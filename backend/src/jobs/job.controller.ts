import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../shared/appError.js";
import {
  cancelOwnedQueuedJob,
  enqueueJob,
  getOwnedJob,
} from "./job.queue.js";

type JobIdParams = {
  jobId: string;
};

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
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
        progress: job.progress,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    },
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
