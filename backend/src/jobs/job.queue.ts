import { randomUUID } from "node:crypto";
import { Types, type ClientSession } from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../shared/appError.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import {
  fenceLearningDocumentWork,
  isLearningDocumentWorkInvalidated,
} from "../modules/learning/learningDocumentWorkFence.js";
import type { LearningDocumentStatus } from "../modules/learning/learningDocument.model.js";
import { compileAiRoutingSnapshotForJob } from "../modules/ai/aiRouting.service.js";
import { aiActionForJobType } from "../modules/ai/aiRoutingSnapshot.js";
import { InterviewAttemptModel } from "../modules/interviews/interviewAttempt.model.js";
import { InterviewQuestionModel } from "../modules/interviews/interviewQuestion.model.js";
import { FlashcardSetModel } from "../modules/learning/flashcardSet.model.js";
import { LearningDocumentModel } from "../modules/learning/learningDocument.model.js";
import { MessageModel } from "../modules/learning/message.model.js";
import { QuizModel } from "../modules/learning/quiz.model.js";
import { abortActiveJobExecution } from "./job.execution.js";
import {
  JobRecordModel,
  type JobExecutionIdentity,
  type JobPhase,
  type JobRecord,
} from "./job.model.js";

export type { JobExecutionIdentity } from "./job.model.js";

const processingPhaseOrder: Readonly<Partial<Record<JobPhase, number>>> = {
  preparing: 1,
  contacting_provider: 2,
  waiting_for_first_response: 3,
  receiving_response: 4,
  validating: 5,
  persisting: 6,
};

function executionFenceError(): AppError {
  return new AppError(
    409,
    "JOB_EXECUTION_FENCE_LOST",
    "The worker no longer owns this job execution.",
    undefined,
    false,
  );
}

function executionIdentity(job: JobRecord): JobExecutionIdentity {
  if (!job.executionId) throw executionFenceError();
  return {
    jobId: job._id.toString(),
    executionId: job.executionId,
    attempt: job.attempts,
  };
}

function executionFilter(execution: JobExecutionIdentity) {
  return {
    _id: execution.jobId,
    status: "processing" as const,
    lockedBy: env.JOB_WORKER_ID,
    executionId: execution.executionId,
    attempts: execution.attempt,
  };
}

function safeJobError(error: unknown) {
  const appError = error instanceof AppError ? error : undefined;
  return {
    code: appError?.code ?? "JOB_EXECUTION_FAILED",
    message: appError?.message.slice(0, 2_000) ?? "The job could not be completed.",
    ...(appError?.classification
      ? { classification: appError.classification }
      : {}),
    ...(appError?.retryable === undefined
      ? {}
      : { retryable: appError.retryable }),
    ...(appError?.timeoutPhase
      ? { timeoutPhase: appError.timeoutPhase }
      : {}),
  };
}

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
  const cancelled = await JobRecordModel.findOneAndUpdate(
    {
      _id: jobId,
      status: "processing",
    },
    {
      $set: {
        status: "cancelled",
        phase: "cancelled",
        cancelledAt,
        cancellationReason: "work_invalidated",
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
      $inc: { phaseSequence: 1 },
    },
    { new: true },
  );
  if (cancelled?.executionId) {
    abortActiveJobExecution(
      {
        jobId,
        executionId: cancelled.executionId,
        attempt: cancelled.attempts,
      },
      "user_cancelled",
    );
  }
}

export async function enqueueJob(input: {
  type: string;
  payload: unknown;
  userId?: string;
  priority?: number;
  maxAttempts?: number;
  runAt?: Date;
  idempotencyKey?: string;
  retryOfJobId?: string;
  rootJobId?: string;
  requireGeminiDirect?: boolean;
  session?: ClientSession;
}): Promise<JobRecord> {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(input.type)) {
    throw new AppError(400, "INVALID_JOB_TYPE", "The job type is invalid.");
  }

  if (input.idempotencyKey) {
    const existingQuery = JobRecordModel.findOne({
      idempotencyKey: input.idempotencyKey,
    });
    if (input.session) existingQuery.session(input.session);
    const existing = await existingQuery.lean();

    if (existing) return existing;
  }

  const aiRoutingSnapshot =
    input.userId
      ? await compileAiRoutingSnapshotForJob({
          type: input.type,
          userId: input.userId,
        })
      : undefined;

  if (
    input.requireGeminiDirect &&
    aiRoutingSnapshot &&
    aiRoutingSnapshot.provider !== "gemini-direct"
  ) {
    throw new AppError(
      409,
      "GEMINI_DIRECT_REQUIRED",
      "This job can be retried only with Gemini Direct.",
      undefined,
      false,
      "NON_RETRYABLE_CONFIGURATION",
    );
  }

  try {
    const values = {
      userId: input.userId,
      type: input.type,
      payload: input.payload,
      priority: input.priority ?? 0,
      maxAttempts: input.maxAttempts ?? 3,
      runAt: input.runAt ?? new Date(),
      idempotencyKey: input.idempotencyKey,
      retryOfJobId: input.retryOfJobId,
      rootJobId: input.rootJobId,
      ...(aiRoutingSnapshot ? { aiRoutingSnapshot } : {}),
    };
    if (input.session) {
      const [created] = await JobRecordModel.create([values], {
        session: input.session,
      });
      return created;
    }
    return await JobRecordModel.create(values);
  } catch (error) {
    if (
      input.idempotencyKey &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existingQuery = JobRecordModel.findOne({
        idempotencyKey: input.idempotencyKey,
      });
      if (input.session) existingQuery.session(input.session);
      const existing = await existingQuery.lean();

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
  const executionId = randomUUID();

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
        executionId,
        phase: "preparing",
      },
      $inc: {
        attempts: 1,
        phaseSequence: 1,
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

export async function heartbeatJob(
  execution: JobExecutionIdentity,
): Promise<void> {
  const result = await JobRecordModel.updateOne(
    executionFilter(execution),
    {
      $set: {
        lockExpiresAt: new Date(
          Date.now() + env.JOB_LEASE_SECONDS * 1_000,
        ),
      },
    },
  );

  if (result.matchedCount === 0) {
    abortActiveJobExecution(execution, "lease_lost");
    throw executionFenceError();
  }
}

export async function updateJobProgress(
  execution: JobExecutionIdentity,
  progress: number,
): Promise<void> {
  const result = await JobRecordModel.updateOne(
    executionFilter(execution),
    {
      $set: {
        progress: Math.max(0, Math.min(100, progress)),
      },
    },
  );
  if (result.matchedCount === 0) throw executionFenceError();
}

export async function assertJobExecutionActive(
  execution: JobExecutionIdentity,
  session?: ClientSession,
): Promise<void> {
  const result = await JobRecordModel.updateOne(
    executionFilter(execution),
    {
      $set: {
        lockExpiresAt: new Date(
          Date.now() + env.JOB_LEASE_SECONDS * 1_000,
        ),
      },
    },
    session ? { session } : undefined,
  );
  if (result.matchedCount !== 1) throw executionFenceError();
}

export async function updateJobPhase(
  execution: JobExecutionIdentity,
  phase: Exclude<
    JobPhase,
    "queued" | "retry_scheduled" | "completed" | "failed" | "cancelled"
  >,
): Promise<void> {
  const current = await JobRecordModel.findOne(executionFilter(execution))
    .select("phase phaseSequence")
    .lean();
  if (!current) throw executionFenceError();

  const currentOrder = processingPhaseOrder[current.phase] ?? 0;
  const nextOrder = processingPhaseOrder[phase] ?? 0;
  if (nextOrder <= currentOrder) return;

  const result = await JobRecordModel.updateOne(
    {
      ...executionFilter(execution),
      phaseSequence: current.phaseSequence,
    },
    {
      $set: { phase },
      $inc: { phaseSequence: 1 },
    },
  );
  if (result.matchedCount === 0) {
    const latest = await JobRecordModel.findOne(executionFilter(execution))
      .select("phase")
      .lean();
    if (
      latest &&
      (processingPhaseOrder[latest.phase] ?? 0) >= nextOrder
    ) {
      return;
    }
    throw executionFenceError();
  }
}

export async function beginJobPersistence(
  execution: JobExecutionIdentity,
): Promise<void> {
  await updateJobPhase(execution, "persisting");
  const result = await JobRecordModel.updateOne(
    { ...executionFilter(execution), phase: "persisting" },
    {
      $set: {
        lockExpiresAt: new Date(
          Date.now() + env.AI_JOB_ATTEMPT_TIMEOUT_MS,
        ),
      },
    },
  );
  if (result.matchedCount === 0) throw executionFenceError();
}

export async function completeJob(
  execution: JobExecutionIdentity,
  result: unknown,
): Promise<void> {
  const completedAt = new Date();
  const updated = await JobRecordModel.updateOne(
    {
      ...executionFilter(execution),
      phase: "persisting",
    },
    {
      $set: {
        status: "completed",
        phase: "completed",
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
        executionId: 1,
      },
      $inc: { phaseSequence: 1 },
    },
  );
  if (updated.matchedCount === 0) throw executionFenceError();
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
  const execution = executionIdentity(job);
  const classifiedError =
    error instanceof ZodError
      ? new AppError(
          400,
          "INVALID_APPLICATION_INPUT",
          "The application input is invalid.",
          undefined,
          false,
          "NON_RETRYABLE_REQUEST",
        )
      : error;
  if (
    classifiedError instanceof AppError &&
    classifiedError.code === "LEARNING_DOCUMENT_WORK_INVALIDATED"
  ) {
    await cancelInvalidatedProcessingJob(job._id.toString());
    return;
  }

  const persistedError = safeJobError(classifiedError);
  const retryable =
    classifiedError instanceof AppError && classifiedError.retryable === true;
  const terminalLearningFence = learningJobRetryFence(job);
  if (!retryable && terminalLearningFence) {
    try {
      await withMongoTransaction(async (mongoSession) => {
        await fenceLearningDocumentWork({
          ...terminalLearningFence,
          session: mongoSession,
        });
        return true;
      });
    } catch (fenceError) {
      if (isLearningDocumentWorkInvalidated(fenceError)) {
        await cancelInvalidatedProcessingJob(job._id.toString());
        return;
      }
      throw fenceError;
    }
  }

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

          const updated = await JobRecordModel.updateOne(
            {
              ...executionFilter(execution),
            },
            {
              $set: {
                status: "queued",
                phase: "retry_scheduled",
                runAt: retryAt,
                error: { ...persistedError, retryable: true },
              },
              $unset: {
                lockedAt: 1,
                lockExpiresAt: 1,
                lockedBy: 1,
                executionId: 1,
              },
              $inc: { phaseSequence: 1 },
            },
            { session: mongoSession },
          );

          if (updated.matchedCount === 0) throw executionFenceError();

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

    const updated = await JobRecordModel.updateOne(
      executionFilter(execution),
      {
        $set: {
          status: "queued",
          phase: "retry_scheduled",
          runAt: retryAt,
          error: { ...persistedError, retryable: true },
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
          executionId: 1,
        },
        $inc: { phaseSequence: 1 },
      },
    );
    if (updated.matchedCount === 0) {
      const current = await JobRecordModel.findById(job._id)
        .select("status")
        .lean();
      if (current?.status === "cancelled") return;
      throw executionFenceError();
    }
    return;
  }

  const failedAt = new Date();
  const updated = await JobRecordModel.updateOne(
    executionFilter(execution),
    {
      $set: {
        status: "failed",
        phase: "failed",
        failedAt,
        error: { ...persistedError, retryable },
        expiresAt: new Date(
          failedAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $unset: {
        lockedAt: 1,
        lockExpiresAt: 1,
        lockedBy: 1,
        executionId: 1,
      },
      $inc: { phaseSequence: 1 },
    },
  );
  if (updated.matchedCount === 0) {
    const current = await JobRecordModel.findById(job._id)
      .select("status")
      .lean();
    if (current?.status === "cancelled") return;
    throw executionFenceError();
  }
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
        phase: "cancelled",
        cancelledAt,
        cancellationReason: "work_invalidated",
        expiresAt: new Date(
          cancelledAt.getTime() +
            env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
      $inc: { phaseSequence: 1 },
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

export function canRetryJob(job: JobRecord): boolean {
  if (!aiActionForJobType(job.type)) return false;
  if (
    job.aiRoutingSnapshot &&
    job.aiRoutingSnapshot.provider !== "gemini-direct"
  ) {
    return false;
  }
  return (
    job.status === "cancelled" ||
    (job.status === "failed" && job.error?.retryable === true)
  );
}

function retryPayloadId(
  source: JobRecord,
  key: string,
): string {
  const payload = source.payload;
  const value =
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload)
      ? (payload as Record<string, unknown>)[key]
      : undefined;
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw new AppError(
      409,
      "JOB_RETRY_LINK_INVALID",
      "The retry target is no longer valid.",
      undefined,
      false,
    );
  }
  return value;
}

async function relinkRetriedJob(input: {
  source: JobRecord;
  retry: JobRecord;
  userId: string;
  session: ClientSession;
}): Promise<void> {
  const sourceId = input.source._id;
  const retryId = input.retry._id;
  const owned = { userId: input.userId };
  let matchedCount: number | undefined;

  switch (input.source.type) {
    case "interview.question.explain":
      matchedCount = (await InterviewQuestionModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "questionId"),
          explanationJobId: { $in: [sourceId, retryId] },
        },
        { $set: { explanationJobId: retryId } },
        { session: input.session },
      )).matchedCount;
      break;
    case "interview.attempt.feedback":
      matchedCount = (await InterviewAttemptModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "attemptId"),
          feedbackJobId: { $in: [sourceId, retryId] },
        },
        {
          $set: { feedbackJobId: retryId, status: "feedback-queued" },
          $unset: { feedbackError: 1 },
        },
        { session: input.session },
      )).matchedCount;
      break;
    case "learning.document.process":
      matchedCount = (await LearningDocumentModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "documentId"),
          processingJobId: { $in: [sourceId, retryId] },
        },
        {
          $set: { processingJobId: retryId, status: "processing" },
          $unset: { processingError: 1 },
        },
        { session: input.session },
      )).matchedCount;
      break;
    case "learning.chat.respond":
      matchedCount = (await MessageModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "userMessageId"),
          responseJobId: { $in: [sourceId, retryId] },
          role: "user",
        },
        { $set: { responseJobId: retryId } },
        { session: input.session },
      )).matchedCount;
      break;
    case "learning.flashcards.generate":
      matchedCount = (await FlashcardSetModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "setId"),
          generationJobId: { $in: [sourceId, retryId] },
        },
        {
          $set: { generationJobId: retryId, status: "generating" },
          $unset: { generationError: 1 },
        },
        { session: input.session },
      )).matchedCount;
      break;
    case "learning.quiz.generate":
      matchedCount = (await QuizModel.updateOne(
        {
          ...owned,
          _id: retryPayloadId(input.source, "quizId"),
          generationJobId: { $in: [sourceId, retryId] },
        },
        {
          $set: { generationJobId: retryId, status: "generating" },
          $unset: { generationError: 1 },
        },
        { session: input.session },
      )).matchedCount;
      break;
    default:
      return;
  }

  if (matchedCount !== 1) {
    throw new AppError(
      409,
      "JOB_RETRY_LINK_CONFLICT",
      "The retry target is no longer current.",
      undefined,
      false,
    );
  }
}

export async function retryOwnedJob(
  userId: string,
  jobId: string,
): Promise<JobRecord> {
  const source = await getOwnedJob(userId, jobId);
  if (!canRetryJob(source)) {
    throw new AppError(
      409,
      "JOB_NOT_RETRYABLE",
      "This job cannot be retried.",
      undefined,
      false,
    );
  }

  return withMongoTransaction(async (session) => {
    const retry = await enqueueJob({
      type: source.type,
      payload: source.payload,
      userId,
      priority: source.priority,
      maxAttempts: source.maxAttempts,
      idempotencyKey: `job-retry:${userId}:${source._id.toString()}`,
      retryOfJobId: source._id.toString(),
      rootJobId: source.rootJobId?.toString() ?? source._id.toString(),
      requireGeminiDirect: true,
      session,
    });
    await relinkRetriedJob({ source, retry, userId, session });
    return retry;
  });
}

export async function cancelOwnedQueuedJob(
  userId: string,
  jobId: string,
): Promise<void> {
  await cancelOwnedJobExecution(userId, jobId);
}

export async function cancelOwnedJobExecution(
  userId: string,
  jobId: string,
): Promise<JobRecord> {
  const cancelledAt = new Date();
  const result = await JobRecordModel.findOneAndUpdate(
    {
      _id: jobId,
      userId,
      $or: [
        { status: "queued" },
        {
          status: "processing",
          phase: { $ne: "persisting" },
        },
      ],
    },
    {
      $set: {
        status: "cancelled",
        phase: "cancelled",
        cancelledAt,
        cancellationReason: "user_requested",
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
      $inc: { phaseSequence: 1 },
    },
    { new: true },
  );

  if (result) {
    if (result.executionId) {
      abortActiveJobExecution(
        {
          jobId,
          executionId: result.executionId,
          attempt: result.attempts,
        },
        "user_cancelled",
      );
    }
    return result.toObject();
  }

  const owned = await JobRecordModel.findOne({ _id: jobId, userId }).lean();
  if (!owned) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }
  if (owned.status === "cancelled") return owned;
  throw new AppError(
    409,
    "JOB_NOT_CANCELLABLE",
    "This job can no longer be cancelled.",
    undefined,
    false,
  );
}
