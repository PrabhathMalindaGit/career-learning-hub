import type { RequestHandler } from "express";
import { AppError } from "../../shared/appError.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { ConversationModel } from "./conversation.model.js";
import { FlashcardSetModel } from "./flashcardSet.model.js";
import { LearningDocumentModel } from "./learningDocument.model.js";
import { QuizModel } from "./quiz.model.js";
import { QuizAttemptModel } from "./quizAttempt.model.js";

// Feature 7.2 — Learning ownership boundary: document/child-resource IDs are bound to request.auth.userId.
// Feature 7.2 BACKEND — Owner-scoped Learning authorization.
export const requireOwnedLearningDocument: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const document = await LearningDocumentModel.findOne({
      _id: request.params.documentId,
      userId: request.auth!.userId,
    });

    if (!document) {
      throw new AppError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
      );
    }

    request.learningDocument = document;
    next();
  });

export const requireOwnedConversation: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const conversation = await ConversationModel.findOne({
      _id: request.params.conversationId,
      documentId: request.params.documentId,
      userId: request.auth!.userId,
    });

    if (!conversation) {
      throw new AppError(
        404,
        "LEARNING_CONVERSATION_NOT_FOUND",
        "Learning conversation not found.",
      );
    }

    request.learningConversation = conversation;
    next();
  });

export const requireOwnedFlashcardSet: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const set = await FlashcardSetModel.findOne({
      _id: request.params.setId,
      userId: request.auth!.userId,
    });

    if (!set) {
      throw new AppError(
        404,
        "FLASHCARD_SET_NOT_FOUND",
        "Flashcard set not found.",
      );
    }

    request.flashcardSet = set;
    next();
  });

export const requireOwnedQuiz: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const quiz = await QuizModel.findOne({
      _id: request.params.quizId,
      userId: request.auth!.userId,
    });

    if (!quiz) {
      throw new AppError(
        404,
        "QUIZ_NOT_FOUND",
        "Quiz not found.",
      );
    }

    request.learningQuiz = quiz;
    next();
  });

export const requireOwnedQuizAttempt: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const attempt = await QuizAttemptModel.findOne({
      _id: request.params.attemptId,
      quizId: request.params.quizId,
      userId: request.auth!.userId,
    });

    if (!attempt) {
      throw new AppError(
        404,
        "QUIZ_ATTEMPT_NOT_FOUND",
        "Quiz attempt not found.",
      );
    }

    request.quizAttempt = attempt;
    next();
  });
