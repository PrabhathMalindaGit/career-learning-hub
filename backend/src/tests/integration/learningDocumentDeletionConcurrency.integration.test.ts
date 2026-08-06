import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import mongoose, { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { getJobHandler } from "../../jobs/job.registry.js";
import {
  completeJob,
  failOrRetryJob,
} from "../../jobs/job.queue.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { createAsset } from "../../modules/assets/asset.service.js";
import { getStorageForProvider } from "../../modules/assets/storage/storage.factory.js";
import { ConversationModel } from "../../modules/learning/conversation.model.js";
import { DocumentChunkModel } from "../../modules/learning/documentChunk.model.js";
import { processLearningDocument } from "../../modules/learning/documentProcessing.service.js";
import { FlashcardModel } from "../../modules/learning/flashcard.model.js";
import { FlashcardSetModel } from "../../modules/learning/flashcardSet.model.js";
import {
  attachFlashcardJob,
  attachQuizJob,
  createFlashcardSet,
  createQuiz,
  generateFlashcards,
  generateQuiz,
  submitQuizAttempt,
} from "../../modules/learning/learningAssessment.service.js";
import {
  attachChatResponseJob,
  createConversation,
  createUserChatMessage,
  generateDocumentChatResponse,
} from "../../modules/learning/learningChat.service.js";
import {
  LearningDocumentModel,
  maximumLearningDocumentWorkFence,
} from "../../modules/learning/learningDocument.model.js";
import { cascadeDeleteLearningDocument } from "../../modules/learning/learningDocument.service.js";
import { registerLearningJobHandlers } from "../../modules/learning/learning.jobs.js";
import { MessageModel } from "../../modules/learning/message.model.js";
import { QuizModel } from "../../modules/learning/quiz.model.js";
import { QuizAttemptModel } from "../../modules/learning/quizAttempt.model.js";
import { QuizQuestionModel } from "../../modules/learning/quizQuestion.model.js";
import { registerTestUser } from "../helpers/auth.js";

const aiGatewayMock = vi.hoisted(() => ({
  generateStructuredOutput: vi.fn(),
}));

vi.mock("../../modules/ai/aiGateway.service.js", () => aiGatewayMock);

vi.mock("pdf-parse", () => ({
  PDFParse: class SyntheticPdfParser {
    async getText() {
      return {
        total: 1,
        text: "Synthetic document text for deterministic processing.",
      };
    }

    async destroy() {}
  },
}));

const syntheticPdf = Buffer.from(
  "%PDF-1.4\n% Synthetic deletion concurrency PDF\n%%EOF\n",
);

type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
};

function deferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => {
    throw new Error("Deferred promise was resolved before initialization.");
  };
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

function jobContext(jobId: string, userId: string) {
  return {
    jobId,
    executionId: randomUUID(),
    userId,
    attempt: 1,
    signal: new AbortController().signal,
    reportProgress: vi.fn(async () => undefined),
    reportPhase: vi.fn(async () => undefined),
    assertActive: vi.fn(async () => undefined),
    beginPersistence: vi.fn(async () => undefined),
    heartbeat: vi.fn(async () => undefined),
  };
}

function pdfUpload(): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "synthetic-concurrency.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: syntheticPdf.byteLength,
    buffer: syntheticPdf,
    stream: Readable.from(syntheticPdf),
    destination: "",
    filename: "",
    path: "",
  };
}

async function createDocument(input: {
  userId?: Types.ObjectId;
  status?: "uploaded" | "processing" | "ready" | "failed" | "deleting";
  assetId?: Types.ObjectId;
  processingJobId?: Types.ObjectId;
  deletionJobId?: Types.ObjectId;
}) {
  const userId = input.userId ?? new Types.ObjectId();

  return LearningDocumentModel.create({
    userId,
    assetId: input.assetId ?? new Types.ObjectId(),
    title: "Synthetic concurrency document",
    originalFilename: "synthetic-concurrency.pdf",
    mimeType: "application/pdf",
    status: input.status ?? "ready",
    processingJobId: input.processingJobId,
    deletionJobId: input.deletionJobId,
  });
}

async function createChunk(input: {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
}) {
  return DocumentChunkModel.create({
    userId: input.userId,
    documentId: input.documentId,
    chunkIndex: 0,
    pageStart: 1,
    pageEnd: 1,
    text: "Synthetic grounded content.",
    wordCount: 3,
  });
}

async function beginDeletion(input: {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  deletionJobId: Types.ObjectId;
}) {
  await LearningDocumentModel.updateOne(
    {
      _id: input.documentId,
      userId: input.userId,
    },
    {
      $set: {
        status: "deleting",
        deletionJobId: input.deletionJobId,
      },
    },
  );

  return cascadeDeleteLearningDocument({
    userId: input.userId.toString(),
    documentId: input.documentId.toString(),
    jobId: input.deletionJobId.toString(),
  });
}

function expectWorkInvalidated(operation: Promise<unknown>) {
  return expect(operation).rejects.toMatchObject({
    statusCode: 409,
    code: "LEARNING_DOCUMENT_WORK_INVALIDATED",
    message: "The learning document no longer accepts this work.",
  });
}

describe("Learning Document deletion concurrency fencing", () => {
  it("prevents conversation persistence when deletion wins before the write fence", async () => {
    const deletionJobId = new Types.ObjectId();
    const document = await createDocument({});
    const fenceEntered = deferred<void>();
    const releaseFence = deferred<void>();
    const findOneAndUpdate = vi
      .spyOn(LearningDocumentModel, "findOneAndUpdate")
      .mockImplementationOnce((() => {
        fenceEntered.resolve();
        return releaseFence.promise.then(() => null);
      }) as never);

    const creationPromise = createConversation({
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      title: "Must lose to deletion",
    });
    await fenceEntered.promise;
    await beginDeletion({
      userId: document.userId,
      documentId: document._id,
      deletionJobId,
    });
    releaseFence.resolve();

    await expectWorkInvalidated(creationPromise);
    findOneAndUpdate.mockRestore();
    expect(
      await ConversationModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("rejects conversation creation after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });

    await expectWorkInvalidated(
      createConversation({
        userId: document.userId.toString(),
        documentId: document._id.toString(),
        title: "Must not be created",
      }),
    );

    expect(
      await ConversationModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("fails closed when the private work fence reaches its safe bound", async () => {
    const document = await createDocument({});
    await LearningDocumentModel.updateOne(
      { _id: document._id },
      { $set: { workFence: maximumLearningDocumentWorkFence } },
    );

    await expectWorkInvalidated(
      createConversation({
        userId: document.userId.toString(),
        documentId: document._id.toString(),
        title: "Must not overflow the work fence",
      }),
    );
    expect(
      await ConversationModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("rejects chat-question acceptance after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Existing conversation",
    });

    await expectWorkInvalidated(
      createUserChatMessage({
        userId: document.userId.toString(),
        documentId: document._id.toString(),
        conversationId: conversation._id.toString(),
        requestId: "55c21342-7718-45a3-a9c5-66d1dbbeef12",
        content: "Must not be accepted",
      }),
    );

    expect(
      await MessageModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      (
        await ConversationModel.findById(conversation._id).lean()
      )?.messageCount
    ).toBe(0);
  });

  it("does not accept an idempotent chat retry after deletion begins", async () => {
    const document = await createDocument({});
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Idempotent conversation",
    });
    const input = {
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      conversationId: conversation._id.toString(),
      requestId: "817cc5bf-ed45-4c40-84e9-78093724ade7",
      content: "One accepted message",
    };

    await createUserChatMessage(input);
    await LearningDocumentModel.updateOne(
      { _id: document._id },
      { $set: { status: "deleting" } },
    );

    await expectWorkInvalidated(createUserChatMessage(input));
    expect(
      await MessageModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(1);
  });

  it("accepts and reconciles one owned chat intent without duplicate work", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-chat-acceptance@example.test",
      displayName: "Learning Chat Acceptance",
    });
    const document = await createDocument({
      userId: new Types.ObjectId(owner.userId),
    });
    const conversation = await ConversationModel.create({
      userId: owner.userId,
      documentId: document._id,
      title: "Accepted conversation",
    });
    const requestId = "4684087a-98b7-4090-ab70-928193be5893";
    const endpoint =
      `/api/v1/learning-documents/${document._id.toString()}` +
      `/conversations/${conversation._id.toString()}/messages`;
    const body = {
      requestId,
      content: "What is the provider-free state?",
    };
    const startSession = vi.spyOn(mongoose, "startSession");

    const first = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(body);
    const repeated = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(body);

    expect(first.status).toBe(202);
    expect(repeated.status).toBe(202);
    expect(Object.keys(first.body).sort()).toEqual([
      "data",
      "success",
    ]);
    expect(first.body.success).toBe(true);
    expect(first.body.data.userMessage).toMatchObject({
      userId: owner.userId,
      documentId: document._id.toString(),
      conversationId: conversation._id.toString(),
      role: "user",
      content: body.content,
      clientRequestId: requestId,
      sourceChunkIds: [],
      sourcePages: [],
    });
    expect(first.body.data.job).toEqual({
      id: expect.any(String),
      type: "learning.chat.respond",
      status: "queued",
    });
    expect(repeated.body.data.userMessage._id).toBe(
      first.body.data.userMessage._id,
    );
    expect(repeated.body.data.job).toEqual(first.body.data.job);

    const idempotencyKey = [
      "learning.chat.respond",
      owner.userId,
      conversation._id.toString(),
      requestId,
    ].join(":");
    const [messages, jobs, canonicalConversation] =
      await Promise.all([
        MessageModel.find({
          userId: owner.userId,
          documentId: document._id,
          conversationId: conversation._id,
        }).lean(),
        JobRecordModel.find({
          userId: owner.userId,
          idempotencyKey,
        }).lean(),
        ConversationModel.findById(conversation._id).lean(),
      ]);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: "user",
      clientRequestId: requestId,
      responseJobId: jobs[0]?._id,
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      type: "learning.chat.respond",
      status: "queued",
      userId: new Types.ObjectId(owner.userId),
      payload: {
        userId: owner.userId,
        documentId: document._id.toString(),
        conversationId: conversation._id.toString(),
        userMessageId: messages[0]?._id.toString(),
      },
    });
    expect(canonicalConversation?.messageCount).toBe(1);
    expect(
      await MessageModel.countDocuments({
        userId: owner.userId,
        conversationId: conversation._id,
        role: "assistant",
      }),
    ).toBe(0);
    expect(
      JSON.stringify(first.body),
    ).not.toContain(document.title);
    expect(aiGatewayMock.generateStructuredOutput).not.toHaveBeenCalled();

    const sessions = await Promise.all(
      startSession.mock.results.map((result) => result.value),
    );
    expect(sessions).toHaveLength(4);
    expect(sessions.every((session) => session.hasEnded)).toBe(true);
  });

  it("rejects document-owned job attachment after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Deleting conversation",
    });
    const message = await MessageModel.create({
      userId: document.userId,
      documentId: document._id,
      conversationId: conversation._id,
      role: "user",
      content: "Deleting message",
      sourceChunkIds: [],
      sourcePages: [],
    });
    const set = await FlashcardSetModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "0775a9d5-1a08-43b4-a92c-b25132a18970",
      title: "Deleting set",
      status: "generating",
    });
    const quiz = await QuizModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "763dbe80-018c-425e-80db-f43c4e223ffd",
      title: "Deleting quiz",
      status: "generating",
    });

    await expectWorkInvalidated(
      attachChatResponseJob({
        userId: document.userId.toString(),
        messageId: message._id.toString(),
        jobId: new Types.ObjectId().toString(),
      }),
    );
    await expectWorkInvalidated(
      attachFlashcardJob({
        userId: document.userId.toString(),
        setId: set._id.toString(),
        jobId: new Types.ObjectId().toString(),
      }),
    );
    await expectWorkInvalidated(
      attachQuizJob({
        userId: document.userId.toString(),
        quizId: quiz._id.toString(),
        jobId: new Types.ObjectId().toString(),
      }),
    );

    expect(
      (await MessageModel.findById(message._id).lean())?.responseJobId,
    ).toBeUndefined();
    expect(
      (await FlashcardSetModel.findById(set._id).lean())
        ?.generationJobId,
    ).toBeUndefined();
    expect(
      (await QuizModel.findById(quiz._id).lean())?.generationJobId,
    ).toBeUndefined();
  });

  it("prevents a paused chat job from recreating an assistant message after deletion", async () => {
    const deletionJobId = new Types.ObjectId();
    const responseJobId = new Types.ObjectId();
    const document = await createDocument({});
    const chunk = await createChunk({
      userId: document.userId,
      documentId: document._id,
    });
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Concurrent chat",
      messageCount: 1,
    });
    const userMessage = await MessageModel.create({
      userId: document.userId,
      documentId: document._id,
      conversationId: conversation._id,
      role: "user",
      content: "What is grounded here?",
      responseJobId,
      sourceChunkIds: [],
      sourcePages: [],
    });
    const providerStarted = deferred<void>();
    const providerResult = deferred<{
      answer: string;
      citedChunkIndexes: number[];
    }>();
    aiGatewayMock.generateStructuredOutput.mockImplementationOnce(() => {
      providerStarted.resolve();
      return providerResult.promise;
    });

    const responsePromise = generateDocumentChatResponse({
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      conversationId: conversation._id.toString(),
      userMessageId: userMessage._id.toString(),
      jobId: responseJobId.toString(),
    });

    await providerStarted.promise;
    await beginDeletion({
      userId: document.userId,
      documentId: document._id,
      deletionJobId,
    });
    providerResult.resolve({
      answer: "Synthetic grounded answer.",
      citedChunkIndexes: [chunk.chunkIndex],
    });

    await expectWorkInvalidated(responsePromise);
    expect(
      await MessageModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      await ConversationModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("rejects flashcard and quiz acceptance after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });

    await expectWorkInvalidated(
      createFlashcardSet({
        userId: document.userId.toString(),
        documentId: document._id.toString(),
        requestId: "2afec798-7432-45ae-8749-3176cde01bc4",
        title: "Blocked cards",
      }),
    );
    await expectWorkInvalidated(
      createQuiz({
        userId: document.userId.toString(),
        documentId: document._id.toString(),
        requestId: "2a15ad06-0112-4f92-bf46-b0ec7672d75a",
        title: "Blocked quiz",
      }),
    );

    expect(
      await FlashcardSetModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      await QuizModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("prevents paused flashcard generation from persisting after deletion", async () => {
    const deletionJobId = new Types.ObjectId();
    const generationJobId = new Types.ObjectId();
    const document = await createDocument({});
    const chunk = await createChunk({
      userId: document.userId,
      documentId: document._id,
    });
    const set = await FlashcardSetModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "b41aca33-dfe7-45e9-8db0-1005cb74af69",
      title: "Concurrent cards",
      status: "generating",
      generationJobId,
    });
    const providerStarted = deferred<void>();
    const providerResult = deferred<{
      cards: Array<{
        cardIndex: number;
        front: string;
        back: string;
        sourceChunkIndexes: number[];
      }>;
    }>();
    aiGatewayMock.generateStructuredOutput.mockImplementationOnce(() => {
      providerStarted.resolve();
      return providerResult.promise;
    });

    const generationPromise = generateFlashcards({
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      setId: set._id.toString(),
      count: 1,
      jobId: generationJobId.toString(),
    });

    await providerStarted.promise;
    await beginDeletion({
      userId: document.userId,
      documentId: document._id,
      deletionJobId,
    });
    providerResult.resolve({
      cards: [
        {
          cardIndex: 0,
          front: "Synthetic front",
          back: "Synthetic back",
          sourceChunkIndexes: [chunk.chunkIndex],
        },
      ],
    });

    await expectWorkInvalidated(generationPromise);
    expect(
      await FlashcardSetModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      await FlashcardModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("prevents paused quiz generation from persisting after deletion", async () => {
    const deletionJobId = new Types.ObjectId();
    const generationJobId = new Types.ObjectId();
    const document = await createDocument({});
    const chunk = await createChunk({
      userId: document.userId,
      documentId: document._id,
    });
    const quiz = await QuizModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "971b2afc-708a-467a-8f52-fe98a0540026",
      title: "Concurrent quiz",
      status: "generating",
      generationJobId,
    });
    const providerStarted = deferred<void>();
    const providerResult = deferred<{
      questions: Array<{
        questionIndex: number;
        prompt: string;
        choices: string[];
        correctChoiceIndex: number;
        explanation: string;
        sourceChunkIndexes: number[];
      }>;
    }>();
    aiGatewayMock.generateStructuredOutput.mockImplementationOnce(() => {
      providerStarted.resolve();
      return providerResult.promise;
    });

    const generationPromise = generateQuiz({
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      quizId: quiz._id.toString(),
      questionCount: 1,
      jobId: generationJobId.toString(),
    });

    await providerStarted.promise;
    await beginDeletion({
      userId: document.userId,
      documentId: document._id,
      deletionJobId,
    });
    providerResult.resolve({
      questions: [
        {
          questionIndex: 0,
          prompt: "Which statement is synthetic?",
          choices: ["This one", "The other one"],
          correctChoiceIndex: 0,
          explanation: "The fixture marks the first choice.",
          sourceChunkIndexes: [chunk.chunkIndex],
        },
      ],
    });

    await expectWorkInvalidated(generationPromise);
    expect(
      await QuizModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      await QuizQuestionModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("prevents paused document processing from restoring chunks or ready status after deletion", async () => {
    const userId = new Types.ObjectId();
    const processingJobId = new Types.ObjectId();
    const deletionJobId = new Types.ObjectId();
    const asset = await createAsset({
      userId: userId.toString(),
      purpose: "learning-document",
      file: pdfUpload(),
      temporary: true,
    });
    const document = await createDocument({
      userId,
      status: "uploaded",
      assetId: asset._id,
      processingJobId,
    });
    const providerStarted = deferred<void>();
    const providerResult = deferred<{
      summary: string;
      keyPoints: string[];
    }>();
    aiGatewayMock.generateStructuredOutput.mockImplementationOnce(() => {
      providerStarted.resolve();
      return providerResult.promise;
    });

    const processingPromise = processLearningDocument({
      userId: userId.toString(),
      documentId: document._id.toString(),
      assetId: asset._id.toString(),
      jobId: processingJobId.toString(),
    });

    await providerStarted.promise;
    await beginDeletion({
      userId,
      documentId: document._id,
      deletionJobId,
    });
    providerResult.resolve({
      summary: "Synthetic summary.",
      keyPoints: ["Synthetic key point."],
    });

    await expectWorkInvalidated(processingPromise);
    expect(
      await LearningDocumentModel.countDocuments({
        _id: document._id,
      }),
    ).toBe(0);
    expect(
      await DocumentChunkModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
    expect(
      await AssetModel.countDocuments({
        _id: asset._id,
        status: { $ne: "deleted" },
      }),
    ).toBe(0);
    expect((await AssetModel.findById(asset._id).lean())?.status).toBe(
      "deleted",
    );
    await expect(
      getStorageForProvider(asset.storageProvider).getObjectBuffer(
        asset.storageKey,
        10 * 1024 * 1024,
      ),
    ).rejects.toThrow();
  });

  it("does not start the database cascade when storage cleanup fails", async () => {
    const userId = new Types.ObjectId();
    const deletionJobId = new Types.ObjectId();
    const asset = await createAsset({
      userId: userId.toString(),
      purpose: "learning-document",
      file: pdfUpload(),
      temporary: true,
    });
    const document = await createDocument({
      userId,
      assetId: asset._id,
    });
    await createChunk({
      userId,
      documentId: document._id,
    });
    const storage = getStorageForProvider(asset.storageProvider);
    const deleteObject = vi
      .spyOn(storage, "deleteObject")
      .mockRejectedValueOnce(new Error("Synthetic storage deletion failure."));

    await expect(
      beginDeletion({
        userId,
        documentId: document._id,
        deletionJobId,
      }),
    ).rejects.toThrow("Synthetic storage deletion failure.");
    deleteObject.mockRestore();

    expect(
      await LearningDocumentModel.countDocuments({ _id: document._id }),
    ).toBe(1);
    expect(
      await DocumentChunkModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(1);
    expect((await AssetModel.findById(asset._id).lean())?.status).toBe(
      "temporary",
    );
    await expect(
      storage.getObjectBuffer(asset.storageKey, 10 * 1024 * 1024),
    ).resolves.toEqual(syntheticPdf);
  });

  it("rolls back dependent deletion when the owned document delete loses its transaction fence", async () => {
    const deletionJobId = new Types.ObjectId();
    const document = await createDocument({});
    await createChunk({
      userId: document.userId,
      documentId: document._id,
    });
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Rollback conversation",
      messageCount: 1,
    });
    await MessageModel.create({
      userId: document.userId,
      documentId: document._id,
      conversationId: conversation._id,
      role: "user",
      content: "This message must survive an aborted cascade.",
      sourceChunkIds: [],
      sourcePages: [],
    });
    const deleteOne = vi
      .spyOn(LearningDocumentModel, "deleteOne")
      .mockReturnValueOnce({
        session: vi.fn(async () => ({
          acknowledged: true,
          deletedCount: 0,
        })),
      } as never);

    await expect(
      beginDeletion({
        userId: document.userId,
        documentId: document._id,
        deletionJobId,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "LEARNING_DOCUMENT_DELETION_CONFLICT",
    });
    deleteOne.mockRestore();

    expect(
      await LearningDocumentModel.countDocuments({ _id: document._id }),
    ).toBe(1);
    expect(
      await DocumentChunkModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(1);
    expect(
      await ConversationModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(1);
    expect(
      await MessageModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(1);
  });

  it("removes the complete persisted document-owned graph", async () => {
    const deletionJobId = new Types.ObjectId();
    const document = await createDocument({});
    const chunk = await createChunk({
      userId: document.userId,
      documentId: document._id,
    });
    const conversation = await ConversationModel.create({
      userId: document.userId,
      documentId: document._id,
      title: "Complete graph conversation",
      messageCount: 1,
    });
    await MessageModel.create({
      userId: document.userId,
      documentId: document._id,
      conversationId: conversation._id,
      role: "user",
      content: "Complete graph message.",
      sourceChunkIds: [chunk._id],
      sourcePages: [1],
    });
    const set = await FlashcardSetModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "6e33e77b-ff8e-4ed1-ad87-866c99c2b944",
      title: "Complete graph cards",
      status: "ready",
      cardCount: 1,
    });
    await FlashcardModel.create({
      userId: document.userId,
      documentId: document._id,
      setId: set._id,
      cardIndex: 0,
      front: "Complete graph front.",
      back: "Complete graph back.",
      sourceChunkIds: [chunk._id],
      sourcePages: [1],
    });
    const quiz = await QuizModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "4c3f5d03-18ae-4103-bbc1-d48f17381ddd",
      title: "Complete graph quiz",
      status: "ready",
      questionCount: 1,
    });
    const question = await QuizQuestionModel.create({
      userId: document.userId,
      documentId: document._id,
      quizId: quiz._id,
      questionIndex: 0,
      prompt: "Which graph is complete?",
      choices: ["This graph", "Another graph"],
      correctChoiceIndex: 0,
      explanation: "The fixture identifies this graph.",
      sourceChunkIds: [chunk._id],
      sourcePages: [1],
    });
    await QuizAttemptModel.create({
      userId: document.userId,
      documentId: document._id,
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

    await beginDeletion({
      userId: document.userId,
      documentId: document._id,
      deletionJobId,
    });

    const remainingCounts = await Promise.all([
      LearningDocumentModel.countDocuments({ _id: document._id }),
      DocumentChunkModel.countDocuments({ documentId: document._id }),
      ConversationModel.countDocuments({ documentId: document._id }),
      MessageModel.countDocuments({ documentId: document._id }),
      FlashcardSetModel.countDocuments({ documentId: document._id }),
      FlashcardModel.countDocuments({ documentId: document._id }),
      QuizModel.countDocuments({ documentId: document._id }),
      QuizQuestionModel.countDocuments({ documentId: document._id }),
      QuizAttemptModel.countDocuments({ documentId: document._id }),
    ]);
    expect(remainingCounts).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("rejects quiz-attempt submission after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });
    const quiz = await QuizModel.create({
      userId: document.userId,
      documentId: document._id,
      requestId: "4cd8eb4a-e198-4a58-af57-f47ce1ef1367",
      title: "Ready quiz",
      status: "ready",
      questionCount: 1,
    });
    await QuizQuestionModel.create({
      userId: document.userId,
      documentId: document._id,
      quizId: quiz._id,
      questionIndex: 0,
      prompt: "Choose one.",
      choices: ["One", "Two"],
      correctChoiceIndex: 0,
      explanation: "One is correct.",
      sourceChunkIds: [],
      sourcePages: [1],
    });

    await expectWorkInvalidated(
      submitQuizAttempt({
        userId: document.userId.toString(),
        quizId: quiz._id.toString(),
        answers: [
          {
            questionIndex: 0,
            selectedChoiceIndex: 0,
          },
        ],
      }),
    );

    expect(
      await QuizAttemptModel.countDocuments({
        documentId: document._id,
      }),
    ).toBe(0);
  });

  it("cancels only queued non-deletion jobs for the exact owner and document", async () => {
    const ownerId = new Types.ObjectId();
    const otherOwnerId = new Types.ObjectId();
    const deletionJobId = new Types.ObjectId();
    const document = await createDocument({
      userId: ownerId,
      status: "deleting",
      deletionJobId,
    });
    const otherDocument = await createDocument({
      userId: ownerId,
    });
    const foreignDocument = await createDocument({
      userId: otherOwnerId,
    });
    const [
      deletionJob,
      queuedChat,
      queuedFlashcards,
      queuedQuiz,
      queuedForOtherDocument,
      foreignJob,
    ] = await JobRecordModel.create([
        {
          _id: deletionJobId,
          userId: ownerId,
          type: "learning.document.delete",
          payload: {
            userId: ownerId.toString(),
            documentId: document._id.toString(),
          },
          status: "processing",
          phase: "persisting",
          attempts: 1,
          executionId: randomUUID(),
          lockedBy: env.JOB_WORKER_ID,
          lockedAt: new Date(),
          lockExpiresAt: new Date(Date.now() + 60_000),
        },
        {
          userId: ownerId,
          type: "learning.chat.respond",
          payload: {
            userId: ownerId.toString(),
            documentId: document._id.toString(),
          },
        },
        {
          userId: ownerId,
          type: "learning.flashcards.generate",
          payload: {
            userId: ownerId.toString(),
            documentId: document._id.toString(),
          },
        },
        {
          userId: ownerId,
          type: "learning.quiz.generate",
          payload: {
            userId: ownerId.toString(),
            documentId: document._id.toString(),
          },
        },
        {
          userId: ownerId,
          type: "learning.quiz.generate",
          payload: {
            userId: ownerId.toString(),
            documentId: otherDocument._id.toString(),
          },
        },
        {
          userId: otherOwnerId,
          type: "learning.flashcards.generate",
          payload: {
            userId: otherOwnerId.toString(),
            documentId: foreignDocument._id.toString(),
          },
        },
      ]);

    await cascadeDeleteLearningDocument({
      userId: ownerId.toString(),
      documentId: document._id.toString(),
      jobId: deletionJobId.toString(),
    });
    await completeJob({
      jobId: deletionJobId.toString(),
      executionId: deletionJob.executionId!,
      attempt: deletionJob.attempts,
    }, {
      documentId: document._id.toString(),
      alreadyDeleted: false,
    });

    const jobs = await JobRecordModel.find({
      _id: {
        $in: [
          deletionJob._id,
          queuedChat._id,
          queuedFlashcards._id,
          queuedQuiz._id,
          queuedForOtherDocument._id,
          foreignJob._id,
        ],
      },
    }).lean();
    const statusById = new Map(
      jobs.map((job) => [job._id.toString(), job.status]),
    );

    expect(statusById.get(deletionJob._id.toString())).toBe("completed");
    expect(statusById.get(queuedChat._id.toString())).toBe("cancelled");
    expect(statusById.get(queuedFlashcards._id.toString())).toBe(
      "cancelled",
    );
    expect(statusById.get(queuedQuiz._id.toString())).toBe("cancelled");
    expect(statusById.get(queuedForOtherDocument._id.toString())).toBe(
      "queued",
    );
    expect(statusById.get(foreignJob._id.toString())).toBe("queued");
  });

  it("terminalizes a processing job that loses the document fence without retrying", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "learning.chat.respond",
      payload: {
        userId: new Types.ObjectId().toString(),
        documentId: new Types.ObjectId().toString(),
      },
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    await failOrRetryJob(
      job,
      new AppError(
        409,
        "LEARNING_DOCUMENT_WORK_INVALIDATED",
        "The learning document no longer accepts this work.",
      ),
    );

    const terminal = await JobRecordModel.findById(job._id).lean();
    expect(terminal).toMatchObject({
      status: "cancelled",
      attempts: 1,
      maxAttempts: 3,
    });
    expect(terminal?.expiresAt).toBeInstanceOf(Date);
    expect(terminal?.lockedBy).toBeUndefined();
    expect(terminal?.error).toBeUndefined();
  });

  it("does not requeue a provider failure after deletion begins", async () => {
    const document = await createDocument({ status: "deleting" });
    const job = await JobRecordModel.create({
      userId: document.userId,
      type: "learning.chat.respond",
      payload: {
        userId: document.userId.toString(),
        documentId: document._id.toString(),
      },
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    await failOrRetryJob(
      job,
      new AppError(
        502,
        "AI_PROVIDER_UNAVAILABLE",
        "The provider is currently unavailable.",
      ),
    );

    const terminal = await JobRecordModel.findById(job._id).lean();
    expect(terminal?.status).toBe("cancelled");
    expect(terminal?.attempts).toBe(1);
    expect(terminal?.error).toBeUndefined();
  });

  it("blocks queued work before provider execution while preserving the deletion handler", async () => {
    registerLearningJobHandlers();
    const deletionJobId = new Types.ObjectId();
    const document = await createDocument({
      status: "deleting",
      deletionJobId,
    });
    const context = jobContext(
      deletionJobId.toString(),
      document.userId.toString(),
    );

    const chatHandler = getJobHandler("learning.chat.respond");
    await expectWorkInvalidated(
      chatHandler.handler(
        {
          userId: document.userId.toString(),
          documentId: document._id.toString(),
          conversationId: new Types.ObjectId().toString(),
          userMessageId: new Types.ObjectId().toString(),
        },
        context,
      ),
    );
    expect(aiGatewayMock.generateStructuredOutput).not.toHaveBeenCalled();

    const deletionHandler = getJobHandler("learning.document.delete");
    await expect(
      deletionHandler.handler(
        {
          userId: document.userId.toString(),
          documentId: document._id.toString(),
        },
        context,
      ),
    ).resolves.toMatchObject({
      documentId: document._id.toString(),
      alreadyDeleted: false,
    });
    expect(
      await LearningDocumentModel.countDocuments({
        _id: document._id,
      }),
    ).toBe(0);
  });

  it("preserves idempotent completion for an already-ready processing job", async () => {
    registerLearningJobHandlers();
    const processingJobId = new Types.ObjectId();
    const document = await createDocument({
      status: "ready",
      processingJobId,
    });
    document.pageCount = 2;
    document.chunkCount = 3;
    await document.save();
    const processingHandler = getJobHandler(
      "learning.document.process",
    );

    await expect(
      processingHandler.handler(
        {
          userId: document.userId.toString(),
          documentId: document._id.toString(),
          assetId: document.assetId.toString(),
        },
        jobContext(
          processingJobId.toString(),
          document.userId.toString(),
        ),
      ),
    ).resolves.toEqual({
      documentId: document._id.toString(),
      pageCount: 2,
      chunkCount: 3,
    });
  });

  it("preserves duplicate-delete and missing-versus-foreign public behavior", async () => {
    const owner = await registerTestUser(app, {
      email: "deletion-fence-owner@test.example",
      displayName: "Deletion Fence Owner",
    });
    const other = await registerTestUser(app, {
      email: "deletion-fence-other@test.example",
      displayName: "Deletion Fence Other",
    });
    const deletionJob = await JobRecordModel.create({
      userId: owner.userId,
      type: "learning.document.delete",
      payload: {
        userId: owner.userId,
        documentId: new Types.ObjectId().toString(),
      },
    });
    const document = await createDocument({
      userId: new Types.ObjectId(owner.userId),
      status: "deleting",
      deletionJobId: deletionJob._id,
    });

    const duplicate = await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(202);
    const foreign = await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}`,
      )
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);
    const missing = await request(app)
      .delete(
        `/api/v1/learning-documents/${new Types.ObjectId().toString()}`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(duplicate.body.data.job).toEqual({
      id: deletionJob._id.toString(),
      type: "learning.document.delete",
      status: "queued-or-processing",
    });
    expect(foreign.body.error).toMatchObject({
      code: "LEARNING_DOCUMENT_NOT_FOUND",
      message: "Learning document not found.",
    });
    expect(missing.body.error).toMatchObject({
      code: "LEARNING_DOCUMENT_NOT_FOUND",
      message: "Learning document not found.",
    });
    expect(Object.keys(foreign.body.error).sort()).toEqual([
      "code",
      "message",
      "requestId",
    ]);
    expect(Object.keys(missing.body.error).sort()).toEqual([
      "code",
      "message",
      "requestId",
    ]);
  });
});
