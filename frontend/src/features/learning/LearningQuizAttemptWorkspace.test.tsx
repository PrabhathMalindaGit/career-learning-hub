import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as learningApi from "./learningApi";
import { LearningQuizAttemptWorkspace } from "./LearningQuizAttemptWorkspace";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "account-a", email: "account-a@example.test" },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchLearningDocument: vi.fn(),
  fetchQuizAttemptReview: vi.fn(),
  fetchQuizForTaking: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const quizId = "507f1f77bcf86cd799439012";
const attemptId = "507f1f77bcf86cd799439013";
const createdAt = "2026-07-26T01:00:00.000Z";

function renderReview() {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId",
        element: <LearningQuizAttemptWorkspace />,
      },
    ],
    {
      initialEntries: [
        `/learning/documents/${documentId}/quizzes/${quizId}/attempts/${attemptId}`,
      ],
    },
  );
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: {
      id: documentId,
      title: "Synthetic architecture notes",
      originalFilename: "synthetic.pdf",
      mimeType: "application/pdf",
      status: "ready",
      pageCount: 3,
      chunkCount: 1,
      summaryKeyPoints: [],
      createdAt,
      updatedAt: createdAt,
    },
  });
  vi.mocked(learningApi.fetchQuizForTaking).mockResolvedValue({
    id: quizId,
    documentId,
    title: "Architecture boundaries",
    status: "ready",
    questionCount: 2,
    createdAt,
    updatedAt: createdAt,
    questions: [
      {
        questionIndex: 0,
        prompt: "Question one",
        choices: ["Selected correct", "Other"],
        sourcePages: [1],
      },
      {
        questionIndex: 1,
        prompt: "Question two",
        choices: ["Selected wrong", "Canonical correct"],
        sourcePages: [2],
      },
    ],
  });
  vi.mocked(learningApi.fetchQuizAttemptReview).mockResolvedValue({
    attempt: {
      id: attemptId,
      documentId,
      quizId,
      correctCount: 1,
      questionCount: 2,
      scorePercent: 50,
      completedAt: createdAt,
      createdAt,
    },
    review: [
      {
        questionIndex: 0,
        prompt: "Question one",
        choices: ["Selected correct", "Other"],
        selectedChoiceIndex: 0,
        correctChoiceIndex: 0,
        correct: true,
        explanation: "Canonical explanation one.",
        sourcePages: [1],
      },
      {
        questionIndex: 1,
        prompt: "Question two",
        choices: ["Selected wrong", "Canonical correct"],
        selectedChoiceIndex: 0,
        correctChoiceIndex: 1,
        correct: false,
        explanation: "<strong>Canonical explanation two.</strong>",
        sourcePages: [2],
      },
    ],
  });
});

describe("Learning quiz attempt workspace", () => {
  it("shows canonical score and immutable selected-versus-correct review", async () => {
    renderReview();

    expect(screen.getByText("Loading attempt review…")).not.toBeNull();
    expect(
      await screen.findByRole("heading", {
        name: "Architecture boundaries",
      }),
    ).not.toBeNull();
    expect(screen.getByText("1 of 2 correct")).not.toBeNull();
    expect(screen.getByText("50%")).not.toBeNull();
    expect(screen.getByText("Correct")).not.toBeNull();
    expect(screen.getByText("Incorrect")).not.toBeNull();
    expect(screen.getByText("Your answer: Selected wrong")).not.toBeNull();
    expect(
      screen.getByText("Correct answer: Canonical correct"),
    ).not.toBeNull();
    expect(
      screen.getByText("<strong>Canonical explanation two.</strong>"),
    ).not.toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: /save|edit|delete/i })).toBeNull();
  });

  it("keeps missing and foreign attempts safely indistinguishable", async () => {
    vi.mocked(learningApi.fetchQuizAttemptReview).mockRejectedValue(
      new ApiError(
        404,
        "QUIZ_ATTEMPT_NOT_FOUND",
        "Quiz attempt not found.",
        "request-attempt-missing-0001",
      ),
    );
    renderReview();

    expect(
      await screen.findByRole("heading", {
        name: "Quiz attempt not found",
      }),
    ).not.toBeNull();
    expect(screen.queryByText(attemptId)).toBeNull();
  });

  it("renders only canonical source-page controls and a fresh-attempt action", async () => {
    renderReview();

    expect(
      await screen.findByRole("link", { name: "Review source page 1" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Take quiz again" }).getAttribute("href"),
    ).toBe(`/learning/documents/${documentId}/quizzes/${quizId}`);
  });

  it("rejects a completed attempt that does not match the canonical quiz count", async () => {
    vi.mocked(learningApi.fetchQuizAttemptReview).mockResolvedValue({
      attempt: {
        id: attemptId,
        documentId,
        quizId,
        correctCount: 1,
        questionCount: 1,
        scorePercent: 100,
        completedAt: createdAt,
        createdAt,
      },
      review: [
        {
          questionIndex: 0,
          prompt: "Question one",
          choices: ["Selected correct", "Other"],
          selectedChoiceIndex: 0,
          correctChoiceIndex: 0,
          correct: true,
          explanation: "Canonical explanation one.",
          sourcePages: [1],
        },
      ],
    });
    renderReview();

    expect(
      await screen.findByRole("heading", {
        name: "Attempt response unavailable",
      }),
    ).not.toBeNull();
    expect(screen.queryByText("100%")).toBeNull();
  });
});
