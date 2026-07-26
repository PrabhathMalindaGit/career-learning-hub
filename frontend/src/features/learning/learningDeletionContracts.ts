import { ApiError } from "../../api/apiClient";
import type {
  AcceptedLearningDocumentDeletionJob,
  LearningDocumentDeletionJob,
  LearningDocumentDeletionResult,
} from "./types";

const objectIdPattern = /^[a-f\d]{24}$/i;
const deletionJobStatuses = new Set<
  LearningDocumentDeletionJob["status"]
>(["queued", "processing", "completed", "failed", "cancelled"]);

function invalid(): never {
  throw new ApiError(
    502,
    "INVALID_LEARNING_RESPONSE",
    "The server returned an invalid learning response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): void {
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    invalid();
  }
}

function text(value: unknown, minimum: number, maximum: number): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum
  ) {
    invalid();
  }
  return value;
}

function id(value: unknown): string {
  const parsed = text(value, 24, 24);
  if (!objectIdPattern.test(parsed)) invalid();
  return parsed;
}

function integer(
  value: unknown,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid();
  }
  return value;
}

function isoDate(value: unknown): string {
  const parsed = text(value, 20, 40);
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(parsed) ||
    Number.isNaN(Date.parse(parsed))
  ) {
    invalid();
  }
  return parsed;
}

function parseSafeError(
  value: unknown,
): NonNullable<LearningDocumentDeletionJob["error"]> {
  const item = record(value);
  exactKeys(item, ["code", "message"]);
  return {
    code: text(item.code, 1, 120),
    message: text(item.message, 1, 2_000),
  };
}

export function parseLearningDocumentDeletionAcceptance(
  value: unknown,
): { job: AcceptedLearningDocumentDeletionJob } {
  const envelope = record(value);
  exactKeys(envelope, ["job"]);
  const item = record(envelope.job);
  exactKeys(item, ["id", "type", "status"]);
  if (
    item.type !== "learning.document.delete" ||
    (item.status !== "queued" &&
      item.status !== "processing" &&
      item.status !== "queued-or-processing")
  ) {
    invalid();
  }
  return {
    job: {
      id: id(item.id),
      type: "learning.document.delete",
      status: item.status,
    },
  };
}

function validateDeletionCounts(value: unknown): void {
  const item = record(value);
  const keys = [
    "messages",
    "conversations",
    "flashcards",
    "flashcardSets",
    "quizAttempts",
    "quizQuestions",
    "quizzes",
    "chunks",
  ] as const;
  exactKeys(item, keys);
  keys.forEach((key) => integer(item[key], 0));
}

function parseDeletionResult(
  value: unknown,
): LearningDocumentDeletionResult {
  const item = record(value);
  exactKeys(
    item,
    ["documentId", "alreadyDeleted"],
    ["deleted"],
  );
  if (typeof item.alreadyDeleted !== "boolean") invalid();
  if (item.alreadyDeleted) {
    if (item.deleted !== undefined) invalid();
  } else {
    if (item.deleted === undefined) invalid();
    validateDeletionCounts(item.deleted);
  }
  return {
    documentId: id(item.documentId),
    alreadyDeleted: item.alreadyDeleted,
  };
}

export function parseLearningDocumentDeletionJob(
  value: unknown,
  expected: {
    expectedJobId: string;
    expectedDocumentId: string;
  },
): LearningDocumentDeletionJob {
  const envelope = record(value);
  exactKeys(envelope, ["job"]);
  const item = record(envelope.job);
  exactKeys(
    item,
    [
      "id",
      "type",
      "status",
      "progress",
      "attempts",
      "maxAttempts",
      "createdAt",
      "updatedAt",
    ],
    ["result", "error"],
  );
  if (
    item.type !== "learning.document.delete" ||
    typeof item.status !== "string" ||
    !deletionJobStatuses.has(
      item.status as LearningDocumentDeletionJob["status"],
    )
  ) {
    invalid();
  }
  const parsedId = id(item.id);
  if (parsedId !== expected.expectedJobId) invalid();
  const status =
    item.status as LearningDocumentDeletionJob["status"];
  const result =
    item.result === undefined
      ? undefined
      : parseDeletionResult(item.result);
  if (
    (status === "completed" && result === undefined) ||
    (status !== "completed" && result !== undefined) ||
    (result !== undefined &&
      result.documentId !== expected.expectedDocumentId)
  ) {
    invalid();
  }
  const error =
    item.error === undefined ? undefined : parseSafeError(item.error);
  if (status === "completed" && error !== undefined) invalid();
  const progress = integer(item.progress, 0, 100);
  if (status === "completed" && progress !== 100) invalid();
  const attempts = integer(item.attempts, 0, 10);
  const maxAttempts = integer(item.maxAttempts, 1, 10);
  if (attempts > maxAttempts) invalid();
  return {
    id: parsedId,
    type: "learning.document.delete",
    status,
    progress,
    attempts,
    maxAttempts,
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}
