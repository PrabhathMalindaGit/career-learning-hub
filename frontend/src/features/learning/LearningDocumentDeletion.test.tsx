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
import { LearningDocumentDeletion } from "./LearningDocumentDeletion";
import * as learningApi from "./learningApi";
import * as learningPolling from "./learningPolling";
import type {
  LearningDocument,
  LearningDocumentDeletionJob,
} from "./types";

vi.mock("./learningApi", () => ({
  fetchLearningDocument: vi.fn(),
  fetchLearningDocumentDeletionJob: vi.fn(),
  requestLearningDocumentDeletion: vi.fn(),
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

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";

function learningDocument(
  overrides: Partial<LearningDocument> = {},
): LearningDocument {
  return {
    id: documentId,
    title: "Synthetic <notes> **literal**",
    originalFilename: "synthetic.pdf",
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 2,
    chunkCount: 1,
    summaryKeyPoints: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function deletionJob(
  status: LearningDocumentDeletionJob["status"],
  overrides: Partial<LearningDocumentDeletionJob> = {},
): LearningDocumentDeletionJob {
  return {
    id: jobId,
    type: "learning.document.delete",
    status,
    progress: status === "completed" ? 100 : 25,
    attempts: 1,
    maxAttempts: 3,
    ...(status === "completed"
      ? {
          result: {
            documentId,
            alreadyDeleted: false,
          },
        }
      : {}),
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function renderDeletion(
  options: {
    document?: LearningDocument;
    accountId?: string;
    onDeletionAccepted?: () => void;
  } = {},
) {
  const onDeletionAccepted = options.onDeletionAccepted ?? vi.fn();
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId",
        element: (
          <LearningDocumentDeletion
            accountId={options.accountId ?? "account-a"}
            document={options.document ?? learningDocument()}
            onDeletionAccepted={onDeletionAccepted}
          />
        ),
      },
      {
        path: "/learning",
        element: <h1>Document library</h1>,
      },
    ],
    {
      initialEntries: [`/learning/documents/${documentId}`],
    },
  );
  const rendered = render(<RouterProvider router={router} />);
  return { ...rendered, onDeletionAccepted, router };
}

async function openConfirmation() {
  const trigger = screen.getByRole("button", {
    name: `More actions for ${learningDocument().title}`,
  });
  await userEvent.click(trigger);
  await userEvent.click(
    screen.getByRole("button", { name: "Delete document" }),
  );
  return {
    trigger,
    dialog: screen.getByRole("dialog", {
      name: `Delete “${learningDocument().title}”?`,
    }),
    input: screen.getByRole("textbox", {
      name: `Type ${learningDocument().title} to confirm`,
    }),
    finalAction: screen.getByRole("button", {
      name: "Delete permanently",
    }),
  };
}

async function enterExactTitle() {
  const controls = await openConfirmation();
  await userEvent.type(controls.input, learningDocument().title);
  return controls;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(learningApi.requestLearningDocumentDeletion).mockResolvedValue({
    job: {
      id: jobId,
      type: "learning.document.delete",
      status: "queued",
    },
    requestId: "request-delete-0001",
  });
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: learningDocument(),
  });
  vi.mocked(learningPolling.pollLearningJob).mockReturnValue(
    new Promise(() => undefined),
  );
});

describe("Learning document deletion confirmation", () => {
  it("keeps deletion behind one record-specific More actions control and renders inert consequences", async () => {
    renderDeletion();
    expect(
      screen.getAllByRole("button", {
        name: `More actions for ${learningDocument().title}`,
      }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Delete document" }),
    ).toBeNull();

    const { dialog, input, finalAction } = await openConfirmation();

    expect(dialog.textContent).toContain(learningDocument().title);
    expect(dialog.textContent).toMatch(/permanently removes/i);
    expect(dialog.textContent).toMatch(
      /conversations, messages, flashcards, quizzes, and attempts/i,
    );
    expect(dialog.textContent).toMatch(/cannot be undone/i);
    expect(input).toBe(document.activeElement);
    expect((finalAction as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector("notes")).toBeNull();
    expect(dialog.querySelector("strong")?.textContent).toBe(
      learningDocument().title,
    );
    expect(dialog.textContent).not.toMatch(
      /storage|asset|507f1f77bcf86cd799439011/i,
    );
    expect(
      screen.queryByRole("button", {
        name: /delete (conversation|message|flashcard|quiz|attempt)/i,
      }),
    ).toBeNull();
  });

  it("requires the exact title after trimming only surrounding whitespace", async () => {
    renderDeletion();
    const { input, finalAction } = await openConfirmation();

    await userEvent.type(input, "Synthetic");
    expect((finalAction as HTMLButtonElement).disabled).toBe(true);
    await userEvent.clear(input);
    await userEvent.type(input, learningDocument().title.toLowerCase());
    expect((finalAction as HTMLButtonElement).disabled).toBe(true);
    await userEvent.clear(input);
    await userEvent.type(input, `  ${learningDocument().title}  `);
    expect((finalAction as HTMLButtonElement).disabled).toBe(false);
  });

  it("closes with Cancel or Escape and returns focus to More actions", async () => {
    renderDeletion();
    let controls = await openConfirmation();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(controls.trigger).toBe(document.activeElement);

    controls = await openConfirmation();
    fireEvent.keyDown(controls.dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => {
      expect(controls.trigger).toBe(document.activeElement);
    });
  });

  it("contains forward and reverse Tab focus inside the dialog", async () => {
    renderDeletion();
    const { dialog, input, finalAction } = await enterExactTitle();

    finalAction.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(input).toBe(document.activeElement);

    input.focus();
    fireEvent.keyDown(dialog, {
      key: "Tab",
      shiftKey: true,
    });
    expect(finalAction).toBe(document.activeElement);
  });

  it("blocks duplicate activation and disables dismissal while accepting", async () => {
    let resolveAcceptance:
      | ((value: Awaited<ReturnType<
          typeof learningApi.requestLearningDocumentDeletion
        >>) => void)
      | undefined;
    vi.mocked(learningApi.requestLearningDocumentDeletion).mockReturnValue(
      new Promise((resolve) => {
        resolveAcceptance = resolve;
      }),
    );
    renderDeletion();
    const { dialog, input, finalAction } = await enterExactTitle();

    fireEvent.click(finalAction);
    fireEvent.click(finalAction);

    expect(
      learningApi.requestLearningDocumentDeletion,
    ).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("dialog")).not.toBeNull();

    resolveAcceptance?.({
      job: {
        id: jobId,
        type: "learning.document.delete",
        status: "queued",
      },
    });
  });
});

describe("Learning document deletion lifecycle", () => {
  it("polls only the accepted job and reports queued then processing", async () => {
    let update: ((job: LearningDocumentDeletionJob) => void) | undefined;
    vi.mocked(learningPolling.pollLearningJob).mockImplementation((input) => {
      update = input.onUpdate;
      return new Promise(() => undefined);
    });
    const onDeletionAccepted = vi.fn();
    renderDeletion({ onDeletionAccepted });
    const { finalAction } = await enterExactTitle();
    await userEvent.click(finalAction);

    expect((await screen.findByRole("status")).textContent).toMatch(
      /deletion queued/i,
    );
    expect(onDeletionAccepted).toHaveBeenCalledTimes(1);
    expect(learningPolling.pollLearningJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId,
        documentId,
        fetchJob: learningApi.fetchLearningDocumentDeletionJob,
        signal: expect.any(AbortSignal),
      }),
    );

    act(() => {
      update?.(deletionJob("processing"));
    });
    expect(screen.getByRole("status").textContent).toMatch(
      /deletion processing/i,
    );
    expect(screen.queryByText(jobId)).toBeNull();
  });

  it("resumes the same paused job without another DELETE", async () => {
    vi.mocked(learningPolling.pollLearningJob)
      .mockResolvedValueOnce({
        reason: "paused",
        cause: "timeout",
        job: deletionJob("processing"),
      })
      .mockResolvedValueOnce({
        reason: "terminal",
        job: deletionJob("completed"),
      });
    vi.mocked(learningApi.fetchLearningDocument).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
      ),
    );
    renderDeletion();
    const { finalAction } = await enterExactTitle();
    await userEvent.click(finalAction);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Resume deletion checks",
      }),
    );

    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(learningPolling.pollLearningJob).mock.calls.map(
        ([input]) => input.jobId,
      ),
    ).toEqual([jobId, jobId]);
    expect(
      learningApi.requestLearningDocumentDeletion,
    ).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", {
        name: "Document library",
      }),
    ).not.toBeNull();
  });

  it.each(["failed", "cancelled"] as const)(
    "preserves a safe retry path after canonical %s",
    async (status) => {
      vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
        reason: "terminal",
        job: deletionJob(status, {
          error:
            status === "failed"
              ? {
                  code: "LEARNING_DOCUMENT_DELETION_FAILED",
                  message: "The document could not be deleted.",
                }
              : undefined,
        }),
      });
      renderDeletion();
      const { finalAction } = await enterExactTitle();
      await userEvent.click(finalAction);

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toMatch(
        status === "failed"
          ? /could not be deleted/i
          : /deletion was cancelled/i,
      );
      expect(
        screen.getByRole("button", {
          name: "Review deletion again",
        }),
      ).not.toBeNull();
      expect(
        learningApi.requestLearningDocumentDeletion,
      ).toHaveBeenCalledTimes(1);
    },
  );

  it("reconciles an uncertain transport outcome without repeating DELETE", async () => {
    vi.mocked(learningApi.requestLearningDocumentDeletion).mockRejectedValue(
      new TypeError("network unavailable"),
    );
    renderDeletion();
    const { finalAction } = await enterExactTitle();
    await userEvent.click(finalAction);

    expect(
      await screen.findByText(/the deletion request outcome is uncertain/i),
    ).not.toBeNull();
    expect(learningApi.fetchLearningDocument).toHaveBeenCalledWith(
      documentId,
      expect.any(AbortSignal),
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: "Review deletion again",
      }),
    );
    expect(
      learningApi.requestLearningDocumentDeletion,
    ).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", {
        name: `Delete “${learningDocument().title}”?`,
      }),
    ).not.toBeNull();
  });

  it("treats canonical absence after an uncertain request as success", async () => {
    vi.mocked(learningApi.requestLearningDocumentDeletion).mockRejectedValue(
      new TypeError("network unavailable"),
    );
    vi.mocked(learningApi.fetchLearningDocument).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
      ),
    );
    renderDeletion();
    const { finalAction } = await enterExactTitle();
    await userEvent.click(finalAction);

    expect(
      await screen.findByRole("heading", {
        name: "Document library",
      }),
    ).not.toBeNull();
    expect(
      learningApi.requestLearningDocumentDeletion,
    ).toHaveBeenCalledTimes(1);
  });

  it("observes an already-deleting document without offering another DELETE", async () => {
    vi.mocked(learningApi.fetchLearningDocument).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
      ),
    );
    renderDeletion({
      document: learningDocument({ status: "deleting" }),
    });

    expect(
      screen.queryByRole("button", {
        name: `More actions for ${learningDocument().title}`,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Delete document" }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Check deletion status",
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Document library",
      }),
    ).not.toBeNull();
    expect(
      learningApi.requestLearningDocumentDeletion,
    ).not.toHaveBeenCalled();
  });

  it("clears in-memory work and aborts when account identity changes", async () => {
    let deletionSignal: AbortSignal | undefined;
    vi.mocked(learningApi.requestLearningDocumentDeletion).mockImplementation(
      (_documentId, signal) => {
        deletionSignal = signal;
        return new Promise(() => undefined);
      },
    );
    const { rerender } = renderDeletion();
    const { finalAction } = await enterExactTitle();
    fireEvent.click(finalAction);

    const router = createMemoryRouter(
      [
        {
          path: "/learning/documents/:documentId",
          element: (
            <LearningDocumentDeletion
              accountId="account-b"
              document={learningDocument()}
              onDeletionAccepted={vi.fn()}
            />
          ),
        },
      ],
      {
        initialEntries: [`/learning/documents/${documentId}`],
      },
    );
    rerender(<RouterProvider router={router} />);

    expect(deletionSignal?.aborted).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not persist deletion state in browser storage or the URL", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    const session = vi.spyOn(window.sessionStorage.__proto__, "setItem");
    const { router } = renderDeletion();
    await openConfirmation();

    expect(local).not.toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe(
      `/learning/documents/${documentId}`,
    );
    expect(router.state.location.search).toBe("");
    expect(router.state.location.hash).toBe("");
  });
});
