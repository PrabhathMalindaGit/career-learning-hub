import { describe, expect, it } from "vitest";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  STRUCTURED_ANSWER_PRESENTATION,
  isStructuredInterviewQuestionType,
  serializeStructuredAnswer,
  structuredAnswerHasContent,
  structuredAnswerLength,
  withStructuredAnswerEdit,
} from "./interviewStructuredAnswer";

describe("interviewStructuredAnswer", () => {
  it("recognizes only the three structured question types", () => {
    expect(isStructuredInterviewQuestionType("behavioral")).toBe(true);
    expect(isStructuredInterviewQuestionType("scenario-based")).toBe(true);
    expect(isStructuredInterviewQuestionType("technical-explanation")).toBe(true);
    expect(isStructuredInterviewQuestionType("short-answer")).toBe(false);
    expect(isStructuredInterviewQuestionType("coding")).toBe(false);
  });

  it("serializes Behavioral sections in stable STAR order and omits blanks", () => {
    expect(
      serializeStructuredAnswer("behavioral", {
        situation: "  Context  ",
        task: "",
        action: "Did the work\nwith care",
        result: " Impact ",
      }),
    ).toBe(
      "Situation:\nContext\n\nAction:\nDid the work\nwith care\n\nResult:\nImpact",
    );
  });

  it("serializes Scenario-Based sections with exact headings", () => {
    expect(
      serializeStructuredAnswer("scenario-based", {
        assessment: "Identify the risk",
        approach: "Contain it",
        tradeOffs: "Speed vs certainty",
        decision: "Act now",
      }),
    ).toBe(
      "Assessment:\nIdentify the risk\n\nApproach:\nContain it\n\nTrade-offs:\nSpeed vs certainty\n\nDecision:\nAct now",
    );
  });

  it("serializes Technical Explanation sections with exact headings", () => {
    expect(
      serializeStructuredAnswer("technical-explanation", {
        concept: "Caching",
        howItWorks: "Store reusable results",
        example: "HTTP cache",
        limitations: "Staleness",
      }),
    ).toBe(
      "Concept:\nCaching\n\nHow it works:\nStore reusable results\n\nExample:\nHTTP cache\n\nTrade-offs / limitations:\nStaleness",
    );
  });

  it("uses the exact serialized length for content and counter semantics", () => {
    const draft = { situation: "Context", action: "Action" };
    const serialized = serializeStructuredAnswer("behavioral", draft);
    expect(structuredAnswerLength("behavioral", draft)).toBe(serialized.length);
    expect(structuredAnswerHasContent("behavioral", draft)).toBe(true);
    expect(structuredAnswerHasContent("behavioral", {})).toBe(false);
    expect(serializeStructuredAnswer("behavioral", {})).toBe("");
  });

  it("rejects an edit whose exact serialized answer would exceed 12,000 characters", () => {
    const accepted = withStructuredAnswerEdit(
      "behavioral",
      {},
      "situation",
      "x".repeat(STRUCTURED_ANSWER_MAX_LENGTH - "Situation:\n".length),
    );
    expect(accepted).not.toBeNull();
    expect(
      structuredAnswerLength("behavioral", accepted ?? {}),
    ).toBe(STRUCTURED_ANSWER_MAX_LENGTH);

    expect(
      withStructuredAnswerEdit(
        "behavioral",
        accepted ?? {},
        "situation",
        "x".repeat(STRUCTURED_ANSWER_MAX_LENGTH),
      ),
    ).toBeNull();
  });

  it("defines the approved labels and guidance for all structured types", () => {
    expect(
      STRUCTURED_ANSWER_PRESENTATION.behavioral.fields.map((field) => field.label),
    ).toEqual(["Situation", "Task", "Action", "Result"]);
    expect(
      STRUCTURED_ANSWER_PRESENTATION["scenario-based"].fields.map(
        (field) => field.label,
      ),
    ).toEqual(["Assessment", "Approach", "Trade-offs", "Decision"]);
    expect(
      STRUCTURED_ANSWER_PRESENTATION["technical-explanation"].fields.map(
        (field) => field.label,
      ),
    ).toEqual([
      "Concept",
      "How it works",
      "Example",
      "Trade-offs / limitations",
    ]);
  });
});
