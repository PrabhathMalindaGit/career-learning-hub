import { describe, expect, it } from "vitest";
import {
  effectiveInterviewQuestionType,
  interviewQuestionTypes,
} from "../../modules/interviews/interviewQuestion.types.js";
import {
  interviewQuestionTypeSchema,
  typedInterviewAnswerSchema,
} from "../../modules/interviews/interview.schemas.js";

describe("Interview question types", () => {
  it("keeps the six selectable modern types stable", () => {
    expect(interviewQuestionTypes).toEqual([
      "multiple-choice",
      "short-answer",
      "coding",
      "behavioral",
      "scenario-based",
      "technical-explanation",
    ]);
  });

  it("maps only missing historical storage to legacy open response", () => {
    expect(effectiveInterviewQuestionType({})).toBe(
      "legacy-open-response",
    );

    expect(
      effectiveInterviewQuestionType({
        questionType: "behavioral",
      }),
    ).toBe("behavioral");
  });

  it("accepts only the six modern selectable question types", () => {
    for (const questionType of interviewQuestionTypes) {
      expect(
        interviewQuestionTypeSchema.parse(questionType),
      ).toBe(questionType);
    }

    expect(
      interviewQuestionTypeSchema.safeParse(
        "legacy-open-response",
      ).success,
    ).toBe(false);
  });

  it("accepts typed Multiple Choice answers", () => {
    expect(
      typedInterviewAnswerSchema.parse({
        type: "multiple-choice",
        selectedOptionId: "option-1",
      }),
    ).toEqual({
      type: "multiple-choice",
      selectedOptionId: "option-1",
    });
  });

  it("accepts text answers for every modern text-based type", () => {
    for (const type of [
      "short-answer",
      "coding",
      "behavioral",
      "scenario-based",
      "technical-explanation",
    ] as const) {
      expect(
        typedInterviewAnswerSchema.parse({
          type,
          text: "Example answer",
        }),
      ).toEqual({
        type,
        text: "Example answer",
      });
    }
  });

  it("rejects cross-type or extra answer fields", () => {
    expect(
      typedInterviewAnswerSchema.safeParse({
        type: "multiple-choice",
        text: "wrong shape",
      }).success,
    ).toBe(false);

    expect(
      typedInterviewAnswerSchema.safeParse({
        type: "short-answer",
        selectedOptionId: "option-1",
      }).success,
    ).toBe(false);

    expect(
      typedInterviewAnswerSchema.safeParse({
        type: "coding",
        text: "const value = 1;",
        unexpected: true,
      }).success,
    ).toBe(false);
  });
});
