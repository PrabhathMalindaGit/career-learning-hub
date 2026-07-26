import { describe, expect, it } from "vitest";
import {
  parseLearningQuizJob,
  parseQuizAttemptDetail,
  parseQuizGenerationAcceptance,
  parseQuizList,
  parseQuizSubmission,
  parseQuizTakingDetail,
  parseSafeQuizErrorEnvelope,
} from "./learningQuizContracts";

const documentId = "507f1f77bcf86cd799439011";
const quizId = "507f1f77bcf86cd799439012";
const jobId = "507f1f77bcf86cd799439013";
const attemptId = "507f1f77bcf86cd799439014";
const userId = "507f1f77bcf86cd799439015";
const questionId = "507f1f77bcf86cd799439016";
const createdAt = "2026-07-26T01:00:00.000Z";

function pagination(overrides: Record<string, unknown> = {}) {
  return { page: 1, limit: 10, total: 1, pages: 1, ...overrides };
}

function quizSummary(overrides: Record<string, unknown> = {}) {
  return {
    _id: quizId,
    documentId,
    title: "Synthetic architecture quiz",
    status: "ready",
    questionCount: 1,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function takingQuestion(overrides: Record<string, unknown> = {}) {
  return {
    questionIndex: 0,
    prompt: "Which boundary is canonical?",
    choices: ["The server boundary", "A browser guess"],
    sourcePages: [1],
    ...overrides,
  };
}

function takingDetail(overrides: Record<string, unknown> = {}) {
  return {
    quiz: quizSummary(),
    questions: [takingQuestion()],
    ...overrides,
  };
}

function attempt(overrides: Record<string, unknown> = {}) {
  return {
    _id: attemptId,
    userId,
    documentId,
    quizId,
    answers: [
      {
        questionId,
        questionIndex: 0,
        selectedChoiceIndex: 0,
        correct: true,
      },
    ],
    correctCount: 1,
    questionCount: 1,
    scorePercent: 100,
    completedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function submittedReview(overrides: Record<string, unknown> = {}) {
  return {
    questionIndex: 0,
    selectedChoiceIndex: 0,
    correctChoiceIndex: 0,
    correct: true,
    explanation: "The server owns canonical scoring.",
    sourcePages: [1],
    ...overrides,
  };
}

function detailedReview(overrides: Record<string, unknown> = {}) {
  return {
    ...takingQuestion(),
    ...submittedReview(),
    ...overrides,
  };
}

describe("quiz answer-key secrecy contracts", () => {
  it.each([
    "correctAnswer",
    "correctAnswerIndex",
    "correctChoice",
    "correctChoiceId",
    "correctChoiceIndex",
    "answer",
    "answerKey",
    "solution",
    "explanation",
    "rationale",
    "isCorrect",
    "correct",
    "scoringKey",
    "expectedAnswer",
    "modelAnswer",
    "review",
    "privateEvaluation",
  ])("rejects answer-key-like quiz-list field %s", (field) => {
    expect(() =>
      parseQuizList(
        {
          quizzes: [quizSummary({ [field]: "must-not-pass" })],
          pagination: pagination(),
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it.each([
    "answer",
    "answerKey",
    "correctAnswer",
    "correctChoiceIndex",
    "explanation",
    "review",
  ])("rejects generation acceptance field %s", (field) => {
    expect(() =>
      parseQuizGenerationAcceptance(
        {
          quizId,
          job: {
            id: jobId,
            type: "learning.quiz.generate",
            status: "queued",
          },
          [field]: "must-not-pass",
        },
        documentId,
      ),
    ).toThrow(/invalid learning response/i);
  });

  it.each([
    "answerKey",
    "correctChoiceIndex",
    "explanation",
    "review",
  ])("rejects generation-job result field %s", (field) => {
    expect(() =>
      parseLearningQuizJob(
        {
          job: {
            id: jobId,
            type: "learning.quiz.generate",
            status: "completed",
            progress: 100,
            attempts: 1,
            maxAttempts: 3,
            result: {
              quizId,
              questionCount: 1,
              [field]: "must-not-pass",
            },
            createdAt,
            updatedAt: createdAt,
          },
        },
        { jobId, quizId },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it("accepts an allowlisted failed quiz-generation job error", () => {
    const parsed = parseLearningQuizJob(
      {
        job: {
          id: jobId,
          type: "learning.quiz.generate",
          status: "failed",
          progress: 60,
          attempts: 3,
          maxAttempts: 3,
          error: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "Quiz generation is currently unavailable.",
          },
          createdAt,
          updatedAt: createdAt,
        },
      },
      { jobId, quizId },
    );

    expect(parsed.error).toEqual({
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "Quiz generation is currently unavailable.",
    });
  });

  it("rejects stack metadata in a failed quiz-generation job error", () => {
    expect(() =>
      parseLearningQuizJob(
        {
          job: {
            id: jobId,
            type: "learning.quiz.generate",
            status: "failed",
            progress: 60,
            attempts: 3,
            maxAttempts: 3,
            error: {
              code: "AI_PROVIDER_UNAVAILABLE",
              message: "Quiz generation is currently unavailable.",
              stack: "must-not-pass",
            },
            createdAt,
            updatedAt: createdAt,
          },
        },
        { jobId, quizId },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it.each([
    "correctAnswer",
    "correctChoiceIndex",
    "answerKey",
    "explanation",
    "review",
  ])("rejects pre-submission question field %s", (field) => {
    expect(() =>
      parseQuizTakingDetail(
        takingDetail({
          questions: [
            takingQuestion({ [field]: "must-not-pass" }),
          ],
        }),
        { documentId, quizId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });

  it.each(["isCorrect", "correct", "correctness", "score"])(
    "rejects per-choice correctness metadata %s",
    (field) => {
      expect(() =>
        parseQuizTakingDetail(
          takingDetail({
            questions: [
              takingQuestion({
                choices: [
                  { text: "Unsafe", [field]: true },
                  "Canonical",
                ],
              }),
            ],
          }),
          { documentId, quizId, pageCount: 3 },
        ),
      ).toThrow(/invalid learning response/i);
    },
  );

  it("rejects review-shaped fields in a pre-submission error", () => {
    expect(() =>
      parseSafeQuizErrorEnvelope({
        success: false,
        error: {
          code: "QUIZ_NOT_READY",
          message: "The quiz is not ready.",
          requestId: "request-quiz-safe-0001",
          details: { correctChoiceIndex: 0 },
        },
      }),
    ).toThrow(/invalid learning response/i);
  });

  it("accepts correctness and explanation only through submission review", () => {
    const taking = parseQuizTakingDetail(takingDetail(), {
      documentId,
      quizId,
      pageCount: 3,
    });
    expect(taking.questions[0]).not.toHaveProperty("correctChoiceIndex");
    expect(taking.questions[0]).not.toHaveProperty("explanation");

    const result = parseQuizSubmission(
      {
        attempt: attempt(),
        review: [submittedReview()],
      },
      {
        documentId,
        quizId,
        takingQuestions: taking.questions,
        submittedAnswers: [
          { questionIndex: 0, selectedChoiceIndex: 0 },
        ],
        pageCount: 3,
      },
    );
    expect(result.review[0]?.correctChoiceIndex).toBe(0);
    expect(result.review[0]?.explanation).toBe(
      "The server owns canonical scoring.",
    );
  });

  it("rejects unknown private evaluation metadata in completed review", () => {
    expect(() =>
      parseQuizAttemptDetail(
        {
          attempt: attempt(),
          review: [
            detailedReview({
              privateEvaluation: { modelAnswer: "must-not-pass" },
            }),
          ],
        },
        { documentId, quizId, attemptId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });
});

describe("quiz identity, ordering, score, and grounding contracts", () => {
  it("accepts canonical generation, listing, taking, job, and review shapes", () => {
    const accepted = parseQuizGenerationAcceptance(
      {
        quizId,
        job: {
          id: jobId,
          type: "learning.quiz.generate",
          status: "queued",
        },
      },
      documentId,
    );
    expect(accepted.documentId).toBe(documentId);

    expect(
      parseQuizList(
        { quizzes: [quizSummary()], pagination: pagination() },
        documentId,
      ).quizzes[0]?.id,
    ).toBe(quizId);

    const taking = parseQuizTakingDetail(takingDetail(), {
      documentId,
      quizId,
      pageCount: 3,
    });
    expect(taking.questions[0]?.sourcePages).toEqual([1]);

    const detail = parseQuizAttemptDetail(
      { attempt: attempt(), review: [detailedReview()] },
      { documentId, quizId, attemptId, pageCount: 3 },
    );
    expect(detail.attempt.scorePercent).toBe(100);
  });

  it.each([
    [
      takingDetail({
        questions: [
          takingQuestion({ questionIndex: 1 }),
        ],
      }),
      "non-contiguous question index",
    ],
    [
      takingDetail({
        questions: [
          takingQuestion({
            choices: ["Duplicate", "duplicate"],
          }),
        ],
      }),
      "duplicate choice",
    ],
    [
      takingDetail({
        questions: [
          takingQuestion({ sourcePages: [0] }),
        ],
      }),
      "page zero",
    ],
    [
      takingDetail({
        questions: [
          takingQuestion({ sourcePages: [4] }),
        ],
      }),
      "page outside the document",
    ],
  ])("rejects malformed taking detail: %s (%s)", (value) => {
    expect(() =>
      parseQuizTakingDetail(value, {
        documentId,
        quizId,
        pageCount: 3,
      }),
    ).toThrow(/invalid learning response/i);
  });

  it("rejects wrong document, quiz, attempt, and score identities", () => {
    expect(() =>
      parseQuizTakingDetail(takingDetail(), {
        documentId: "507f1f77bcf86cd799439099",
        quizId,
        pageCount: 3,
      }),
    ).toThrow(/invalid learning response/i);

    expect(() =>
      parseQuizAttemptDetail(
        {
          attempt: attempt({ quizId: "507f1f77bcf86cd799439099" }),
          review: [detailedReview()],
        },
        { documentId, quizId, attemptId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);

    expect(() =>
      parseQuizAttemptDetail(
        {
          attempt: attempt({ _id: "507f1f77bcf86cd799439099" }),
          review: [detailedReview()],
        },
        { documentId, quizId, attemptId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);

    expect(() =>
      parseQuizAttemptDetail(
        {
          attempt: attempt({ scorePercent: 101 }),
          review: [detailedReview()],
        },
        { documentId, quizId, attemptId, pageCount: 3 },
      ),
    ).toThrow(/invalid learning response/i);
  });
});
