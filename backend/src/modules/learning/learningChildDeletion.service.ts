import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { ConversationModel } from "./conversation.model.js";
import { FlashcardModel } from "./flashcard.model.js";
import { FlashcardSetModel } from "./flashcardSet.model.js";
import { MessageModel } from "./message.model.js";
import { QuizModel } from "./quiz.model.js";
import { QuizAttemptModel } from "./quizAttempt.model.js";
import { QuizQuestionModel } from "./quizQuestion.model.js";

const activeJobStatuses = ["queued", "processing"] as const;

// Feature 5.10 — Learning child-resource deletion boundary.
// Performs owner-scoped transactional deletion/cascade rules while active jobs
// remain authoritative blockers for the targeted resource.
// Feature 5.10 BACKEND — Delete owned Learning conversation.
export async function deleteLearningConversation(input: {
  userId: string;
  documentId: string;
  conversationId: string;
}): Promise<string> {
  return withMongoTransaction(async (mongoSession) => {
    const conversation = await ConversationModel.findOne({
      _id: input.conversationId,
      userId: input.userId,
      documentId: input.documentId,
    }).session(mongoSession);

    if (!conversation) {
      throw new AppError(
        404,
        "LEARNING_CONVERSATION_NOT_FOUND",
        "Learning conversation not found.",
      );
    }

    const activeJob = await JobRecordModel.exists({
      userId: input.userId,
      type: "learning.chat.respond",
      "payload.conversationId": input.conversationId,
      status: { $in: activeJobStatuses },
    }).session(mongoSession);

    if (activeJob) {
      throw new AppError(
        409,
        "LEARNING_CONVERSATION_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Grounded Chat response before deleting this conversation.",
      );
    }

    await MessageModel.deleteMany({
      userId: input.userId,
      documentId: input.documentId,
      conversationId: conversation._id,
    }).session(mongoSession);

    const deleted = await ConversationModel.deleteOne({
      _id: conversation._id,
      userId: input.userId,
      documentId: input.documentId,
    }).session(mongoSession);

    if (deleted.deletedCount !== 1) {
      throw new AppError(
        404,
        "LEARNING_CONVERSATION_NOT_FOUND",
        "Learning conversation not found.",
      );
    }

    return conversation._id.toString();
  });
}

// Feature 5.10 BACKEND — Delete owned flashcard set.
export async function deleteLearningFlashcardSet(input: {
  userId: string;
  setId: string;
}): Promise<string> {
  return withMongoTransaction(async (mongoSession) => {
    const set = await FlashcardSetModel.findOne({
      _id: input.setId,
      userId: input.userId,
    }).session(mongoSession);

    if (!set) {
      throw new AppError(
        404,
        "FLASHCARD_SET_NOT_FOUND",
        "Flashcard set not found.",
      );
    }

    const activeJob = await JobRecordModel.exists({
      userId: input.userId,
      type: "learning.flashcards.generate",
      "payload.setId": input.setId,
      status: { $in: activeJobStatuses },
    }).session(mongoSession);

    if (activeJob) {
      throw new AppError(
        409,
        "FLASHCARD_SET_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current flashcard generation before deleting this set.",
      );
    }

    await FlashcardModel.deleteMany({
      userId: input.userId,
      documentId: set.documentId,
      setId: set._id,
    }).session(mongoSession);

    const deleted = await FlashcardSetModel.deleteOne({
      _id: set._id,
      userId: input.userId,
    }).session(mongoSession);

    if (deleted.deletedCount !== 1) {
      throw new AppError(
        404,
        "FLASHCARD_SET_NOT_FOUND",
        "Flashcard set not found.",
      );
    }

    return set._id.toString();
  });
}

// Feature 5.10 BACKEND — Delete owned quiz.
export async function deleteLearningQuiz(input: {
  userId: string;
  quizId: string;
}): Promise<string> {
  return withMongoTransaction(async (mongoSession) => {
    const quiz = await QuizModel.findOne({
      _id: input.quizId,
      userId: input.userId,
    }).session(mongoSession);

    if (!quiz) {
      throw new AppError(404, "QUIZ_NOT_FOUND", "Quiz not found.");
    }

    const activeJob = await JobRecordModel.exists({
      userId: input.userId,
      type: "learning.quiz.generate",
      "payload.quizId": input.quizId,
      status: { $in: activeJobStatuses },
    }).session(mongoSession);

    if (activeJob) {
      throw new AppError(
        409,
        "QUIZ_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current quiz generation before deleting this quiz.",
      );
    }

    await QuizAttemptModel.deleteMany({
      userId: input.userId,
      documentId: quiz.documentId,
      quizId: quiz._id,
    }).session(mongoSession);

    await QuizQuestionModel.deleteMany({
      userId: input.userId,
      documentId: quiz.documentId,
      quizId: quiz._id,
    }).session(mongoSession);

    const deleted = await QuizModel.deleteOne({
      _id: quiz._id,
      userId: input.userId,
    }).session(mongoSession);

    if (deleted.deletedCount !== 1) {
      throw new AppError(404, "QUIZ_NOT_FOUND", "Quiz not found.");
    }

    return quiz._id.toString();
  });
}
