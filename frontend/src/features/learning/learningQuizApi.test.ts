import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../../api/apiClient";
import {
  createQuizGeneration,
  fetchLearningQuizJob,
  fetchQuizAttemptReview,
  fetchQuizForTaking,
  listQuizAttempts,
  listQuizzes,
  submitQuizAttempt,
} from "./learningApi";

vi.mock("../../api/apiClient", async () => {
  const actual = await vi.importActual<typeof apiClient>(
    "../../api/apiClient",
  );
  return {
    ...actual,
    requestWithMetadata: vi.fn(),
    requestWithStatusMetadata: vi.fn(),
  };
});

const documentId = "507f1f77bcf86cd799439011";
const quizId = "507f1f77bcf86cd799439012";
const jobId = "507f1f77bcf86cd799439013";
const attemptId = "507f1f77bcf86cd799439014";
const userId = "507f1f77bcf86cd799439015";
const questionId = "507f1f77bcf86cd799439016";
const requestId = "3159bf41-e3ac-409c-bad4-a77981000d52";
const createdAt = "2026-07-26T01:00:00.000Z";

const takingQuestion = {
  questionIndex: 0,
  prompt: "Which boundary is canonical?",
  choices: ["The server boundary", "A browser guess"],
  sourcePages: [1],
};

function quizSummary() {
  return {
    _id: quizId,
    documentId,
    title: "Synthetic architecture quiz",
    status: "ready",
    questionCount: 1,
    createdAt,
    updatedAt: createdAt,
  };
}

function attempt() {
  return {
    _id: attemptId,
    userId,
    documentId,
    quizId,
    answers: [
      {
        questionId,
        questionIndex: 0,
        selectedChoiceIndex: 0,
        correct: true,
      },
    ],
    correctCount: 1,
    questionCount: 1,
    scorePercent: 100,
    completedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Learning quiz API", () => {
  it("creates a quiz with one generation intent and no user identity", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 202,
      data: {
        quizId,
        job: {
          id: jobId,
          type: "learning.quiz.generate",
          status: "queued",
        },
      },
      requestId: "request-quiz-create-0001",
    });

    const result = await createQuizGeneration(documentId, {
      title: "Synthetic architecture quiz",
      questionCount: 5,
      focus: "Boundaries",
      requestId,
    });

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      `/learning-documents/${documentId}/quizzes`,
      expect.objectContaining({
        method: "POST",
        authentication: "required",
        body: {
          title: "Synthetic architecture quiz",
          questionCount: 5,
          focus: "Boundaries",
          requestId,
        },
      }),
    );
    expect(
      vi.mocked(apiClient.requestWithStatusMetadata).mock.calls[0]?.[1]?.body,
    ).not.toHaveProperty("userId");
    expect(result.requestId).toBe("request-quiz-create-0001");
  });

  it("requires canonical HTTP status for generation and submission", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {},
    });
    await expect(
      createQuizGeneration(documentId, {
        title: "Quiz",
        questionCount: 1,
        requestId,
      }),
    ).rejects.toMatchObject({ code: "INVALID_LEARNING_RESPONSE" });

    await expect(
      submitQuizAttempt(
        documentId,
        quizId,
        [takingQuestion],
        [{ questionIndex: 0, selectedChoiceIndex: 0 }],
        3,
      ),
    ).rejects.toMatchObject({ code: "INVALID_LEARNING_RESPONSE" });
  });

  it("lists and fetches exact safe quiz identities", async () => {
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({
        data: {
          quizzes: [quizSummary()],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
        requestId: "request-quiz-list-0001",
      })
      .mockResolvedValueOnce({
        data: {
          quiz: quizSummary(),
          questions: [takingQuestion],
        },
      });

    const listed = await listQuizzes(documentId, { page: 1, limit: 10 });
    const taking = await fetchQuizForTaking(
      documentId,
      quizId,
      3,
    );

    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      1,
      `/quizzes?documentId=${documentId}&page=1&limit=10`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      2,
      `/quizzes/${quizId}`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(listed.requestId).toBe("request-quiz-list-0001");
    expect(taking.questions[0]).not.toHaveProperty("correctChoiceIndex");
    expect(taking.questions[0]).not.toHaveProperty("explanation");
  });

  it("polls only the exact quiz-generation job and result", async () => {
    vi.mocked(apiClient.requestWithMetadata).mockResolvedValue({
      data: {
        job: {
          id: jobId,
          type: "learning.quiz.generate",
          status: "completed",
          progress: 100,
          attempts: 1,
          maxAttempts: 3,
          result: { quizId, questionCount: 1 },
          createdAt,
          updatedAt: createdAt,
        },
      },
    });

    const job = await fetchLearningQuizJob(jobId, quizId);
    expect(job.result?.quizId).toBe(quizId);
    expect(apiClient.requestWithMetadata).toHaveBeenCalledWith(
      `/jobs/${jobId}`,
      expect.objectContaining({ authentication: "required" }),
    );
  });

  it("submits answers without score, keys, correctness, userId, or idempotency", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 201,
      data: {
        attempt: attempt(),
        review: [
          {
            questionIndex: 0,
            selectedChoiceIndex: 0,
            correctChoiceIndex: 0,
            correct: true,
            explanation: "The server owns canonical scoring.",
            sourcePages: [1],
          },
        ],
      },
      requestId: "request-quiz-submit-0001",
    });

    const result = await submitQuizAttempt(
      documentId,
      quizId,
      [takingQuestion],
      [{ questionIndex: 0, selectedChoiceIndex: 0 }],
      3,
    );
    const body = vi.mocked(
      apiClient.requestWithStatusMetadata,
    ).mock.calls[0]?.[1]?.body;

    expect(body).toEqual({
      answers: [{ questionIndex: 0, selectedChoiceIndex: 0 }],
    });
    expect(body).not.toHaveProperty("score");
    expect(body).not.toHaveProperty("correct");
    expect(body).not.toHaveProperty("answerKey");
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("requestId");
    expect(result.attempt.scorePercent).toBe(100);
  });

  it("loads paginated immutable history and exact owned review", async () => {
    const summary = {
      _id: attemptId,
      documentId,
      quizId,
      correctCount: 1,
      questionCount: 1,
      scorePercent: 100,
      completedAt: createdAt,
      createdAt,
    };
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({
        data: {
          attempts: [summary],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          attempt: attempt(),
          review: [
            {
              ...takingQuestion,
              selectedChoiceIndex: 0,
              correctChoiceIndex: 0,
              correct: true,
              explanation: "The server owns canonical scoring.",
            },
          ],
        },
      });

    const history = await listQuizAttempts(
      documentId,
      quizId,
      { page: 1, limit: 10 },
    );
    const review = await fetchQuizAttemptReview(
      documentId,
      quizId,
      attemptId,
      3,
    );

    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      1,
      `/quizzes/${quizId}/attempts?page=1&limit=10`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      2,
      `/quizzes/${quizId}/attempts/${attemptId}`,
      expect.objectContaining({ authentication: "required" }),
    );
    expect(history.attempts[0]?.id).toBe(attemptId);
    expect(review.review[0]?.explanation).toBe(
      "The server owns canonical scoring.",
    );
  });
});
