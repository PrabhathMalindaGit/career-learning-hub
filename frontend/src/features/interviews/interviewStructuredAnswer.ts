export const STRUCTURED_ANSWER_MAX_LENGTH = 12_000;

export type StructuredInterviewQuestionType =
  | "behavioral"
  | "scenario-based"
  | "technical-explanation";

export type StructuredAnswerFieldKey =
  | "situation"
  | "task"
  | "action"
  | "result"
  | "assessment"
  | "approach"
  | "tradeOffs"
  | "decision"
  | "concept"
  | "howItWorks"
  | "example"
  | "limitations";

export type StructuredAnswerDraft = Partial<
  Record<StructuredAnswerFieldKey, string>
>;

export interface StructuredAnswerFieldDefinition {
  key: StructuredAnswerFieldKey;
  label: string;
  placeholder: string;
  heading: string;
}

export interface StructuredAnswerPresentation {
  guidance: string;
  groupLabel: string;
  fields: readonly StructuredAnswerFieldDefinition[];
}

export const STRUCTURED_ANSWER_PRESENTATION: Record<
  StructuredInterviewQuestionType,
  StructuredAnswerPresentation
> = {
  behavioral: {
    guidance:
      "Use the STAR structure to keep your example clear and evidence-based.",
    groupLabel: "Behavioral response",
    fields: [
      {
        key: "situation",
        label: "Situation",
        placeholder: "Describe the context…",
        heading: "Situation",
      },
      {
        key: "task",
        label: "Task",
        placeholder: "What were you responsible for?",
        heading: "Task",
      },
      {
        key: "action",
        label: "Action",
        placeholder: "What did you personally do?",
        heading: "Action",
      },
      {
        key: "result",
        label: "Result",
        placeholder: "What happened? What was the impact?",
        heading: "Result",
      },
    ],
  },
  "scenario-based": {
    guidance:
      "Structure your reasoning from assessment through the final decision.",
    groupLabel: "Scenario response",
    fields: [
      {
        key: "assessment",
        label: "Assessment",
        placeholder: "What is happening and what matters most?",
        heading: "Assessment",
      },
      {
        key: "approach",
        label: "Approach",
        placeholder: "What would you do?",
        heading: "Approach",
      },
      {
        key: "tradeOffs",
        label: "Trade-offs",
        placeholder:
          "What risks, alternatives, or constraints would you consider?",
        heading: "Trade-offs",
      },
      {
        key: "decision",
        label: "Decision",
        placeholder: "What would you ultimately choose and why?",
        heading: "Decision",
      },
    ],
  },
  "technical-explanation": {
    guidance: "Explain the idea as if speaking to an interviewer.",
    groupLabel: "Technical explanation",
    fields: [
      {
        key: "concept",
        label: "Concept",
        placeholder: "Define the concept clearly…",
        heading: "Concept",
      },
      {
        key: "howItWorks",
        label: "How it works",
        placeholder: "Explain the mechanism or process…",
        heading: "How it works",
      },
      {
        key: "example",
        label: "Example",
        placeholder: "Give a practical example…",
        heading: "Example",
      },
      {
        key: "limitations",
        label: "Trade-offs / limitations",
        placeholder: "Explain strengths, limitations, or alternatives…",
        heading: "Trade-offs / limitations",
      },
    ],
  },
};

export function isStructuredInterviewQuestionType(
  type: string,
): type is StructuredInterviewQuestionType {
  return (
    type === "behavioral" ||
    type === "scenario-based" ||
    type === "technical-explanation"
  );
}

export function serializeStructuredAnswer(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): string {
  const sections: string[] = [];
  for (const field of STRUCTURED_ANSWER_PRESENTATION[type].fields) {
    const value = (draft[field.key] ?? "").trim();
    if (!value) continue;
    sections.push(`${field.heading}:\n${value}`);
  }
  return sections.join("\n\n");
}

export function structuredAnswerLength(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): number {
  return serializeStructuredAnswer(type, draft).length;
}

export function structuredAnswerHasContent(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): boolean {
  return serializeStructuredAnswer(type, draft).length > 0;
}

export function withStructuredAnswerEdit(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
  key: StructuredAnswerFieldKey,
  value: string,
): StructuredAnswerDraft | null {
  const next = { ...draft, [key]: value };
  return structuredAnswerLength(type, next) <= STRUCTURED_ANSWER_MAX_LENGTH
    ? next
    : null;
}
