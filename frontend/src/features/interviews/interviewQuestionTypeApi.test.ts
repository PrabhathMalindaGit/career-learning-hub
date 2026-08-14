import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const sessionId = "507f1f77bcf86cd799439011";
const questionId = "507f1f77bcf86cd799439012";
const attemptId = "507f1f77bcf86cd799439013";
const jobId = "507f1f77bcf86cd799439014";
const requestId = "123e4567-e89b-42d3-a456-426614174000";
const timestamp = "2026-08-13T00:00:00.000Z";

let api: typeof import("./interviewApi");

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "task6-request-id-0001",
    },
  });
}

function acceptedGenerationJob() {
  return jsonResponse(
    {
      job: {
        id: jobId,
        type: "interview.questions.generate",
        status: "queued",
      },
    },
    202,
  );
}

function question(
  questionType:
    | "multiple-choice"
    | "behavioral",
) {
  return {
    _id: questionId,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "A typed practice question.",
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

function requestBody(index: number): unknown {
  const call = vi.mocked(fetch).mock.calls[index];
  return JSON.parse(String(call?.[1]?.body));
}

describe("Interview question-type API requests", () => {
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

  it("sends single, balanced mixed, and explicit-count generation bodies exactly", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(acceptedGenerationJob())
      .mockResolvedValueOnce(acceptedGenerationJob())
      .mockResolvedValueOnce(acceptedGenerationJob());

    await api.generateInterviewQuestions(sessionId, {
      requestId,
      count: 3,
      categories: [" JavaScript "],
      questionTypes: ["short-answer"],
    });
    await api.generateInterviewQuestions(sessionId, {
      requestId,
      count: 4,
      categories: [" APIs "],
      questionTypes: ["behavioral", "technical-explanation"],
    });
    await api.generateInterviewQuestions(sessionId, {
      requestId,
      count: 5,
      categories: [" Systems "],
      questionTypes: ["coding", "scenario-based"],
      typeCounts: {
        coding: 2,
        "scenario-based": 3,
      },
    });

    expect(requestBody(0)).toEqual({
      requestId,
      count: 3,
      categories: ["JavaScript"],
      questionTypes: ["short-answer"],
    });
    expect(requestBody(1)).toEqual({
      requestId,
      count: 4,
      categories: ["APIs"],
      questionTypes: ["behavioral", "technical-explanation"],
    });
    expect(requestBody(2)).toEqual({
      requestId,
      count: 5,
      categories: ["Systems"],
      questionTypes: ["coding", "scenario-based"],
      typeCounts: {
        coding: 2,
        "scenario-based": 3,
      },
    });
  });

  it("sends canonical manual MCQ and typed text question bodies", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ question: question("multiple-choice") }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({ question: question("behavioral") }, 201),
      );

    await api.addManualQuestion(sessionId, {
      questionType: "multiple-choice",
      category: " JavaScript ",
      difficulty: "medium",
      question: " Which statement is correct? ",
      multipleChoice: {
        options: [" First option ", " Second option "],
        correctOptionIndex: 1,
      },
    });
    await api.addManualQuestion(sessionId, {
      questionType: "behavioral",
      category: " Leadership ",
      difficulty: "medium",
      question: " Describe a difficult decision. ",
      modelAnswer: " Use truthful evidence. ",
    });

    expect(requestBody(0)).toEqual({
      questionType: "multiple-choice",
      category: "JavaScript",
      difficulty: "medium",
      question: "Which statement is correct?",
      multipleChoice: {
        options: ["First option", "Second option"],
        correctOptionIndex: 1,
      },
    });
    expect(requestBody(1)).toEqual({
      questionType: "behavioral",
      category: "Leadership",
      difficulty: "medium",
      question: "Describe a difficult decision.",
      modelAnswer: "Use truthful evidence.",
    });
  });

  it("sends legacy, modern typed text, and MCQ attempt bodies exactly", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            attempt: {
              _id: attemptId,
              sessionId,
              questionId,
              answerText: "Historical answer.",
              status: "recorded",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            attempt: {
              _id: attemptId,
              sessionId,
              questionId,
              answer: {
                type: "behavioral",
                text: "Structured response.",
              },
              status: "recorded",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            attempt: {
              _id: attemptId,
              sessionId,
              questionId,
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
              status: "recorded",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          201,
        ),
      );

    await api.recordInterviewAttempt(sessionId, questionId, {
      answerText: "  Historical answer.  ",
    });
    await api.recordInterviewAttempt(sessionId, questionId, {
      answer: {
        type: "behavioral",
        text: "  Structured response.  ",
      },
    });
    await api.recordInterviewAttempt(sessionId, questionId, {
      answer: {
        type: "multiple-choice",
        selectedOptionId: " option-a ",
      },
    });

    expect(requestBody(0)).toEqual({
      answerText: "Historical answer.",
    });
    expect(requestBody(1)).toEqual({
      answer: {
        type: "behavioral",
        text: "Structured response.",
      },
    });
    expect(requestBody(2)).toEqual({
      answer: {
        type: "multiple-choice",
        selectedOptionId: "option-a",
      },
    });
  });
});
