import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../../api/apiClient";
import {
  createFlashcardSet,
  createLearningConversation,
  fetchFlashcardSet,
  fetchLearningChatJob,
  fetchLearningDocument,
  fetchLearningDocumentSource,
  fetchLearningJob,
  fetchLearningFlashcardJob,
  listFlashcardSets,
  listLearningFlashcards,
  listDocumentChunks,
  listLearningConversations,
  listLearningDocuments,
  listLearningMessages,
  sendLearningMessage,
  uploadLearningDocument,
} from "./learningApi";

vi.mock("../../api/apiClient", async () => {
  const actual = await vi.importActual<typeof apiClient>(
    "../../api/apiClient",
  );
  return {
    ...actual,
    requestWithMetadata: vi.fn(),
    requestWithStatusMetadata: vi.fn(),
  };
});

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const conversationId = "507f1f77bcf86cd799439013";
const messageId = "507f1f77bcf86cd799439014";
const userId = "507f1f77bcf86cd799439015";
const setId = "507f1f77bcf86cd799439016";
const cardId = "507f1f77bcf86cd799439017";
const createdAt = "2026-07-26T01:00:00.000Z";

function document(status = "ready") {
  return {
    id: documentId,
    title: "Synthetic document",
    originalFilename: "synthetic.pdf",
    mimeType: "application/pdf",
    status,
    pageCount: status === "ready" ? 2 : 0,
    chunkCount: status === "ready" ? 1 : 0,
    summaryKeyPoints: [],
    createdAt,
    updatedAt: createdAt,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Learning API", () => {
  it("requests a filtered bounded document page and preserves request ID", async () => {
    const { id: _detailId, ...listDocument } = document();
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        documents: [{ ...listDocument, _id: documentId }],
        pagination: { page: 2, limit: 10, total: 11, pages: 2 },
      },
      requestId: "request-learning-0001",
    });

    const result = await listLearningDocuments({
      page: 2,
      limit: 10,
      status: "ready",
    });

    expect(apiClient.requestWithMetadata).toHaveBeenCalledWith(
      "/learning-documents?page=2&limit=10&status=ready",
      expect.objectContaining({ authentication: "required" }),
    );
    expect(result.requestId).toBe("request-learning-0001");
  });

  it("sends multipart FormData without setting Content-Type and requires 202", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        document: document("uploaded"),
        job: {
          id: jobId,
          type: "learning.document.process",
          status: "queued",
        },
      },
      requestId: "request-upload-0001",
    });
    const file = new File(["%PDF-1.7"], "synthetic.pdf", {
      type: "application/pdf",
    });

    await uploadLearningDocument("Synthetic title", file);

    const [, options] = vi.mocked(
      apiClient.requestWithStatusMetadata,
    ).mock.calls[0] ?? [];
    expect(options?.body).toBeInstanceOf(FormData);
    expect(options?.headers).toBeUndefined();
    expect((options?.body as FormData).get("title")).toBe(
      "Synthetic title",
    );
    expect((options?.body as FormData).get("file")).toBe(file);
  });

  it("rejects a successful upload response that is not HTTP 202", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {
        document: document("uploaded"),
        job: {
          id: jobId,
          type: "learning.document.process",
          status: "queued",
        },
      },
    });

    await expect(
      uploadLearningDocument(
        "Synthetic title",
        new File(["%PDF"], "synthetic.pdf", {
          type: "application/pdf",
        }),
      ),
    ).rejects.toMatchObject({
      code: "INVALID_LEARNING_RESPONSE",
    });
  });

  it("binds document, job, chunk and source requests to exact identities", async () => {
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({
        data: { document: document() },
      })
      .mockResolvedValueOnce({
        data: {
          job: {
            id: jobId,
            type: "learning.document.process",
            status: "processing",
            progress: 5,
            attempts: 1,
            maxAttempts: 3,
            createdAt,
            updatedAt: createdAt,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          chunks: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          source: {
            url: "https://private.example.test/document.pdf",
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            contentType: "application/pdf",
          },
        },
      });

    await fetchLearningDocument(documentId);
    await fetchLearningJob(jobId, documentId);
    await listDocumentChunks(documentId, 2);
    await fetchLearningDocumentSource(documentId);

    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      1,
      `/learning-documents/${documentId}`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      2,
      `/jobs/${jobId}`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      3,
      `/learning-documents/${documentId}/chunks?page=1&limit=20`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      4,
      `/learning-documents/${documentId}/source`,
      expect.objectContaining({ authentication: "required" }),
    );
  });

  it("creates and lists route-bound conversations without a userId", async () => {
    const canonicalConversation = {
      _id: conversationId,
      userId,
      documentId,
      title: "Synthetic conversation",
      messageCount: 0,
      createdAt,
      updatedAt: createdAt,
    };
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 201,
      data: { conversation: canonicalConversation },
      requestId: "request-create-chat-0001",
    });
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        conversations: [canonicalConversation],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      },
      requestId: "request-list-chat-0001",
    });

    const created = await createLearningConversation(
      documentId,
      "Synthetic conversation",
    );
    const listed = await listLearningConversations(documentId, {
      page: 1,
      limit: 10,
    });

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      `/learning-documents/${documentId}/conversations`,
      expect.objectContaining({
        method: "POST",
        body: { title: "Synthetic conversation" },
        authentication: "required",
      }),
    );
    expect(
      vi.mocked(apiClient.requestWithStatusMetadata).mock.calls[0]?.[1]
        ?.body,
    ).not.toHaveProperty("userId");
    expect(created.requestId).toBe("request-create-chat-0001");
    expect(listed.requestId).toBe("request-list-chat-0001");
  });

  it("requires canonical HTTP statuses for conversation creation and message acceptance", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {},
    });

    await expect(
      createLearningConversation(documentId, "Synthetic conversation"),
    ).rejects.toMatchObject({ code: "INVALID_LEARNING_RESPONSE" });

    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 201,
      data: {},
    });
    await expect(
      sendLearningMessage(
        documentId,
        conversationId,
        "Grounded question",
        "3159bf41-e3ac-409c-bad4-a77981000d52",
        3,
      ),
    ).rejects.toMatchObject({ code: "INVALID_LEARNING_RESPONSE" });
  });

  it("lists messages, submits one explicit idempotency UUID and polls the exact chat job", async () => {
    const canonicalMessage = {
      _id: messageId,
      userId,
      documentId,
      conversationId,
      role: "user",
      content: "Grounded question",
      sourceChunkIds: [],
      sourcePages: [],
      createdAt,
      updatedAt: createdAt,
    };
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({
        data: {
          messages: [canonicalMessage],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          job: {
            id: jobId,
            type: "learning.chat.respond",
            status: "processing",
            progress: 10,
            attempts: 1,
            maxAttempts: 3,
            createdAt,
            updatedAt: createdAt,
          },
        },
      });
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        userMessage: {
          ...canonicalMessage,
          clientRequestId: "3159bf41-e3ac-409c-bad4-a77981000d52",
        },
        job: {
          id: jobId,
          type: "learning.chat.respond",
          status: "queued",
        },
      },
      requestId: "request-send-chat-0001",
    });

    await listLearningMessages(
      documentId,
      conversationId,
      3,
      { page: 1, limit: 20 },
    );
    const accepted = await sendLearningMessage(
      documentId,
      conversationId,
      "Grounded question",
      "3159bf41-e3ac-409c-bad4-a77981000d52",
      3,
    );
    await fetchLearningChatJob(jobId, 3);

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      `/learning-documents/${documentId}/conversations/${conversationId}/messages`,
      expect.objectContaining({
        method: "POST",
        body: {
          content: "Grounded question",
          requestId: "3159bf41-e3ac-409c-bad4-a77981000d52",
        },
      }),
    );
    expect(accepted.requestId).toBe("request-send-chat-0001");
    expect(apiClient.requestWithMetadata).toHaveBeenLastCalledWith(
      `/jobs/${jobId}`,
      expect.objectContaining({ authentication: "required" }),
    );
  });

  it("creates a flashcard set with exact canonical acceptance and no userId", async () => {
    const requestId = "3159bf41-e3ac-409c-bad4-a77981000d52";
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        setId,
        job: {
          id: jobId,
          type: "learning.flashcards.generate",
          status: "queued",
        },
      },
      requestId: "request-flashcards-0001",
    });

    const result = await createFlashcardSet(documentId, {
      title: "Architecture review",
      count: 12,
      focus: "Bounded contexts",
      requestId,
    });

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      `/learning-documents/${documentId}/flashcard-sets`,
      expect.objectContaining({
        method: "POST",
        authentication: "required",
        body: {
          title: "Architecture review",
          count: 12,
          focus: "Bounded contexts",
          requestId,
        },
      }),
    );
    expect(
      vi.mocked(apiClient.requestWithStatusMetadata).mock.calls[0]?.[1]?.body,
    ).not.toHaveProperty("userId");
    expect(result.requestId).toBe("request-flashcards-0001");
    expect(result.setId).toBe(setId);
  });

  it("requires HTTP 202 for flashcard generation acceptance", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {},
    });

    await expect(
      createFlashcardSet(documentId, {
        title: "Architecture review",
        count: 12,
        requestId: "3159bf41-e3ac-409c-bad4-a77981000d52",
      }),
    ).rejects.toMatchObject({ code: "INVALID_LEARNING_RESPONSE" });
  });

  it("lists and fetches canonical route-bound sets and cards", async () => {
    const canonicalSet = {
      _id: setId,
      documentId,
      title: "Architecture review",
      status: "ready",
      cardCount: 1,
      createdAt,
      updatedAt: createdAt,
    };
    const { _id: _listSetId, ...canonicalSetDetail } = canonicalSet;
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({
        data: {
          sets: [canonicalSet],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: { set: { ...canonicalSetDetail, id: setId } },
      })
      .mockResolvedValueOnce({
        data: {
          cards: [
            {
              _id: cardId,
              cardIndex: 0,
              front: "Canonical question",
              back: "Canonical answer",
              sourcePages: [1],
              createdAt,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      });

    await listFlashcardSets(documentId, { page: 1, limit: 10 });
    await fetchFlashcardSet(documentId, setId);
    await listLearningFlashcards(setId, 2, {
      page: 1,
      limit: 100,
    });

    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      1,
      `/flashcard-sets?documentId=${documentId}&page=1&limit=10`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      2,
      `/flashcard-sets/${setId}`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      3,
      `/flashcard-sets/${setId}/cards?page=1&limit=100`,
      expect.objectContaining({ authentication: "required" }),
    );
  });

  it("polls the exact flashcard job and expected result set", async () => {
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        job: {
          id: jobId,
          type: "learning.flashcards.generate",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: { setId, cardCount: 1 },
          createdAt,
          updatedAt: createdAt,
        },
      },
    });

    const result = await fetchLearningFlashcardJob(jobId, setId);

    expect(result.result?.setId).toBe(setId);
    expect(apiClient.requestWithMetadata).toHaveBeenCalledWith(
      `/jobs/${jobId}`,
      expect.objectContaining({ authentication: "required" }),
    );
  });
});
