import { describe, expect, it } from "vitest";
import * as interviewFeature from "./interviewApi";

const sessionId = "507f1f77bcf86cd799439011";
const questionId = "507f1f77bcf86cd799439012";
const attemptId = "507f1f77bcf86cd799439013";
const jobId = "507f1f77bcf86cd799439014";
const timestamp = "2026-07-25T10:00:00.000Z";

type ContractApi = {
  parseSessionList(value: unknown): unknown;
  parseSessionDetail(value: unknown, expectedId: string): unknown;
  parseCreatedSession(value: unknown): unknown;
  parseQuestionList(value: unknown, expectedSessionId: string): unknown;
  parseQuestionDetail(
    value: unknown,
    expectedSessionId: string,
    expectedQuestionId: string,
  ): unknown;
  parseCreatedQuestion(value: unknown, expectedSessionId: string): unknown;
  parseAttemptList(
    value: unknown,
    expectedSessionId: string,
    expectedQuestionId?: string,
  ): unknown;
  parseAttemptDetail(
    value: unknown,
    expectedSessionId: string,
    expectedAttemptId: string,
    expectedQuestionId?: string,
  ): unknown;
  parseRecordedAttempt(
    value: unknown,
    expectedSessionId: string,
    expectedQuestionId: string,
  ): unknown;
  parseAcceptedInterviewJob(value: unknown, expectedType: string): unknown;
  parseInterviewJob(value: unknown): unknown;
  parseExplanationResponse(
    value: unknown,
    expectedSessionId: string,
    expectedQuestionId: string,
  ): unknown;
  parseFeedbackResponse(
    value: unknown,
    expectedSessionId: string,
    expectedAttemptId: string,
    expectedQuestionId?: string,
  ): unknown;
};

const contracts = interviewFeature as unknown as ContractApi;

function sessionFixture() {
  return {
    _id: sessionId,
    userId: "private-owner",
    title: "Synthetic platform interview",
    targetRole: "Platform Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["Reliability"],
    skillGaps: ["Capacity planning"],
    jobDescription: "Synthetic role context.",
    mode: "written-practice",
    status: "active",
    questionCount: 1,
    sourceResumeId: "507f1f77bcf86cd799439099",
    sourceResumeVersionId: "507f1f77bcf86cd799439098",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionFixture() {
  return {
    _id: questionId,
    userId: "private-owner",
    sessionId,
    source: "manual",
    category: "System design",
    difficulty: "medium",
    question: "How would you design a reliable queue?",
    questionFingerprint: "private-fingerprint",
    isPinned: false,
    userNotes: "Review back-pressure.",
    modelAnswer: "Discuss durability and delivery semantics.",
    explanation: "Start from reliability requirements.",
    explanationKeyPoints: ["Delivery guarantees"],
    provider: "private-provider",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function attemptFixture() {
  return {
    _id: attemptId,
    userId: "private-owner",
    sessionId,
    questionId,
    answerText: "I would begin with delivery guarantees.",
    status: "feedback-completed",
    feedbackJobId: jobId,
    feedback: {
      score: 78,
      summary: "Clear structure with room for more evidence.",
      strengths: ["Clear opening"],
      improvements: ["Add failure-mode examples"],
      suggestedAnswerOutline: ["Requirements", "Trade-offs"],
      promptVersion: "private-prompt",
      provider: "private-provider",
      model: "private-model",
      completedAt: timestamp,
    },
    feedbackError: {
      code: "PRIVATE_INTERNAL_CODE",
      message: "Private internal message.",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("interview response contracts", () => {
  it("allowlists session summaries, details, create results, and pagination", () => {
    const list = contracts.parseSessionList({
      sessions: [sessionFixture()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      internal: "discard",
    }) as {
      sessions: Array<Record<string, unknown>>;
      pagination: Record<string, unknown>;
    };

    expect(list.sessions[0]).not.toHaveProperty("userId");
    expect(list.sessions[0]).not.toHaveProperty("jobDescription");
    expect(list.sessions[0]).not.toHaveProperty("sourceResumeId");
    expect(list.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    });

    const detail = contracts.parseSessionDetail(
      { session: sessionFixture() },
      sessionId,
    ) as Record<string, unknown>;
    expect(detail).toMatchObject({
      id: sessionId,
      jobDescription: "Synthetic role context.",
    });
    expect(detail).not.toHaveProperty("userId");
    expect(detail).not.toHaveProperty("sourceResumeId");

    const created = contracts.parseCreatedSession({
      session: sessionFixture(),
      questions: [questionFixture()],
    }) as {
      session: Record<string, unknown>;
      questions: Array<Record<string, unknown>>;
    };
    expect(created.session.id).toBe(sessionId);
    expect(created.questions[0]).not.toHaveProperty("questionFingerprint");
    expect(created.questions[0]).not.toHaveProperty("modelAnswer");
  });

  it("rejects malformed pagination and route-selected session identity", () => {
    expect(() =>
      contracts.parseSessionList({
        sessions: [],
        pagination: { page: 1, limit: 20, total: 1, pages: 0 },
      }),
    ).toThrowError(/invalid interview response/i);

    expect(() =>
      contracts.parseSessionDetail(
        { session: sessionFixture() },
        "507f1f77bcf86cd799439099",
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("allowlists question summaries and details while enforcing nested identity", () => {
    const list = contracts.parseQuestionList(
      {
        questions: [questionFixture()],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      },
      sessionId,
    ) as { questions: Array<Record<string, unknown>> };

    expect(list.questions[0]).toMatchObject({
      id: questionId,
      sessionId,
      question: "How would you design a reliable queue?",
    });
    expect(list.questions[0]).not.toHaveProperty("modelAnswer");
    expect(list.questions[0]).not.toHaveProperty("explanation");
    expect(list.questions[0]).not.toHaveProperty("questionFingerprint");

    const detail = contracts.parseQuestionDetail(
      { question: questionFixture() },
      sessionId,
      questionId,
    ) as Record<string, unknown>;
    expect(detail).toMatchObject({
      modelAnswer: "Discuss durability and delivery semantics.",
      explanationKeyPoints: ["Delivery guarantees"],
    });
    expect(detail).not.toHaveProperty("provider");

    const created = contracts.parseCreatedQuestion(
      { question: questionFixture() },
      sessionId,
    ) as Record<string, unknown>;
    expect(created).toMatchObject({ id: questionId, sessionId });

    expect(() =>
      contracts.parseQuestionDetail(
        {
          question: {
            ...questionFixture(),
            sessionId: "507f1f77bcf86cd799439099",
          },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("allowlists attempts and stored feedback without provider metadata", () => {
    const list = contracts.parseAttemptList(
      {
        attempts: [attemptFixture()],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      },
      sessionId,
    ) as { attempts: Array<Record<string, unknown>> };
    const attempt = list.attempts[0];
    const feedback = attempt.feedback as Record<string, unknown>;

    expect(attempt).toMatchObject({
      id: attemptId,
      sessionId,
      questionId,
    });
    expect(attempt).not.toHaveProperty("userId");
    expect(attempt).not.toHaveProperty("feedbackJobId");
    expect(attempt).not.toHaveProperty("feedbackError");
    expect(feedback).toMatchObject({
      score: 78,
      summary: "Clear structure with room for more evidence.",
    });
    expect(feedback).not.toHaveProperty("provider");
    expect(feedback).not.toHaveProperty("model");
    expect(feedback).not.toHaveProperty("promptVersion");

    const recorded = contracts.parseRecordedAttempt(
      { attempt: attemptFixture() },
      sessionId,
      questionId,
    ) as Record<string, unknown>;
    expect(recorded).toMatchObject({ id: attemptId, sessionId });

    expect(() =>
      contracts.parseAttemptDetail(
        {
          attempt: {
            ...attemptFixture(),
            feedback: { ...attemptFixture().feedback, score: 101 },
          },
        },
        sessionId,
        attemptId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("validates accepted jobs and strips raw job errors, payloads, and stacks", () => {
    const accepted = contracts.parseAcceptedInterviewJob(
      {
        job: {
          id: jobId,
          type: "interview.questions.generate",
          status: "queued",
          payload: { private: true },
        },
      },
      "interview.questions.generate",
    ) as Record<string, unknown>;
    expect(accepted).toEqual({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });

    const failed = contracts.parseInterviewJob({
      job: {
        id: jobId,
        type: "interview.question.explain",
        status: "failed",
        progress: 45,
        attempts: 3,
        maxAttempts: 3,
        result: { private: true },
        error: {
          code: "AI_UNAVAILABLE",
          message: "Explanation could not be completed.",
          stack: "private stack",
        },
        payload: { privateQuestion: "do not retain" },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }) as Record<string, unknown>;

    expect(failed.error).toEqual({
      code: "AI_UNAVAILABLE",
      message: "Explanation could not be completed.",
    });
    expect(failed).not.toHaveProperty("payload");
    expect(failed).not.toHaveProperty("result");
    expect(failed.error).not.toHaveProperty("stack");
    expect(() =>
      contracts.parseInterviewJob({
        job: {
          ...failed,
          status: "paused",
        },
      }),
    ).toThrowError(/invalid interview response/i);
  });

  it("validates completed job result identity for every interview job type", () => {
    expect(
      contracts.parseInterviewJob({
        job: {
          id: jobId,
          type: "interview.questions.generate",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: {
            insertedCount: 1,
            duplicateCount: 0,
            questionIds: [questionId],
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      }),
    ).toMatchObject({
      result: {
        kind: "generation",
        questionIds: [questionId],
      },
    });

    expect(() =>
      contracts.parseInterviewJob({
        job: {
          id: jobId,
          type: "interview.question.explain",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: {
            questionId: "507f1f77bcf86cd799439099",
            explanationReady: true,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      }),
    ).not.toThrow();
  });

  it("handles already-available and queued explanation and feedback responses", () => {
    expect(
      contracts.parseExplanationResponse(
        {
          question: questionFixture(),
          alreadyAvailable: true,
        },
        sessionId,
        questionId,
      ),
    ).toMatchObject({ kind: "available" });

    expect(
      contracts.parseExplanationResponse(
        {
          job: {
            id: jobId,
            type: "interview.question.explain",
            status: "queued",
          },
        },
        sessionId,
        questionId,
      ),
    ).toMatchObject({ kind: "queued" });

    expect(
      contracts.parseFeedbackResponse(
        {
          attempt: attemptFixture(),
          alreadyAvailable: true,
        },
        sessionId,
        attemptId,
        questionId,
      ),
    ).toMatchObject({ kind: "available" });

    expect(
      contracts.parseFeedbackResponse(
        {
          attemptId,
          job: {
            id: jobId,
            type: "interview.attempt.feedback",
            status: "queued",
          },
        },
        sessionId,
        attemptId,
        questionId,
      ),
    ).toMatchObject({ kind: "queued" });
  });

  it("rejects a recorded attempt bound to the wrong session", () => {
    expect(() =>
      contracts.parseRecordedAttempt(
        {
          attempt: {
            ...attemptFixture(),
            sessionId: "507f1f77bcf86cd799439099",
          },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects a recorded attempt bound to the wrong question", () => {
    expect(() =>
      contracts.parseRecordedAttempt(
        {
          attempt: {
            ...attemptFixture(),
            questionId: "507f1f77bcf86cd799439099",
          },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects attempts outside a filtered question history", () => {
    expect(() =>
      contracts.parseAttemptList(
        {
          attempts: [
            {
              ...attemptFixture(),
              questionId: "507f1f77bcf86cd799439099",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
        sessionId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects an attempt list entry bound to the wrong session", () => {
    expect(() =>
      contracts.parseAttemptList(
        {
          attempts: [
            {
              ...attemptFixture(),
              sessionId: "507f1f77bcf86cd799439099",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
        sessionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects attempt details bound to the wrong attempt or question", () => {
    expect(() =>
      contracts.parseAttemptDetail(
        { attempt: attemptFixture() },
        sessionId,
        "507f1f77bcf86cd799439099",
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);

    expect(() =>
      contracts.parseAttemptDetail(
        {
          attempt: {
            ...attemptFixture(),
            questionId: "507f1f77bcf86cd799439099",
          },
        },
        sessionId,
        attemptId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects already-available feedback for the wrong question", () => {
    expect(() =>
      contracts.parseFeedbackResponse(
        {
          attempt: {
            ...attemptFixture(),
            questionId: "507f1f77bcf86cd799439099",
          },
          alreadyAvailable: true,
        },
        sessionId,
        attemptId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });

  it("rejects a queued feedback response bound to the wrong attempt", () => {
    expect(() =>
      contracts.parseFeedbackResponse(
        {
          attemptId: "507f1f77bcf86cd799439099",
          job: {
            id: jobId,
            type: "interview.attempt.feedback",
            status: "queued",
          },
        },
        sessionId,
        attemptId,
        questionId,
      ),
    ).toThrowError(/invalid interview response/i);
  });
});
