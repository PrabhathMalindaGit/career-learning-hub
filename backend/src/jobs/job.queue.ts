import { Types } from "mongoose";
import { env } from "../config/env.js";
import { AppError } from "../shared/appError.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import {
  fenceLearningDocumentWork,
  isLearningDocumentWorkInvalidated,
} from "../modules/learning/learningDocumentWorkFence.js";
import type { LearningDocumentStatus } from "../modules/learning/learningDocument.model.js";
import { JobRecordModel, type JobRecord } from "./job.model.js";

const learningJobRetryStatuses: Readonly<
  Record<string, readonly LearningDocumentStatus[]>
> = {
  "learning.document.process": [
    "uploaded",
    "processing",
    "failed",
    "ready",
  ],
  "learning.chat.respond": ["ready"],
  "learning.flashcards.generate": ["ready"],
  "learning.quiz.generate": ["ready"],
};

function learningJobRetryFence(job: JobRecord):
  | {
      userId: string;
      documentId: string;
      allowedStatuses: readonly LearningDocumentStatus[];
    }
  | undefined {
  const allowedStatuses = learningJobRetryStatuses[job.type];
  const payload =
    typeof job.payload === "object" &&
    job.payload !== null &&
    !Array.isArray(job.payload)
      ? (job.payload as Record<string, unknown>)
      : undefined;
  const documentId = payload?.documentId;

  if (
    !allowedStatuses ||
    !job.userId ||
    typeof documentId !== "string" ||
    !/^[a-f\d]{24}$/i.test(documentId)
  ) {
    return undefined;
  }

  return {
    userId: job.userId.toString(),
    documentId,
    allowedStatuses,
  };
}

async function cancelInvalidatedProcessingJob(
  jobId: string,
): Promise<void> {
  const cancelledAt = new Date();
  await JobRecordModel.updateOne(
    {
      _id: jobId,
      status: "processing",
    },
    {
      $set: {
        status: "cancelled",
        expiresAt: new Date(
          cancelledAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $unset: {
        lockedAt: 1,
        lockExpiresAt: 1,
        lockedBy: 1,
        error: 1,
      },
    },
  );
}

export async function enqueueJob(input: {
  type: string;
  payload: unknown;
  userId?: string;
  priority?: number;
  maxAttempts?: number;
  runAt?: Date;
  idempotencyKey?: string;
}): Promise<JobRecord> {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(input.type)) {
    throw new AppError(400, "INVALID_JOB_TYPE", "The job type is invalid.");
  }

  if (input.idempotencyKey) {
    const existing = await JobRecordModel.findOne({
      idempotencyKey: input.idempotencyKey,
    }).lean();

    if (existing) return existing;
  }

  try {
    return await JobRecordModel.create({
      userId: input.userId,
      type: input.type,
      payload: input.payload,
      priority: input.priority ?? 0,
      maxAttempts: input.maxAttempts ?? 3,
      runAt: input.runAt ?? new Date(),
      idempotencyKey: input.idempotencyKey,
    });
  } catch (error) {
    if (
      input.idempotencyKey &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existing = await JobRecordModel.findOne({
        idempotencyKey: input.idempotencyKey,
      }).lean();

      if (existing) return existing;
    }

    throw error;
  }
}

export async function claimNextJob(): Promise<JobRecord | null> {
  const now = new Date();
  const lockExpiresAt = new Date(
    now.getTime() + env.JOB_LEASE_SECONDS * 1_000,
  );

  return JobRecordModel.findOneAndUpdate(
    {
      $or: [
        {
          status: "queued",
          runAt: { $lte: now },
        },
        {
          status: "processing",
          lockExpiresAt: { $lte: now },
        },
      ],
      $expr: {
        $lt: ["$attempts", "$maxAttempts"],
      },
    },
    {
      $set: {
        status: "processing",
        lockedAt: now,
        lockExpiresAt,
        lockedBy: env.JOB_WORKER_ID,
      },
      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
      sort: {
        priority: -1,
        runAt: 1,
        createdAt: 1,
      },
    },
  ).lean();
}

export async function heartbeatJob(jobId: string): Promise<void> {
  const result = await JobRecordModel.updateOne(
    {
      _id: jobId,
      status: "processing",
      lockedBy: env.JOB_WORKER_ID,
    },
    {
      $set: {
        lockExpiresAt: new Date(
          Date.now() + env.JOB_LEASE_SECONDS * 1_000,
        ),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new AppError(
      409,
      "JOB_LEASE_LOST",
      "The worker no longer owns this job lease.",
    );
  }
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
): Promise<void> {
  await JobRecordModel.updateOne(
    {
      _id: jobId,
      status: "processing",
      lockedBy: env.JOB_WORKER_ID,
    },
    {
      $set: {
        progress: Math.max(0, Math.min(100, progress)),
      },
    },
  );
}

export async function completeJob(
  jobId: string,
  result: unknown,
): Promise<void> {
  const completedAt = new Date();
  await JobRecordModel.updateOne(
    {
      _id: jobId,
      status: "processing",
      lockedBy: env.JOB_WORKER_ID,
    },
    {
      $set: {
        status: "completed",
        result,
        progress: 100,
        completedAt,
        expiresAt: new Date(
          completedAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $unset: {
        lockedAt: 1,
        lockExpiresAt: 1,
        lockedBy: 1,
        error: 1,
      },
    },
  );
}

function retryDelay(attempt: number): number {
  return Math.min(
    5 * 60 * 1_000,
    2_000 * 2 ** Math.max(0, attempt - 1) +
      Math.floor(Math.random() * 1_000),
  );
}

export async function failOrRetryJob(
  job: JobRecord,
  error: unknown,
): Promise<void> {
  if (
    error instanceof AppError &&
    error.code === "LEARNING_DOCUMENT_WORK_INVALIDATED"
  ) {
    await cancelInvalidatedProcessingJob(job._id.toString());
    return;
  }

  const message =
    error instanceof Error ? error.message : "Unknown job failure.";
  const code =
    error instanceof AppError ? error.code : "JOB_EXECUTION_FAILED";
  const stack =
    !env.isProduction && error instanceof Error
      ? error.stack?.slice(0, 8_000)
      : undefined;
  const retryable =
    !(error instanceof AppError) || error.retryable !== false;

  if (retryable && job.attempts < job.maxAttempts) {
    const retryAt = new Date(Date.now() + retryDelay(job.attempts));
    const retryFence = learningJobRetryFence(job);

    if (retryFence) {
      try {
        await withMongoTransaction(async (mongoSession) => {
          await fenceLearningDocumentWork({
            ...retryFence,
            session: mongoSession,
          });

          await JobRecordModel.updateOne(
            {
              _id: job._id,
              status: "processing",
            },
            {
              $set: {
                status: "queued",
                runAt: retryAt,
                error: {
                  code,
                  message: message.slice(0, 2_000),
                  stack,
                },
              },
              $unset: {
                lockedAt: 1,
                lockExpiresAt: 1,
                lockedBy: 1,
              },
            },
            { session: mongoSession },
          );

          return true;
        });
      } catch (retryError) {
        if (isLearningDocumentWorkInvalidated(retryError)) {
          await cancelInvalidatedProcessingJob(
            job._id.toString(),
          );
          return;
        }

        throw retryError;
      }

      return;
    }

    await JobRecordModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "queued",
          runAt: retryAt,
          error: {
            code,
            message: message.slice(0, 2_000),
            stack,
          },
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
        },
      },
    );
    return;
  }

  const failedAt = new Date();
  await JobRecordModel.updateOne(
    { _id: job._id },
    {
      $set: {
        status: "failed",
        failedAt,
        error: {
          code,
          message: message.slice(0, 2_000),
          stack,
        },
        expiresAt: new Date(
          failedAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $unset: {
        lockedAt: 1,
        lockExpiresAt: 1,
        lockedBy: 1,
      },
    },
  );
}

export async function cancelQueuedLearningDocumentJobs(input: {
  userId: string;
  documentId: string;
}): Promise<number> {
  const cancelledAt = new Date();
  const result = await JobRecordModel.updateMany(
    {
      userId: input.userId,
      status: "queued",
      type: {
        $in: [
          "learning.document.process",
          "learning.chat.respond",
          "learning.flashcards.generate",
          "learning.quiz.generate",
        ],
      },
      "payload.documentId": input.documentId,
    },
    {
      $set: {
        status: "cancelled",
        expiresAt: new Date(
          cancelledAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $unset: {
        lockedAt: 1,
        lockExpiresAt: 1,
        lockedBy: 1,
        error: 1,
      },
    },
  );

  return result.modifiedCount;
}

export async function getOwnedJob(
  userId: string,
  jobId: string,
): Promise<JobRecord> {
  const job = await JobRecordModel.findOne({
    _id: new Types.ObjectId(jobId),
    userId: new Types.ObjectId(userId),
  }).lean();

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  return job;
}

export async function cancelOwnedQueuedJob(
  userId: string,
  jobId: string,
): Promise<void> {
  const result = await JobRecordModel.updateOne(
    {
      _id: jobId,
      userId,
      status: "queued",
    },
    {
      $set: {
        status: "cancelled",
        expiresAt: new Date(
          Date.now() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new AppError(
      409,
      "JOB_NOT_CANCELLABLE",
      "Only an owned queued job can be cancelled.",
    );
  }
}
