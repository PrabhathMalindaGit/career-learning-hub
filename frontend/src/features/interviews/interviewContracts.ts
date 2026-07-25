import { ApiError } from "../../api/apiClient";
import type {
  AcceptedInterviewJob,
  FeedbackRequestResult,
  InterviewAttempt,
  InterviewAttemptPage,
  InterviewAttemptStatus,
  InterviewDifficulty,
  InterviewFeedback,
  InterviewJob,
  InterviewJobResult,
  InterviewJobStatus,
  InterviewJobType,
  InterviewMode,
  InterviewQuestionDetail,
  InterviewQuestionPage,
  InterviewQuestionSource,
  InterviewQuestionSummary,
  InterviewSessionDetail,
  InterviewSessionPage,
  InterviewSessionStatus,
  InterviewSessionSummary,
  Pagination,
  ExplanationRequestResult,
} from "./types";

const objectIdPattern = /^[a-f\d]{24}$/i;

function invalid(): never {
  throw new ApiError(
    502,
    "INVALID_INTERVIEW_RESPONSE",
    "The server returned an invalid interview response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function array<T>(
  value: unknown,
  maximum: number,
  parse: (item: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > maximum) invalid();
  return value.map(parse);
}

function text(
  value: unknown,
  maximum: number,
  minimum = 0,
): string {
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
  return value === undefined || value === null
    ? undefined
    : text(value, maximum);
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

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") invalid();
  return value;
}

function id(value: unknown): string {
  const parsed = text(value, 24, 24);
  if (!objectIdPattern.test(parsed)) invalid();
  return parsed;
}

function date(value: unknown): string {
  const parsed = text(value, 40, 20);
  if (
    Number.isNaN(Date.parse(parsed)) ||
    !/^\d{4}-\d{2}-\d{2}T/.test(parsed)
  ) {
    invalid();
  }
  return parsed;
}

function optionalDate(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : date(value);
}

function sessionStatus(value: unknown): InterviewSessionStatus {
  if (value !== "active" && value !== "completed" && value !== "archived") {
    invalid();
  }
  return value;
}

function mode(value: unknown): InterviewMode {
  if (
    value !== "study" &&
    value !== "written-practice" &&
    value !== "mock-interview"
  ) {
    invalid();
  }
  return value;
}

function difficulty(value: unknown): InterviewDifficulty {
  if (value !== "easy" && value !== "medium" && value !== "hard") {
    invalid();
  }
  return value;
}

function questionSource(value: unknown): InterviewQuestionSource {
  if (value !== "manual" && value !== "ai-generated") invalid();
  return value;
}

function attemptStatus(value: unknown): InterviewAttemptStatus {
  if (
    value !== "recorded" &&
    value !== "feedback-queued" &&
    value !== "feedback-processing" &&
    value !== "feedback-completed" &&
    value !== "feedback-failed"
  ) {
    invalid();
  }
  return value;
}

function jobType(value: unknown): InterviewJobType {
  if (
    value !== "interview.questions.generate" &&
    value !== "interview.question.explain" &&
    value !== "interview.attempt.feedback"
  ) {
    invalid();
  }
  return value;
}

function jobStatus(value: unknown): InterviewJobStatus {
  if (
    value !== "queued" &&
    value !== "processing" &&
    value !== "completed" &&
    value !== "failed" &&
    value !== "cancelled"
  ) {
    invalid();
  }
  return value;
}

function parsePagination(value: unknown): Pagination {
  const item = record(value);
  const page = integer(item.page, 1);
  const limit = integer(item.limit, 1, 100);
  const total = integer(item.total, 0);
  const pages = integer(item.pages, 0);
  if (pages !== Math.ceil(total / limit)) invalid();
  return { page, limit, total, pages };
}

function parseSessionSummary(value: unknown): InterviewSessionSummary {
  const item = record(value);
  const completedAt = optionalDate(item.completedAt);
  return {
    id: id(item.id ?? item._id),
    title: text(item.title, 160, 1),
    targetRole: text(item.targetRole, 200, 2),
    experienceLevel: text(item.experienceLevel, 100, 1),
    focusTopics: array(item.focusTopics, 50, (topic) =>
      text(topic, 120, 1),
    ),
    skillGaps: array(item.skillGaps, 50, (gap) => text(gap, 120, 1)),
    mode: mode(item.mode),
    status: sessionStatus(item.status),
    questionCount: integer(item.questionCount, 0),
    ...(completedAt === undefined ? {} : { completedAt }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

function parseQuestionSummary(value: unknown): InterviewQuestionSummary {
  const item = record(value);
  const userNotes = optionalText(item.userNotes, 8_000);
  return {
    id: id(item.id ?? item._id),
    sessionId: id(item.sessionId),
    source: questionSource(item.source),
    category: text(item.category, 120, 1),
    difficulty: difficulty(item.difficulty),
    question: text(item.question, 2_000, 5),
    isPinned: boolean(item.isPinned),
    ...(userNotes === undefined ? {} : { userNotes }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

function parseFeedback(value: unknown): InterviewFeedback {
  const item = record(value);
  return {
    score: integer(item.score, 0, 100),
    summary: text(item.summary, 2_000, 1),
    strengths: array(item.strengths, 20, (entry) =>
      text(entry, 1_000, 1),
    ),
    improvements: array(item.improvements, 20, (entry) =>
      text(entry, 1_000, 1),
    ),
    suggestedAnswerOutline: array(
      item.suggestedAnswerOutline,
      20,
      (entry) => text(entry, 1_000, 1),
    ),
    completedAt: date(item.completedAt),
  };
}

function parseAttempt(value: unknown): InterviewAttempt {
  const item = record(value);
  const feedback =
    item.feedback === undefined || item.feedback === null
      ? undefined
      : parseFeedback(item.feedback);
  return {
    id: id(item.id ?? item._id),
    sessionId: id(item.sessionId),
    questionId: id(item.questionId),
    answerText: text(item.answerText, 50_000, 1),
    status: attemptStatus(item.status),
    ...(feedback === undefined ? {} : { feedback }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

function assertIdentity(expected: string, actual: string): void {
  if (expected !== actual) invalid();
}

export function parseSessionList(value: unknown): InterviewSessionPage {
  const item = record(value);
  return {
    sessions: array(item.sessions, 100, parseSessionSummary),
    pagination: parsePagination(item.pagination),
  };
}

export function parseSessionDetail(
  value: unknown,
  expectedId: string,
): InterviewSessionDetail {
  const item = record(value);
  const rawSession = record(item.session);
  const session = parseSessionSummary(rawSession);
  assertIdentity(expectedId, session.id);
  const jobDescription = optionalText(rawSession.jobDescription, 30_000);
  return {
    ...session,
    ...(jobDescription === undefined ? {} : { jobDescription }),
  };
}

export function parseCreatedSession(value: unknown): {
  session: InterviewSessionDetail;
  questions: InterviewQuestionSummary[];
} {
  const item = record(value);
  const rawSession = record(item.session);
  const session = parseSessionDetail(
    { session: rawSession },
    id(rawSession.id ?? rawSession._id),
  );
  const questions = array(item.questions, 100, parseQuestionSummary);
  for (const question of questions) {
    assertIdentity(session.id, question.sessionId);
  }
  return { session, questions };
}

export function parseQuestionList(
  value: unknown,
  expectedSessionId: string,
): InterviewQuestionPage {
  const item = record(value);
  const questions = array(item.questions, 100, parseQuestionSummary);
  for (const question of questions) {
    assertIdentity(expectedSessionId, question.sessionId);
  }
  return {
    questions,
    pagination: parsePagination(item.pagination),
  };
}

export function parseQuestionDetail(
  value: unknown,
  expectedSessionId: string,
  expectedQuestionId: string,
): InterviewQuestionDetail {
  const item = record(record(value).question);
  const summary = parseQuestionSummary(item);
  assertIdentity(expectedSessionId, summary.sessionId);
  assertIdentity(expectedQuestionId, summary.id);
  const modelAnswer = optionalText(item.modelAnswer, 12_000);
  const explanation = optionalText(item.explanation, 12_000);
  const explanationKeyPoints =
    item.explanationKeyPoints === undefined
      ? []
      : array(item.explanationKeyPoints, 20, (entry) =>
          text(entry, 1_000, 1),
        );
  return {
    ...summary,
    ...(modelAnswer === undefined ? {} : { modelAnswer }),
    ...(explanation === undefined ? {} : { explanation }),
    explanationKeyPoints,
  };
}

export function parseCreatedQuestion(
  value: unknown,
  expectedSessionId: string,
): InterviewQuestionDetail {
  const item = record(record(value).question);
  return parseQuestionDetail(
    { question: item },
    expectedSessionId,
    id(item.id ?? item._id),
  );
}

export function parseAttemptList(
  value: unknown,
  expectedSessionId: string,
): InterviewAttemptPage {
  const item = record(value);
  const attempts = array(item.attempts, 100, parseAttempt);
  for (const attempt of attempts) {
    assertIdentity(expectedSessionId, attempt.sessionId);
  }
  return {
    attempts,
    pagination: parsePagination(item.pagination),
  };
}

export function parseAttemptDetail(
  value: unknown,
  expectedSessionId: string,
  expectedAttemptId: string,
): InterviewAttempt {
  const attempt = parseAttempt(record(value).attempt);
  assertIdentity(expectedSessionId, attempt.sessionId);
  assertIdentity(expectedAttemptId, attempt.id);
  return attempt;
}

export function parseRecordedAttempt(
  value: unknown,
  expectedSessionId: string,
): InterviewAttempt {
  const item = record(record(value).attempt);
  return parseAttemptDetail(
    { attempt: item },
    expectedSessionId,
    id(item.id ?? item._id),
  );
}

export function parseAcceptedInterviewJob(
  value: unknown,
  expectedType: InterviewJobType,
): AcceptedInterviewJob {
  const item = record(record(value).job);
  const type = jobType(item.type);
  const status = jobStatus(item.status);
  if (
    type !== expectedType ||
    (status !== "queued" && status !== "processing")
  ) {
    invalid();
  }
  return {
    id: id(item.id),
    type,
    status,
  };
}

function parseCompletedJobResult(
  type: InterviewJobType,
  value: unknown,
): InterviewJobResult {
  const item = record(value);
  if (type === "interview.questions.generate") {
    return {
      kind: "generation",
      insertedCount: integer(item.insertedCount, 0, 20),
      duplicateCount: integer(item.duplicateCount, 0, 20),
      questionIds: array(item.questionIds, 20, id),
    };
  }
  if (type === "interview.question.explain") {
    if (item.explanationReady !== true) invalid();
    return {
      kind: "explanation",
      questionId: id(item.questionId),
      explanationReady: true,
    };
  }
  return {
    kind: "feedback",
    attemptId: id(item.attemptId),
    score: integer(item.score, 0, 100),
  };
}

export function parseInterviewJob(value: unknown): InterviewJob {
  const item = record(record(value).job);
  const type = jobType(item.type);
  const status = jobStatus(item.status);
  const errorValue =
    item.error === undefined || item.error === null
      ? undefined
      : record(item.error);
  return {
    id: id(item.id),
    type,
    status,
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(status === "completed"
      ? { result: parseCompletedJobResult(type, item.result) }
      : {}),
    ...(errorValue === undefined
      ? {}
      : {
          error: {
            code: text(errorValue.code, 120, 1),
            message: text(errorValue.message, 2_000, 1),
          },
        }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

export function parseExplanationResponse(
  value: unknown,
  expectedSessionId: string,
  expectedQuestionId: string,
): ExplanationRequestResult {
  const item = record(value);
  if (item.alreadyAvailable === true) {
    return {
      kind: "available",
      question: parseQuestionDetail(
        { question: item.question },
        expectedSessionId,
        expectedQuestionId,
      ),
    };
  }
  return {
    kind: "queued",
    job: parseAcceptedInterviewJob(
      item,
      "interview.question.explain",
    ),
  };
}

export function parseFeedbackResponse(
  value: unknown,
  expectedSessionId: string,
  expectedAttemptId: string,
): FeedbackRequestResult {
  const item = record(value);
  if (item.alreadyAvailable === true) {
    return {
      kind: "available",
      attempt: parseAttemptDetail(
        { attempt: item.attempt },
        expectedSessionId,
        expectedAttemptId,
      ),
    };
  }
  const responseAttemptId = id(item.attemptId);
  assertIdentity(expectedAttemptId, responseAttemptId);
  return {
    kind: "queued",
    attemptId: responseAttemptId,
    job: parseAcceptedInterviewJob(
      item,
      "interview.attempt.feedback",
    ),
  };
}
