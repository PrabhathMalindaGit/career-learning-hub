import { AppError } from "../../shared/appError.js";
import {
  interviewQuestionTypes,
  type InterviewQuestionType,
} from "./interviewQuestion.types.js";

export type InterviewQuestionTypeCounts = Partial<
  Record<InterviewQuestionType, number>
>;

function invalidDistribution(message: string): never {
  throw new AppError(
    400,
    "INTERVIEW_QUESTION_TYPE_DISTRIBUTION_INVALID",
    message,
    undefined,
    false,
  );
}

export function resolveQuestionTypeCounts(input: {
  count: number;
  questionTypes: readonly InterviewQuestionType[];
  typeCounts?: InterviewQuestionTypeCounts;
}): InterviewQuestionTypeCounts {
  if (!Number.isInteger(input.count) || input.count < 1) {
    invalidDistribution(
      "Question count must be a positive integer.",
    );
  }

  if (
    input.questionTypes.length < 1 ||
    input.questionTypes.length >
      interviewQuestionTypes.length
  ) {
    invalidDistribution(
      "Select between one and six question types.",
    );
  }

  const knownTypes = new Set<string>(
    interviewQuestionTypes,
  );
  const selected = new Set<string>();

  for (const questionType of input.questionTypes) {
    if (!knownTypes.has(questionType)) {
      invalidDistribution(
        "An unsupported interview question type was selected.",
      );
    }

    if (selected.has(questionType)) {
      invalidDistribution(
        "Interview question types must be unique.",
      );
    }

    selected.add(questionType);
  }

  if (input.typeCounts !== undefined) {
    const resolved: InterviewQuestionTypeCounts = {};
    let total = 0;

    for (const [rawType, rawCount] of Object.entries(
      input.typeCounts,
    )) {
      if (!knownTypes.has(rawType)) {
        invalidDistribution(
          "Question counts contain an unsupported type.",
        );
      }

      if (!selected.has(rawType)) {
        invalidDistribution(
          "Question counts may only reference selected types.",
        );
      }

      if (
        !Number.isInteger(rawCount) ||
        rawCount < 0
      ) {
        invalidDistribution(
          "Question type counts must be non-negative integers.",
        );
      }

      const questionType =
        rawType as InterviewQuestionType;

      resolved[questionType] = rawCount;
      total += rawCount;
    }

    if (total !== input.count) {
      invalidDistribution(
        "Question type counts must add up to count.",
      );
    }

    return resolved;
  }

  const resolved: InterviewQuestionTypeCounts = {};
  const base = Math.floor(
    input.count / input.questionTypes.length,
  );
  let remainder =
    input.count % input.questionTypes.length;

  for (const questionType of input.questionTypes) {
    resolved[questionType] =
      base + (remainder > 0 ? 1 : 0);

    if (remainder > 0) {
      remainder -= 1;
    }
  }

  return resolved;
}

export function assertQuestionTypeDistribution(input: {
  questions: Array<{
    questionType: InterviewQuestionType;
  }>;
  expected: InterviewQuestionTypeCounts;
}): void {
  const actual: InterviewQuestionTypeCounts = {};

  for (const question of input.questions) {
    actual[question.questionType] =
      (actual[question.questionType] ?? 0) + 1;
  }

  const mismatch = interviewQuestionTypes.some(
    (questionType) =>
      (actual[questionType] ?? 0) !==
      (input.expected[questionType] ?? 0),
  );

  if (mismatch) {
    throw new AppError(
      502,
      "AI_INTERVIEW_QUESTION_TYPE_MISMATCH",
      "The AI provider did not follow the requested question-type distribution.",
      undefined,
      false,
    );
  }
}
