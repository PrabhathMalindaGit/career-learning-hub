import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { recordActivitySafely } from "../activity/activity.service.js";
import { AssetModel } from "../assets/asset.model.js";
import { createAsset } from "../assets/asset.service.js";
import { getStorageForProvider } from "../assets/storage/storage.factory.js";
import { ConversationModel } from "./conversation.model.js";
import { DocumentChunkModel } from "./documentChunk.model.js";
import { FlashcardModel } from "./flashcard.model.js";
import { FlashcardSetModel } from "./flashcardSet.model.js";
import {
  LearningDocumentModel,
  type LearningDocumentDocument,
  type LearningDocumentStatus,
} from "./learningDocument.model.js";
import { MessageModel } from "./message.model.js";
import { QuizModel } from "./quiz.model.js";
import { QuizAttemptModel } from "./quizAttempt.model.js";
import { QuizQuestionModel } from "./quizQuestion.model.js";

export async function createLearningDocumentUpload(input: {
  userId: string;
  title: string;
  file: Express.Multer.File;
}): Promise<LearningDocumentDocument> {
  if (input.file.mimetype !== "application/pdf") {
    throw new AppError(
      415,
      "LEARNING_DOCUMENT_PDF_REQUIRED",
      "Learning Workspace currently accepts PDF documents only.",
    );
  }

  const asset = await createAsset({
    userId: input.userId,
    purpose: "learning-document",
    file: input.file,
    temporary: true,
    expiresInSeconds: 24 * 60 * 60,
  });

  try {
    const document = await LearningDocumentModel.create({
      userId: input.userId,
      assetId: asset._id,
      title: input.title,
      originalFilename:
        asset.originalFilename ?? input.file.originalname,
      mimeType: "application/pdf",
      status: "uploaded",
    });

    await recordActivitySafely({
      userId: input.userId,
      type: "learning.document.uploaded",
      resourceType: "learning-document",
      resourceId: document._id.toString(),
      metadata: {
        assetId: asset._id.toString(),
        sizeBytes: asset.sizeBytes,
      },
    });

    return document;
  } catch (error) {
    const storage = getStorageForProvider(asset.storageProvider);
    await storage.deleteObject(asset.storageKey).catch(() => undefined);

    await AssetModel.updateOne(
      { _id: asset._id, userId: input.userId },
      {
        $set: {
          status: "deleted",
          deletedAt: new Date(),
        },
        $unset: {
          expiresAt: 1,
        },
      },
    ).catch(() => undefined);

    throw error;
  }
}

export async function listLearningDocuments(
  userId: string,
  input: {
    page: number;
    limit: number;
    status?: LearningDocumentStatus;
  },
) {
  const filter: Record<string, unknown> = { userId };
  if (input.status) filter.status = input.status;

  const [documents, total] = await Promise.all([
    LearningDocumentModel.find(filter)
      .select(
        "title originalFilename mimeType status pageCount chunkCount summaryKeyPoints processingError processedAt createdAt updatedAt",
      )
      .sort({ updatedAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    LearningDocumentModel.countDocuments(filter),
  ]);

  return {
    documents,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export function serializeLearningDocument(
  document: LearningDocumentDocument,
) {
  return {
    id: document._id.toString(),
    title: document.title,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    status: document.status,
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    summary: document.summary,
    summaryKeyPoints: document.summaryKeyPoints,
    processingError: document.processingError,
    processedAt: document.processedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function listDocumentChunks(input: {
  userId: string;
  documentId: string;
  page: number;
  limit: number;
}) {
  const [chunks, total] = await Promise.all([
    DocumentChunkModel.find({
      userId: input.userId,
      documentId: input.documentId,
    })
      .select("chunkIndex pageStart pageEnd text wordCount")
      .sort({ chunkIndex: 1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    DocumentChunkModel.countDocuments({
      userId: input.userId,
      documentId: input.documentId,
    }),
  ]);

  return {
    chunks,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function cascadeDeleteLearningDocument(input: {
  userId: string;
  documentId: string;
  jobId: string;
}) {
  const document = await LearningDocumentModel.findOne({
    _id: input.documentId,
    userId: input.userId,
  });

  if (!document) {
    return {
      documentId: input.documentId,
      alreadyDeleted: true,
    };
  }

  if (
    document.deletionJobId &&
    document.deletionJobId.toString() !== input.jobId
  ) {
    throw new AppError(
      409,
      "LEARNING_DOCUMENT_DELETION_CONFLICT",
      "A different deletion job owns this document.",
    );
  }

  await LearningDocumentModel.updateOne(
    {
      _id: document._id,
      userId: input.userId,
    },
    {
      $set: {
        status: "deleting",
        deletionJobId: input.jobId,
      },
    },
  );

  const asset = await AssetModel.findOne({
    _id: document.assetId,
    userId: input.userId,
  });

  if (asset && asset.status !== "deleted") {
    await getStorageForProvider(
      asset.storageProvider,
    ).deleteObject(asset.storageKey);

    asset.status = "deleted";
    asset.deletedAt = new Date();
    asset.expiresAt = undefined;
    await asset.save();
  }

  const deletionCounts = await withMongoTransaction(
    async (mongoSession) => {
      const [
        messages,
        conversations,
        cards,
        cardSets,
        quizAttempts,
        quizQuestions,
        quizzes,
        chunks,
      ] = await Promise.all([
        MessageModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        ConversationModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        FlashcardModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        FlashcardSetModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        QuizAttemptModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        QuizQuestionModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        QuizModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
        DocumentChunkModel.deleteMany({
          userId: input.userId,
          documentId: input.documentId,
        }).session(mongoSession),
      ]);

      const deletedDocument =
        await LearningDocumentModel.deleteOne({
          _id: input.documentId,
          userId: input.userId,
          deletionJobId: input.jobId,
        }).session(mongoSession);

      if (deletedDocument.deletedCount !== 1) {
        throw new AppError(
          409,
          "LEARNING_DOCUMENT_DELETION_CONFLICT",
          "The document could not be deleted by this job.",
        );
      }

      return {
        messages: messages.deletedCount,
        conversations: conversations.deletedCount,
        flashcards: cards.deletedCount,
        flashcardSets: cardSets.deletedCount,
        quizAttempts: quizAttempts.deletedCount,
        quizQuestions: quizQuestions.deletedCount,
        quizzes: quizzes.deletedCount,
        chunks: chunks.deletedCount,
      };
    },
  );

  await recordActivitySafely({
    userId: input.userId,
    type: "learning.document.deleted",
    resourceType: "learning-document",
    resourceId: input.documentId,
    origin: "worker",
    metadata: deletionCounts,
  });

  return {
    documentId: input.documentId,
    alreadyDeleted: false,
    deleted: deletionCounts,
  };
}
