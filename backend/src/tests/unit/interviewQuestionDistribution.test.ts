import { describe, expect, it } from "vitest";
import type { InterviewQuestionType } from "../../modules/interviews/interviewQuestion.types.js";
import {
  generateQuestionsBodySchema,
  generatedQuestionSetSchema,
  manualQuestionInputSchema,
} from "../../modules/interviews/interview.schemas.js";

type QuestionTypeCounts = Partial<
  Record<InterviewQuestionType, number>
>;

type DistributionModule = {
  resolveQuestionTypeCounts(input: {
    count: number;
    questionTypes: InterviewQuestionType[];
    typeCounts?: QuestionTypeCounts;
  }): QuestionTypeCounts;
  assertQuestionTypeDistribution(input: {
    questions: Array<{
      questionType: InterviewQuestionType;
    }>;
    expected: QuestionTypeCounts;
  }): void;
};

async function loadDistributionModule(): Promise<
  DistributionModule | null
> {
  const modulePath =
    "../../modules/interviews/interviewQuestionDistribution.js";

  try {
    return (await import(
      /* @vite-ignore */ modulePath
    )) as DistributionModule;
  } catch {
    return null;
  }
}

describe("Interview question type distribution", () => {
  it("resolves balanced and explicit distributions deterministically", async () => {
    const distribution =
      await loadDistributionModule();

    expect(distribution).not.toBeNull();

    if (!distribution) return;

    expect(
      distribution.resolveQuestionTypeCounts({
        count: 5,
        questionTypes: [
          "behavioral",
          "technical-explanation",
        ],
      }),
    ).toEqual({
      behavioral: 3,
      "technical-explanation": 2,
    });

    expect(
      distribution.resolveQuestionTypeCounts({
        count: 6,
        questionTypes: [
          "multiple-choice",
          "coding",
        ],
        typeCounts: {
          "multiple-choice": 2,
          coding: 4,
        },
      }),
    ).toEqual({
      "multiple-choice": 2,
      coding: 4,
    });
  });

  it("rejects invalid direct distribution inputs", async () => {
    const distribution =
      await loadDistributionModule();

    expect(distribution).not.toBeNull();

    if (!distribution) return;

    const invalidInputs = [
      {
        count: 1,
        questionTypes: [],
      },
      {
        count: 2,
        questionTypes: [
          "coding",
          "coding",
        ],
      },
      {
        count: 2,
        questionTypes: ["coding"],
        typeCounts: {
          coding: -1,
        },
      },
      {
        count: 2,
        questionTypes: ["coding"],
        typeCounts: {
          coding: 1.5,
        },
      },
      {
        count: 2,
        questionTypes: ["coding"],
        typeCounts: {
          behavioral: 2,
        },
      },
      {
        count: 2,
        questionTypes: ["coding"],
        typeCounts: {
          coding: 1,
        },
      },
    ] as Array<{
      count: number;
      questionTypes: InterviewQuestionType[];
      typeCounts?: QuestionTypeCounts;
    }>;

    for (const input of invalidInputs) {
      expect(() =>
        distribution.resolveQuestionTypeCounts(input),
      ).toThrow();
    }
  });

  it("validates generation question types and exact custom counts", () => {
    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "11111111-1111-4111-8111-111111111111",
        count: 5,
        categories: ["Technical"],
        questionTypes: [
          "behavioral",
          "technical-explanation",
        ],
      }).success,
    ).toBe(true);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "22222222-2222-4222-8222-222222222222",
        count: 6,
        categories: [],
        questionTypes: [
          "multiple-choice",
          "coding",
        ],
        typeCounts: {
          "multiple-choice": 2,
          coding: 4,
        },
      }).success,
    ).toBe(true);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "33333333-3333-4333-8333-333333333333",
        count: 2,
        categories: [],
      }).success,
    ).toBe(false);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "44444444-4444-4444-8444-444444444444",
        count: 2,
        categories: [],
        questionTypes: [
          "coding",
          "coding",
        ],
      }).success,
    ).toBe(false);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "55555555-5555-4555-8555-555555555555",
        count: 2,
        categories: [],
        questionTypes: ["coding"],
        typeCounts: {
          behavioral: 2,
        },
      }).success,
    ).toBe(false);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "66666666-6666-4666-8666-666666666666",
        count: 2,
        categories: [],
        questionTypes: ["coding"],
        typeCounts: {
          coding: -1,
        },
      }).success,
    ).toBe(false);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "77777777-7777-4777-8777-777777777777",
        count: 2,
        categories: [],
        questionTypes: ["coding"],
        typeCounts: {
          coding: 1.5,
        },
      }).success,
    ).toBe(false);

    expect(
      generateQuestionsBodySchema.safeParse({
        requestId:
          "88888888-8888-4888-8888-888888888888",
        count: 2,
        categories: [],
        questionTypes: ["coding"],
        typeCounts: {
          coding: 1,
        },
      }).success,
    ).toBe(false);
  });

  it("accepts all six typed manual question shapes and validates MCQ data", () => {
    expect(
      manualQuestionInputSchema.safeParse({
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Which statement about const is correct?",
        multipleChoice: {
          options: [
            "A const binding cannot be reassigned.",
            "A const object can never be mutated.",
          ],
          correctOptionIndex: 0,
        },
      }).success,
    ).toBe(true);

    for (const questionType of [
      "short-answer",
      "coding",
      "behavioral",
      "scenario-based",
      "technical-explanation",
    ] as const) {
      expect(
        manualQuestionInputSchema.safeParse({
          questionType,
          category: "General",
          difficulty: "medium",
          question:
            `Provide a ${questionType} practice response.`,
          modelAnswer:
            "Describe a strong answer structure.",
        }).success,
      ).toBe(true);
    }

    expect(
      manualQuestionInputSchema.safeParse({
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Which option is duplicated?",
        multipleChoice: {
          options: [
            "Same option",
            " Same option ",
          ],
          correctOptionIndex: 0,
        },
      }).success,
    ).toBe(false);

    expect(
      manualQuestionInputSchema.safeParse({
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Which option index is valid?",
        multipleChoice: {
          options: ["A", "B"],
          correctOptionIndex: 2,
        },
      }).success,
    ).toBe(false);

    expect(
      manualQuestionInputSchema.safeParse({
        questionType: "coding",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Write a small mapping function.",
        multipleChoice: {
          options: ["A", "B"],
          correctOptionIndex: 0,
        },
      }).success,
    ).toBe(false);

    expect(
      manualQuestionInputSchema.safeParse({
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Which answer is correct?",
        modelAnswer:
          "This field is reserved for text questions.",
        multipleChoice: {
          options: ["A", "B"],
          correctOptionIndex: 0,
        },
      }).success,
    ).toBe(false);
  });

  it("validates the typed provider result union including MCQ bounds", () => {
    expect(
      generatedQuestionSetSchema.safeParse({
        questions: [
          {
            questionType: "multiple-choice",
            category: "JavaScript",
            difficulty: "medium",
            question:
              "Which statement is correct?",
            options: [
              "Option A",
              "Option B",
            ],
            correctOptionIndex: 1,
            modelAnswer:
              "Option B is the correct choice.",
          },
          {
            questionType: "coding",
            category: "JavaScript",
            difficulty: "medium",
            question:
              "Write a function that reverses an array.",
            starterCode:
              "function reverseArray(values) {\n  // TODO\n}",
            modelAnswer:
              "Discuss a simple implementation and complexity.",
          },
        ],
      }).success,
    ).toBe(true);

    expect(
      generatedQuestionSetSchema.safeParse({
        questions: [
          {
            questionType: "multiple-choice",
            category: "JavaScript",
            difficulty: "medium",
            question:
              "Which index is invalid?",
            options: ["A", "B"],
            correctOptionIndex: 2,
            modelAnswer: "B",
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      generatedQuestionSetSchema.safeParse({
        questions: [
          {
            questionType: "multiple-choice",
            category: "JavaScript",
            difficulty: "medium",
            question:
              "Which options are distinct?",
            options: ["Same", " Same "],
            correctOptionIndex: 0,
            modelAnswer: "Same",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects provider question-type drift with the dedicated application error", async () => {
    const distribution =
      await loadDistributionModule();

    expect(distribution).not.toBeNull();

    if (!distribution) return;

    try {
      distribution.assertQuestionTypeDistribution({
        questions: [
          { questionType: "behavioral" },
          { questionType: "behavioral" },
        ],
        expected: {
          behavioral: 1,
          coding: 1,
        },
      });

      throw new Error(
        "Expected question-type mismatch.",
      );
    } catch (error) {
      expect(error).toMatchObject({
        code:
          "AI_INTERVIEW_QUESTION_TYPE_MISMATCH",
      });
    }
  });
});
