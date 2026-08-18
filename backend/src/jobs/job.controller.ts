import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../shared/appError.js";
import {
  cancelOwnedJobExecution,
  cancelOwnedQueuedJob,
  canRetryJob,
  enqueueJob,
  getOwnedJob,
  retryOwnedJob,
} from "./job.queue.js";
import type { JobRecord } from "./job.model.js";

type JobIdParams = {
  jobId: string;
};

function publicJob(job: JobRecord) {
  return {
    id: job._id.toString(),
    type: job.type,
    status: job.status,
    phase: job.phase ?? job.status,
    phaseSequence: job.phaseSequence ?? 0,
    progress: job.progress,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    canRetry: canRetryJob(job),
    ...(job.retryOfJobId
      ? { retryOfJobId: job.retryOfJobId.toString() }
      : {}),
    ...(job.rootJobId
      ? { rootJobId: job.rootJobId.toString() }
      : {}),
    ...(job.result === undefined ? {} : { result: job.result }),
    ...(job.error === undefined
      ? {}
      : {
          error: {
            code: job.error.code,
            message: job.error.message,
            ...(job.error.classification
              ? { classification: job.error.classification }
              : {}),
            ...(job.error.retryable === undefined
              ? {}
              : { retryable: job.error.retryable }),
            ...(job.error.timeoutPhase
              ? { timeoutPhase: job.error.timeoutPhase }
              : {}),
          },
        }),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function getJobController(
  request: Request<JobIdParams>,
  response: Response,
): Promise<void> {
  const job = await getOwnedJob(
    request.auth!.userId,
    request.params.jobId,
  );

  response.status(200).json({
    success: true,
    data: {
      job: publicJob(job),
    },
  });
}

// =========================================================
// FIND: CANCEL RETRY BACKEND
// DOES: Cancels an owned active job when its execution phase allows cancellation.
// UI: JobResilienceActions.tsx -> FIND: CANCEL RETRY
// =========================================================
export async function cancelJobPostController(
  request: Request<JobIdParams>,
  response: Response,
): Promise<void> {
  const job = await cancelOwnedJobExecution(
    request.auth!.userId,
    request.params.jobId,
  );
  response.status(200).json({
    success: true,
    data: { job: publicJob(job) },
  });
}

// =========================================================
// FIND: JOB PROGRESS BACKEND
// FIND: CANCEL RETRY BACKEND
// DOES: Creates an authorized retry for an owned retryable job.
// UI: JobResilienceActions.tsx -> FIND: JOB PROGRESS
// =========================================================
export async function retryJobController(
  request: Request<JobIdParams>,
  response: Response,
): Promise<void> {
  const job = await retryOwnedJob(
    request.auth!.userId,
    request.params.jobId,
  );
  response.status(202).json({
    success: true,
    data: { job: publicJob(job) },
  });
}

export async function cancelJobController(
  request: Request<JobIdParams>,
  response: Response,
): Promise<void> {
  await cancelOwnedQueuedJob(
    request.auth!.userId,
    request.params.jobId,
  );
  response.status(204).send();
}

export async function createInfrastructureTestJobController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!env.ENABLE_DEV_ROUTES) {
    throw new AppError(404, "ROUTE_NOT_FOUND", "Route not found.");
  }

  const job = await enqueueJob({
    type: "infrastructure.echo",
    payload: {
      message: request.body.message,
    },
    userId: request.auth!.userId,
    maxAttempts: 3,
  });

  response.status(202).json({
    success: true,
    data: {
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}
