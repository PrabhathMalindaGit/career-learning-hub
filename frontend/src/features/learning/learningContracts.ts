import { ApiError } from "../../api/apiClient";
import type {
  AcceptedLearningFlashcardJob,
  AcceptedLearningChatJob,
  AcceptedLearningJob,
  DocumentChunk,
  Flashcard,
  FlashcardSet,
  FlashcardSetStatus,
  LearningChatJob,
  LearningConversation,
  LearningDocument,
  LearningDocumentSource,
  LearningDocumentStatus,
  LearningFlashcardJob,
  LearningJob,
  LearningMessage,
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
const messageRoles = new Set<LearningMessage["role"]>([
  "user",
  "assistant",
]);
const flashcardSetStatuses = new Set<FlashcardSetStatus>([
  "generating",
  "ready",
  "failed",
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

function parseSourcePages(value: unknown, pageCount: number): number[] {
  if (!Array.isArray(value) || value.length > 100) invalid();
  const pages = value.map((page) =>
    integer(page, 1, pageCount > 0 ? pageCount : Number.MAX_SAFE_INTEGER),
  );
  for (let index = 1; index < pages.length; index += 1) {
    if (pages[index - 1]! >= pages[index]!) invalid();
  }
  return pages;
}

function parseConversation(
  value: unknown,
  expectedDocumentId: string,
): LearningConversation {
  const item = record(value);
  exactKeys(
    item,
    [
      "_id",
      "userId",
      "documentId",
      "title",
      "messageCount",
      "createdAt",
      "updatedAt",
    ],
    ["lastMessageAt"],
  );
  id(item.userId);
  const documentId = id(item.documentId);
  if (documentId !== expectedDocumentId) invalid();
  return {
    id: id(item._id),
    documentId,
    title: text(item.title, 200, 1),
    messageCount: integer(item.messageCount, 0),
    ...(item.lastMessageAt === undefined
      ? {}
      : { lastMessageAt: isoDate(item.lastMessageAt) }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

export function parseLearningConversationCreate(
  value: unknown,
  expectedDocumentId: string,
): { conversation: LearningConversation } {
  const item = record(value);
  exactKeys(item, ["conversation"]);
  return {
    conversation: parseConversation(
      item.conversation,
      expectedDocumentId,
    ),
  };
}

export function parseLearningConversationList(
  value: unknown,
  expectedDocumentId: string,
): {
  conversations: LearningConversation[];
  pagination: LearningPagination;
} {
  const item = record(value);
  exactKeys(item, ["conversations", "pagination"]);
  if (!Array.isArray(item.conversations) || item.conversations.length > 100) {
    invalid();
  }
  const conversations = item.conversations.map((conversation) =>
    parseConversation(conversation, expectedDocumentId),
  );
  if (
    new Set(conversations.map((conversation) => conversation.id)).size !==
    conversations.length
  ) {
    invalid();
  }
  return {
    conversations,
    pagination: parsePagination(item.pagination),
  };
}

function parseMessage(
  value: unknown,
  expected: {
    documentId: string;
    conversationId: string;
    pageCount: number;
    accepted?: boolean;
  },
): LearningMessage {
  const item = record(value);
  exactKeys(
    item,
    [
      "_id",
      "userId",
      "documentId",
      "conversationId",
      "role",
      "content",
      "sourceChunkIds",
      "sourcePages",
      "createdAt",
      "updatedAt",
    ],
    [
      "clientRequestId",
      "responseJobId",
      "replyToMessageId",
    ],
  );
  id(item.userId);
  const documentId = id(item.documentId);
  const conversationId = id(item.conversationId);
  if (
    documentId !== expected.documentId ||
    conversationId !== expected.conversationId ||
    typeof item.role !== "string" ||
    !messageRoles.has(item.role as LearningMessage["role"])
  ) {
    invalid();
  }
  if (!Array.isArray(item.sourceChunkIds) || item.sourceChunkIds.length > 20) {
    invalid();
  }
  item.sourceChunkIds.forEach(id);
  if (item.clientRequestId !== undefined) {
    text(item.clientRequestId, 100, 1);
  }
  if (expected.accepted && item.clientRequestId === undefined) invalid();
  if (item.responseJobId !== undefined) id(item.responseJobId);
  if (item.replyToMessageId !== undefined) id(item.replyToMessageId);
  const sourcePages = parseSourcePages(
    item.sourcePages,
    expected.pageCount,
  );
  if (item.role === "user" && sourcePages.length > 0) invalid();
  return {
    id: id(item._id),
    documentId,
    conversationId,
    role: item.role as LearningMessage["role"],
    content: text(item.content, 50_000, 1),
    sourcePages,
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

export function parseLearningMessageList(
  value: unknown,
  expected: {
    documentId: string;
    conversationId: string;
    pageCount: number;
  },
): {
  messages: LearningMessage[];
  pagination: LearningPagination;
} {
  const item = record(value);
  exactKeys(item, ["messages", "pagination"]);
  if (!Array.isArray(item.messages) || item.messages.length > 100) {
    invalid();
  }
  const messages = item.messages.map((message) =>
    parseMessage(message, expected),
  );
  const ids = new Set<string>();
  for (let index = 0; index < messages.length; index += 1) {
    const current = messages[index]!;
    if (ids.has(current.id)) invalid();
    ids.add(current.id);
    const previous = messages[index - 1];
    if (
      previous &&
      (previous.createdAt > current.createdAt ||
        (previous.createdAt === current.createdAt &&
          previous.id >= current.id))
    ) {
      invalid();
    }
  }
  return {
    messages,
    pagination: parsePagination(item.pagination),
  };
}

function parseAcceptedChatJob(value: unknown): AcceptedLearningChatJob {
  const item = record(value);
  exactKeys(item, ["id", "type", "status"]);
  if (
    item.type !== "learning.chat.respond" ||
    (item.status !== "queued" && item.status !== "processing")
  ) {
    invalid();
  }
  return {
    id: id(item.id),
    type: "learning.chat.respond",
    status: item.status,
  };
}

export function parseLearningMessageAcceptance(
  value: unknown,
  expected: {
    documentId: string;
    conversationId: string;
    pageCount: number;
  },
): {
  userMessage: LearningMessage;
  job: AcceptedLearningChatJob;
} {
  const item = record(value);
  exactKeys(item, ["userMessage", "job"]);
  const userMessage = parseMessage(item.userMessage, {
    ...expected,
    accepted: true,
  });
  if (userMessage.role !== "user") invalid();
  return {
    userMessage,
    job: parseAcceptedChatJob(item.job),
  };
}

function parseChatJobResult(
  value: unknown,
  pageCount: number,
): NonNullable<LearningChatJob["result"]> {
  const item = record(value);
  exactKeys(item, ["messageId", "sourcePages"]);
  return {
    messageId: id(item.messageId),
    sourcePages: parseSourcePages(item.sourcePages, pageCount),
  };
}

function parseJobError(
  value: unknown,
): NonNullable<LearningChatJob["error"]> {
  const item = record(value);
  exactKeys(item, ["code", "message"], ["stack"]);
  if (item.stack !== undefined) text(item.stack, 8_000);
  return {
    code: text(item.code, 120, 1),
    message: text(item.message, 2_000, 1),
  };
}

export function parseLearningChatJob(
  value: unknown,
  expected: { jobId: string; pageCount: number },
): LearningChatJob {
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
    item.type !== "learning.chat.respond" ||
    typeof item.status !== "string" ||
    !jobStatuses.has(item.status as LearningChatJob["status"])
  ) {
    invalid();
  }
  const jobId = id(item.id);
  if (jobId !== expected.jobId) invalid();
  const result =
    item.result === undefined
      ? undefined
      : parseChatJobResult(item.result, expected.pageCount);
  const error =
    item.error === undefined ? undefined : parseJobError(item.error);
  return {
    id: jobId,
    type: "learning.chat.respond",
    status: item.status as LearningChatJob["status"],
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

function parseFlashcardSetError(
  value: unknown,
): FlashcardSet["generationError"] {
  const item = record(value);
  if (Object.keys(item).length === 0) return undefined;
  exactKeys(item, ["code", "message"]);
  return {
    code: text(item.code, 120, 1),
    message: text(item.message, 2_000, 1),
  };
}

function parseFlashcardSet(
  value: unknown,
  identityKey: "id" | "_id",
  expectedDocumentId: string,
): FlashcardSet {
  const item = record(value);
  exactKeys(
    item,
    [
      identityKey,
      "documentId",
      "title",
      "status",
      "cardCount",
      "createdAt",
      "updatedAt",
    ],
    ["generationError"],
  );
  if (
    typeof item.status !== "string" ||
    !flashcardSetStatuses.has(item.status as FlashcardSetStatus)
  ) {
    invalid();
  }
  const documentId = id(item.documentId);
  if (documentId !== expectedDocumentId) invalid();
  const generationError =
    item.generationError === undefined
      ? undefined
      : parseFlashcardSetError(item.generationError);
  return {
    id: id(item[identityKey]),
    documentId,
    title: text(item.title, 200, 1),
    status: item.status as FlashcardSetStatus,
    cardCount: integer(item.cardCount, 0, 100),
    ...(generationError === undefined ? {} : { generationError }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

export function parseFlashcardSetAcceptance(
  value: unknown,
  expectedDocumentId: string,
): {
  setId: string;
  documentId: string;
  job: AcceptedLearningFlashcardJob;
} {
  const item = record(value);
  exactKeys(item, ["setId", "job"]);
  const job = record(item.job);
  exactKeys(job, ["id", "type", "status"]);
  if (
    job.type !== "learning.flashcards.generate" ||
    (job.status !== "queued" && job.status !== "processing")
  ) {
    invalid();
  }
  return {
    setId: id(item.setId),
    documentId: id(expectedDocumentId),
    job: {
      id: id(job.id),
      type: "learning.flashcards.generate",
      status: job.status,
    },
  };
}

export function parseFlashcardSetList(
  value: unknown,
  expectedDocumentId: string,
): {
  sets: FlashcardSet[];
  pagination: LearningPagination;
} {
  const item = record(value);
  exactKeys(item, ["sets", "pagination"]);
  if (!Array.isArray(item.sets) || item.sets.length > 100) invalid();
  const sets = item.sets.map((set) =>
    parseFlashcardSet(set, "_id", expectedDocumentId),
  );
  if (new Set(sets.map((set) => set.id)).size !== sets.length) invalid();
  return {
    sets,
    pagination: parsePagination(item.pagination),
  };
}

export function parseFlashcardSetDetail(
  value: unknown,
  expected: { documentId: string; setId: string },
): { set: FlashcardSet } {
  const item = record(value);
  exactKeys(item, ["set"]);
  const set = parseFlashcardSet(item.set, "id", expected.documentId);
  if (set.id !== expected.setId) invalid();
  return { set };
}

function parseFlashcard(
  value: unknown,
  pageCount: number,
): Flashcard {
  const item = record(value);
  exactKeys(item, [
    "_id",
    "cardIndex",
    "front",
    "back",
    "sourcePages",
    "createdAt",
  ]);
  if (!Array.isArray(item.sourcePages) || item.sourcePages.length > 50) {
    invalid();
  }
  return {
    id: id(item._id),
    cardIndex: integer(item.cardIndex, 0, 99),
    front: text(item.front, 3_000, 1),
    back: text(item.back, 8_000, 1),
    sourcePages: parseSourcePages(item.sourcePages, pageCount),
    createdAt: isoDate(item.createdAt),
  };
}

export function parseFlashcardList(
  value: unknown,
  expected: { pageCount: number },
): { cards: Flashcard[]; pagination: LearningPagination } {
  const item = record(value);
  exactKeys(item, ["cards", "pagination"]);
  if (!Array.isArray(item.cards) || item.cards.length > 100) invalid();
  const cards = item.cards.map((card) =>
    parseFlashcard(card, expected.pageCount),
  );
  const ids = new Set<string>();
  for (let index = 0; index < cards.length; index += 1) {
    const current = cards[index]!;
    if (ids.has(current.id)) invalid();
    ids.add(current.id);
    const previous = cards[index - 1];
    if (previous && previous.cardIndex >= current.cardIndex) invalid();
  }
  return {
    cards,
    pagination: parsePagination(item.pagination),
  };
}

function parseFlashcardJobResult(
  value: unknown,
): NonNullable<LearningFlashcardJob["result"]> {
  const item = record(value);
  exactKeys(item, ["setId", "cardCount"]);
  return {
    setId: id(item.setId),
    cardCount: integer(item.cardCount, 1, 100),
  };
}

export function parseLearningFlashcardJob(
  value: unknown,
  expected: { jobId: string; setId: string },
): LearningFlashcardJob {
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
    item.type !== "learning.flashcards.generate" ||
    typeof item.status !== "string" ||
    !jobStatuses.has(item.status as LearningFlashcardJob["status"])
  ) {
    invalid();
  }
  const jobId = id(item.id);
  if (jobId !== expected.jobId) invalid();
  const result =
    item.result === undefined
      ? undefined
      : parseFlashcardJobResult(item.result);
  if (
    (item.status === "completed" && result === undefined) ||
    (item.status !== "completed" && result !== undefined) ||
    (result !== undefined && result.setId !== expected.setId)
  ) {
    invalid();
  }
  const error =
    item.error === undefined ? undefined : parseJobError(item.error);
  return {
    id: jobId,
    type: "learning.flashcards.generate",
    status: item.status as LearningFlashcardJob["status"],
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
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
