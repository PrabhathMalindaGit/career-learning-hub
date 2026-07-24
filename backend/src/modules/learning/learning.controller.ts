import type { Request, Response } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import { AppError } from "../../shared/appError.js";
import {
  attachFlashcardJob,
  attachQuizJob,
  createFlashcardSet,
  createQuiz,
  getQuizAttemptReview,
  getQuizForTaking,
  listFlashcards,
  listFlashcardSets,
  listQuizAttempts,
  listQuizzes,
  submitQuizAttempt,
} from "./learningAssessment.service.js";
import {
  attachChatResponseJob,
  createConversation,
  createUserChatMessage,
  listConversationMessages,
  listDocumentConversations,
} from "./learningChat.service.js";
import {
  createLearningDocumentUpload,
  listDocumentChunks,
  listLearningDocuments,
  serializeLearningDocument,
} from "./learningDocument.service.js";
import { LearningDocumentModel } from "./learningDocument.model.js";

export const learningPdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: env.ASSET_MAX_FILE_SIZE_BYTES,
    fields: 10,
  },
}).single("file");

export async function uploadLearningDocumentController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.file) {
    throw new AppError(
      400,
      "LEARNING_DOCUMENT_FILE_REQUIRED",
      "A PDF learning document is required.",
    );
  }

  const document = await createLearningDocumentUpload({
    userId: request.auth!.userId,
    title: request.body.title,
    file: request.file,
  });

  const job = await enqueueJob({
    type: "learning.document.process",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      documentId: document._id.toString(),
      assetId: document.assetId.toString(),
    },
    maxAttempts: env.LEARNING_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "learning.document.process",
      request.auth!.userId,
      document._id.toString(),
    ].join(":"),
  });

  document.processingJobId = job._id;
  await document.save();

  response.status(202).json({
    success: true,
    data: {
      document: serializeLearningDocument(document),
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function listLearningDocumentsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listLearningDocuments(
    request.auth!.userId,
    request.query as unknown as {
      page: number;
      limit: number;
      status?: "uploaded" | "processing" | "ready" | "failed" | "deleting";
    },
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getLearningDocumentController(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json({
    success: true,
    data: {
      document: serializeLearningDocument(
        request.learningDocument!,
      ),
    },
  });
}

export async function listDocumentChunksController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listDocumentChunks({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    ...(request.query as unknown as {
      page: number;
      limit: number;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function deleteLearningDocumentController(
  request: Request,
  response: Response,
): Promise<void> {
  const document = request.learningDocument!;

  if (
    document.status === "deleting" &&
    document.deletionJobId
  ) {
    response.status(202).json({
      success: true,
      data: {
        job: {
          id: document.deletionJobId.toString(),
          type: "learning.document.delete",
          status: "queued-or-processing",
        },
      },
    });
    return;
  }

  const job = await enqueueJob({
    type: "learning.document.delete",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      documentId: document._id.toString(),
    },
    maxAttempts: env.LEARNING_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "learning.document.delete",
      request.auth!.userId,
      document._id.toString(),
    ].join(":"),
  });

  document.status = "deleting";
  document.deletionJobId = job._id;
  await document.save();

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

export async function createConversationController(
  request: Request,
  response: Response,
): Promise<void> {
  const conversation = await createConversation({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    title: request.body.title,
  });

  response.status(201).json({
    success: true,
    data: { conversation },
  });
}

export async function listConversationsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listDocumentConversations({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    ...(request.query as unknown as {
      page: number;
      limit: number;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function listConversationMessagesController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listConversationMessages({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    conversationId:
      request.learningConversation!._id.toString(),
    ...(request.query as unknown as {
      page: number;
      limit: number;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function sendConversationMessageController(
  request: Request,
  response: Response,
): Promise<void> {
  if (request.learningDocument!.status !== "ready") {
    throw new AppError(
      409,
      "LEARNING_DOCUMENT_NOT_READY",
      "The document must finish processing before chat can be used.",
    );
  }

  if (
    request.body.content.length >
    env.LEARNING_MAX_CHAT_MESSAGE_CHARACTERS
  ) {
    throw new AppError(
      413,
      "LEARNING_CHAT_MESSAGE_TOO_LONG",
      `The chat message exceeds the ${env.LEARNING_MAX_CHAT_MESSAGE_CHARACTERS}-character limit.`,
    );
  }

  const message = await createUserChatMessage({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    conversationId:
      request.learningConversation!._id.toString(),
    requestId: request.body.requestId,
    content: request.body.content,
  });

  const job = await enqueueJob({
    type: "learning.chat.respond",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      documentId: request.learningDocument!._id.toString(),
      conversationId:
        request.learningConversation!._id.toString(),
      userMessageId: message._id.toString(),
    },
    maxAttempts: env.LEARNING_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "learning.chat.respond",
      request.auth!.userId,
      request.learningConversation!._id.toString(),
      request.body.requestId,
    ].join(":"),
  });

  await attachChatResponseJob({
    userId: request.auth!.userId,
    messageId: message._id.toString(),
    jobId: job._id.toString(),
  });

  response.status(202).json({
    success: true,
    data: {
      userMessage: message,
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function createFlashcardSetController(
  request: Request,
  response: Response,
): Promise<void> {
  if (
    request.body.count >
    env.LEARNING_MAX_FLASHCARDS_PER_SET
  ) {
    throw new AppError(
      400,
      "FLASHCARD_COUNT_LIMIT_EXCEEDED",
      `A set may contain at most ${env.LEARNING_MAX_FLASHCARDS_PER_SET} flashcards.`,
    );
  }

  const set = await createFlashcardSet({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    requestId: request.body.requestId,
    title: request.body.title,
  });

  const job = await enqueueJob({
    type: "learning.flashcards.generate",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      documentId: request.learningDocument!._id.toString(),
      setId: set._id.toString(),
      count: request.body.count,
      focus: request.body.focus,
    },
    maxAttempts: env.LEARNING_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "learning.flashcards.generate",
      request.auth!.userId,
      request.learningDocument!._id.toString(),
      request.body.requestId,
    ].join(":"),
  });

  await attachFlashcardJob({
    userId: request.auth!.userId,
    setId: set._id.toString(),
    jobId: job._id.toString(),
  });

  response.status(202).json({
    success: true,
    data: {
      setId: set._id.toString(),
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function listFlashcardSetsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listFlashcardSets({
    userId: request.auth!.userId,
    documentId: request.query.documentId as string | undefined,
    page: Number(request.query.page),
    limit: Number(request.query.limit),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getFlashcardSetController(
  request: Request,
  response: Response,
): Promise<void> {
  const set = request.flashcardSet!;

  response.status(200).json({
    success: true,
    data: {
      set: {
        id: set._id.toString(),
        documentId: set.documentId.toString(),
        title: set.title,
        status: set.status,
        cardCount: set.cardCount,
        generationError: set.generationError,
        createdAt: set.createdAt,
        updatedAt: set.updatedAt,
      },
    },
  });
}

export async function listFlashcardsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listFlashcards({
    userId: request.auth!.userId,
    setId: request.flashcardSet!._id.toString(),
    ...(request.query as unknown as {
      page: number;
      limit: number;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function createQuizController(
  request: Request,
  response: Response,
): Promise<void> {
  if (
    request.body.questionCount >
    env.LEARNING_MAX_QUIZ_QUESTIONS
  ) {
    throw new AppError(
      400,
      "QUIZ_QUESTION_LIMIT_EXCEEDED",
      `A quiz may contain at most ${env.LEARNING_MAX_QUIZ_QUESTIONS} questions.`,
    );
  }

  const quiz = await createQuiz({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    requestId: request.body.requestId,
    title: request.body.title,
  });

  const job = await enqueueJob({
    type: "learning.quiz.generate",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      documentId: request.learningDocument!._id.toString(),
      quizId: quiz._id.toString(),
      questionCount: request.body.questionCount,
      focus: request.body.focus,
    },
    maxAttempts: env.LEARNING_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "learning.quiz.generate",
      request.auth!.userId,
      request.learningDocument!._id.toString(),
      request.body.requestId,
    ].join(":"),
  });

  await attachQuizJob({
    userId: request.auth!.userId,
    quizId: quiz._id.toString(),
    jobId: job._id.toString(),
  });

  response.status(202).json({
    success: true,
    data: {
      quizId: quiz._id.toString(),
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function listQuizzesController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listQuizzes({
    userId: request.auth!.userId,
    documentId: request.query.documentId as string | undefined,
    page: Number(request.query.page),
    limit: Number(request.query.limit),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getQuizController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await getQuizForTaking({
    userId: request.auth!.userId,
    quizId: request.learningQuiz!._id.toString(),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function submitQuizController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await submitQuizAttempt({
    userId: request.auth!.userId,
    quizId: request.learningQuiz!._id.toString(),
    answers: request.body.answers,
  });

  response.status(201).json({
    success: true,
    data: result,
  });
}

export async function listAllQuizAttemptsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listQuizAttempts({
    userId: request.auth!.userId,
    documentId: request.query.documentId as string | undefined,
    page: Number(request.query.page),
    limit: Number(request.query.limit),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function listQuizAttemptsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listQuizAttempts({
    userId: request.auth!.userId,
    quizId: request.learningQuiz!._id.toString(),
    ...(request.query as unknown as {
      page: number;
      limit: number;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getQuizAttemptController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await getQuizAttemptReview({
    userId: request.auth!.userId,
    quizId: request.learningQuiz!._id.toString(),
    attemptId: request.quizAttempt!._id.toString(),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}
