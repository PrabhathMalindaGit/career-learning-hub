export const interviewQuestionTypes = [
  "multiple-choice",
  "short-answer",
  "coding",
  "behavioral",
  "scenario-based",
  "technical-explanation",
] as const;

export type InterviewQuestionType =
  (typeof interviewQuestionTypes)[number];

export type EffectiveInterviewQuestionType =
  | InterviewQuestionType
  | "legacy-open-response";

export interface InterviewMultipleChoiceOption {
  id: string;
  text: string;
}

export interface InterviewMultipleChoiceStorage {
  options: InterviewMultipleChoiceOption[];
  correctOptionId: string;
}

export type TypedInterviewAnswer =
  | {
      type: "multiple-choice";
      selectedOptionId: string;
    }
  | {
      type: "short-answer";
      text: string;
    }
  | {
      type: "coding";
      text: string;
    }
  | {
      type: "behavioral";
      text: string;
    }
  | {
      type: "scenario-based";
      text: string;
    }
  | {
      type: "technical-explanation";
      text: string;
    };

export function effectiveInterviewQuestionType(input: {
  questionType?: InterviewQuestionType;
}): EffectiveInterviewQuestionType {
  return input.questionType ?? "legacy-open-response";
}
