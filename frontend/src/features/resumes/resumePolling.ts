import { ApiError } from "../../api/apiClient";
import type { ResumeJob } from "./types";

export const POLLING_MAX_DURATION_MS = 5 * 60 * 1_000;
const TRANSIENT_FAILURE_LIMIT = 3;

export function pollDelayForAttempt(attempt: number): number {
  return [1_000, 2_000, 3_000, 5_000][attempt] ?? 8_000;
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

export type PollResult =
  | { reason: "terminal"; job: ResumeJob }
  | {
      reason: "transport-failure";
      job: ResumeJob | undefined;
      error: unknown;
    }
  | { reason: "timeout"; job: ResumeJob | undefined }
  | { reason: "cancelled"; job: ResumeJob | undefined };

export async function pollResumeJob(input: {
  jobId: string;
  expectedType: ResumeJob["type"];
  fetchJob(
    jobId: string,
    signal?: AbortSignal,
  ): Promise<ResumeJob>;
  signal?: AbortSignal;
  onUpdate?(job: ResumeJob): void;
  now?: () => number;
  wait?: (
    milliseconds: number,
    signal?: AbortSignal,
  ) => Promise<void>;
}): Promise<PollResult> {
  const now = input.now ?? Date.now;
  const wait = input.wait ?? defaultWait;
  const startedAt = now();
  let attempt = 0;
  let transientFailures = 0;
  let lastJob: ResumeJob | undefined;
  let lastError: unknown;

  while (true) {
    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= POLLING_MAX_DURATION_MS) {
      return { reason: "timeout", job: lastJob };
    }

    await wait(pollDelayForAttempt(attempt), input.signal);

    if (input.signal?.aborted) {
      return { reason: "cancelled", job: lastJob };
    }
    if (now() - startedAt >= POLLING_MAX_DURATION_MS) {
      return { reason: "timeout", job: lastJob };
    }

    try {
      const job = await input.fetchJob(input.jobId, input.signal);
      if (job.id !== input.jobId || job.type !== input.expectedType) {
        throw new ApiError(
          502,
          "INVALID_RESUME_JOB",
          "The server returned a mismatched resume job.",
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
        (error.status === 403 ||
          error.status === 404 ||
          error.code === "INVALID_RESUME_RESPONSE" ||
          error.code === "INVALID_RESUME_JOB")
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
