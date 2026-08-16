import { ApiError } from "../../api/apiClient";
import type {
  InterviewJob,
  InterviewJobType,
} from "./types";

export const INTERVIEW_POLLING_MAX_DURATION_MS = 5 * 60 * 1_000;
const TRANSIENT_FAILURE_LIMIT = 3;

export function interviewPollDelayForAttempt(attempt: number): number {
  return [1_000, 1_000, 2_000, 2_000, 3_000][attempt] ?? 3_000;
}

function defaultWait(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function resultIdentity(job: InterviewJob): string | undefined {
  if (!job.result) return undefined;
  if (job.result.kind === "generation") return undefined;
  return job.result.kind === "explanation"
    ? job.result.questionId
    : job.result.attemptId;
}

export type InterviewPollResult =
  | { reason: "terminal"; job: InterviewJob }
  | {
      reason: "transport-failure";
      job: InterviewJob | undefined;
      error: unknown;
    }
  | { reason: "timeout"; job: InterviewJob | undefined }
  | { reason: "cancelled"; job: InterviewJob | undefined };

export async function pollInterviewJob(input: {
  jobId: string;
  expectedType: InterviewJobType;
  expectedResultId?: string;
  fetchJob(
    jobId: string,
    signal?: AbortSignal,
  ): Promise<InterviewJob>;
  signal?: AbortSignal;
  onUpdate?(job: InterviewJob): void;
  now?: () => number;
  wait?: (
    milliseconds: number,
    signal?: AbortSignal,
  ) => Promise<void>;
}): Promise<InterviewPollResult> {
  const now = input.now ?? Date.now;
  const wait = input.wait ?? defaultWait;
  const startedAt = now();
  let attempt = 0;
  let transientFailures = 0;
  let lastJob: InterviewJob | undefined;
  let lastError: unknown;

  while (true) {
    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= INTERVIEW_POLLING_MAX_DURATION_MS) {
      return { reason: "timeout", job: lastJob };
    }

    await wait(interviewPollDelayForAttempt(attempt), input.signal);

    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= INTERVIEW_POLLING_MAX_DURATION_MS) {
      return { reason: "timeout", job: lastJob };
    }

    try {
      const job = await input.fetchJob(input.jobId, input.signal);
      const completedIdentity = resultIdentity(job);
      if (
        job.id !== input.jobId ||
        job.type !== input.expectedType ||
        (job.status === "completed" &&
          input.expectedResultId !== undefined &&
          completedIdentity !== input.expectedResultId)
      ) {
        throw new ApiError(
          502,
          "INVALID_INTERVIEW_JOB",
          "The server returned a mismatched interview job.",
        );
      }
      lastJob = job;
      transientFailures = 0;
      input.onUpdate?.(job);
      if (
        job.status === "completed" ||
        job.status === "failed" ||
        job.status === "cancelled"
      ) {
        return { reason: "terminal", job };
      }
    } catch (error) {
      if (input.signal?.aborted) {
        return { reason: "cancelled", job: lastJob };
      }
      if (
        error instanceof ApiError &&
        (error.status === 401 ||
          error.status === 403 ||
          error.status === 404 ||
          error.code === "INVALID_INTERVIEW_RESPONSE" ||
          error.code === "INVALID_INTERVIEW_JOB")
      ) {
        throw error;
      }
      transientFailures += 1;
      lastError = error;
      if (transientFailures >= TRANSIENT_FAILURE_LIMIT) {
        return {
          reason: "transport-failure",
          job: lastJob,
          error: lastError,
        };
      }
    }

    attempt += 1;
  }
}
