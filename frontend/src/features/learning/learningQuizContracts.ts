import { ApiError } from "../../api/apiClient";
import { parseJobResilienceMetadata } from "../jobs/jobResilience";
import type {
  AcceptedLearningQuizJob,
  LearningPagination,
  LearningQuizJob,
  QuizAnswerSelection,
  QuizAttemptReview,
  QuizAttemptSummary,
  QuizForTaking,
  QuizQuestionForTaking,
  QuizQuestionReview,
  QuizStatus,
  QuizSummary,
} from "./types";

const objectIdPattern = /^[a-f\d]{24}$/i;
const requestIdPattern = /^[A-Za-z0-9._-]{16,128}$/;
const quizStatuses = new Set<QuizStatus>([
  "generating",
  "ready",
  "failed",
]);
const jobStatuses = new Set<LearningQuizJob["status"]>([
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

function decimal(value: unknown, minimum: number, maximum: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
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
  if (!Array.isArray(value) || value.length > 50) invalid();
  const pages = value.map((page) => integer(page, 1, pageCount));
  for (let index = 1; index < pages.length; index += 1) {
    if (pages[index - 1]! >= pages[index]!) invalid();
  }
  return pages;
}

function parseGenerationError(
  value: unknown,
): QuizSummary["generationError"] {
  const item = record(value);
  if (Object.keys(item).length === 0) return undefined;
  exactKeys(
    item,
    ["code", "message"],
    ["classification", "retryable", "timeoutPhase"],
  );
  return {
    code: text(item.code, 120, 1),
    message: text(item.message, 2_000, 1),
  };
}

function parseQuizSummary(
  value: unknown,
  expectedDocumentId: string,
): QuizSummary {
  const item = record(value);
  exactKeys(
    item,
    [
      "_id",
      "documentId",
      "title",
      "status",
      "questionCount",
      "createdAt",
      "updatedAt",
    ],
    ["generationError"],
  );
  if (
    typeof item.status !== "string" ||
    !quizStatuses.has(item.status as QuizStatus)
  ) {
    invalid();
  }
  const documentId = id(item.documentId);
  if (documentId !== expectedDocumentId) invalid();
  const generationError =
    item.generationError === undefined
      ? undefined
      : parseGenerationError(item.generationError);
  if (
    (item.status === "failed" && generationError === undefined) ||
    (item.status !== "failed" && generationError !== undefined)
  ) {
    invalid();
  }
  return {
    id: id(item._id),
    documentId,
    title: text(item.title, 200, 1),
    status: item.status as QuizStatus,
    questionCount: integer(item.questionCount, 0, 100),
    ...(generationError === undefined ? {} : { generationError }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

export function parseQuizGenerationAcceptance(
  value: unknown,
  expectedDocumentId: string,
): {
  quizId: string;
  documentId: string;
  job: AcceptedLearningQuizJob;
} {
  const item = record(value);
  exactKeys(item, ["quizId", "job"]);
  const job = record(item.job);
  exactKeys(job, ["id", "type", "status"]);
  if (
    job.type !== "learning.quiz.generate" ||
    (job.status !== "queued" && job.status !== "processing")
  ) {
    invalid();
  }
  return {
    quizId: id(item.quizId),
    documentId: id(expectedDocumentId),
    job: {
      id: id(job.id),
      type: "learning.quiz.generate",
      status: job.status,
    },
  };
}

export function parseQuizList(
  value: unknown,
  expectedDocumentId: string,
): { quizzes: QuizSummary[]; pagination: LearningPagination } {
  const item = record(value);
  exactKeys(item, ["quizzes", "pagination"]);
  if (!Array.isArray(item.quizzes) || item.quizzes.length > 100) invalid();
  const quizzes = item.quizzes.map((quiz) =>
    parseQuizSummary(quiz, expectedDocumentId),
  );
  if (new Set(quizzes.map((quiz) => quiz.id)).size !== quizzes.length) {
    invalid();
  }
  return {
    quizzes,
    pagination: parsePagination(item.pagination),
  };
}

function parseTakingQuestion(
  value: unknown,
  expectedIndex: number,
  pageCount: number,
): QuizQuestionForTaking {
  const item = record(value);
  exactKeys(item, [
    "questionIndex",
    "prompt",
    "choices",
    "sourcePages",
  ]);
  const questionIndex = integer(item.questionIndex, 0, 99);
  if (questionIndex !== expectedIndex) invalid();
  if (
    !Array.isArray(item.choices) ||
    item.choices.length < 2 ||
    item.choices.length > 8
  ) {
    invalid();
  }
  const choices = item.choices.map((choice) => text(choice, 2_000, 1));
  const normalized = choices.map((choice) =>
    choice.normalize("NFKC").toLocaleLowerCase(),
  );
  if (new Set(normalized).size !== normalized.length) invalid();
  return {
    questionIndex,
    prompt: text(item.prompt, 4_000, 1),
    choices,
    sourcePages: parseSourcePages(item.sourcePages, pageCount),
  };
}

export function parseQuizTakingDetail(
  value: unknown,
  expected: {
    documentId: string;
    quizId: string;
    pageCount: number;
  },
): QuizForTaking {
  const item = record(value);
  exactKeys(item, ["quiz", "questions"]);
  const quiz = record(item.quiz);
  exactKeys(quiz, [
    "_id",
    "documentId",
    "title",
    "status",
    "questionCount",
    "createdAt",
    "updatedAt",
  ]);
  if (quiz.status !== "ready") invalid();
  const quizId = id(quiz._id);
  const documentId = id(quiz.documentId);
  if (
    quizId !== expected.quizId ||
    documentId !== expected.documentId ||
    expected.pageCount < 1
  ) {
    invalid();
  }
  if (!Array.isArray(item.questions) || item.questions.length > 100) {
    invalid();
  }
  const questionCount = integer(quiz.questionCount, 0, 100);
  if (item.questions.length !== questionCount) invalid();
  const questions = item.questions.map((question, index) =>
    parseTakingQuestion(question, index, expected.pageCount),
  );
  return {
    id: quizId,
    documentId,
    title: text(quiz.title, 200, 1),
    status: "ready",
    questionCount,
    createdAt: isoDate(quiz.createdAt),
    updatedAt: isoDate(quiz.updatedAt),
    questions,
  };
}

function parseJobError(
  value: unknown,
): LearningQuizJob["error"] {
  const item = record(value);
  exactKeys(item, ["code", "message"]);
  return {
    code: text(item.code, 120, 1),
    message: text(item.message, 2_000, 1),
  };
}

export function parseLearningQuizJob(
  value: unknown,
  expected: { jobId: string; quizId: string },
): LearningQuizJob {
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
    [
      "result",
      "error",
      "phase",
      "phaseSequence",
      "canRetry",
      "retryOfJobId",
      "rootJobId",
    ],
  );
  if (
    item.type !== "learning.quiz.generate" ||
    typeof item.status !== "string" ||
    !jobStatuses.has(item.status as LearningQuizJob["status"])
  ) {
    invalid();
  }
  const jobId = id(item.id);
  if (jobId !== expected.jobId) invalid();
  let result: LearningQuizJob["result"];
  if (item.result !== undefined) {
    const resultItem = record(item.result);
    exactKeys(resultItem, ["quizId", "questionCount"]);
    result = {
      quizId: id(resultItem.quizId),
      questionCount: integer(resultItem.questionCount, 1, 100),
    };
  }
  if (
    (item.status === "completed" && result === undefined) ||
    (item.status !== "completed" && result !== undefined) ||
    (result !== undefined && result.quizId !== expected.quizId)
  ) {
    invalid();
  }
  const error =
    item.error === undefined ? undefined : parseJobError(item.error);
  return {
    id: jobId,
    type: "learning.quiz.generate",
    status: item.status as LearningQuizJob["status"],
    ...parseJobResilienceMetadata(
      item,
      item.status as LearningQuizJob["status"],
    ),
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error }),
    createdAt: isoDate(item.createdAt),
    updatedAt: isoDate(item.updatedAt),
  };
}

type RawAttemptAnswer = {
  questionIndex: number;
  selectedChoiceIndex: number;
  correct: boolean;
};

function parseAttempt(
  value: unknown,
  expected: {
    documentId: string;
    quizId: string;
    attemptId?: string;
  },
): {
  summary: QuizAttemptSummary;
  answers: RawAttemptAnswer[];
} {
  const item = record(value);
  exactKeys(item, [
    "_id",
    "userId",
    "documentId",
    "quizId",
    "answers",
    "correctCount",
    "questionCount",
    "scorePercent",
    "completedAt",
    "createdAt",
    "updatedAt",
  ]);
  id(item.userId);
  const attemptId = id(item._id);
  const documentId = id(item.documentId);
  const quizId = id(item.quizId);
  if (
    documentId !== expected.documentId ||
    quizId !== expected.quizId ||
    (expected.attemptId !== undefined && attemptId !== expected.attemptId)
  ) {
    invalid();
  }
  if (!Array.isArray(item.answers) || item.answers.length > 100) invalid();
  const answers = item.answers.map((value, index) => {
    const answer = record(value);
    exactKeys(answer, [
      "questionId",
      "questionIndex",
      "selectedChoiceIndex",
      "correct",
    ]);
    id(answer.questionId);
    const questionIndex = integer(answer.questionIndex, 0, 99);
    if (questionIndex !== index) invalid();
    return {
      questionIndex,
      selectedChoiceIndex: integer(answer.selectedChoiceIndex, 0, 7),
      correct: boolean(answer.correct),
    };
  });
  const questionCount = integer(item.questionCount, 1, 100);
  const correctCount = integer(item.correctCount, 0, questionCount);
  if (
    answers.length !== questionCount ||
    answers.filter((answer) => answer.correct).length !== correctCount
  ) {
    invalid();
  }
  return {
    summary: {
      id: attemptId,
      documentId,
      quizId,
      correctCount,
      questionCount,
      scorePercent: decimal(item.scorePercent, 0, 100),
      completedAt: isoDate(item.completedAt),
      createdAt: isoDate(item.createdAt),
    },
    answers,
  };
}

function parseSubmittedReview(
  value: unknown,
  expectedIndex: number,
  takingQuestion: QuizQuestionForTaking,
  submittedAnswer: QuizAnswerSelection,
  attemptAnswer: RawAttemptAnswer,
  pageCount: number,
): QuizQuestionReview {
  const item = record(value);
  exactKeys(item, [
    "questionIndex",
    "selectedChoiceIndex",
    "correctChoiceIndex",
    "correct",
    "explanation",
    "sourcePages",
  ]);
  const questionIndex = integer(item.questionIndex, 0, 99);
  const selectedChoiceIndex = integer(item.selectedChoiceIndex, 0, 7);
  const correctChoiceIndex = integer(item.correctChoiceIndex, 0, 7);
  const correct = boolean(item.correct);
  if (
    questionIndex !== expectedIndex ||
    takingQuestion.questionIndex !== expectedIndex ||
    submittedAnswer.questionIndex !== expectedIndex ||
    attemptAnswer.questionIndex !== expectedIndex ||
    selectedChoiceIndex !== submittedAnswer.selectedChoiceIndex ||
    selectedChoiceIndex !== attemptAnswer.selectedChoiceIndex ||
    correct !== attemptAnswer.correct ||
    selectedChoiceIndex >= takingQuestion.choices.length ||
    correctChoiceIndex >= takingQuestion.choices.length ||
    correct !== (selectedChoiceIndex === correctChoiceIndex)
  ) {
    invalid();
  }
  return {
    questionIndex,
    prompt: takingQuestion.prompt,
    choices: takingQuestion.choices,
    selectedChoiceIndex,
    correctChoiceIndex,
    correct,
    explanation: text(item.explanation, 8_000, 1),
    sourcePages: parseSourcePages(item.sourcePages, pageCount),
  };
}

export function parseQuizSubmission(
  value: unknown,
  expected: {
    documentId: string;
    quizId: string;
    takingQuestions: QuizQuestionForTaking[];
    submittedAnswers: QuizAnswerSelection[];
    pageCount: number;
  },
): QuizAttemptReview {
  const item = record(value);
  exactKeys(item, ["attempt", "review"]);
  const parsedAttempt = parseAttempt(item.attempt, expected);
  if (
    !Array.isArray(item.review) ||
    item.review.length !== parsedAttempt.summary.questionCount ||
    expected.takingQuestions.length !== parsedAttempt.summary.questionCount ||
    expected.submittedAnswers.length !== parsedAttempt.summary.questionCount
  ) {
    invalid();
  }
  const review = item.review.map((question, index) =>
    parseSubmittedReview(
      question,
      index,
      expected.takingQuestions[index]!,
      expected.submittedAnswers[index]!,
      parsedAttempt.answers[index]!,
      expected.pageCount,
    ),
  );
  return { attempt: parsedAttempt.summary, review };
}

function parseDetailedReview(
  value: unknown,
  expectedIndex: number,
  attemptAnswer: RawAttemptAnswer,
  pageCount: number,
): QuizQuestionReview {
  const item = record(value);
  exactKeys(item, [
    "questionIndex",
    "prompt",
    "choices",
    "selectedChoiceIndex",
    "correctChoiceIndex",
    "correct",
    "explanation",
    "sourcePages",
  ]);
  const taking = parseTakingQuestion(
    {
      questionIndex: item.questionIndex,
      prompt: item.prompt,
      choices: item.choices,
      sourcePages: item.sourcePages,
    },
    expectedIndex,
    pageCount,
  );
  const selectedChoiceIndex = integer(item.selectedChoiceIndex, 0, 7);
  const correctChoiceIndex = integer(item.correctChoiceIndex, 0, 7);
  const correct = boolean(item.correct);
  if (
    selectedChoiceIndex !== attemptAnswer.selectedChoiceIndex ||
    correct !== attemptAnswer.correct ||
    selectedChoiceIndex >= taking.choices.length ||
    correctChoiceIndex >= taking.choices.length ||
    correct !== (selectedChoiceIndex === correctChoiceIndex)
  ) {
    invalid();
  }
  return {
    ...taking,
    selectedChoiceIndex,
    correctChoiceIndex,
    correct,
    explanation: text(item.explanation, 8_000, 1),
  };
}

export function parseQuizAttemptDetail(
  value: unknown,
  expected: {
    documentId: string;
    quizId: string;
    attemptId: string;
    pageCount: number;
  },
): QuizAttemptReview {
  const item = record(value);
  exactKeys(item, ["attempt", "review"]);
  const parsedAttempt = parseAttempt(item.attempt, expected);
  if (
    !Array.isArray(item.review) ||
    item.review.length !== parsedAttempt.summary.questionCount
  ) {
    invalid();
  }
  return {
    attempt: parsedAttempt.summary,
    review: item.review.map((question, index) =>
      parseDetailedReview(
        question,
        index,
        parsedAttempt.answers[index]!,
        expected.pageCount,
      ),
    ),
  };
}

export function parseQuizAttemptList(
  value: unknown,
  expected: { documentId: string; quizId: string },
): { attempts: QuizAttemptSummary[]; pagination: LearningPagination } {
  const item = record(value);
  exactKeys(item, ["attempts", "pagination"]);
  if (!Array.isArray(item.attempts) || item.attempts.length > 100) invalid();
  const attempts = item.attempts.map((value) => {
    const attempt = record(value);
    exactKeys(attempt, [
      "_id",
      "quizId",
      "documentId",
      "correctCount",
      "questionCount",
      "scorePercent",
      "completedAt",
      "createdAt",
    ]);
    const documentId = id(attempt.documentId);
    const quizId = id(attempt.quizId);
    if (
      documentId !== expected.documentId ||
      quizId !== expected.quizId
    ) {
      invalid();
    }
    const questionCount = integer(attempt.questionCount, 1, 100);
    return {
      id: id(attempt._id),
      documentId,
      quizId,
      correctCount: integer(attempt.correctCount, 0, questionCount),
      questionCount,
      scorePercent: decimal(attempt.scorePercent, 0, 100),
      completedAt: isoDate(attempt.completedAt),
      createdAt: isoDate(attempt.createdAt),
    };
  });
  if (new Set(attempts.map((attempt) => attempt.id)).size !== attempts.length) {
    invalid();
  }
  for (let index = 1; index < attempts.length; index += 1) {
    if (
      Date.parse(attempts[index - 1]!.completedAt) <
      Date.parse(attempts[index]!.completedAt)
    ) {
      invalid();
    }
  }
  return { attempts, pagination: parsePagination(item.pagination) };
}

export function parseSafeQuizErrorEnvelope(value: unknown): {
  code: string;
  message: string;
  requestId?: string;
} {
  const envelope = record(value);
  exactKeys(envelope, ["success", "error"]);
  if (envelope.success !== false) invalid();
  const error = record(envelope.error);
  exactKeys(error, ["code", "message"], ["requestId"]);
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
