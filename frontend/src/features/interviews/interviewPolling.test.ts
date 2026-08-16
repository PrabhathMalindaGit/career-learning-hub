import { ApiError } from "../../api/apiClient";
import { describe, expect, it, vi } from "vitest";
import * as interviewFeature from "./interviewApi";

const jobId = "507f1f77bcf86cd799439014";
const questionId = "507f1f77bcf86cd799439012";
const timestamp = "2026-07-25T10:00:00.000Z";

type Job = {
  id: string;
  type:
    | "interview.questions.generate"
    | "interview.question.explain"
    | "interview.attempt.feedback";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
};

type PollingApi = {
  INTERVIEW_POLLING_MAX_DURATION_MS: number;
  interviewPollDelayForAttempt(attempt: number): number;
  pollInterviewJob(input: {
    jobId: string;
    expectedType: Job["type"];
    expectedResultId?: string;
    fetchJob(id: string, signal?: AbortSignal): Promise<Job>;
    signal?: AbortSignal;
    onUpdate?(job: Job): void;
    now?: () => number;
    wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  }): Promise<{
    reason: "terminal" | "transport-failure" | "timeout" | "cancelled";
    job?: Job;
    error?: unknown;
  }>;
};

const polling = interviewFeature as unknown as PollingApi;

function job(
  status: Job["status"],
  type: Job["type"] = "interview.question.explain",
): Job {
  return {
    id: jobId,
    type,
    status,
    progress: status === "completed" ? 100 : 20,
    attempts: 1,
    maxAttempts: 3,
    ...(status === "completed"
      ? {
          result: {
            kind: "explanation",
            questionId,
            explanationReady: true,
          },
        }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("interview polling", () => {
  it("uses a steady one-second bounded delay between checks", () => {
    expect(
      [0, 1, 2, 3, 4, 20].map(
        polling.interviewPollDelayForAttempt,
      ),
    ).toEqual([1_000, 1_000, 1_000, 1_000, 1_000, 1_000]);
    expect(polling.INTERVIEW_POLLING_MAX_DURATION_MS).toBe(
      5 * 60 * 1_000,
    );
  });

  it("checks immediately, then stops at a validated completed job with matching result identity", async () => {
    const updates: Job[] = [];
    const delays: number[] = [];
    const fetchJob = vi
      .fn()
      .mockResolvedValueOnce(job("processing"))
      .mockResolvedValueOnce(job("completed"));

    const result = await polling.pollInterviewJob({
      jobId,
      expectedType: "interview.question.explain",
      expectedResultId: questionId,
      fetchJob,
      onUpdate: (value) => updates.push(value),
      wait: async (delay) => {
        delays.push(delay);
      },
    });

    expect(delays).toEqual([1_000]);
    expect(updates.map((value) => value.status)).toEqual([
      "processing",
      "completed",
    ]);
    expect(result).toMatchObject({
      reason: "terminal",
      job: { status: "completed" },
    });
  });

  it.each(["failed", "cancelled"] as const)(
    "stops without retrying provider work when the job is %s",
    async (status) => {
      const fetchJob = vi.fn().mockResolvedValue(job(status));
      const result = await polling.pollInterviewJob({
        jobId,
        expectedType: "interview.question.explain",
        fetchJob,
        wait: async () => undefined,
      });

      expect(result).toMatchObject({
        reason: "terminal",
        job: { status },
      });
      expect(fetchJob).toHaveBeenCalledTimes(1);
    },
  );

  it("pauses after three consecutive transient failures while preserving the last job", async () => {
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

    const result = await polling.pollInterviewJob({
      jobId,
      expectedType: "interview.question.explain",
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

  it.each([401, 404])(
    "stops immediately on authentication or owned-resource HTTP %i",
    async (status) => {
      const fetchJob = vi.fn().mockRejectedValue(
        new ApiError(
          status,
          status === 401 ? "AUTHENTICATION_REQUIRED" : "JOB_NOT_FOUND",
          "Job status cannot be accessed.",
        ),
      );

      await expect(
        polling.pollInterviewJob({
          jobId,
          expectedType: "interview.question.explain",
          fetchJob,
          wait: async () => undefined,
        }),
      ).rejects.toMatchObject({ status });
      expect(fetchJob).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects a wrong job type and a completed-result identity mismatch", async () => {
    await expect(
      polling.pollInterviewJob({
        jobId,
        expectedType: "interview.question.explain",
        fetchJob: vi
          .fn()
          .mockResolvedValue(
            job("queued", "interview.attempt.feedback"),
          ),
        wait: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INTERVIEW_JOB" });

    await expect(
      polling.pollInterviewJob({
        jobId,
        expectedType: "interview.question.explain",
        expectedResultId: "507f1f77bcf86cd799439099",
        fetchJob: vi.fn().mockResolvedValue(job("completed")),
        wait: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INTERVIEW_JOB" });
  });

  it("pauses at five minutes without marking the backend job failed", async () => {
    let now = 0;
    const processing = job("processing");
    const result = await polling.pollInterviewJob({
      jobId,
      expectedType: "interview.question.explain",
      fetchJob: vi.fn().mockResolvedValue(processing),
      now: () => now,
      wait: async (delay) => {
        now += delay;
        if (now < polling.INTERVIEW_POLLING_MAX_DURATION_MS) {
          now = polling.INTERVIEW_POLLING_MAX_DURATION_MS;
        }
      },
    });

    expect(result).toEqual({
      reason: "timeout",
      job: processing,
    });
  });

  it("honors cancellation after the immediate check without an extra request", async () => {
    const controller = new AbortController();
    const processing = job("processing");
    const fetchJob = vi.fn().mockResolvedValue(processing);
    const result = await polling.pollInterviewJob({
      jobId,
      expectedType: "interview.question.explain",
      fetchJob,
      signal: controller.signal,
      wait: async () => {
        controller.abort();
      },
    });

    expect(result).toEqual({ reason: "cancelled", job: processing });
    expect(fetchJob).toHaveBeenCalledTimes(1);
  });
});
