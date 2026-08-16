import { randomUUID } from "node:crypto";
import request from "supertest";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { ConversationModel } from "../../modules/learning/conversation.model.js";
import { FlashcardModel } from "../../modules/learning/flashcard.model.js";
import { FlashcardSetModel } from "../../modules/learning/flashcardSet.model.js";
import { LearningDocumentModel } from "../../modules/learning/learningDocument.model.js";
import { MessageModel } from "../../modules/learning/message.model.js";
import { QuizModel } from "../../modules/learning/quiz.model.js";
import { QuizAttemptModel } from "../../modules/learning/quizAttempt.model.js";
import { QuizQuestionModel } from "../../modules/learning/quizQuestion.model.js";
import { registerTestUser } from "../helpers/auth.js";

async function createReadyDocument(userId: string, title: string) {
  return LearningDocumentModel.create({
    userId,
    assetId: new Types.ObjectId(),
    title,
    originalFilename: `${title.toLowerCase().replaceAll(" ", "-")}.pdf`,
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 2,
    chunkCount: 1,
  });
}

async function createConversationFixture(userId: string, documentId: string) {
  const conversation = await ConversationModel.create({
    userId,
    documentId,
    title: "Deletion conversation",
    messageCount: 1,
    lastMessageAt: new Date(),
  });
  const message = await MessageModel.create({
    userId,
    documentId,
    conversationId: conversation._id,
    role: "user",
    content: "What should I revise?",
    clientRequestId: randomUUID(),
  });
  return { conversation, message };
}

async function createFlashcardFixture(userId: string, documentId: string) {
  const set = await FlashcardSetModel.create({
    userId,
    documentId,
    requestId: randomUUID(),
    title: "Deletion flashcards",
    status: "ready",
    cardCount: 1,
  });
  const card = await FlashcardModel.create({
    userId,
    documentId,
    setId: set._id,
    cardIndex: 0,
    front: "What is REST?",
    back: "An architectural style for networked applications.",
    sourceChunkIds: [],
    sourcePages: [1],
  });
  return { set, card };
}

async function createQuizFixture(userId: string, documentId: string) {
  const quiz = await QuizModel.create({
    userId,
    documentId,
    requestId: randomUUID(),
    title: "Deletion quiz",
    status: "ready",
    questionCount: 1,
  });
  const question = await QuizQuestionModel.create({
    userId,
    documentId,
    quizId: quiz._id,
    questionIndex: 0,
    prompt: "Which HTTP method commonly retrieves a resource?",
    choices: ["GET", "POST"],
    correctChoiceIndex: 0,
    explanation: "GET requests retrieve representations of resources.",
    sourceChunkIds: [],
    sourcePages: [1],
  });
  const attempt = await QuizAttemptModel.create({
    userId,
    documentId,
    quizId: quiz._id,
    answers: [
      {
        questionId: question._id,
        questionIndex: 0,
        selectedChoiceIndex: 0,
        correct: true,
      },
    ],
    correctCount: 1,
    questionCount: 1,
    scorePercent: 100,
  });
  return { quiz, question, attempt };
}

describe("Learning child resource deletion", () => {
  it("deletes an owned conversation and its messages", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-chat@example.com",
      displayName: "Learning Child Delete Chat",
    });
    const document = await createReadyDocument(owner.userId, "Chat Delete");
    const { conversation, message } = await createConversationFixture(
      owner.userId,
      document._id.toString(),
    );

    await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}/conversations/${conversation._id.toString()}`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await ConversationModel.exists({ _id: conversation._id })).toBeFalsy();
    expect(await MessageModel.exists({ _id: message._id })).toBeFalsy();
    expect(await LearningDocumentModel.exists({ _id: document._id })).toBeTruthy();
  });

  it("blocks conversation deletion while its chat response job is active", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-chat-busy@example.com",
      displayName: "Learning Child Delete Chat Busy",
    });
    const document = await createReadyDocument(owner.userId, "Chat Busy");
    const { conversation, message } = await createConversationFixture(
      owner.userId,
      document._id.toString(),
    );
    await JobRecordModel.create({
      userId: owner.userId,
      type: "learning.chat.respond",
      payload: {
        userId: owner.userId,
        documentId: document._id.toString(),
        conversationId: conversation._id.toString(),
        userMessageId: message._id.toString(),
      },
      status: "processing",
    });

    const response = await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}/conversations/${conversation._id.toString()}`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(response.body.error.code).toBe(
      "LEARNING_CONVERSATION_DELETE_BLOCKED_BY_ACTIVE_JOB",
    );
    expect(await ConversationModel.exists({ _id: conversation._id })).toBeTruthy();
    expect(await MessageModel.exists({ _id: message._id })).toBeTruthy();
  });

  it("uses owner-scoped not-found behavior for foreign conversations", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-chat-owner@example.com",
      displayName: "Learning Child Delete Chat Owner",
    });
    const other = await registerTestUser(app, {
      email: "learning-child-delete-chat-other@example.com",
      displayName: "Learning Child Delete Chat Other",
    });
    const document = await createReadyDocument(owner.userId, "Chat Private");
    const { conversation, message } = await createConversationFixture(
      owner.userId,
      document._id.toString(),
    );

    const response = await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}/conversations/${conversation._id.toString()}`,
      )
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("LEARNING_DOCUMENT_NOT_FOUND");
    expect(await ConversationModel.exists({ _id: conversation._id })).toBeTruthy();
    expect(await MessageModel.exists({ _id: message._id })).toBeTruthy();
  });

  it("deletes an owned flashcard set and its cards", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-flashcards@example.com",
      displayName: "Learning Child Delete Flashcards",
    });
    const document = await createReadyDocument(owner.userId, "Flashcard Delete");
    const { set, card } = await createFlashcardFixture(
      owner.userId,
      document._id.toString(),
    );

    await request(app)
      .delete(`/api/v1/flashcard-sets/${set._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await FlashcardSetModel.exists({ _id: set._id })).toBeFalsy();
    expect(await FlashcardModel.exists({ _id: card._id })).toBeFalsy();
    expect(await LearningDocumentModel.exists({ _id: document._id })).toBeTruthy();
  });

  it("blocks flashcard-set deletion while generation is active", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-flashcards-busy@example.com",
      displayName: "Learning Child Delete Flashcards Busy",
    });
    const document = await createReadyDocument(owner.userId, "Flashcard Busy");
    const { set, card } = await createFlashcardFixture(
      owner.userId,
      document._id.toString(),
    );
    await JobRecordModel.create({
      userId: owner.userId,
      type: "learning.flashcards.generate",
      payload: {
        userId: owner.userId,
        documentId: document._id.toString(),
        setId: set._id.toString(),
        count: 1,
      },
      status: "queued",
    });

    const response = await request(app)
      .delete(`/api/v1/flashcard-sets/${set._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(response.body.error.code).toBe(
      "FLASHCARD_SET_DELETE_BLOCKED_BY_ACTIVE_JOB",
    );
    expect(await FlashcardSetModel.exists({ _id: set._id })).toBeTruthy();
    expect(await FlashcardModel.exists({ _id: card._id })).toBeTruthy();
  });

  it("uses owner-scoped not-found behavior for foreign flashcard sets", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-flashcards-owner@example.com",
      displayName: "Learning Child Delete Flashcards Owner",
    });
    const other = await registerTestUser(app, {
      email: "learning-child-delete-flashcards-other@example.com",
      displayName: "Learning Child Delete Flashcards Other",
    });
    const document = await createReadyDocument(owner.userId, "Flashcard Private");
    const { set, card } = await createFlashcardFixture(
      owner.userId,
      document._id.toString(),
    );

    const response = await request(app)
      .delete(`/api/v1/flashcard-sets/${set._id.toString()}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("FLASHCARD_SET_NOT_FOUND");
    expect(await FlashcardSetModel.exists({ _id: set._id })).toBeTruthy();
    expect(await FlashcardModel.exists({ _id: card._id })).toBeTruthy();
  });

  it("deletes an owned quiz with questions and attempt history", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-quiz@example.com",
      displayName: "Learning Child Delete Quiz",
    });
    const document = await createReadyDocument(owner.userId, "Quiz Delete");
    const { quiz, question, attempt } = await createQuizFixture(
      owner.userId,
      document._id.toString(),
    );

    await request(app)
      .delete(`/api/v1/quizzes/${quiz._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await QuizModel.exists({ _id: quiz._id })).toBeFalsy();
    expect(await QuizQuestionModel.exists({ _id: question._id })).toBeFalsy();
    expect(await QuizAttemptModel.exists({ _id: attempt._id })).toBeFalsy();
    expect(await LearningDocumentModel.exists({ _id: document._id })).toBeTruthy();
  });

  it("blocks quiz deletion while generation is active", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-quiz-busy@example.com",
      displayName: "Learning Child Delete Quiz Busy",
    });
    const document = await createReadyDocument(owner.userId, "Quiz Busy");
    const { quiz, question, attempt } = await createQuizFixture(
      owner.userId,
      document._id.toString(),
    );
    await JobRecordModel.create({
      userId: owner.userId,
      type: "learning.quiz.generate",
      payload: {
        userId: owner.userId,
        documentId: document._id.toString(),
        quizId: quiz._id.toString(),
        questionCount: 1,
      },
      status: "processing",
    });

    const response = await request(app)
      .delete(`/api/v1/quizzes/${quiz._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(response.body.error.code).toBe("QUIZ_DELETE_BLOCKED_BY_ACTIVE_JOB");
    expect(await QuizModel.exists({ _id: quiz._id })).toBeTruthy();
    expect(await QuizQuestionModel.exists({ _id: question._id })).toBeTruthy();
    expect(await QuizAttemptModel.exists({ _id: attempt._id })).toBeTruthy();
  });

  it("uses owner-scoped not-found behavior for foreign quizzes", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-quiz-owner@example.com",
      displayName: "Learning Child Delete Quiz Owner",
    });
    const other = await registerTestUser(app, {
      email: "learning-child-delete-quiz-other@example.com",
      displayName: "Learning Child Delete Quiz Other",
    });
    const document = await createReadyDocument(owner.userId, "Quiz Private");
    const { quiz, question, attempt } = await createQuizFixture(
      owner.userId,
      document._id.toString(),
    );

    const response = await request(app)
      .delete(`/api/v1/quizzes/${quiz._id.toString()}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("QUIZ_NOT_FOUND");
    expect(await QuizModel.exists({ _id: quiz._id })).toBeTruthy();
    expect(await QuizQuestionModel.exists({ _id: question._id })).toBeTruthy();
    expect(await QuizAttemptModel.exists({ _id: attempt._id })).toBeTruthy();
  });
});
