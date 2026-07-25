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
const timestamp = "2026-07-25T10:00:00.000Z";

type InterviewApi = {
  listInterviewSessions(input?: unknown, signal?: AbortSignal): Promise<unknown>;
  createInterviewSession(input: unknown, signal?: AbortSignal): Promise<unknown>;
  fetchInterviewSession(id: string, signal?: AbortSignal): Promise<unknown>;
  updateInterviewSessionStatus(
    id: string,
    status: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  listInterviewQuestions(
    id: string,
    input?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown>;
  addManualQuestion(
    id: string,
    input: unknown,
    signal?: AbortSignal,
  ): Promise<unknown>;
  generateInterviewQuestions(
    id: string,
    input: unknown,
    signal?: AbortSignal,
  ): Promise<unknown>;
  fetchInterviewQuestion(
    id: string,
    question: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  setQuestionPinned(
    id: string,
    question: string,
    pinned: boolean,
    signal?: AbortSignal,
  ): Promise<unknown>;
  saveQuestionNotes(
    id: string,
    question: string,
    notes: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  requestQuestionExplanation(
    id: string,
    question: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  recordInterviewAttempt(
    id: string,
    question: string,
    answer: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  listAttemptHistory(
    id: string,
    input?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown>;
  fetchInterviewAttempt(
    id: string,
    attempt: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  requestAttemptFeedback(
    id: string,
    attempt: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
  fetchInterviewJob(id: string, signal?: AbortSignal): Promise<unknown>;
};

let api: InterviewApi;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "interview-request-id-0001",
    },
  });
}

function session() {
  return {
    _id: sessionId,
    title: "Synthetic interview",
    targetRole: "Platform Engineer",
    experienceLevel: "Mid-level",
    focusTopics: [],
    skillGaps: [],
    mode: "study",
    status: "active",
    questionCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function question() {
  return {
    _id: questionId,
    sessionId,
    source: "manual",
    category: "System design",
    difficulty: "medium",
    question: "How would you design a reliable queue?",
    isPinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function attempt() {
  return {
    _id: attemptId,
    sessionId,
    questionId,
    answerText: "Start from delivery requirements.",
    status: "recorded",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function requestAt(index = 0): [string, RequestInit] {
  const call = vi.mocked(fetch).mock.calls[index];
  return [String(call?.[0]), call?.[1] ?? {}];
}

describe("interviewApi", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    vi.stubGlobal("fetch", vi.fn());
    api = (await import("./interviewApi")) as unknown as InterviewApi;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lists sessions with bounded pagination, supported status, signal, and no user ID", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        sessions: [session()],
        pagination: { page: 1, limit: 100, total: 1, pages: 1 },
      }),
    );
    const controller = new AbortController();

    await api.listInterviewSessions(
      { page: -2, limit: 500, status: "active" },
      controller.signal,
    );

    expect(requestAt()[0]).toBe(
      "https://api.example.test/api/v1/interview-sessions?page=1&limit=100&status=active",
    );
    expect(requestAt()[0]).not.toContain("userId");
    expect(requestAt()[1].signal).toBe(controller.signal);
  });

  it("creates a session with canonical fields and omits empty optionals and ownership", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ session: session(), questions: [] }, 201),
    );

    await api.createInterviewSession({
      title: "  Synthetic interview  ",
      targetRole: " Platform Engineer ",
      experienceLevel: " Mid-level ",
      focusTopics: [" Reliability ", ""],
      skillGaps: [" Capacity planning "],
      jobDescription: "  ",
      mode: "written-practice",
      userId: "must-not-send",
      company: "must-not-send",
    });

    expect(requestAt()[0]).toBe(
      "https://api.example.test/api/v1/interview-sessions",
    );
    expect(requestAt()[1].method).toBe("POST");
    expect(JSON.parse(String(requestAt()[1].body))).toEqual({
      title: "Synthetic interview",
      targetRole: "Platform Engineer",
      experienceLevel: "Mid-level",
      focusTopics: ["Reliability"],
      skillGaps: ["Capacity planning"],
      mode: "written-practice",
      manualQuestions: [],
    });
  });

  it("uses exact session detail and approved status mutation contracts", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ session: session() }))
      .mockResolvedValueOnce(
        jsonResponse({
          session: { ...session(), status: "completed" },
        }),
      );

    await api.fetchInterviewSession(sessionId);
    await api.updateInterviewSessionStatus(sessionId, "completed");

    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}`,
    );
    expect(requestAt(1)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}/status`,
    );
    expect(requestAt(1)[1].method).toBe("PATCH");
    expect(JSON.parse(String(requestAt(1)[1].body))).toEqual({
      status: "completed",
    });
  });

  it("serializes question filters and sends exact manual and generation bodies", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          questions: [question()],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ question: question() }, 201))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            job: {
              id: jobId,
              type: "interview.questions.generate",
              status: "queued",
            },
          },
          202,
        ),
      );

    await api.listInterviewQuestions(sessionId, {
      page: 0,
      limit: 500,
      pinned: false,
      difficulty: "hard",
      category: " System design ",
    });
    await api.addManualQuestion(sessionId, {
      category: " System design ",
      difficulty: "medium",
      question: " How would you design a reliable queue? ",
      modelAnswer: " ",
      userId: "must-not-send",
    });
    await api.generateInterviewQuestions(sessionId, {
      requestId,
      count: 10,
      categories: [" System design ", ""],
      difficultyMix: { easy: 10, medium: 0, hard: 0 },
      userId: "must-not-send",
    });

    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}/questions?page=1&limit=100&pinned=false&difficulty=hard&category=System+design`,
    );
    expect(JSON.parse(String(requestAt(1)[1].body))).toEqual({
      category: "System design",
      difficulty: "medium",
      question: "How would you design a reliable queue?",
    });
    expect(JSON.parse(String(requestAt(2)[1].body))).toEqual({
      requestId,
      count: 10,
      categories: ["System design"],
    });
  });

  it("loads and mutates one bound question with exact routes and bodies", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ question: question() }))
      .mockResolvedValueOnce(
        jsonResponse({ question: { ...question(), isPinned: true } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ question: { ...question(), userNotes: "" } }),
      );

    await api.fetchInterviewQuestion(sessionId, questionId);
    await api.setQuestionPinned(sessionId, questionId, true);
    await api.saveQuestionNotes(sessionId, questionId, "");

    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}/questions/${questionId}`,
    );
    expect(JSON.parse(String(requestAt(1)[1].body))).toEqual({
      isPinned: true,
    });
    expect(JSON.parse(String(requestAt(2)[1].body))).toEqual({
      notes: "",
    });
  });

  it("uses explicit bodyless explanation and feedback requests", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            job: {
              id: jobId,
              type: "interview.question.explain",
              status: "queued",
            },
          },
          202,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            attemptId,
            job: {
              id: jobId,
              type: "interview.attempt.feedback",
              status: "queued",
            },
          },
          202,
        ),
      );

    await api.requestQuestionExplanation(sessionId, questionId);
    await api.requestAttemptFeedback(sessionId, attemptId);

    expect(requestAt(0)[1].method).toBe("POST");
    expect(requestAt(0)[1].body).toBeUndefined();
    expect(requestAt(1)[1].method).toBe("POST");
    expect(requestAt(1)[1].body).toBeUndefined();
  });

  it("records and reads immutable attempts with bounded filters and identity", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ attempt: attempt() }, 201))
      .mockResolvedValueOnce(
        jsonResponse({
          attempts: [attempt()],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ attempt: attempt() }));

    await api.recordInterviewAttempt(
      sessionId,
      questionId,
      "  Start from delivery requirements.  ",
    );
    await api.listAttemptHistory(sessionId, {
      page: 0,
      limit: 500,
      questionId,
      status: "recorded",
    });
    await api.fetchInterviewAttempt(sessionId, attemptId);

    expect(JSON.parse(String(requestAt(0)[1].body))).toEqual({
      answerText: "Start from delivery requirements.",
    });
    expect(requestAt(1)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}/attempts?page=1&limit=100&questionId=${questionId}&status=recorded`,
    );
    expect(requestAt(2)[0]).toBe(
      `https://api.example.test/api/v1/interview-sessions/${sessionId}/attempts/${attemptId}`,
    );
  });

  it("polls one owned job and rejects malformed successful DTOs", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          job: {
            id: jobId,
            type: "interview.questions.generate",
            status: "queued",
            progress: 0,
            attempts: 0,
            maxAttempts: 3,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          sessions: [{ ...session(), _id: "bad" }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        }),
      );

    await api.fetchInterviewJob(jobId);
    await expect(api.listInterviewSessions()).rejects.toMatchObject({
      code: "INVALID_INTERVIEW_RESPONSE",
    });
    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/jobs/${jobId}`,
    );
  });
});
