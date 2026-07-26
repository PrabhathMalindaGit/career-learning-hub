import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../../api/apiClient";
import {
  fetchLearningDocument,
  fetchLearningDocumentSource,
  fetchLearningJob,
  listDocumentChunks,
  listLearningDocuments,
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
});
