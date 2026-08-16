import { ApiError } from "../../api/apiClient";
import type {
  LearningChatJob,
  LearningDocumentDeletionJob,
  LearningFlashcardJob,
  LearningJob,
  LearningQuizJob,
} from "./types";

export const LEARNING_POLLING_MAX_DURATION_MS = 5 * 60 * 1_000;
const TRANSIENT_FAILURE_LIMIT = 3;

export function pollingDelayForAttempt(attempt: number): number {
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

type PollableLearningJob =
  | LearningJob
  | LearningDocumentDeletionJob
  | LearningChatJob
  | LearningFlashcardJob
  | LearningQuizJob;

export type LearningPollResult<
  Job extends PollableLearningJob = LearningJob,
> =
  | { reason: "terminal"; job: Job }
  | {
      reason: "paused";
      cause: "timeout" | "transport-failure";
      job: Job | undefined;
      error?: unknown;
    }
  | { reason: "cancelled"; job: Job | undefined };

function isFatalPollingError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 401 ||
      error.status === 403 ||
      error.status === 404 ||
      error.code === "INVALID_LEARNING_RESPONSE")
  );
}

export async function pollLearningJob<
  Job extends PollableLearningJob = LearningJob,
>(input: {
  jobId: string;
  documentId: string;
  fetchJob(
    jobId: string,
    documentId: string,
    signal?: AbortSignal,
  ): Promise<Job>;
  signal?: AbortSignal;
  onUpdate?(job: Job): void;
  now?: () => number;
  wait?: (
    milliseconds: number,
    signal?: AbortSignal,
  ) => Promise<void>;
}): Promise<LearningPollResult<Job>> {
  const now = input.now ?? Date.now;
  const wait = input.wait ?? defaultWait;
  const startedAt = now();
  let attempt = 0;
  let transientFailures = 0;
  let lastJob: Job | undefined;
  let lastError: unknown;

  while (true) {
    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= LEARNING_POLLING_MAX_DURATION_MS) {
      return {
        reason: "paused",
        cause: "timeout",
        job: lastJob,
      };
    }

    await wait(pollingDelayForAttempt(attempt), input.signal);

    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= LEARNING_POLLING_MAX_DURATION_MS) {
      return {
        reason: "paused",
        cause: "timeout",
        job: lastJob,
      };
    }

    try {
      const job = await input.fetchJob(
        input.jobId,
        input.documentId,
        input.signal,
      );
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
      if (isFatalPollingError(error)) throw error;
      transientFailures += 1;
      lastError = error;
      if (transientFailures >= TRANSIENT_FAILURE_LIMIT) {
        return {
          reason: "paused",
          cause: "transport-failure",
          job: lastJob,
          error: lastError,
        };
      }
    }

    attempt += 1;
  }
}
