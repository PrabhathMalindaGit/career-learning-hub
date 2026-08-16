import type { Request, Response } from "express";
import {
  deleteLearningConversation,
  deleteLearningFlashcardSet,
  deleteLearningQuiz,
} from "./learningChildDeletion.service.js";

type ConversationDeleteParams = {
  documentId: string;
  conversationId: string;
};

type FlashcardSetDeleteParams = {
  setId: string;
};

type QuizDeleteParams = {
  quizId: string;
};

export async function deleteLearningConversationController(
  request: Request<ConversationDeleteParams>,
  response: Response,
): Promise<void> {
  const id = await deleteLearningConversation({
    userId: request.auth!.userId,
    documentId: request.params.documentId,
    conversationId: request.params.conversationId,
  });

  response.status(200).json({
    success: true,
    data: { deleted: true, id },
  });
}

export async function deleteLearningFlashcardSetController(
  request: Request<FlashcardSetDeleteParams>,
  response: Response,
): Promise<void> {
  const id = await deleteLearningFlashcardSet({
    userId: request.auth!.userId,
    setId: request.params.setId,
  });

  response.status(200).json({
    success: true,
    data: { deleted: true, id },
  });
}

export async function deleteLearningQuizController(
  request: Request<QuizDeleteParams>,
  response: Response,
): Promise<void> {
  const id = await deleteLearningQuiz({
    userId: request.auth!.userId,
    quizId: request.params.quizId,
  });

  response.status(200).json({
    success: true,
    data: { deleted: true, id },
  });
}
