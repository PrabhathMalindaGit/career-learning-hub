import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as learningApi from "./learningApi";
import { LearningQuizWorkspace } from "./LearningQuizWorkspace";
import type {
  LearningDocument,
  QuizAttemptSummary,
  QuizForTaking,
} from "./types";

let accountId = "account-a";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: accountId, email: `${accountId}@example.test` },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchLearningDocument: vi.fn(),
  fetchQuizForTaking: vi.fn(),
  listQuizAttempts: vi.fn(),
  submitQuizAttempt: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const quizId = "507f1f77bcf86cd799439012";
const attemptId = "507f1f77bcf86cd799439013";
const createdAt = "2026-07-26T01:00:00.000Z";

const documentRecord: LearningDocument = {
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
};

const quiz: QuizForTaking = {
  id: quizId,
  documentId,
  title: "Architecture boundaries",
  status: "ready",
  questionCount: 1,
  createdAt,
  updatedAt: createdAt,
  questions: [
    {
      questionIndex: 0,
      prompt: "Which boundary is canonical?",
      choices: ["The server boundary", "A browser guess"],
      sourcePages: [1],
    },
  ],
};

function historyAttempt(id = attemptId): QuizAttemptSummary {
  return {
    id,
    documentId,
    quizId,
    correctCount: 1,
    questionCount: 1,
    scorePercent: 100,
    completedAt: createdAt,
    createdAt,
  };
}

function renderWorkspace() {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId/quizzes/:quizId",
        element: <LearningQuizWorkspace />,
      },
      {
        path: "/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId",
        element: <h1>Attempt review route</h1>,
      },
    ],
    {
      initialEntries: [
        `/learning/documents/${documentId}/quizzes/${quizId}`,
      ],
    },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, view };
}

beforeEach(() => {
  accountId = "account-a";
  vi.clearAllMocks();
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: documentRecord,
  });
  vi.mocked(learningApi.fetchQuizForTaking).mockResolvedValue(quiz);
  vi.mocked(learningApi.listQuizAttempts).mockResolvedValue({
    attempts: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
});

describe("Learning quiz workspace", () => {
  it("loads exact document, safe-taking detail, and empty attempt history", async () => {
    renderWorkspace();

    expect(screen.getByText("Loading quiz workspace…")).not.toBeNull();
    expect(
      await screen.findByRole("heading", {
        name: "Architecture boundaries",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Which boundary is canonical?")).not.toBeNull();
    expect(screen.getByText("No completed attempts yet.")).not.toBeNull();
    expect(screen.queryByText(/correct answer/i)).toBeNull();
    expect(screen.queryByText(/explanation/i)).toBeNull();
  });

  it("keeps the in-memory draft after safe failure and blocks duplicate submission", async () => {
    let rejectSubmit: ((reason: unknown) => void) | undefined;
    vi.mocked(learningApi.submitQuizAttempt).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectSubmit = reject;
      }),
    );
    renderWorkspace();
    await screen.findByText("Which boundary is canonical?");
    const answer = screen.getByRole("radio", {
      name: "The server boundary",
    });
    await userEvent.click(answer);
    const submit = screen.getByRole("button", {
      name: "Submit quiz answers",
    });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(learningApi.submitQuizAttempt).toHaveBeenCalledTimes(1);

    rejectSubmit?.(
      new ApiError(
        503,
        "QUIZ_SUBMISSION_UNAVAILABLE",
        "Submission is temporarily unavailable.",
        "request-submit-0001",
      ),
    );
    expect(
      await screen.findByText("Submission is temporarily unavailable."),
    ).not.toBeNull();
    expect((answer as HTMLInputElement).checked).toBe(true);
  });

  it("adopts the server score and navigates only after validated success", async () => {
    vi.mocked(learningApi.submitQuizAttempt).mockResolvedValue({
      attempt: historyAttempt(),
      review: [
        {
          ...quiz.questions[0]!,
          selectedChoiceIndex: 0,
          correctChoiceIndex: 0,
          correct: true,
          explanation: "Canonical server explanation.",
        },
      ],
      requestId: "request-submit-0001",
    });
    renderWorkspace();
    await screen.findByText("Which boundary is canonical?");
    await userEvent.click(
      screen.getByRole("radio", { name: "The server boundary" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Submit quiz answers" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Attempt review route" }),
    ).not.toBeNull();
    const body = vi.mocked(learningApi.submitQuizAttempt).mock.calls[0]?.[3];
    expect(body).toEqual([
      { questionIndex: 0, selectedChoiceIndex: 0 },
    ]);
  });

  it("does not automatically resubmit an uncertain outcome and reconciles through history", async () => {
    vi.mocked(learningApi.submitQuizAttempt).mockRejectedValue(
      new TypeError("network connection lost"),
    );
    vi.mocked(learningApi.listQuizAttempts)
      .mockResolvedValueOnce({
        attempts: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      })
      .mockResolvedValueOnce({
        attempts: [historyAttempt()],
        pagination: { page: 1, limit: 100, total: 1, pages: 1 },
      });
    renderWorkspace();
    await screen.findByText("Which boundary is canonical?");
    await userEvent.click(
      screen.getByRole("radio", { name: "The server boundary" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Submit quiz answers" }),
    );

    expect(
      await screen.findByText(/outcome is uncertain/i),
    ).not.toBeNull();
    expect(learningApi.submitQuizAttempt).toHaveBeenCalledTimes(1);
    await userEvent.click(
      screen.getByRole("button", { name: "Reconcile submission" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Attempt review route" }),
    ).not.toBeNull();
    expect(learningApi.submitQuizAttempt).toHaveBeenCalledTimes(1);
  });

  it("shows paginated immutable attempt links", async () => {
    vi.mocked(learningApi.listQuizAttempts).mockResolvedValue({
      attempts: [historyAttempt()],
      pagination: { page: 1, limit: 10, total: 11, pages: 2 },
    });
    renderWorkspace();

    expect(
      await screen.findByRole("link", { name: /Review attempt/i }),
    ).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Next attempt page" }),
    );
    expect(learningApi.listQuizAttempts).toHaveBeenLastCalledWith(
      documentId,
      quizId,
      { page: 2, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it("clears private draft state when account identity changes", async () => {
    const { view } = renderWorkspace();
    await screen.findByText("Which boundary is canonical?");
    await userEvent.click(
      screen.getByRole("radio", { name: "The server boundary" }),
    );
    accountId = "account-b";
    view.rerender(
      <RouterProvider
        router={createMemoryRouter(
          [
            {
              path: "/learning/documents/:documentId/quizzes/:quizId",
              element: <LearningQuizWorkspace />,
            },
          ],
          {
            initialEntries: [
              `/learning/documents/${documentId}/quizzes/${quizId}`,
            ],
          },
        )}
      />,
    );
    await waitFor(() =>
      expect(
        (
          screen.getByRole("radio", {
            name: "The server boundary",
          }) as HTMLInputElement
        ).checked,
      ).toBe(false),
    );
  });

  it("keeps quiz drafts and attempt data out of browser storage", async () => {
    const localStorageWrite = vi.spyOn(
      Storage.prototype,
      "setItem",
    );
    renderWorkspace();

    await screen.findByRole("heading", {
      name: "Architecture boundaries",
    });
    await userEvent.click(
      screen.getByRole("radio", { name: "The server boundary" }),
    );

    expect(localStorageWrite).not.toHaveBeenCalled();
    localStorageWrite.mockRestore();
  });
});
