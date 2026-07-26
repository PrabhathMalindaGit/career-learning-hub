import { describe, expect, it } from "vitest";
import {
  parseDocumentChunks,
  parseLearningDocumentDetail,
  parseLearningDocumentList,
  parseLearningJob,
  parseLearningSource,
  parseLearningUpload,
  parseStandardErrorEnvelope,
} from "./learningContracts";

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
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
