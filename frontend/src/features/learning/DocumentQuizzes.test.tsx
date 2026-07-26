import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { DocumentQuizzes } from "./DocumentQuizzes";
import * as learningApi from "./learningApi";
import * as learningPolling from "./learningPolling";
import type {
  LearningDocument,
  LearningQuizJob,
  QuizSummary,
} from "./types";

vi.mock("./learningApi", () => ({
  createQuizGeneration: vi.fn(),
  fetchLearningQuizJob: vi.fn(),
  fetchQuizForTaking: vi.fn(),
  listQuizzes: vi.fn(),
}));

vi.mock("./learningPolling", () => ({
  pollLearningJob: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const quizId = "507f1f77bcf86cd799439012";
const jobId = "507f1f77bcf86cd799439013";
const createdAt = "2026-07-26T01:00:00.000Z";

const documentRecord: LearningDocument = {
  id: documentId,
  title: "Synthetic architecture notes",
  originalFilename: "synthetic-architecture.pdf",
  mimeType: "application/pdf",
  status: "ready",
  pageCount: 4,
  chunkCount: 2,
  summaryKeyPoints: [],
  createdAt,
  updatedAt: createdAt,
};

function quiz(overrides: Partial<QuizSummary> = {}): QuizSummary {
  return {
    id: quizId,
    documentId,
    title: "Architecture boundaries",
    status: "ready",
    questionCount: 1,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function completedJob(): LearningQuizJob {
  return {
    id: jobId,
    type: "learning.quiz.generate",
    status: "completed",
    progress: 100,
    attempts: 1,
    maxAttempts: 3,
    result: { quizId, questionCount: 1 },
    createdAt,
    updatedAt: createdAt,
  };
}

function renderQuizzes(document = documentRecord) {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId",
        element: (
          <DocumentQuizzes
            accountId="account-a"
            document={document}
          />
        ),
      },
      {
        path: "/learning/documents/:documentId/quizzes/:quizId",
        element: <h1>Quiz route reached</h1>,
      },
    ],
    { initialEntries: [`/learning/documents/${documentId}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(learningApi.listQuizzes).mockResolvedValue({
    quizzes: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
});

describe("Document quizzes", () => {
  it("shows loading, empty, retry, and canonical status rows", async () => {
    vi.mocked(learningApi.listQuizzes).mockRejectedValueOnce(
      new ApiError(
        503,
        "QUIZ_UNAVAILABLE",
        "Quiz records are temporarily unavailable.",
        "request-quiz-list-0001",
      ),
    );
    renderQuizzes();

    expect(screen.getByText("Loading quizzes…")).not.toBeNull();
    expect(
      await screen.findByText("Quiz records are temporarily unavailable."),
    ).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Try quiz list again" }),
    );
    expect(await screen.findByText("No quizzes yet.")).not.toBeNull();

    vi.mocked(learningApi.listQuizzes).mockResolvedValue({
      quizzes: [
        quiz({ status: "generating", questionCount: 0 }),
        quiz({
          id: "507f1f77bcf86cd799439020",
          status: "failed",
          questionCount: 0,
          generationError: {
            code: "GEMINI_NOT_CONFIGURED",
            message: "Quiz generation is not configured.",
          },
        }),
        quiz({ id: "507f1f77bcf86cd799439021" }),
      ],
      pagination: { page: 1, limit: 10, total: 3, pages: 1 },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh quizzes" }),
    );
    expect(await screen.findByText("Generating")).not.toBeNull();
    expect(screen.getByText("Generation failed")).not.toBeNull();
    expect(screen.getByText("Quiz generation is not configured.")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /Take Architecture boundaries/i }),
    ).not.toBeNull();
  });

  it("validates generation fields and retains them after recoverable failure", async () => {
    vi.mocked(learningApi.createQuizGeneration).mockRejectedValue(
      new ApiError(
        503,
        "AI_PROVIDER_UNAVAILABLE",
        "Generation is currently unavailable.",
      ),
    );
    renderQuizzes();
    await screen.findByText("No quizzes yet.");

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Generate quiz" })
        .closest("form")!,
    );
    expect(screen.getByText("Enter a quiz title.")).not.toBeNull();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Quiz title" }),
      "Architecture boundaries",
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Question count" }),
      { target: { value: "0" } },
    );
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Generate quiz" })
        .closest("form")!,
    );
    expect(screen.getByText("Choose between 1 and 100 questions.")).not.toBeNull();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Question count" }),
      { target: { value: "5" } },
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Generate quiz" }),
    );
    expect(
      await screen.findByText("Generation is currently unavailable."),
    ).not.toBeNull();
    expect(
      (screen.getByRole("textbox", { name: "Quiz title" }) as HTMLInputElement)
        .value,
    ).toBe("Architecture boundaries");
  });

  it("blocks duplicate generation and clears values only after validated acceptance", async () => {
    let resolveCreate:
      | ((value: Awaited<ReturnType<
          typeof learningApi.createQuizGeneration
        >>) => void)
      | undefined;
    vi.mocked(learningApi.createQuizGeneration).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    vi.mocked(learningPolling.pollLearningJob).mockReturnValue(
      new Promise(() => undefined),
    );
    renderQuizzes();
    await screen.findByText("No quizzes yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Quiz title" }),
      "Architecture boundaries",
    );
    const submit = screen.getByRole("button", { name: "Generate quiz" });
    fireEvent.submit(submit.closest("form")!);
    fireEvent.submit(submit.closest("form")!);
    expect(learningApi.createQuizGeneration).toHaveBeenCalledTimes(1);

    resolveCreate?.({
      quizId,
      documentId,
      job: {
        id: jobId,
        type: "learning.quiz.generate",
        status: "queued",
      },
      requestId: "request-quiz-create-0001",
    });
    await waitFor(() =>
      expect(
        (screen.getByRole("textbox", { name: "Quiz title" }) as HTMLInputElement)
          .value,
      ).toBe(""),
    );
    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(1);
  });

  it("refetches canonical safe taking detail before navigating after completion", async () => {
    vi.mocked(learningApi.createQuizGeneration).mockResolvedValue({
      quizId,
      documentId,
      job: {
        id: jobId,
        type: "learning.quiz.generate",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: completedJob(),
    });
    vi.mocked(learningApi.fetchQuizForTaking).mockResolvedValue({
      ...quiz(),
      status: "ready",
      questions: [
        {
          questionIndex: 0,
          prompt: "Canonical prompt",
          choices: ["One", "Two"],
          sourcePages: [1],
        },
      ],
    });
    renderQuizzes();
    await screen.findByText("No quizzes yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Quiz title" }),
      "Architecture boundaries",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Generate quiz" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Quiz route reached" }),
    ).not.toBeNull();
    expect(learningApi.fetchQuizForTaking).toHaveBeenCalledWith(
      documentId,
      quizId,
      4,
      expect.any(AbortSignal),
    );
  });

  it("resumes paused generation checks with the same accepted job", async () => {
    vi.mocked(learningApi.createQuizGeneration).mockResolvedValue({
      quizId,
      documentId,
      job: {
        id: jobId,
        type: "learning.quiz.generate",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob)
      .mockResolvedValueOnce({
        reason: "paused",
        cause: "transport-failure",
        job: {
          ...completedJob(),
          status: "processing",
          progress: 45,
          result: undefined,
        },
      })
      .mockReturnValueOnce(new Promise(() => undefined));
    renderQuizzes();
    await screen.findByText("No quizzes yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Quiz title" }),
      "Architecture boundaries",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Generate quiz" }),
    );

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Resume generation checks",
      }),
    );

    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(learningPolling.pollLearningJob).mock.calls.map(
        ([options]) => options.jobId,
      ),
    ).toEqual([jobId, jobId]);
  });
});
