import type { ClientSession } from "mongoose";
import { AppError } from "../../shared/appError.js";
import {
  LearningDocumentModel,
  maximumLearningDocumentWorkFence,
  type LearningDocumentStatus,
} from "./learningDocument.model.js";

export const learningDocumentWorkInvalidatedCode =
  "LEARNING_DOCUMENT_WORK_INVALIDATED";

export function learningDocumentWorkInvalidatedError(): AppError {
  return new AppError(
    409,
    learningDocumentWorkInvalidatedCode,
    "The learning document no longer accepts this work.",
  );
}

export function isLearningDocumentWorkInvalidated(
  error: unknown,
): boolean {
  return (
    error instanceof AppError &&
    error.code === learningDocumentWorkInvalidatedCode
  );
}

export async function assertLearningDocumentWorkAvailable(input: {
  userId: string;
  documentId: string;
  allowedStatuses: readonly LearningDocumentStatus[];
}): Promise<void> {
  const exists = await LearningDocumentModel.exists({
    _id: input.documentId,
    userId: input.userId,
    status: { $in: input.allowedStatuses },
  });

  if (!exists) {
    throw learningDocumentWorkInvalidatedError();
  }
}

export async function fenceLearningDocumentWork(input: {
  userId: string;
  documentId: string;
  allowedStatuses: readonly LearningDocumentStatus[];
  session: ClientSession;
  assetId?: string;
  processingJobId?: string;
}): Promise<void> {
  const document = await LearningDocumentModel.findOneAndUpdate(
    {
      _id: input.documentId,
      userId: input.userId,
      status: { $in: input.allowedStatuses },
      $or: [
        { workFence: { $exists: false } },
        {
          workFence: {
            $lt: maximumLearningDocumentWorkFence,
          },
        },
      ],
      ...(input.assetId === undefined
        ? {}
        : { assetId: input.assetId }),
      ...(input.processingJobId === undefined
        ? {}
        : { processingJobId: input.processingJobId }),
    },
    {
      $inc: { workFence: 1 },
    },
    {
      new: true,
      session: input.session,
      timestamps: false,
    },
  );

  if (!document) {
    throw learningDocumentWorkInvalidatedError();
  }
}
