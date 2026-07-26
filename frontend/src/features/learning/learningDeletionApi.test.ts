import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../../api/apiClient";
import {
  fetchLearningDocumentDeletionJob,
  requestLearningDocumentDeletion,
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

afterEach(() => {
  vi.clearAllMocks();
});

describe("Learning document deletion API", () => {
  it("sends one authenticated bodyless DELETE with abort support", async () => {
    const controller = new AbortController();
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        job: {
          id: jobId,
          type: "learning.document.delete",
          status: "queued",
        },
      },
      requestId: "request-delete-0001",
    });

    const result = await requestLearningDocumentDeletion(
      documentId,
      controller.signal,
    );

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      `/learning-documents/${documentId}`,
      {
        method: "DELETE",
        authentication: "required",
        signal: controller.signal,
      },
    );
    const [, options] =
      vi.mocked(apiClient.requestWithStatusMetadata).mock.calls[0] ?? [];
    expect(options).not.toHaveProperty("body");
    expect(JSON.stringify(options)).not.toMatch(
      /userId|chunk|conversation|message|flashcard|quiz|attempt|asset/i,
    );
    expect(result).toEqual({
      job: {
        id: jobId,
        type: "learning.document.delete",
        status: "queued",
      },
      requestId: "request-delete-0001",
    });
  });

  it("rejects a successful deletion response that is not HTTP 202", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {
        job: {
          id: jobId,
          type: "learning.document.delete",
          status: "queued",
        },
      },
      requestId: "request-delete-0002",
    });

    await expect(
      requestLearningDocumentDeletion(documentId),
    ).rejects.toMatchObject({
      code: "INVALID_LEARNING_RESPONSE",
      requestId: "request-delete-0002",
    });
  });

  it("preserves safe missing or foreign deletion errors", async () => {
    const error = new apiClient.ApiError(
      404,
      "LEARNING_DOCUMENT_NOT_FOUND",
      "Learning document not found.",
      "request-delete-0003",
    );
    vi.mocked(
      apiClient.requestWithStatusMetadata,
    ).mockRejectedValue(error);

    await expect(
      requestLearningDocumentDeletion(documentId),
    ).rejects.toBe(error);
  });

  it("accepts the exact repeated-delete job response", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        job: {
          id: jobId,
          type: "learning.document.delete",
          status: "queued-or-processing",
        },
      },
    });

    await expect(
      requestLearningDocumentDeletion(documentId),
    ).resolves.toMatchObject({
      job: { id: jobId, status: "queued-or-processing" },
    });
  });

  it("fetches and validates only the exact accepted deletion job", async () => {
    const controller = new AbortController();
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        job: {
          id: jobId,
          type: "learning.document.delete",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: {
            documentId,
            alreadyDeleted: true,
          },
          createdAt,
          updatedAt: createdAt,
        },
      },
      requestId: "request-delete-job-0001",
    });

    const result = await fetchLearningDocumentDeletionJob(
      jobId,
      documentId,
      controller.signal,
    );

    expect(apiClient.requestWithMetadata).toHaveBeenCalledWith(
      `/jobs/${jobId}`,
      {
        authentication: "required",
        signal: controller.signal,
      },
    );
    expect(result).toMatchObject({
      id: jobId,
      type: "learning.document.delete",
      status: "completed",
      result: { documentId, alreadyDeleted: true },
      requestId: "request-delete-job-0001",
    });
  });

  it.each([
    {
      id: jobId,
      type: "learning.document.process",
      status: "processing",
    },
    {
      id: "507f1f77bcf86cd799439099",
      type: "learning.document.delete",
      status: "processing",
    },
  ])("rejects a mismatched deletion job %#", async (identity) => {
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        job: {
          ...identity,
          progress: 25,
          attempts: 1,
          maxAttempts: 3,
          createdAt,
          updatedAt: createdAt,
        },
      },
    });

    await expect(
      fetchLearningDocumentDeletionJob(jobId, documentId),
    ).rejects.toMatchObject({
      code: "INVALID_LEARNING_RESPONSE",
    });
  });
});
