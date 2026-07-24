import { ApiError } from "../../api/apiClient";
import { describe, expect, it, vi } from "vitest";
import {
  POLLING_MAX_DURATION_MS,
  pollDelayForAttempt,
  pollResumeJob,
} from "./resumePolling";
import type { ResumeJob } from "./types";

const jobId = "507f1f77bcf86cd799439014";
const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const timestamp = "2026-07-24T10:00:00.000Z";

function job(
  status: ResumeJob["status"],
  type: ResumeJob["type"] = "resume.import-pdf",
): ResumeJob {
  return {
    id: jobId,
    type,
    status,
    progress: status === "completed" ? 100 : 10,
    attempts: 1,
    maxAttempts: 3,
    ...(status === "completed"
      ? {
          result: {
            kind: "import" as const,
            resumeId,
            versionId,
            versionNumber: 1,
          },
        }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("resume polling", () => {
  it("uses the approved delay schedule", () => {
    expect(
      [0, 1, 2, 3, 4, 20].map(pollDelayForAttempt),
    ).toEqual([1_000, 2_000, 3_000, 5_000, 8_000, 8_000]);
    expect(POLLING_MAX_DURATION_MS).toBe(5 * 60 * 1_000);
  });

  it("stops immediately after a validated terminal state", async () => {
    const delays: number[] = [];
    const fetchJob = vi
      .fn()
      .mockResolvedValueOnce(job("processing"))
      .mockResolvedValueOnce(job("completed"));
    const updates: ResumeJob[] = [];

    const result = await pollResumeJob({
      jobId,
      expectedType: "resume.import-pdf",
      fetchJob,
      onUpdate: (value) => updates.push(value),
      wait: async (delay) => {
        delays.push(delay);
      },
    });

    expect(delays).toEqual([1_000, 2_000]);
    expect(updates.map((value) => value.status)).toEqual([
      "processing",
      "completed",
    ]);
    expect(result).toMatchObject({
      reason: "terminal",
      job: { status: "completed" },
    });
  });

  it("preserves the last state and pauses after three transient failures", async () => {
    const last = job("processing");
    const fetchJob = vi
      .fn()
      .mockResolvedValueOnce(last)
      .mockRejectedValueOnce(new TypeError("network"))
      .mockRejectedValueOnce(new TypeError("network"))
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "TEMPORARY_FAILURE",
          "Status is temporarily unavailable.",
          "poll-request-id-0001",
        ),
      );

    const result = await pollResumeJob({
      jobId,
      expectedType: "resume.import-pdf",
      fetchJob,
      wait: async () => undefined,
    });

    expect(result).toMatchObject({
      reason: "transport-failure",
      job: last,
      error: {
        code: "TEMPORARY_FAILURE",
        requestId: "poll-request-id-0001",
      },
    });
    expect(fetchJob).toHaveBeenCalledTimes(4);
  });

  it.each([403, 404])(
    "stops immediately on owned-resource HTTP %i",
    async (status) => {
      const fetchJob = vi.fn().mockRejectedValue(
        new ApiError(
          status,
          status === 403 ? "FORBIDDEN" : "JOB_NOT_FOUND",
          "Status cannot be accessed.",
        ),
      );

      await expect(
        pollResumeJob({
          jobId,
          expectedType: "resume.import-pdf",
          fetchJob,
          wait: async () => undefined,
        }),
      ).rejects.toMatchObject({ status });
      expect(fetchJob).toHaveBeenCalledTimes(1);
    },
  );

  it("stops on a wrong job type", async () => {
    await expect(
      pollResumeJob({
        jobId,
        expectedType: "resume.import-pdf",
        fetchJob: vi.fn().mockResolvedValue(job("queued", "resume.analyze")),
        wait: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_RESUME_JOB",
    });
  });

  it("pauses without marking the backend job failed at five minutes", async () => {
    let now = 0;
    const result = await pollResumeJob({
      jobId,
      expectedType: "resume.import-pdf",
      fetchJob: vi.fn().mockResolvedValue(job("processing")),
      now: () => now,
      wait: async (delay) => {
        now += delay;
        if (now < POLLING_MAX_DURATION_MS) {
          now = POLLING_MAX_DURATION_MS;
        }
      },
    });

    expect(result).toEqual({
      reason: "timeout",
      job: undefined,
    });
  });

  it("honors cancellation without an extra request", async () => {
    const controller = new AbortController();
    const fetchJob = vi.fn();
    const result = await pollResumeJob({
      jobId,
      expectedType: "resume.import-pdf",
      fetchJob,
      signal: controller.signal,
      wait: async () => {
        controller.abort();
      },
    });

    expect(result.reason).toBe("cancelled");
    expect(fetchJob).not.toHaveBeenCalled();
  });
});
