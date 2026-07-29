import {
  act,
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
import * as learningApi from "./learningApi";
import { LearningFlashcardWorkspace } from "./LearningFlashcardWorkspace";
import type {
  FlashcardSet,
  LearningDocument,
} from "./types";

let accountId = "account-a";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: accountId,
      email: `${accountId}@example.test`,
      profile: { displayName: "Flashcard User" },
    },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchFlashcardSet: vi.fn(),
  fetchLearningDocument: vi.fn(),
  listLearningFlashcards: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const setId = "507f1f77bcf86cd799439012";
const secondSetId = "507f1f77bcf86cd799439099";
const cardId = "507f1f77bcf86cd799439013";
const createdAt = "2026-07-26T01:00:00.000Z";

function documentRecord(
  overrides: Partial<LearningDocument> = {},
): LearningDocument {
  return {
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
    ...overrides,
  };
}

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

function renderWorkspace(
  initialPath = `/learning/documents/${documentId}/flashcards/${setId}`,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId/flashcards/:setId",
        element: <LearningFlashcardWorkspace />,
      },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, view };
}

beforeEach(() => {
  accountId = "account-a";
  vi.clearAllMocks();
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: documentRecord(),
  });
  vi.mocked(learningApi.fetchFlashcardSet).mockResolvedValue({
    set: setRecord(),
  });
  vi.mocked(learningApi.listLearningFlashcards).mockResolvedValue({
    cards: [
      {
        id: cardId,
        cardIndex: 0,
        front: "What is the canonical question?",
        back: "The canonical answer.",
        sourcePages: [1],
        createdAt,
      },
    ],
    pagination: { page: 1, limit: 100, total: 1, pages: 1 },
  });
});

describe("Learning flashcard workspace", () => {
  it("loads exact document, set, and canonical cards before study", async () => {
    let resolveDocument:
      | ((value: Awaited<ReturnType<
          typeof learningApi.fetchLearningDocument
        >>) => void)
      | undefined;
    vi.mocked(learningApi.fetchLearningDocument).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDocument = resolve;
      }),
    );
    renderWorkspace();

    expect(screen.getByText("Loading flashcard study…")).not.toBeNull();
    resolveDocument?.({ document: documentRecord() });

    expect(
      await screen.findByRole("heading", { name: "Architecture review" }),
    ).not.toBeNull();
    const breadcrumbs = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(breadcrumbs.textContent).toContain("Architecture review");
    expect(breadcrumbs.textContent).not.toContain(setId);
    expect(
      screen.getAllByText("Synthetic architecture notes").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("What is the canonical question?"),
    ).not.toBeNull();
    expect(learningApi.fetchFlashcardSet).toHaveBeenCalledWith(
      documentId,
      setId,
      expect.any(AbortSignal),
    );
    expect(learningApi.listLearningFlashcards).toHaveBeenCalledWith(
      setId,
      4,
      { page: 1, limit: 100 },
      expect.any(AbortSignal),
    );
  });

  it("shows an empty canonical set without fabricating cards", async () => {
    vi.mocked(learningApi.fetchFlashcardSet).mockResolvedValue({
      set: setRecord({ cardCount: 0 }),
    });
    vi.mocked(learningApi.listLearningFlashcards).mockResolvedValue({
      cards: [],
      pagination: { page: 1, limit: 100, total: 0, pages: 0 },
    });
    renderWorkspace();

    expect(
      await screen.findByRole("heading", { name: "No flashcards available" }),
    ).not.toBeNull();
    expect(screen.queryByText("Example question")).toBeNull();
  });

  it.each([
    ["generating", "This flashcard set is still generating."],
    ["failed", "Flashcard generation is not configured."],
  ] as const)("shows factual %s set state without loading cards", async (status, message) => {
    vi.mocked(learningApi.fetchFlashcardSet).mockResolvedValue({
      set: setRecord({
        status,
        cardCount: 0,
        ...(status === "failed"
          ? {
              generationError: {
                code: "GEMINI_NOT_CONFIGURED",
                message: "Flashcard generation is not configured.",
              },
            }
          : {}),
      }),
    });
    renderWorkspace();

    expect(await screen.findByText(message)).not.toBeNull();
    expect(learningApi.listLearningFlashcards).not.toHaveBeenCalled();
  });

  it("keeps missing or foreign set errors safe and equivalent", async () => {
    vi.mocked(learningApi.fetchFlashcardSet).mockRejectedValue(
      new ApiError(
        404,
        "FLASHCARD_SET_NOT_FOUND",
        "Flashcard set not found.",
        "request-missing-set-0001",
      ),
    );
    renderWorkspace();

    expect(
      await screen.findByRole("heading", {
        name: "Flashcard set not found",
      }),
    ).not.toBeNull();
    expect(screen.queryByText(setId)).toBeNull();
    expect(screen.getByText(/request-missing-set-0001/)).not.toBeNull();
  });

  it("retries a transient study-workspace error explicitly", async () => {
    vi.mocked(learningApi.fetchLearningDocument)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "LEARNING_UNAVAILABLE",
          "Flashcard study is temporarily unavailable.",
          "request-study-retry-0001",
        ),
      )
      .mockResolvedValueOnce({ document: documentRecord() });
    renderWorkspace();

    expect(
      await screen.findByText("Flashcard study is temporarily unavailable."),
    ).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Try flashcard study again",
      }),
    );

    expect(
      await screen.findByText("What is the canonical question?"),
    ).not.toBeNull();
    expect(learningApi.fetchLearningDocument).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed nested document/set identity and card counts", async () => {
    vi.mocked(learningApi.fetchFlashcardSet).mockRejectedValueOnce(
      new ApiError(
        502,
        "INVALID_LEARNING_RESPONSE",
        "The server returned an invalid learning response.",
      ),
    );
    const first = renderWorkspace();
    expect(
      await screen.findByRole("heading", {
        name: "Flashcard response unavailable",
      }),
    ).not.toBeNull();
    first.view.unmount();

    vi.mocked(learningApi.fetchFlashcardSet).mockResolvedValue({
      set: setRecord({ cardCount: 2 }),
    });
    const second = renderWorkspace();
    expect(
      await screen.findByRole("heading", {
        name: "Flashcard response unavailable",
      }),
    ).not.toBeNull();
    second.view.unmount();
  });

  it("ignores stale set responses after the route changes", async () => {
    let resolveFirstSet:
      | ((value: Awaited<ReturnType<
          typeof learningApi.fetchFlashcardSet
        >>) => void)
      | undefined;
    vi.mocked(learningApi.fetchFlashcardSet)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstSet = resolve;
        }),
      )
      .mockResolvedValueOnce({
        set: setRecord({
          id: secondSetId,
          title: "Second canonical set",
        }),
      });
    const { router } = renderWorkspace();

    await act(async () => {
      await router.navigate(
        `/learning/documents/${documentId}/flashcards/${secondSetId}`,
      );
    });
    expect(
      await screen.findByRole("heading", { name: "Second canonical set" }),
    ).not.toBeNull();

    resolveFirstSet?.({
      set: setRecord({ title: "Stale first set" }),
    });
    expect(screen.queryByText("Stale first set")).toBeNull();
  });

  it("clears prior cards when the account identity changes", async () => {
    const { router, view } = renderWorkspace();
    expect(
      await screen.findByText("What is the canonical question?"),
    ).not.toBeNull();
    let resolveNewAccount:
      | ((value: Awaited<ReturnType<
          typeof learningApi.fetchLearningDocument
        >>) => void)
      | undefined;
    vi.mocked(learningApi.fetchLearningDocument).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNewAccount = resolve;
      }),
    );
    accountId = "account-b";
    view.rerender(
      <RouterProvider key={accountId} router={router} />,
    );

    await waitFor(() => {
      expect(screen.queryByText("What is the canonical question?")).toBeNull();
    });
    resolveNewAccount?.({ document: documentRecord() });
  });
});
