import { describe, expect, it } from "vitest";
import {
  parseDocumentChunks,
  parseFlashcardList,
  parseFlashcardSetAcceptance,
  parseFlashcardSetDetail,
  parseFlashcardSetList,
  parseLearningChatJob,
  parseLearningConversationCreate,
  parseLearningConversationList,
  parseLearningDocumentDetail,
  parseLearningDocumentList,
  parseLearningFlashcardJob,
  parseLearningJob,
  parseLearningMessageAcceptance,
  parseLearningMessageList,
  parseLearningSource,
  parseLearningUpload,
  parseStandardErrorEnvelope,
} from "./learningContracts";

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const conversationId = "507f1f77bcf86cd799439013";
const messageId = "507f1f77bcf86cd799439014";
const assistantMessageId = "507f1f77bcf86cd799439015";
const userId = "507f1f77bcf86cd799439016";
const setId = "507f1f77bcf86cd799439017";
const cardId = "507f1f77bcf86cd799439018";
const createdAt = "2026-07-26T01:00:00.000Z";

function safeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: documentId,
    title: "Synthetic learning document",
    originalFilename: "synthetic-learning.pdf",
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 3,
    chunkCount: 2,
    summary: "Stored summary",
    summaryKeyPoints: ["First key point"],
    processedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function pagination(overrides: Record<string, unknown> = {}) {
  return {
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
    ...overrides,
  };
}

describe("Learning response contracts", () => {
  it("validates and normalizes the document list response", () => {
    const { id: _detailId, ...listDocument } = safeDocument();
    const result = parseLearningDocumentList({
      documents: [
        {
          ...listDocument,
          _id: documentId,
        },
      ],
      pagination: pagination(),
    });

    expect(result.documents[0]?.id).toBe(documentId);
    expect(result.pagination).toEqual(pagination());
  });

  it("validates the document detail response", () => {
    const result = parseLearningDocumentDetail(
      { document: safeDocument() },
      documentId,
    );

    expect(result.document.title).toBe("Synthetic learning document");
  });

  it("validates an accepted upload response", () => {
    const result = parseLearningUpload({
      document: safeDocument({
        status: "uploaded",
        pageCount: 0,
        chunkCount: 0,
        summary: undefined,
        processedAt: undefined,
      }),
      job: {
        id: jobId,
        type: "learning.document.process",
        status: "queued",
      },
    });

    expect(result.job).toEqual({
      id: jobId,
      type: "learning.document.process",
      status: "queued",
    });
    expect(result.document.id).toBe(documentId);
  });

  it("normalizes the backend's empty processing-error subdocument", () => {
    const result = parseLearningUpload({
      document: safeDocument({
        status: "uploaded",
        pageCount: 0,
        chunkCount: 0,
        summary: undefined,
        processingError: {},
        processedAt: undefined,
      }),
      job: {
        id: jobId,
        type: "learning.document.process",
        status: "queued",
      },
    });

    expect(result.document.processingError).toBeUndefined();
  });

  it("rejects an upload response with the wrong processing job type", () => {
    expect(() =>
      parseLearningUpload({
        document: safeDocument({ status: "uploaded" }),
        job: {
          id: jobId,
          type: "learning.document.delete",
          status: "queued",
        },
      }),
    ).toThrow(/invalid learning response/i);
  });

  it("validates a processing-job response and expected identities", () => {
    const result = parseLearningJob(
      {
        job: {
          id: jobId,
          type: "learning.document.process",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: {
            documentId,
            pageCount: 3,
            chunkCount: 2,
          },
          createdAt,
          updatedAt: createdAt,
        },
      },
      { expectedJobId: jobId, expectedDocumentId: documentId },
    );

    expect(result.result?.documentId).toBe(documentId);
  });

  it("rejects a processing job for a different document", () => {
    expect(() =>
      parseLearningJob(
        {
          job: {
            id: jobId,
            type: "learning.document.process",
            status: "completed",
            progress: 100,
            attempts: 1,
            maxAttempts: 3,
            result: {
              documentId: "507f1f77bcf86cd799439099",
              pageCount: 3,
              chunkCount: 2,
            },
            createdAt,
            updatedAt: createdAt,
          },
        },
        { expectedJobId: jobId, expectedDocumentId: documentId },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates a bounded chunk-list response", () => {
    const result = parseDocumentChunks(
      {
        chunks: [
          {
            _id: "507f1f77bcf86cd799439013",
            chunkIndex: 0,
            pageStart: 1,
            pageEnd: 2,
            text: "Synthetic extracted text.",
            wordCount: 3,
          },
        ],
        pagination: pagination(),
      },
      { pageCount: 3 },
    );

    expect(result.chunks[0]?.pageEnd).toBe(2);
  });

  it.each([
    [{ pageStart: 0, pageEnd: 1 }, "Page 0"],
    [{ pageStart: 2, pageEnd: 1 }, "reversed"],
    [{ pageStart: 2, pageEnd: 4 }, "outside document bounds"],
  ])("rejects invalid page ranges: %s (%s)", (range) => {
    expect(() =>
      parseDocumentChunks(
        {
          chunks: [
            {
              _id: "507f1f77bcf86cd799439013",
              chunkIndex: 0,
              ...range,
              text: "Synthetic extracted text.",
              wordCount: 3,
            },
          ],
          pagination: pagination(),
        },
        { pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("accepts only the exact private source-target allowlist", () => {
    const source = parseLearningSource(
      {
        source: {
          url: "https://private.example.test/document.pdf?signature=secret",
          expiresAt: "2026-07-26T01:05:00.000Z",
          contentType: "application/pdf",
        },
      },
      Date.parse("2026-07-26T01:00:00.000Z"),
    );

    expect(Object.keys(source.source).sort()).toEqual([
      "contentType",
      "expiresAt",
      "url",
    ]);
  });

  it.each([
    "assetId",
    "storageKey",
    "provider",
    "checksum",
    "filesystemPath",
    "ownerId",
    "userId",
    "cookie",
    "authorization",
    "headers",
  ])("rejects source targets containing private field %s", (field) => {
    expect(() =>
      parseLearningSource(
        {
          source: {
            url: "https://private.example.test/document.pdf",
            expiresAt: "2026-07-26T01:05:00.000Z",
            contentType: "application/pdf",
            [field]: "must-not-pass",
          },
        },
        Date.parse("2026-07-26T01:00:00.000Z"),
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects an expired source target", () => {
    expect(() =>
      parseLearningSource(
        {
          source: {
            url: "https://private.example.test/document.pdf",
            expiresAt: "2026-07-26T00:59:59.000Z",
            contentType: "application/pdf",
          },
        },
        Date.parse("2026-07-26T01:00:00.000Z"),
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects a route and document identity mismatch", () => {
    expect(() =>
      parseLearningDocumentDetail(
        { document: safeDocument() },
        "507f1f77bcf86cd799439099",
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects private or unknown document fields", () => {
    expect(() =>
      parseLearningDocumentDetail(
        {
          document: safeDocument({
            storageKey: "private/path",
          }),
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates a standard error envelope and preserves a safe request ID", () => {
    expect(
      parseStandardErrorEnvelope({
        success: false,
        error: {
          code: "LEARNING_DOCUMENT_INVALID",
          message: "The request could not be completed.",
          requestId: "request-learning-0001",
        },
      }),
    ).toEqual({
      code: "LEARNING_DOCUMENT_INVALID",
      message: "The request could not be completed.",
      requestId: "request-learning-0001",
    });
  });

  it.each([
    pagination({ page: 0 }),
    pagination({ limit: 101 }),
    pagination({ total: -1 }),
    pagination({ pages: 2 }),
  ])("rejects invalid pagination metadata: %s", (value) => {
    expect(() =>
      parseLearningDocumentList({
        documents: [],
        pagination: value,
      }),
    ).toThrow(/invalid learning response/i);
  });
});

function conversation(overrides: Record<string, unknown> = {}) {
  return {
    _id: conversationId,
    userId,
    documentId,
    title: "Synthetic grounded discussion",
    messageCount: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function message(overrides: Record<string, unknown> = {}) {
  return {
    _id: messageId,
    userId,
    documentId,
    conversationId,
    role: "user",
    content: "What does the document say?",
    sourceChunkIds: [],
    sourcePages: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe("Grounded chat response contracts", () => {
  it("validates a canonical conversation creation and strips owner identity", () => {
    const result = parseLearningConversationCreate(
      { conversation: conversation() },
      documentId,
    );

    expect(result.conversation).toEqual({
      id: conversationId,
      documentId,
      title: "Synthetic grounded discussion",
      messageCount: 0,
      createdAt,
      updatedAt: createdAt,
    });
    expect(result.conversation).not.toHaveProperty("userId");
  });

  it("validates conversation pagination and document identity", () => {
    const result = parseLearningConversationList(
      {
        conversations: [conversation()],
        pagination: pagination(),
      },
      documentId,
    );

    expect(result.conversations[0]?.documentId).toBe(documentId);
    expect(result.pagination).toEqual(pagination());

    expect(() =>
      parseLearningConversationList(
        {
          conversations: [
            conversation({
              documentId: "507f1f77bcf86cd799439099",
            }),
          ],
          pagination: pagination(),
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects unknown conversation fields", () => {
    expect(() =>
      parseLearningConversationCreate(
        {
          conversation: conversation({
            provider: "must-not-enter-state",
          }),
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates ordered canonical messages and strips private fields", () => {
    const result = parseLearningMessageList(
      {
        messages: [
          message(),
          message({
            _id: assistantMessageId,
            role: "assistant",
            content: "A canonical answer.",
            replyToMessageId: messageId,
            sourceChunkIds: ["507f1f77bcf86cd799439017"],
            sourcePages: [1, 3],
            createdAt: "2026-07-26T01:00:01.000Z",
            updatedAt: "2026-07-26T01:00:01.000Z",
          }),
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      },
      { documentId, conversationId, pageCount: 3 },
    );

    expect(result.messages.map((item) => item.id)).toEqual([
      messageId,
      assistantMessageId,
    ]);
    expect(result.messages[1]?.sourcePages).toEqual([1, 3]);
    expect(result.messages[1]).not.toHaveProperty("sourceChunkIds");
    expect(result.messages[1]).not.toHaveProperty("userId");
  });

  it.each([
    [[0], "Page 0"],
    [[4], "out of range"],
    [[1, 1], "duplicate"],
    [[3, 1], "unordered"],
  ])("rejects invalid assistant source pages: %s (%s)", (sourcePages) => {
    expect(() =>
      parseLearningMessageList(
        {
          messages: [
            message({
              role: "assistant",
              sourcePages,
            }),
          ],
          pagination: pagination(),
        },
        { documentId, conversationId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects wrong conversation identity, duplicate IDs and reversed chronology", () => {
    expect(() =>
      parseLearningMessageList(
        {
          messages: [
            message({
              conversationId: "507f1f77bcf86cd799439099",
            }),
          ],
          pagination: pagination(),
        },
        { documentId, conversationId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);

    expect(() =>
      parseLearningMessageList(
        {
          messages: [
            message({ createdAt: "2026-07-26T01:00:02.000Z" }),
            message({ createdAt }),
          ],
          pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        },
        { documentId, conversationId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates accepted canonical user message and exact chat job", () => {
    const result = parseLearningMessageAcceptance(
      {
        userMessage: message({
          clientRequestId: "3159bf41-e3ac-409c-bad4-a77981000d52",
        }),
        job: {
          id: jobId,
          type: "learning.chat.respond",
          status: "queued",
        },
      },
      { documentId, conversationId, pageCount: 3 },
    );

    expect(result.userMessage.id).toBe(messageId);
    expect(result.userMessage).not.toHaveProperty("clientRequestId");
    expect(result.job).toEqual({
      id: jobId,
      type: "learning.chat.respond",
      status: "queued",
    });
  });

  it("rejects a message acceptance with the wrong job type", () => {
    expect(() =>
      parseLearningMessageAcceptance(
        {
          userMessage: message({
            clientRequestId: "3159bf41-e3ac-409c-bad4-a77981000d52",
          }),
          job: {
            id: jobId,
            type: "learning.document.process",
            status: "queued",
          },
        },
        { documentId, conversationId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates a completed chat job and exact job identity", () => {
    const result = parseLearningChatJob(
      {
        job: {
          id: jobId,
          type: "learning.chat.respond",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: {
            messageId: assistantMessageId,
            sourcePages: [1, 3],
          },
          createdAt,
          updatedAt: createdAt,
        },
      },
      { jobId, pageCount: 3 },
    );

    expect(result.result?.messageId).toBe(assistantMessageId);
    expect(() =>
      parseLearningChatJob(
        {
          job: {
            id: "507f1f77bcf86cd799439099",
            type: "learning.chat.respond",
            status: "processing",
            progress: 10,
            attempts: 1,
            maxAttempts: 3,
            createdAt,
            updatedAt: createdAt,
          },
        },
        { jobId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("strips development stack data from a safe failed chat job", () => {
    const result = parseLearningChatJob(
      {
        job: {
          id: jobId,
          type: "learning.chat.respond",
          status: "failed",
          progress: 10,
          attempts: 3,
          maxAttempts: 3,
          error: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "Grounded response generation is unavailable.",
            stack: "private development stack",
          },
          createdAt,
          updatedAt: createdAt,
        },
      },
      { jobId, pageCount: 3 },
    );

    expect(result.error).toEqual({
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "Grounded response generation is unavailable.",
    });
  });
});

function flashcardSet(overrides: Record<string, unknown> = {}) {
  return {
    _id: setId,
    documentId,
    title: "Synthetic architecture review",
    status: "ready",
    cardCount: 2,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function flashcard(overrides: Record<string, unknown> = {}) {
  return {
    _id: cardId,
    cardIndex: 0,
    front: "What is **bounded context**?",
    back: "<strong>It is stored as plain text.</strong>",
    sourcePages: [1, 3],
    createdAt,
    ...overrides,
  };
}

describe("Flashcard response contracts", () => {
  it("validates exact generation acceptance and job type", () => {
    expect(
      parseFlashcardSetAcceptance(
        {
          setId,
          job: {
            id: jobId,
            type: "learning.flashcards.generate",
            status: "queued",
          },
        },
        documentId,
      ),
    ).toEqual({
      setId,
      documentId,
      job: {
        id: jobId,
        type: "learning.flashcards.generate",
        status: "queued",
      },
    });

    expect(() =>
      parseFlashcardSetAcceptance(
        {
          setId,
          job: {
            id: jobId,
            type: "learning.chat.respond",
            status: "queued",
          },
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates a bounded set page and strips no private fields", () => {
    const result = parseFlashcardSetList(
      {
        sets: [flashcardSet()],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      },
      documentId,
    );

    expect(result.sets[0]).toEqual({
      id: setId,
      documentId,
      title: "Synthetic architecture review",
      status: "ready",
      cardCount: 2,
      createdAt,
      updatedAt: createdAt,
    });
  });

  it.each([
    { status: "completed" },
    { provider: "must-not-enter-state" },
    { userId },
  ])("rejects malformed or private set data: %s", (extra) => {
    expect(() =>
      parseFlashcardSetList(
        {
          sets: [flashcardSet(extra)],
          pagination: pagination({ limit: 10 }),
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates set detail and rejects wrong nested document identity", () => {
    const { _id: _listSetId, ...listFields } = flashcardSet();
    const detail = { ...listFields, id: setId };

    expect(
      parseFlashcardSetDetail({ set: detail }, { documentId, setId }).set.id,
    ).toBe(setId);
    expect(() =>
      parseFlashcardSetDetail(
        {
          set: {
            ...detail,
            documentId: "507f1f77bcf86cd799439099",
          },
        },
        { documentId, setId },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates canonical ordered cards and factual source pages", () => {
    const result = parseFlashcardList(
      {
        cards: [
          flashcard(),
          flashcard({
            _id: "507f1f77bcf86cd799439019",
            cardIndex: 1,
            front: "Second question",
            back: "Second answer",
            sourcePages: [],
          }),
        ],
        pagination: {
          page: 1,
          limit: 100,
          total: 2,
          pages: 1,
        },
      },
      { pageCount: 3 },
    );

    expect(result.cards[0]?.front).toBe("What is **bounded context**?");
    expect(result.cards[0]?.sourcePages).toEqual([1, 3]);
    expect(result.cards[0]).not.toHaveProperty("sourceChunkIds");
  });

  it.each([
    [[0], "Page 0"],
    [[4], "out of range"],
    [[1, 1], "duplicate"],
    [[3, 1], "unordered"],
  ])("rejects invalid flashcard source pages: %s (%s)", (sourcePages) => {
    expect(() =>
      parseFlashcardList(
        {
          cards: [flashcard({ sourcePages })],
          pagination: pagination({ limit: 100 }),
        },
        { pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects duplicate IDs, unordered indexes and private card fields", () => {
    expect(() =>
      parseFlashcardList(
        {
          cards: [
            flashcard({ cardIndex: 1 }),
            flashcard({ cardIndex: 0 }),
          ],
          pagination: {
            page: 1,
            limit: 100,
            total: 2,
            pages: 1,
          },
        },
        { pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);

    expect(() =>
      parseFlashcardList(
        {
          cards: [flashcard({ sourceChunkIds: [cardId] })],
          pagination: pagination({ limit: 100 }),
        },
        { pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("validates exact completed generation job and result set identity", () => {
    const result = parseLearningFlashcardJob(
      {
        job: {
          id: jobId,
          type: "learning.flashcards.generate",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: { setId, cardCount: 2 },
          createdAt,
          updatedAt: createdAt,
        },
      },
      { jobId, setId },
    );

    expect(result.result).toEqual({ setId, cardCount: 2 });
  });

  it.each([
    {
      id: "507f1f77bcf86cd799439099",
      type: "learning.flashcards.generate",
      result: { setId, cardCount: 2 },
    },
    {
      id: jobId,
      type: "learning.chat.respond",
      result: { setId, cardCount: 2 },
    },
    {
      id: jobId,
      type: "learning.flashcards.generate",
      result: {
        setId: "507f1f77bcf86cd799439099",
        cardCount: 2,
      },
    },
  ])("rejects wrong flashcard job identity: %s", (identity) => {
    expect(() =>
      parseLearningFlashcardJob(
        {
          job: {
            ...identity,
            status: "completed",
            progress: 100,
            attempts: 1,
            maxAttempts: 3,
            createdAt,
            updatedAt: createdAt,
          },
        },
        { jobId, setId },
      ),
    ).toThrow(/invalid learning response/i);
  });
});
