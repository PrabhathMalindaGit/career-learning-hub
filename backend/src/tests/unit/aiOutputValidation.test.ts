import { describe, expect, it } from "vitest";
import {
  extractStructuredJson,
  validateStructuredAiOutput,
} from "../../modules/ai/aiOutputValidation.js";
import { aiAnalysisResultSchema } from "../../modules/resume-analysis/resumeAnalysis.schemas.js";
import { quizGenerationResultSchema } from "../../modules/learning/learning.schemas.js";

describe("AI structured-output validation", () => {
  it("parses fenced JSON and validates the expected schema", () => {
    const result = validateStructuredAiOutput(
      `\`\`\`json
      {
        "scoreBreakdown": {
          "keywordMatch": 20,
          "clarity": 20,
          "evidence": 20,
          "formatting": 20
        },
        "issues": [],
        "strengths": [],
        "missingKeywords": [],
        "suggestions": []
      }
      \`\`\``,
      aiAnalysisResultSchema,
    );

    expect(result.scoreBreakdown.keywordMatch).toBe(20);
  });

  it("extracts a bounded JSON object from provider wrapper text", () => {
    expect(
      extractStructuredJson(
        'Provider preface {"value": 4} trailing text',
      ),
    ).toEqual({ value: 4 });
  });

  it("rejects an output that violates score bounds", () => {
    expect(() =>
      validateStructuredAiOutput(
        JSON.stringify({
          scoreBreakdown: {
            keywordMatch: 40,
            clarity: 20,
            evidence: 20,
            formatting: 20,
          },
          issues: [],
          strengths: [],
          missingKeywords: [],
          suggestions: [],
        }),
        aiAnalysisResultSchema,
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "AI_SCHEMA_VALIDATION_FAILED",
      }),
    );
  });

  it("rejects duplicate choices and invalid answer indexes", () => {
    expect(() =>
      validateStructuredAiOutput(
        JSON.stringify({
          questions: [
            {
              questionIndex: 0,
              prompt: "Which answer is valid?",
              choices: ["Same", "same"],
              correctChoiceIndex: 2,
              explanation: "Invalid fixture",
              sourceChunkIndexes: [],
            },
          ],
        }),
        quizGenerationResultSchema,
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "AI_SCHEMA_VALIDATION_FAILED",
      }),
    );
  });

  it("rejects an oversized provider response before parsing", () => {
    expect(() =>
      extractStructuredJson("x".repeat(2_000_001)),
    ).toThrowError(
      expect.objectContaining({
        code: "AI_RESPONSE_TOO_LARGE",
      }),
    );
  });

  it("rejects non-JSON provider output", () => {
    expect(() =>
      extractStructuredJson("not structured output"),
    ).toThrowError(
      expect.objectContaining({
        code: "AI_INVALID_JSON",
      }),
    );
  });
});
