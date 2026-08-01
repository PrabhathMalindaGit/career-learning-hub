import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { DocumentFlashcards } from "./DocumentFlashcards";
import * as learningApi from "./learningApi";
import * as learningPolling from "./learningPolling";
import type {
  FlashcardSet,
  LearningDocument,
  LearningFlashcardJob,
} from "./types";

vi.mock("./learningApi", () => ({
  createFlashcardSet: vi.fn(),
  fetchFlashcardSet: vi.fn(),
  fetchLearningFlashcardJob: vi.fn(),
  listFlashcardSets: vi.fn(),
  listLearningFlashcards: vi.fn(),
}));

vi.mock("./learningPolling", () => ({
  pollLearningJob: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const setId = "507f1f77bcf86cd799439012";
const jobId = "507f1f77bcf86cd799439013";
const cardId = "507f1f77bcf86cd799439014";
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

function setRecord(overrides: Partial<FlashcardSet> = {}): FlashcardSet {
  return {
    id: setId,
    documentId,
    title: "Architecture review",
    status: "ready",
    cardCount: 1,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function completedJob(): LearningFlashcardJob {
  return {
    id: jobId,
    type: "learning.flashcards.generate",
    status: "completed",
    progress: 100,
    attempts: 1,
    maxAttempts: 3,
    result: { setId, cardCount: 1 },
    createdAt,
    updatedAt: createdAt,
  };
}

function renderFlashcards(accountId = "account-a") {
  const router = createMemoryRouter(
    [
      {
        path: `/learning/documents/:documentId`,
        element: (
          <DocumentFlashcards
            accountId={accountId}
            document={documentRecord}
          />
        ),
      },
      {
        path: `/learning/documents/:documentId/flashcards/:setId`,
        element: <h1>Study route reached</h1>,
      },
    ],
    { initialEntries: [`/learning/documents/${documentId}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(learningApi.listFlashcardSets).mockResolvedValue({
    sets: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
});

describe("Document flashcards", () => {
  it("shows loading, empty, refresh, and bounded pagination states", async () => {
    let resolveList:
      | ((value: Awaited<ReturnType<
          typeof learningApi.listFlashcardSets
        >>) => void)
      | undefined;
    vi.mocked(learningApi.listFlashcardSets).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );
    renderFlashcards();

    expect(screen.getByText("Loading flashcard sets…")).not.toBeNull();
    resolveList?.({
      sets: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    });
    expect(await screen.findByText("No flashcard sets yet.")).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh flashcard sets" }),
    );
    expect(learningApi.listFlashcardSets).toHaveBeenLastCalledWith(
      documentId,
      { page: 1, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it("renders canonical generating, failed, and ready sets with pagination", async () => {
    vi.mocked(learningApi.listFlashcardSets).mockResolvedValue({
      sets: [
        setRecord({
          title: "Generating architecture cards",
          status: "generating",
          cardCount: 0,
        }),
        setRecord({
          id: "507f1f77bcf86cd799439020",
          title: "Failed architecture cards",
          status: "failed",
          cardCount: 0,
          generationError: {
            code: "GEMINI_NOT_CONFIGURED",
            message: "Flashcard generation is not configured.",
          },
        }),
        setRecord({ id: "507f1f77bcf86cd799439021" }),
      ],
      pagination: { page: 1, limit: 10, total: 11, pages: 2 },
    });
    renderFlashcards();

    expect(await screen.findByText("Generating")).not.toBeNull();
    expect(screen.getByText("Generation failed")).not.toBeNull();
    expect(
      screen.getByText("Flashcard generation is not configured."),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /Study Architecture review/i }),
    ).not.toBeNull();
    expect(
      screen.getByRole("list", {
        name: "Flashcard sets for Synthetic architecture notes",
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("article", {
        name: "Flashcard set Architecture review",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Ready to study")).not.toBeNull();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Next flashcard-set page",
      }),
    );
    expect(learningApi.listFlashcardSets).toHaveBeenLastCalledWith(
      documentId,
      { page: 2, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it("validates title, count, and focus before generation", async () => {
    const user = userEvent.setup();
    renderFlashcards();
    await screen.findByText("No flashcard sets yet.");

    await user.click(
      screen.getByRole("button", { name: "Generate flashcards" }),
    );
    expect(screen.getByText("Enter a flashcard-set title.")).not.toBeNull();

    await user.type(
      screen.getByRole("textbox", { name: "Set title" }),
      "Architecture review",
    );
    await user.clear(screen.getByRole("spinbutton", { name: "Card count" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Card count" }),
      { target: { value: "0" } },
    );
    fireEvent.submit(
      screen.getByRole("button", {
        name: "Generate flashcards",
      }).closest("form")!,
    );
    expect(screen.getByText("Choose between 1 and 100 cards.")).not.toBeNull();
    expect(learningApi.createFlashcardSet).not.toHaveBeenCalled();
  });

  it("prevents duplicate submissions and retains values on recoverable failure", async () => {
    let rejectCreate: ((reason: unknown) => void) | undefined;
    vi.mocked(learningApi.createFlashcardSet).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCreate = reject;
      }),
    );
    const user = userEvent.setup();
    renderFlashcards();
    await screen.findByText("No flashcard sets yet.");
    await user.type(
      screen.getByRole("textbox", { name: "Set title" }),
      "Architecture review",
    );

    const submit = screen.getByRole("button", {
      name: "Generate flashcards",
    });
    fireEvent.submit(submit.closest("form")!);
    fireEvent.submit(submit.closest("form")!);
    expect(learningApi.createFlashcardSet).toHaveBeenCalledTimes(1);

    rejectCreate?.(
      new ApiError(
        503,
        "AI_PROVIDER_UNAVAILABLE",
        "Generation is currently unavailable.",
        "request-generate-0001",
      ),
    );
    expect(
      await screen.findByText("Generation is currently unavailable."),
    ).not.toBeNull();
    expect(screen.getByDisplayValue("Architecture review")).not.toBeNull();
    expect(screen.getByText(/request-generate-0001/)).not.toBeNull();
  });

  it("clears the form after validated acceptance and resumes the same paused job", async () => {
    vi.mocked(learningApi.createFlashcardSet).mockResolvedValue({
      setId,
      documentId,
      job: {
        id: jobId,
        type: "learning.flashcards.generate",
        status: "queued",
      },
      requestId: "request-accepted-0001",
    });
    vi.mocked(learningPolling.pollLearningJob)
      .mockResolvedValueOnce({
        reason: "paused",
        cause: "timeout",
        job: undefined,
      })
      .mockResolvedValueOnce({
        reason: "terminal",
        job: {
          ...completedJob(),
          status: "cancelled",
          result: undefined,
        },
      });
    const user = userEvent.setup();
    renderFlashcards();
    await screen.findByText("No flashcard sets yet.");
    await user.type(
      screen.getByRole("textbox", { name: "Set title" }),
      "Architecture review",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate flashcards" }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Resume generation checks",
      }),
    ).not.toBeNull();
    expect(
      (screen.getByRole("textbox", {
        name: "Set title",
      }) as HTMLInputElement).value,
    ).toBe("");
    await user.click(
      screen.getByRole("button", {
        name: "Resume generation checks",
      }),
    );
    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(learningPolling.pollLearningJob).mock.calls.map(
        ([input]) => input.jobId,
      ),
    ).toEqual([jobId, jobId]);
    expect(await screen.findByText(/generation was cancelled/i)).not.toBeNull();
    expect(learningApi.createFlashcardSet).toHaveBeenCalledTimes(1);
  });

  it("refetches canonical set and cards before completed navigation", async () => {
    vi.mocked(learningApi.createFlashcardSet).mockResolvedValue({
      setId,
      documentId,
      job: {
        id: jobId,
        type: "learning.flashcards.generate",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: completedJob(),
    });
    vi.mocked(learningApi.fetchFlashcardSet).mockResolvedValue({
      set: setRecord(),
    });
    vi.mocked(learningApi.listLearningFlashcards).mockResolvedValue({
      cards: [
        {
          id: cardId,
          cardIndex: 0,
          front: "Canonical question",
          back: "Canonical answer",
          sourcePages: [1],
          createdAt,
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, pages: 1 },
    });
    const user = userEvent.setup();
    const router = renderFlashcards();
    await screen.findByText("No flashcard sets yet.");
    await user.type(
      screen.getByRole("textbox", { name: "Set title" }),
      "Architecture review",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate flashcards" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/learning/documents/${documentId}/flashcards/${setId}`,
      );
    });
    expect(learningApi.fetchFlashcardSet).toHaveBeenCalledWith(
      documentId,
      setId,
      expect.any(AbortSignal),
    );
    expect(learningApi.listLearningFlashcards).toHaveBeenCalledWith(
      setId,
      documentRecord.pageCount,
      { page: 1, limit: 100 },
      expect.any(AbortSignal),
    );
  });

  it("shows terminal failure without fabrication or automatic regeneration", async () => {
    vi.mocked(learningApi.createFlashcardSet).mockResolvedValue({
      setId,
      documentId,
      job: {
        id: jobId,
        type: "learning.flashcards.generate",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: {
        ...completedJob(),
        status: "failed",
        result: undefined,
        error: {
          code: "GEMINI_NOT_CONFIGURED",
          message: "Flashcard generation is not configured.",
        },
      },
    });
    const user = userEvent.setup();
    renderFlashcards();
    await screen.findByText("No flashcard sets yet.");
    await user.type(
      screen.getByRole("textbox", { name: "Set title" }),
      "Architecture review",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate flashcards" }),
    );

    expect(
      await screen.findByText(/Flashcard generation is not configured/),
    ).not.toBeNull();
    expect(screen.queryByText("Canonical question")).toBeNull();
    expect(learningApi.createFlashcardSet).toHaveBeenCalledTimes(1);
  });

  it("does not persist drafts, jobs, or generated content", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    renderFlashcards();
    await act(async () => undefined);

    expect(storageWrite).not.toHaveBeenCalled();
    storageWrite.mockRestore();
  });
});
