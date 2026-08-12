import { describe, expect, it } from "vitest";
import {
  parseAttemptDetail,
  parseQuestionDetail,
  parseQuestionList,
} from "./interviewContracts";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionType,
} from "./types";

const sessionId = "507f1f77bcf86cd799439011";
const questionId = "507f1f77bcf86cd799439012";
const attemptId = "507f1f77bcf86cd799439013";
const timestamp = "2026-08-13T00:00:00.000Z";

function questionFixture(
  questionType: EffectiveInterviewQuestionType,
) {
  return {
    _id: questionId,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "Explain a useful interview concept.",
    questionType,
    ...(questionType === "multiple-choice"
      ? {
          multipleChoice: {
            options: [
              { id: "option-a", text: "First option" },
              { id: "option-b", text: "Second option" },
            ],
          },
        }
      : {}),
    isPinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function attemptBase() {
  return {
    _id: attemptId,
    sessionId,
    questionId,
    status: "recorded",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const modernTextTypes: InterviewQuestionType[] = [
  "short-answer",
  "coding",
  "behavioral",
  "scenario-based",
  "technical-explanation",
];

describe("Interview question-type runtime contracts", () => {
  it("parses all seven effective question response types", () => {
    const types: EffectiveInterviewQuestionType[] = [
      "legacy-open-response",
      "multiple-choice",
      ...modernTextTypes,
    ];

    const parsed = parseQuestionList(
      {
        questions: types.map((type, index) => ({
          ...questionFixture(type),
          _id: `507f1f77bcf86cd7994390${20 + index}`,
        })),
        pagination: {
          page: 1,
          limit: 20,
          total: types.length,
          pages: 1,
        },
      },
      sessionId,
    );

    expect(parsed.questions.map((question) => question.questionType)).toEqual(
      types,
    );
    expect(parsed.questions[1]?.multipleChoice?.options).toEqual([
      { id: "option-a", text: "First option" },
      { id: "option-b", text: "Second option" },
    ]);

    const historical = parseQuestionDetail(
      {
        question: {
          ...questionFixture("legacy-open-response"),
          questionType: undefined,
          explanationKeyPoints: [],
        },
      },
      sessionId,
      questionId,
    );
    expect(historical.questionType).toBe("legacy-open-response");
  });

  it("rejects malformed or secret-bearing Multiple Choice question responses", () => {
    const invalidMultipleChoiceValues = [
      { options: [{ id: "option-a", text: "Only option" }] },
      {
        options: Array.from({ length: 9 }, (_, index) => ({
          id: `option-${index}`,
          text: `Option ${index}`,
        })),
      },
      {
        options: [
          { id: " ", text: "First option" },
          { id: "option-b", text: "Second option" },
        ],
      },
      {
        options: [
          { id: "option-a", text: " " },
          { id: "option-b", text: "Second option" },
        ],
      },
      {
        options: [
          { id: "option-a", text: "First option" },
          { id: "option-a", text: "Duplicate id" },
        ],
      },
      {
        options: [
          { id: "option-a", text: "First option" },
          { id: "option-b", text: "Second option" },
        ],
        correctOptionId: "option-a",
      },
    ];

    for (const multipleChoice of invalidMultipleChoiceValues) {
      expect(() =>
        parseQuestionDetail(
          {
            question: {
              ...questionFixture("multiple-choice"),
              multipleChoice,
              explanationKeyPoints: [],
            },
          },
          sessionId,
          questionId,
        ),
      ).toThrowError(/invalid interview response/i);
    }

    expect(() =>
      parseQuestionDetail(
        {
          question: {
            ...questionFixture("multiple-choice"),
            multipleChoice: undefined,
            explanationKeyPoints: [],
          },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);

    expect(() =>
      parseQuestionDetail(
        {
          question: {
            ...questionFixture("behavioral"),
            multipleChoice: {
              options: [
                { id: "option-a", text: "First option" },
                { id: "option-b", text: "Second option" },
              ],
            },
            explanationKeyPoints: [],
          },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("parses legacy, modern text, and post-submit MCQ attempts", () => {
    const legacy = parseAttemptDetail(
      {
        attempt: {
          ...attemptBase(),
          answerText: "Historical free-text answer.",
        },
      },
      sessionId,
      attemptId,
      questionId,
      "legacy-open-response",
    );
    expect(legacy.answerText).toBe("Historical free-text answer.");

    for (const type of modernTextTypes) {
      const parsed = parseAttemptDetail(
        {
          attempt: {
            ...attemptBase(),
            answer: {
              type,
              text: `Answer for ${type}`,
            },
          },
        },
        sessionId,
        attemptId,
        questionId,
        type,
      );
      expect(parsed.answer?.type).toBe(type);
    }

    const mcq = parseAttemptDetail(
      {
        attempt: {
          ...attemptBase(),
          answer: {
            type: "multiple-choice",
            selectedOptionId: "option-a",
          },
          evaluation: {
            kind: "multiple-choice",
            score: 0,
            correct: false,
            correctOptionId: "option-b",
          },
        },
      },
      sessionId,
      attemptId,
      questionId,
      "multiple-choice",
    );
    expect(mcq.evaluation).toEqual({
      kind: "multiple-choice",
      score: 0,
      correct: false,
      correctOptionId: "option-b",
    });
  });

  it("rejects attempt type mismatches and malformed MCQ evaluations", () => {
    expect(() =>
      parseAttemptDetail(
        {
          attempt: {
            ...attemptBase(),
            answer: {
              type: "behavioral",
              text: "Behavioral response.",
            },
          },
        },
        sessionId,
        attemptId,
        questionId,
        "coding",
      ),
    ).toThrowError(/invalid interview response/i);

    for (const evaluation of [
      {
        kind: "multiple-choice",
        score: 50,
        correct: false,
        correctOptionId: "option-b",
      },
      {
        kind: "multiple-choice",
        score: 100,
        correct: true,
      },
    ]) {
      expect(() =>
        parseAttemptDetail(
          {
            attempt: {
              ...attemptBase(),
              answer: {
                type: "multiple-choice",
                selectedOptionId: "option-a",
              },
              evaluation,
            },
          },
          sessionId,
          attemptId,
          questionId,
          "multiple-choice",
        ),
      ).toThrowError(/invalid interview response/i);
    }
  });
});
