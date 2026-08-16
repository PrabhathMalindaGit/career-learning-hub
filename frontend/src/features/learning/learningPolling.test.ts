import { ApiError } from "../../api/apiClient";
import { describe, expect, it, vi } from "vitest";
import {
  LEARNING_POLLING_MAX_DURATION_MS,
  pollLearningJob,
  pollingDelayForAttempt,
} from "./learningPolling";
import type { LearningQuizJob } from "./types";

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";

function job(status: "queued" | "processing" | "completed") {
  return {
    id: jobId,
    type: "learning.document.process" as const,
    status,
    progress: status === "completed" ? 100 : 5,
    attempts: 1,
    maxAttempts: 3,
    ...(status === "completed"
      ? {
          result: {
            documentId,
            pageCount: 2,
            chunkCount: 1,
          },
        }
      : {}),
    createdAt,
    updatedAt: createdAt,
  };
}

describe("Learning processing polling", () => {
  it("uses a steady one-second bounded delay between checks", () => {
    expect([0, 1, 2, 3, 4, 5].map(pollingDelayForAttempt)).toEqual([
      1_000,
      1_000,
      1_000,
      1_000,
      1_000,
      1_000,
    ]);
  });

  it("checks immediately, then polls the exact job until terminal completion", async () => {
    const fetchJob = vi
      .fn()
      .mockResolvedValueOnce(job("processing"))
      .mockResolvedValueOnce(job("completed"));
    const wait = vi.fn().mockResolvedValue(undefined);

    const result = await pollLearningJob({
      jobId,
      documentId,
      fetchJob,
      wait,
    });

    expect(result).toMatchObject({
      reason: "terminal",
      job: { status: "completed" },
    });
    expect(fetchJob).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledWith(1_000, undefined);
  });

  it("pauses after three consecutive transient failures", async () => {
    const fetchJob = vi.fn().mockRejectedValue(new TypeError("offline"));

    const result = await pollLearningJob({
      jobId,
      documentId,
      fetchJob,
      wait: vi.fn().mockResolvedValue(undefined),
    });

    expect(result.reason).toBe("paused");
    expect(fetchJob).toHaveBeenCalledTimes(3);
  });

  it("pauses at five minutes without claiming backend failure", async () => {
    let now = 0;
    const processing = job("processing");
    const result = await pollLearningJob({
      jobId,
      documentId,
      fetchJob: vi.fn().mockResolvedValue(processing),
      now: () => now,
      wait: async (milliseconds) => {
        now += milliseconds;
        if (now < LEARNING_POLLING_MAX_DURATION_MS) {
          now = LEARNING_POLLING_MAX_DURATION_MS;
        }
      },
    });

    expect(result).toEqual({
      reason: "paused",
      job: processing,
      cause: "timeout",
    });
  });

  it.each([
    new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication required."),
    new ApiError(404, "JOB_NOT_FOUND", "Job not found."),
    new ApiError(
      502,
      "INVALID_LEARNING_RESPONSE",
      "The server returned an invalid learning response.",
    ),
  ])("stops immediately for non-resumable polling error %s", async (error) => {
    await expect(
      pollLearningJob({
        jobId,
        documentId,
        fetchJob: vi.fn().mockRejectedValue(error),
        wait: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toBe(error);
  });

  it("cancels after the immediate check on route change or unmount", async () => {
    const controller = new AbortController();
    const processing = job("processing");
    const fetchJob = vi.fn().mockResolvedValue(processing);
    const wait = vi.fn(async () => {
      controller.abort();
    });

    await expect(
      pollLearningJob({
        jobId,
        documentId,
        fetchJob,
        signal: controller.signal,
        wait,
      }),
    ).resolves.toEqual({
      reason: "cancelled",
      job: processing,
    });
    expect(fetchJob).toHaveBeenCalledTimes(1);
  });

  it("uses the same bounded lifecycle for an exact quiz-generation job", async () => {
    const quizId = "507f1f77bcf86cd799439013";
    const quizJob: LearningQuizJob = {
      id: jobId,
      type: "learning.quiz.generate",
      status: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result: { quizId, questionCount: 1 },
      createdAt,
      updatedAt: createdAt,
    };
    const wait = vi.fn().mockResolvedValue(undefined);

    const result = await pollLearningJob<LearningQuizJob>({
      jobId,
      documentId,
      fetchJob: vi.fn().mockResolvedValue(quizJob),
      wait,
    });

    expect(result).toEqual({ reason: "terminal", job: quizJob });
    expect(wait).not.toHaveBeenCalled();
  });
});
