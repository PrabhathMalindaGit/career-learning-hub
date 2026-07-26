import { ApiError } from "../../api/apiClient";
import type {
  AcceptedLearningJob,
  DocumentChunk,
  LearningDocument,
  LearningDocumentSource,
  LearningDocumentStatus,
  LearningJob,
  LearningPagination,
} from "./types";

const objectIdPattern = /^[a-f\d]{24}$/i;
const requestIdPattern = /^[A-Za-z0-9._-]{16,128}$/;
const documentStatuses = new Set<LearningDocumentStatus>([
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleting",
]);
const jobStatuses = new Set<LearningJob["status"]>([
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

function invalid(): never {
  throw new ApiError(
    502,
    "INVALID_LEARNING_RESPONSE",
    "The server returned an invalid learning response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
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

function text(value: unknown, maximum: number, minimum = 0): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum
  ) {
    invalid();
  }
  return value;
}

function optionalText(
  value: unknown,
  maximum: number,
): string | undefined {
  return value === undefined ? undefined : text(value, maximum);
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

function id(value: unknown): string {
  const parsed = text(value, 24, 24);
  if (!objectIdPattern.test(parsed)) invalid();
  return parsed;
}

function isoDate(value: unknown): string {
  const parsed = text(value, 40, 20);
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(parsed) ||
    Number.isNaN(Date.parse(parsed))
  ) {
    invalid();
  }
  return parsed;
}

function parseStatus(value: unknown): LearningDocumentStatus {
  if (
    typeof value !== "string" ||
    !documentStatuses.has(value as LearningDocumentStatus)
  ) {
    invalid();
  }
  return value as LearningDocumentStatus;
}

function parseProcessingError(
  value: unknown,
): LearningDocument["processingError"] {
  const item = record(value);
  if (Object.keys(item).length === 0) return undefined;
  exactKeys(item, ["code", "message"]);
  return {
    code: text(item.code, 120, 1),
    message: text(item.message, 2_000, 1),
  };
}

const documentFields = [
  "title",
  "originalFilename",
  "mimeType",
  "status",
  "pageCount",
  "chunkCount",
  "summaryKeyPoints",
  "createdAt",
  "updatedAt",
] as const;
const optionalDocumentFields = [
  "summary",
  "processingError",
  "processedAt",
] as const;

function parseDocument(
  value: unknown,
  identityKey: "id" | "_id",
): LearningDocument {
  const item = record(value);
  exactKeys(
    item,
    [identityKey, ...documentFields],
    optionalDocumentFields,
  );
  if (item.mimeType !== "application/pdf") invalid();
  const points = item.summaryKeyPoints;
  if (!Array.isArray(points) || points.length > 30) invalid();
  const processingError =
    item.processingError === undefined
      ? undefined
      : parseProcessingError(item.processingError);
  return {
    id: id(item[identityKey]),
    title: text(item.title, 200, 1),
    originalFilename: text(item.originalFilename, 255, 1),
    mimeType: "application/pdf",
    status: parseStatus(item.status),
    pageCount: integer(item.pageCount, 0),
    chunkCount: integer(item.chunkCount, 0),
    ...(item.summary === undefined
      ? {}
      : { summary: text(item.summary, 20_000) }),
    summaryKeyPoints: points.map((point) => text(point, 2_000, 1)),
    ...(processingError === undefined
      ? {}
      : { processingError }),
    ...(item.processedAt === undefined
      ? {}
      : { processedAt: isoDate(item.processedAt) }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

function parsePagination(value: unknown): LearningPagination {
  const item = record(value);
  exactKeys(item, ["page", "limit", "total", "pages"]);
  const pagination = {
    page: integer(item.page, 1),
    limit: integer(item.limit, 1, 100),
    total: integer(item.total, 0),
    pages: integer(item.pages, 0),
  };
  if (
    pagination.pages !==
      Math.ceil(pagination.total / pagination.limit) ||
    pagination.page > Math.max(1, pagination.pages)
  ) {
    invalid();
  }
  return pagination;
}

export function parseLearningDocumentList(value: unknown): {
  documents: LearningDocument[];
  pagination: LearningPagination;
} {
  const item = record(value);
  exactKeys(item, ["documents", "pagination"]);
  if (!Array.isArray(item.documents) || item.documents.length > 100) {
    invalid();
  }
  return {
    documents: item.documents.map((document) =>
      parseDocument(document, "_id"),
    ),
    pagination: parsePagination(item.pagination),
  };
}

export function parseLearningDocumentDetail(
  value: unknown,
  expectedDocumentId: string,
): { document: LearningDocument } {
  const item = record(value);
  exactKeys(item, ["document"]);
  const document = parseDocument(item.document, "id");
  if (document.id !== expectedDocumentId) invalid();
  return { document };
}

function parseAcceptedJob(value: unknown): AcceptedLearningJob {
  const item = record(value);
  exactKeys(item, ["id", "type", "status"]);
  if (
    item.type !== "learning.document.process" ||
    (item.status !== "queued" && item.status !== "processing")
  ) {
    invalid();
  }
  return {
    id: id(item.id),
    type: "learning.document.process",
    status: item.status,
  };
}

export function parseLearningUpload(value: unknown): {
  document: LearningDocument;
  job: AcceptedLearningJob;
} {
  const item = record(value);
  exactKeys(item, ["document", "job"]);
  return {
    document: parseDocument(item.document, "id"),
    job: parseAcceptedJob(item.job),
  };
}

function parseJobResult(value: unknown): NonNullable<LearningJob["result"]> {
  const item = record(value);
  exactKeys(item, ["documentId", "pageCount", "chunkCount"]);
  return {
    documentId: id(item.documentId),
    pageCount: integer(item.pageCount, 1),
    chunkCount: integer(item.chunkCount, 1),
  };
}

export function parseLearningJob(
  value: unknown,
  expected: {
    expectedJobId: string;
    expectedDocumentId: string;
  },
): LearningJob {
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
  if (item.type !== "learning.document.process") invalid();
  if (
    typeof item.status !== "string" ||
    !jobStatuses.has(item.status as LearningJob["status"])
  ) {
    invalid();
  }
  const parsedId = id(item.id);
  if (parsedId !== expected.expectedJobId) invalid();
  const result =
    item.result === undefined ? undefined : parseJobResult(item.result);
  if (
    result !== undefined &&
    result.documentId !== expected.expectedDocumentId
  ) {
    invalid();
  }
  const error =
    item.error === undefined
      ? undefined
      : parseProcessingError(item.error);
  return {
    id: parsedId,
    type: "learning.document.process",
    status: item.status as LearningJob["status"],
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

function parseChunk(
  value: unknown,
  pageCount: number,
): DocumentChunk {
  const item = record(value);
  exactKeys(item, [
    "_id",
    "chunkIndex",
    "pageStart",
    "pageEnd",
    "text",
    "wordCount",
  ]);
  const pageStart = integer(item.pageStart, 1);
  const pageEnd = integer(item.pageEnd, 1);
  if (
    pageStart > pageEnd ||
    (pageCount > 0 && pageEnd > pageCount)
  ) {
    invalid();
  }
  return {
    id: id(item._id),
    chunkIndex: integer(item.chunkIndex, 0),
    pageStart,
    pageEnd,
    text: text(item.text, 30_000, 1),
    wordCount: integer(item.wordCount, 1),
  };
}

export function parseDocumentChunks(
  value: unknown,
  bounds: { pageCount: number },
): { chunks: DocumentChunk[]; pagination: LearningPagination } {
  const item = record(value);
  exactKeys(item, ["chunks", "pagination"]);
  if (!Array.isArray(item.chunks) || item.chunks.length > 100) {
    invalid();
  }
  const chunks = item.chunks.map((chunk) =>
    parseChunk(chunk, bounds.pageCount),
  );
  for (let index = 1; index < chunks.length; index += 1) {
    if (
      chunks[index - 1]!.chunkIndex >= chunks[index]!.chunkIndex
    ) {
      invalid();
    }
  }
  return {
    chunks,
    pagination: parsePagination(item.pagination),
  };
}

function privateSourceUrl(value: unknown): string {
  const parsed = text(value, 2_000, 1);
  let url: URL;
  try {
    url = new URL(parsed);
  } catch {
    invalid();
  }
  const localHttp =
    url.protocol === "http:" &&
    (url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]");
  if (url.protocol !== "https:" && !localHttp) invalid();
  return url.toString();
}

export function parseLearningSource(
  value: unknown,
  now = Date.now(),
): { source: LearningDocumentSource } {
  const envelope = record(value);
  exactKeys(envelope, ["source"]);
  const item = record(envelope.source);
  exactKeys(item, ["url", "expiresAt", "contentType"]);
  if (item.contentType !== "application/pdf") invalid();
  const expiresAt = isoDate(item.expiresAt);
  if (Date.parse(expiresAt) <= now) invalid();
  return {
    source: {
      url: privateSourceUrl(item.url),
      expiresAt,
      contentType: "application/pdf",
    },
  };
}

export function parseStandardErrorEnvelope(value: unknown): {
  code: string;
  message: string;
  requestId?: string;
} {
  const envelope = record(value);
  exactKeys(envelope, ["success", "error"]);
  if (envelope.success !== false) invalid();
  const error = record(envelope.error);
  exactKeys(error, ["code", "message"], ["requestId", "details"]);
  const requestId =
    error.requestId === undefined
      ? undefined
      : text(error.requestId, 128, 16);
  if (requestId !== undefined && !requestIdPattern.test(requestId)) {
    invalid();
  }
  return {
    code: text(error.code, 120, 1),
    message: text(error.message, 2_000, 1),
    ...(requestId === undefined ? {} : { requestId }),
  };
}
