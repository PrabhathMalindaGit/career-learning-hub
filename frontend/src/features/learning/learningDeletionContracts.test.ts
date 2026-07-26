import { describe, expect, it } from "vitest";
import {
  parseLearningDocumentDeletionAcceptance,
  parseLearningDocumentDeletionJob,
} from "./learningDeletionContracts";

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";

function acceptedJob(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: jobId,
    type: "learning.document.delete",
    status: "queued",
    ...overrides,
  };
}

function deletionJob(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: jobId,
    type: "learning.document.delete",
    status: "processing",
    progress: 20,
    attempts: 1,
    maxAttempts: 3,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe("Learning document deletion contracts", () => {
  it.each(["queued", "processing", "queued-or-processing"] as const)(
    "accepts the exact deletion acceptance status %s",
    (status) => {
      expect(
        parseLearningDocumentDeletionAcceptance({
          job: acceptedJob({ status }),
        }),
      ).toEqual({
        job: {
          id: jobId,
          type: "learning.document.delete",
          status,
        },
      });
    },
  );

  it.each([
    {
      job: acceptedJob({ type: "learning.document.process" }),
    },
    {
      job: acceptedJob({ status: "completed" }),
    },
    {
      job: acceptedJob({ id: "wrong-job-id" }),
    },
    {
      job: acceptedJob({ ownerId: documentId }),
    },
    {
      job: acceptedJob(),
      storageKey: "private/key.pdf",
    },
  ])("rejects malformed or expanded deletion acceptance %#", (value) => {
    expect(() =>
      parseLearningDocumentDeletionAcceptance(value),
    ).toThrow(/invalid learning response/i);
  });

  it("validates and minimizes the exact normal completion result", () => {
    const result = parseLearningDocumentDeletionJob(
      {
        job: deletionJob({
          status: "completed",
          progress: 100,
          result: {
            documentId,
            alreadyDeleted: false,
            deleted: {
              messages: 2,
              conversations: 1,
              flashcards: 3,
              flashcardSets: 1,
              quizAttempts: 2,
              quizQuestions: 2,
              quizzes: 1,
              chunks: 4,
            },
          },
        }),
      },
      { expectedJobId: jobId, expectedDocumentId: documentId },
    );

    expect(result.result).toEqual({
      documentId,
      alreadyDeleted: false,
    });
    expect(JSON.stringify(result)).not.toContain("deleted");
  });

  it("accepts the exact already-deleted completion result", () => {
    const result = parseLearningDocumentDeletionJob(
      {
        job: deletionJob({
          status: "completed",
          progress: 100,
          result: { documentId, alreadyDeleted: true },
        }),
      },
      { expectedJobId: jobId, expectedDocumentId: documentId },
    );

    expect(result.result).toEqual({
      documentId,
      alreadyDeleted: true,
    });
  });

  it.each([
    {
      expected: { expectedJobId: jobId, expectedDocumentId: documentId },
      job: deletionJob({ type: "learning.quiz.generate" }),
    },
    {
      expected: { expectedJobId: jobId, expectedDocumentId: documentId },
      job: deletionJob({ id: "507f1f77bcf86cd799439099" }),
    },
    {
      expected: { expectedJobId: jobId, expectedDocumentId: documentId },
      job: deletionJob({
        status: "completed",
        result: {
          documentId: "507f1f77bcf86cd799439099",
          alreadyDeleted: true,
        },
      }),
    },
    {
      expected: { expectedJobId: jobId, expectedDocumentId: documentId },
      job: deletionJob({ privateMetadata: { storageKey: "secret" } }),
    },
  ])("rejects wrong job or document identity and unknown fields %#", (input) => {
    expect(() =>
      parseLearningDocumentDeletionJob(
        { job: input.job },
        input.expected,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("accepts only code and message in a public deletion error", () => {
    const result = parseLearningDocumentDeletionJob(
      {
        job: deletionJob({
          status: "failed",
          error: {
            code: "LEARNING_DOCUMENT_DELETION_FAILED",
            message: "The document could not be deleted.",
          },
        }),
      },
      { expectedJobId: jobId, expectedDocumentId: documentId },
    );

    expect(result.error).toEqual({
      code: "LEARNING_DOCUMENT_DELETION_FAILED",
      message: "The document could not be deleted.",
    });
  });

  it.each(["stack", "details", "providerOutput", "storageKey"])(
    "rejects private deletion error field %s",
    (field) => {
      expect(() =>
        parseLearningDocumentDeletionJob(
          {
            job: deletionJob({
              status: "failed",
              error: {
                code: "LEARNING_DOCUMENT_DELETION_FAILED",
                message: "The document could not be deleted.",
                [field]: "must-not-pass",
              },
            }),
          },
          { expectedJobId: jobId, expectedDocumentId: documentId },
        ),
      ).toThrow(/invalid learning response/i);
    },
  );

  it.each([
    deletionJob({
      status: "completed",
      result: undefined,
    }),
    deletionJob({
      status: "processing",
      result: { documentId, alreadyDeleted: true },
    }),
    deletionJob({
      status: "completed",
      result: {
        documentId,
        alreadyDeleted: false,
        deleted: {
          messages: 0,
          conversations: 0,
          flashcards: 0,
          flashcardSets: 0,
          quizAttempts: 0,
          quizQuestions: 0,
          quizzes: 0,
          chunks: 0,
          assets: 1,
        },
      },
    }),
  ])("rejects invalid result-state combinations %#", (job) => {
    expect(() =>
      parseLearningDocumentDeletionJob(
        { job },
        { expectedJobId: jobId, expectedDocumentId: documentId },
      ),
    ).toThrow(/invalid learning response/i);
  });
});
