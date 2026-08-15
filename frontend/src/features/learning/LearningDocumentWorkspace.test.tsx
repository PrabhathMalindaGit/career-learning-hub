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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as learningApi from "./learningApi";
import * as learningPolling from "./learningPolling";
import { LearningDocumentWorkspace } from "./LearningDocumentWorkspace";
import type { LearningDocument } from "./types";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: "workspace-user-id",
      email: "workspace@example.test",
      profile: { displayName: "Workspace User" },
    },
  }),
}));

vi.mock("./learningApi", () => ({
  createFlashcardSet: vi.fn(),
  createQuizGeneration: vi.fn(),
  createLearningConversation: vi.fn(),
  fetchFlashcardSet: vi.fn(),
  fetchLearningFlashcardJob: vi.fn(),
  fetchLearningDocument: vi.fn(),
  fetchLearningDocumentDeletionJob: vi.fn(),
  fetchLearningDocumentSource: vi.fn(),
  fetchLearningJob: vi.fn(),
  fetchLearningQuizJob: vi.fn(),
  fetchQuizForTaking: vi.fn(),
  listDocumentChunks: vi.fn(),
  listFlashcardSets: vi.fn(),
  listLearningFlashcards: vi.fn(),
  listLearningConversations: vi.fn(),
  listLearningDocuments: vi.fn(),
  listQuizzes: vi.fn(),
  requestLearningDocumentDeletion: vi.fn(),
  uploadLearningDocument: vi.fn(),
}));

vi.mock("./learningPolling", async () => {
  const actual = await vi.importActual<typeof learningPolling>(
    "./learningPolling",
  );
  return {
    ...actual,
    pollLearningJob: vi.fn(),
  };
});

const firstDocumentId = "507f1f77bcf86cd799439011";
const secondDocumentId = "507f1f77bcf86cd799439099";
const createdAt = "2026-07-26T01:00:00.000Z";

function learningDocument(
  overrides: Partial<LearningDocument> = {},
): LearningDocument {
  return {
    id: firstDocumentId,
    title: "Synthetic distributed systems notes",
    originalFilename: "synthetic-distributed-systems-notes.pdf",
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 6,
    chunkCount: 2,
    summary: "A stored summary with **literal markdown**.",
    summaryKeyPoints: [
      "First stored point",
      "<img src=x onerror=alert(1)>",
    ],
    processedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function renderWorkspace(
  initialPath = `/learning/documents/${firstDocumentId}`,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId",
        element: <LearningDocumentWorkspace />,
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(new Blob(["%PDF-1.4"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    ),
  );
  class StubUrl extends URL {
    static createObjectURL = vi.fn(
      () => "blob:synthetic-private-pdf",
    );
    static revokeObjectURL = vi.fn();
  }
  vi.stubGlobal("URL", StubUrl);
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: learningDocument(),
    requestId: "request-workspace-0001",
  });
  vi.mocked(learningApi.listQuizzes).mockResolvedValue({
    quizzes: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
  vi.mocked(learningApi.listDocumentChunks).mockResolvedValue({
    chunks: [
      {
        id: "507f1f77bcf86cd799439013",
        chunkIndex: 0,
        pageStart: 1,
        pageEnd: 1,
        text: "First **literal** chunk.",
        wordCount: 3,
      },
      {
        id: "507f1f77bcf86cd799439014",
        chunkIndex: 1,
        pageStart: 4,
        pageEnd: 6,
        text: "<script>must remain text</script>",
        wordCount: 3,
      },
    ],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  });
  vi.mocked(learningApi.fetchLearningDocumentSource).mockResolvedValue({
    source: {
      url: "https://private.example.test/document.pdf?signature=must-not-show",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      contentType: "application/pdf",
    },
    requestId: "request-source-0001",
  });
  vi.mocked(learningApi.listLearningConversations).mockResolvedValue({
    conversations: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
  vi.mocked(learningApi.listFlashcardSets).mockResolvedValue({
    sets: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
  vi.mocked(
    learningApi.requestLearningDocumentDeletion,
  ).mockResolvedValue({
    job: {
      id: "507f1f77bcf86cd799439098",
      type: "learning.document.delete",
      status: "queued",
    },
  });
  vi.mocked(learningPolling.pollLearningJob).mockReturnValue(
    new Promise(() => undefined),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Learning document workspace", () => {
  it("loads the route-bound document and shows a loading state first", async () => {
    let resolve:
      | ((value: Awaited<ReturnType<
          typeof learningApi.fetchLearningDocument
        >>) => void)
      | undefined;
    vi.mocked(learningApi.fetchLearningDocument).mockReturnValue(
      new Promise((next) => {
        resolve = next;
      }),
    );
    renderWorkspace();

    expect(screen.getByText("Loading document workspace…")).not.toBeNull();

    resolve?.({ document: learningDocument() });
    expect(
      await screen.findByRole("heading", {
        name: "Synthetic distributed systems notes",
      }),
    ).not.toBeNull();
    const breadcrumbs = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(breadcrumbs.textContent).toContain(
      "Synthetic distributed systems notes",
    );
    expect(breadcrumbs.textContent).not.toContain(firstDocumentId);
    expect(learningApi.fetchLearningDocument).toHaveBeenCalledWith(
      firstDocumentId,
      expect.any(AbortSignal),
    );
  });

  it("shows uploaded and processing states without fabricated percentages", async () => {
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({
        status: "processing",
        pageCount: 0,
        chunkCount: 0,
      }),
    });
    renderWorkspace();

    expect(
      await screen.findByText(
        "Processing is continuing in the background.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("shows a ready overview with stored summary and key points", async () => {
    renderWorkspace();

    const summary = await screen.findByRole("region", {
      name: "Stored summary",
    });
    const keyPoints = screen.getByRole("region", {
      name: "Stored key points",
    });
    expect(summary.textContent).toContain("A stored summary");
    expect(keyPoints.textContent).toContain("First stored point");
    expect(screen.getByText("First stored point")).not.toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("Ready")).not.toBeNull();
    expect(screen.getByText("PDF document")).not.toBeNull();
  });

  it("renders summary and key points as plain escaped text", async () => {
    renderWorkspace();

    const summary = await screen.findByText(
      "A stored summary with **literal markdown**.",
    );
    expect(summary.querySelector("strong")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("shows a failed state, safe processing error, request ID and refresh action", async () => {
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({
        status: "failed",
        processingError: {
          code: "DOCUMENT_TEXT_UNAVAILABLE",
          message: "No extractable text was found. OCR is not supported.",
        },
      }),
      requestId: "request-failed-0001",
    });
    renderWorkspace();

    expect(
      await screen.findByText(/No extractable text was found/),
    ).not.toBeNull();
    expect(screen.getByText(/request-failed-0001/)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Refresh document status" }),
    ).not.toBeNull();
  });

  it("keeps missing-document errors safe and non-disclosing", async () => {
    vi.mocked(learningApi.fetchLearningDocument).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
        "request-missing-0001",
      ),
    );
    renderWorkspace();

    expect(
      await screen.findByRole("heading", { name: "Document not found" }),
    ).not.toBeNull();
    expect(screen.queryByText(firstDocumentId)).toBeNull();
    expect(screen.getByText(/request-missing-0001/)).not.toBeNull();
  });

  it("ignores an old document response after the route changes", async () => {
    let resolveFirst:
      | ((value: { document: LearningDocument }) => void)
      | undefined;
    vi.mocked(learningApi.fetchLearningDocument)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({
        document: learningDocument({
          id: secondDocumentId,
          title: "Second synthetic document",
        }),
      });
    const router = renderWorkspace();

    await act(async () => {
      await router.navigate(
        `/learning/documents/${secondDocumentId}`,
      );
    });
    expect(
      await screen.findByRole("heading", {
        name: "Second synthetic document",
      }),
    ).not.toBeNull();

    resolveFirst?.({
      document: learningDocument({ title: "Stale first title" }),
    });
    expect(screen.queryByText("Stale first title")).toBeNull();
  });

  it("offers owned conversations only for a ready document", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Grounded Chat" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Conversations" }),
    ).not.toBeNull();
    expect(screen.getByText("No conversations yet.")).not.toBeNull();
    expect(learningApi.listLearningConversations).toHaveBeenCalledWith(
      firstDocumentId,
      { page: 1, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it("offers owned flashcard generation and sets only for a ready document", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Flashcards" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Flashcard sets" }),
    ).not.toBeNull();
    expect(screen.getByText("No flashcard sets yet.")).not.toBeNull();
    expect(learningApi.listFlashcardSets).toHaveBeenCalledWith(
      firstDocumentId,
      { page: 1, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it("offers owned quiz generation and records only for a ready document", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Quizzes" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Quizzes" }),
    ).not.toBeNull();
    expect(screen.getByText("No quizzes yet.")).not.toBeNull();
    expect(learningApi.listQuizzes).toHaveBeenCalledWith(
      firstDocumentId,
      { page: 1, limit: 10 },
      expect.any(AbortSignal),
    );
  });

  it.each([
    [
      "processing",
      "Processing must finish before grounded chat is available.",
    ],
    [
      "failed",
      "Failed documents cannot be used for grounded chat.",
    ],
    [
      "deleting",
      "Grounded chat is unavailable while deletion completes.",
    ],
  ] as const)("does not expose active chat controls for %s documents", async (status, message) => {
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({ status }),
    });
    renderWorkspace();

    expect(await screen.findByText(message)).not.toBeNull();
    expect(
      screen.queryByRole("tab", { name: "Grounded Chat" }),
    ).toBeNull();
    expect(
      screen.queryByRole("tab", { name: "Flashcards" }),
    ).toBeNull();
    expect(
      screen.queryByRole("tab", { name: "Quizzes" }),
    ).toBeNull();
    expect(learningApi.listLearningConversations).not.toHaveBeenCalled();
    expect(learningApi.listFlashcardSets).not.toHaveBeenCalled();
  });
});

describe("Secure original-PDF viewer", () => {
  it("does not request a source while the viewer is hidden", async () => {
    renderWorkspace();
    await screen.findByText(/A stored summary/);

    expect(learningApi.fetchLearningDocumentSource).not.toHaveBeenCalled();
  });

  it("requests the source only when Original PDF opens", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );

    expect(learningApi.fetchLearningDocumentSource).toHaveBeenCalledWith(
      firstDocumentId,
      expect.any(AbortSignal),
    );
    const frame = await screen.findByTitle(
      "Original PDF: Synthetic distributed systems notes",
    );
    expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(frame.getAttribute("src")).toBe(
      "blob:synthetic-private-pdf",
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://private.example.test/document.pdf?signature=must-not-show",
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
      }),
    );
  });

  it("keeps the raw signed URL out of visible text and route state", async () => {
    const router = renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );
    await screen.findByTitle(
      "Original PDF: Synthetic distributed systems notes",
    );

    expect(screen.queryByText(/signature=must-not-show/)).toBeNull();
    expect(router.state.location.search).toBe("");
    expect(router.state.location.pathname).toBe(
      `/learning/documents/${firstDocumentId}`,
    );
  });

  it("clears expired source access and requires explicit refresh", async () => {
    vi.useFakeTimers();
    vi.mocked(learningApi.fetchLearningDocumentSource).mockResolvedValue({
      source: {
        url: "https://private.example.test/document.pdf",
        expiresAt: new Date(Date.now() + 1_000).toISOString(),
        contentType: "application/pdf",
      },
    });
    renderWorkspace();
    await act(async () => undefined);
    fireEvent.click(
      screen.getByRole("tab", { name: "Original PDF" }),
    );
    await act(async () => undefined);
    expect(
      screen.getByTitle(
        "Original PDF: Synthetic distributed systems notes",
      ),
    ).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_001);
    });

    expect(
      screen.getByText("Secure PDF access has expired."),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Refresh secure PDF access",
      }),
    ).not.toBeNull();
    expect(screen.queryByTitle(/Original PDF:/)).toBeNull();
  });

  it("requests a new target only after explicit refresh", async () => {
    vi.mocked(learningApi.fetchLearningDocumentSource)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "SOURCE_UNAVAILABLE",
          "Secure PDF access is unavailable.",
        ),
      )
      .mockResolvedValueOnce({
        source: {
          url: "https://private.example.test/refreshed.pdf",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          contentType: "application/pdf",
        },
      });
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Refresh secure PDF access",
      }),
    );

    expect(learningApi.fetchLearningDocumentSource).toHaveBeenCalledTimes(2);
  });

  it("clears source state when the document changes", async () => {
    const router = renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );
    await screen.findByTitle(
      "Original PDF: Synthetic distributed systems notes",
    );
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({
        id: secondDocumentId,
        title: "Second synthetic document",
      }),
    });

    await act(async () => {
      await router.navigate(
        `/learning/documents/${secondDocumentId}`,
      );
    });

    expect(screen.queryByTitle(/Original PDF:/)).toBeNull();
  });
});

describe("Page-aware extracted content", () => {
  it("renders factual single-page and multi-page labels", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Extracted Content" }),
    );

    expect(await screen.findByText("Page 1")).not.toBeNull();
    expect(screen.getByText("Pages 4–6")).not.toBeNull();
    expect(screen.getAllByText("3 words")).toHaveLength(2);
    expect(screen.queryByText("Page 0")).toBeNull();
  });

  it("renders chunk text as plain escaped text", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Extracted Content" }),
    );

    expect(await screen.findByText("First **literal** chunk.")).not.toBeNull();
    expect(
      screen.getByText("<script>must remain text</script>"),
    ).not.toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("supports chunk pagination", async () => {
    vi.mocked(learningApi.listDocumentChunks).mockResolvedValue({
      chunks: [
        {
          id: "507f1f77bcf86cd799439013",
          chunkIndex: 0,
          pageStart: 1,
          pageEnd: 1,
          text: "First page of extracted content.",
          wordCount: 5,
        },
      ],
      pagination: { page: 1, limit: 20, total: 21, pages: 2 },
    });
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Extracted Content" }),
    );
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Next extracted-content page",
      }),
    );

    expect(learningApi.listDocumentChunks).toHaveBeenLastCalledWith(
      firstDocumentId,
      6,
      { page: 2, limit: 20 },
      expect.any(AbortSignal),
    );
  });

  it("ignores old chunk responses after a document route change", async () => {
    let resolveChunks:
      | ((value: Awaited<ReturnType<
          typeof learningApi.listDocumentChunks
        >>) => void)
      | undefined;
    vi.mocked(learningApi.listDocumentChunks).mockReturnValue(
      new Promise((resolve) => {
        resolveChunks = resolve;
      }),
    );
    const router = renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Extracted Content" }),
    );
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({
        id: secondDocumentId,
        title: "Second synthetic document",
      }),
    });

    await act(async () => {
      await router.navigate(
        `/learning/documents/${secondDocumentId}`,
      );
    });
    resolveChunks?.({
      chunks: [
        {
          id: "507f1f77bcf86cd799439013",
          chunkIndex: 0,
          pageStart: 1,
          pageEnd: 1,
          text: "Stale extracted content",
          wordCount: 3,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    expect(screen.queryByText("Stale extracted content")).toBeNull();
  });

  it("provides accessible tabs, viewer title and pagination names", async () => {
    renderWorkspace();

    const tabs = await screen.findByRole("tablist", {
      name: "Document workspace views",
    });
    expect(tabs).not.toBeNull();
    expect(
      screen.getByRole("tab", { name: "Overview" }).getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    const backLink = screen.getByRole("link", {
      name: "← Document library",
    });
    expect(backLink.getAttribute("href")).toBe("/learning");
    expect(
      backLink.classList.contains("workspace-back-link"),
    ).toBe(true);
  });

  it("preserves wrapping arrow-key selection and focus behavior", async () => {
    renderWorkspace();
    const overview = await screen.findByRole("tab", {
      name: "Overview",
    });
    const original = screen.getByRole("tab", {
      name: "Original PDF",
    });
    const quizzes = screen.getByRole("tab", {
      name: "Quizzes",
    });

    overview.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(quizzes);
    expect(quizzes.getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(overview);
    expect(overview.getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(original);
    expect(original.getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(quizzes);
    expect(quizzes.getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(overview);
    expect(overview.getAttribute("aria-selected")).toBe("true");
  });

  it("does not persist private source or document content", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );
    await screen.findByTitle(
      "Original PDF: Synthetic distributed systems notes",
    );

    expect(local).not.toHaveBeenCalled();
  });
});

describe("Document-level deletion placement and teardown", () => {
  it("places the sole destructive action behind More actions in the document header", async () => {
    renderWorkspace();

    const trigger = await screen.findByRole("button", {
      name: `More actions for ${learningDocument().title}`,
    });
    expect(
      trigger.closest(".learning-workspace-header"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Delete document" }),
    ).toBeNull();

    await userEvent.click(trigger);
    const deleteAction = screen.getByRole("button", {
      name: "Delete document",
    });
    expect(
      deleteAction.closest(".learning-workspace-header"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", {
        name: /delete (conversation|message|flashcard|quiz|attempt)/i,
      }),
    ).toBeNull();
  });

  it("unmounts document-scoped views and revokes the PDF URL after acceptance", async () => {
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Original PDF" }),
    );
    await screen.findByTitle(
      "Original PDF: Synthetic distributed systems notes",
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: `More actions for ${learningDocument().title}`,
      }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete document" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", {
        name: `Type ${learningDocument().title} to confirm`,
      }),
      learningDocument().title,
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: "Delete permanently",
      }),
    );

    expect(
      await screen.findByRole("status"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("tablist", {
        name: "Document workspace views",
      }),
    ).toBeNull();
    expect(screen.queryByTitle(/Original PDF:/)).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:synthetic-private-pdf",
    );
  });

  it("shows factual observation instead of a new action for a deleting document", async () => {
    vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
      document: learningDocument({ status: "deleting" }),
    });
    renderWorkspace();

    expect(
      await screen.findByRole("heading", {
        name: "Document is being deleted",
      }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Delete document" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: `More actions for ${learningDocument().title}`,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Check deletion status",
      }),
    ).not.toBeNull();
  });
});
