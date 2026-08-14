import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { parseQuestionDetail } from "./interviewContracts";

const sessionId = "507f1f77bcf86cd799439011";
const questionId = "507f1f77bcf86cd799439012";
const timestamp = "2026-08-14T00:00:00.000Z";
let api: typeof import("./interviewApi");

function question(
  type: "coding" | "behavioral",
  starterCode?: string,
) {
  return {
    _id: questionId,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "A typed practice question.",
    questionType: type,
    ...(starterCode === undefined ? {} : { starterCode }),
    isPinned: false,
    explanationKeyPoints: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "starter-code-request-0001",
    },
  });
}

function requestBody(index: number): unknown {
  const call = vi.mocked(fetch).mock.calls[index];
  return JSON.parse(String(call?.[1]?.body));
}

describe("Interview starter code frontend contracts", () => {
  it("parses Coding starter code on detail responses", () => {
    const starterCode = "function solve(input) {\n  // TODO\n}";
    const parsed = parseQuestionDetail(
      { question: question("coding", starterCode) },
      sessionId,
      questionId,
    );

    expect(parsed.starterCode).toBe(starterCode);
  });

  it("rejects starter code on non-Coding detail responses", () => {
    try {
      parseQuestionDetail(
        { question: question("behavioral", "// not valid here") },
        sessionId,
        questionId,
      );
      throw new Error("Expected parser rejection");
    } catch (error) {
      expect(error instanceof ApiError).toBe(true);
      expect((error as ApiError).status).toBe(502);
      expect((error as ApiError).code).toBe("INVALID_INTERVIEW_RESPONSE");
    }
  });
});

describe("Interview starter code API transport", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    vi.stubGlobal("fetch", vi.fn());
    api = await import("./interviewApi");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("trims and sends starter code only for manual Coding questions", async () => {
    const starterCode = "function solve(input) {\n  // TODO\n}";
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ question: question("coding", starterCode) }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({ question: question("behavioral") }, 201),
      );

    await api.addManualQuestion(sessionId, {
      questionType: "coding",
      category: " JavaScript ",
      difficulty: "medium",
      question: " Write a validation function. ",
      starterCode: `  ${starterCode}  `,
      modelAnswer: " Validate inputs first. ",
    });

    await api.addManualQuestion(sessionId, {
      questionType: "behavioral",
      category: " Leadership ",
      difficulty: "medium",
      question: " Describe a difficult decision. ",
      starterCode: " // stale Coding-only value ",
      modelAnswer: " Use truthful evidence. ",
    });

    expect(requestBody(0)).toEqual({
      questionType: "coding",
      category: "JavaScript",
      difficulty: "medium",
      question: "Write a validation function.",
      starterCode,
      modelAnswer: "Validate inputs first.",
    });
    expect(requestBody(1)).toEqual({
      questionType: "behavioral",
      category: "Leadership",
      difficulty: "medium",
      question: "Describe a difficult decision.",
      modelAnswer: "Use truthful evidence.",
    });
  });
});
