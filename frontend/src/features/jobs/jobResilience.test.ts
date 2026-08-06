import { afterEach, describe, expect, it, vi } from "vitest";
import { configureApiClientAuth } from "../../api/apiClient";
import {
  cancelJob,
  createSingleFlightJobPoller,
  parseSafeJob,
  phaseLabel,
  retryJob,
} from "./jobResilience";

const jobId = "507f1f77bcf86cd799439014";

describe("job resilience contracts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it.each([
    ["queued", "Queued"],
    ["preparing", "Preparing"],
    ["contacting_provider", "Contacting Gemini"],
    ["waiting_for_first_response", "Waiting for response"],
    ["receiving_response", "Processing response"],
    ["validating", "Validating"],
    ["persisting", "Saving"],
    ["retry_scheduled", "Retrying"],
    ["completed", "Completed"],
    ["failed", "Failed"],
    ["cancelled", "Cancelled"],
  ] as const)("maps %s to safe progress wording", (phase, label) => {
    expect(phaseLabel(phase)).toBe(label);
  });

  it("parses only allowlisted job resilience fields", () => {
    expect(parseSafeJob({
      id: jobId,
      type: "resume.analyze",
      status: "processing",
      phase: "validating",
      phaseSequence: 4,
      progress: 70,
      attempts: 1,
      maxAttempts: 3,
      canRetry: false,
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:01.000Z",
    })).toMatchObject({ phase: "validating", canRetry: false });

    for (const forbidden of [
      "payload",
      "routing",
      "aiRoutingSnapshot",
      "executionId",
      "lockedBy",
      "provider",
      "model",
      "stack",
    ]) {
      expect(() => parseSafeJob({
        id: jobId,
        type: "resume.analyze",
        status: "processing",
        phase: "validating",
        progress: 70,
        attempts: 1,
        maxAttempts: 3,
        canRetry: false,
        createdAt: "2026-08-06T00:00:00.000Z",
        updatedAt: "2026-08-06T00:00:01.000Z",
        [forbidden]: "private",
      })).toThrow();
    }

    expect(() => parseSafeJob({
      id: jobId,
      type: "resume.analyze",
      status: "failed",
      phase: "failed",
      phaseSequence: 5,
      progress: 70,
      attempts: 3,
      maxAttempts: 3,
      canRetry: true,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is temporarily unavailable.",
        stack: "private",
      },
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:01.000Z",
    })).toThrow();
  });

  it("aborts a prior run and suppresses its late callback", async () => {
    const poller = createSingleFlightJobPoller();
    let releaseFirst!: () => void;
    const first = new Promise<string>((resolve) => {
      releaseFirst = () => resolve("first");
    });
    const onResult = vi.fn();
    const firstRun = poller.run(async (signal) => {
      expect(signal.aborted).toBe(false);
      return first;
    }, onResult);
    const secondRun = poller.run(async () => "second", onResult);

    await secondRun;
    releaseFirst();
    await firstRun;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith("second");
  });

  it("stops the active request on unmount or navigation cleanup", async () => {
    const poller = createSingleFlightJobPoller();
    let observedSignal: AbortSignal | undefined;
    const run = poller.run(async (signal) => {
      observedSignal = signal;
      await new Promise<void>((resolve) => {
        signal.addEventListener("abort", () => resolve(), { once: true });
      });
      return "cancelled";
    });

    poller.stop();
    await run;
    expect(observedSignal?.aborted).toBe(true);
  });

  it("uses authenticated owned POST actions and validates returned jobs", async () => {
    const restoreAuth = configureApiClientAuth({
      getAccessToken: () => "test-access-token",
      refreshSession: vi.fn(),
      clearAuthentication: vi.fn(),
    });
    const responseJob = {
      id: jobId,
      type: "resume.analyze",
      status: "cancelled",
      phase: "cancelled",
      phaseSequence: 5,
      progress: 40,
      attempts: 1,
      maxAttempts: 3,
      canRetry: true,
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:01.000Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: { job: responseJob },
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: {
          job: {
            ...responseJob,
            id: "507f1f77bcf86cd799439099",
            status: "queued",
            phase: "queued",
            phaseSequence: 0,
            progress: 0,
            attempts: 0,
            canRetry: false,
            retryOfJobId: jobId,
            rootJobId: jobId,
          },
        },
      }), { status: 202, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(cancelJob(jobId)).resolves.toMatchObject({
        status: "cancelled",
        canRetry: true,
      });
      await expect(retryJob(jobId)).resolves.toMatchObject({
        status: "queued",
        retryOfJobId: jobId,
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]?.[0]).toContain(`/jobs/${jobId}/cancel`);
      expect(fetchMock.mock.calls[1]?.[0]).toContain(`/jobs/${jobId}/retry`);
      expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"))
        .toBe("Bearer test-access-token");
    } finally {
      restoreAuth();
    }
  });

  it("refreshes canonical state when persistence wins the cancellation race", async () => {
    const restoreAuth = configureApiClientAuth({
      getAccessToken: () => "test-access-token",
      refreshSession: vi.fn(),
      clearAuthentication: vi.fn(),
    });
    const canonical = {
      id: jobId,
      type: "resume.analyze",
      status: "processing",
      phase: "persisting",
      phaseSequence: 6,
      progress: 90,
      attempts: 1,
      maxAttempts: 3,
      canRetry: false,
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:01.000Z",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: false,
        error: { code: "JOB_NOT_CANCELLABLE", message: "This job can no longer be cancelled." },
      }), { status: 409, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: { job: canonical },
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(cancelJob(jobId)).resolves.toMatchObject({
        status: "processing",
        phase: "persisting",
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      restoreAuth();
    }
  });
});
