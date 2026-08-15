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
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as learningApi from "./learningApi";
import * as learningPolling from "./learningPolling";
import { LearningDashboard } from "./LearningDashboard";
import type {
  LearningDocument,
  LearningPagination,
} from "./types";

let mockedAccountId = "library-user-id";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: mockedAccountId,
      email: "library@example.test",
      profile: { displayName: "Library User" },
    },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchLearningDocument: vi.fn(),
  fetchLearningDocumentDeletionJob: vi.fn(),
  fetchLearningDocumentSource: vi.fn(),
  fetchLearningJob: vi.fn(),
  listDocumentChunks: vi.fn(),
  listLearningDocuments: vi.fn(),
  requestLearningDocumentDeletion: vi.fn(),
  uploadLearningDocument: vi.fn(),
}));

vi.mock("./learningPolling", () => ({
  pollLearningJob: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const jobId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";
const pagination: LearningPagination = {
  page: 1,
  limit: 10,
  total: 1,
  pages: 1,
};

function learningDocument(
  overrides: Partial<LearningDocument> = {},
): LearningDocument {
  return {
    id: documentId,
    title: "Synthetic systems notes",
    originalFilename: "synthetic-systems-notes.pdf",
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 4,
    chunkCount: 7,
    summary: "Stored summary",
    summaryKeyPoints: [],
    processedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function pageResult(
  documents: LearningDocument[],
  page: LearningPagination = pagination,
) {
  return { documents, pagination: page };
}

async function openUploadForm() {
  await userEvent.click(
    screen.getByRole("button", { name: "Upload PDF" }),
  );
}

function renderLibrary(initialEntry = "/learning") {
  const router = createMemoryRouter(
    [{ path: "/learning", element: <LearningDashboard /> }],
    { initialEntries: [initialEntry] },
  );
  return {
    ...render(<RouterProvider router={router} />),
    router,
  };
}

beforeEach(() => {
  mockedAccountId = "library-user-id";
  vi.mocked(learningApi.listLearningDocuments).mockResolvedValue(
    pageResult([]),
  );
  vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
    reason: "terminal",
    job: {
      id: jobId,
      type: "learning.document.process",
      status: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result: {
        documentId,
        pageCount: 4,
        chunkCount: 7,
      },
      createdAt,
      updatedAt: createdAt,
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Learning document library", () => {
  it("shows a loading state", () => {
    vi.mocked(learningApi.listLearningDocuments).mockReturnValue(
      new Promise(() => undefined),
    );

    renderLibrary();

    expect(screen.getByText("Loading your documents…")).not.toBeNull();
  });

  it("shows a truthful empty state without sample data or fabricated metrics", async () => {
    renderLibrary();

    expect(
      await screen.findByText(
        "No documents match this view. Upload a private PDF to begin.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Learning document")).toBeNull();
    expect(screen.queryByText(/streak|score|progress percentage/i)).toBeNull();
  });

  it("filters by the canonical document status", async () => {
    renderLibrary();
    await screen.findByText(/No documents match/);

    await userEvent.selectOptions(
      screen.getByLabelText("Document status"),
      "failed",
    );

    await waitFor(() => {
      expect(learningApi.listLearningDocuments).toHaveBeenLastCalledWith(
        { page: 1, limit: 10, status: "failed" },
        expect.any(AbortSignal),
      );
    });
  });

  it("supports bounded document pagination", async () => {
    vi.mocked(learningApi.listLearningDocuments).mockResolvedValue(
      pageResult([learningDocument()], {
        page: 1,
        limit: 10,
        total: 11,
        pages: 2,
      }),
    );
    renderLibrary();

    await userEvent.click(
      await screen.findByRole("button", { name: "Next page" }),
    );

    await waitFor(() => {
      expect(learningApi.listLearningDocuments).toHaveBeenLastCalledWith(
        { page: 2, limit: 10 },
        expect.any(AbortSignal),
      );
    });
  });

  it("canonically refreshes while a visible document is processing", async () => {
    vi.useFakeTimers();
    vi.mocked(learningApi.listLearningDocuments)
      .mockResolvedValueOnce(
        pageResult([
          learningDocument({
            status: "processing",
            pageCount: 0,
            chunkCount: 0,
          }),
        ]),
      )
      .mockResolvedValueOnce(pageResult([learningDocument()]));

    renderLibrary();
    await act(async () => undefined);
    await vi.advanceTimersByTimeAsync(8_000);
    await act(async () => undefined);

    expect(learningApi.listLearningDocuments).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["failed", "Processing failed"],
    ["deleting", "Deleting"],
    ["processing", "Processing"],
    ["ready", "Ready"],
  ] as const)("shows the %s document state factually", async (
    status,
    label,
  ) => {
    vi.mocked(learningApi.listLearningDocuments).mockResolvedValue(
      pageResult([
        learningDocument({
          status,
          ...(status === "failed"
            ? {
                processingError: {
                  code: "DOCUMENT_TEXT_UNAVAILABLE",
                  message: "No extractable text was found.",
                },
              }
            : {}),
        }),
      ]),
    );

    renderLibrary();

    expect(await screen.findByText(label)).not.toBeNull();
    const moreActions = screen.queryByRole("button", {
      name: `More actions for ${learningDocument().title}`,
    });
    if (status === "deleting") {
      expect(moreActions).toBeNull();
      expect(screen.queryByRole("button", { name: "Delete document" })).toBeNull();
    } else {
      expect(moreActions).not.toBeNull();
      expect(screen.queryByRole("button", { name: "Delete document" })).toBeNull();
    }
  });

  it("presents supported dossier metadata through explicit semantic actions", async () => {
    vi.mocked(learningApi.listLearningDocuments).mockResolvedValue(
      pageResult([learningDocument()]),
    );

    renderLibrary();

    const card = await screen.findByRole("article", {
      name: "Synthetic systems notes",
    });
    expect(card.textContent).toContain("synthetic-systems-notes.pdf");
    expect(card.textContent).toContain("PDF document");
    expect(card.textContent).toContain("4 pages");
    expect(card.textContent).toContain("7 extracted sections");
    expect(
      card.querySelector("time[datetime='2026-07-26T01:00:00.000Z']"),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", {
        name: "Open workspace",
      }).getAttribute("href"),
    ).toBe(`/learning/documents/${documentId}`);
    const moreActions = screen.getByRole("button", {
      name: `More actions for ${learningDocument().title}`,
    });
    expect(screen.queryByRole("button", { name: "Delete document" })).toBeNull();
    await userEvent.click(moreActions);
    expect(screen.getByRole("button", { name: "Delete document" })).not.toBeNull();
    expect(card.textContent).not.toMatch(/file size/i);
  });

  it("offers manual refresh and preserves a safe request ID on failure", async () => {
    vi.mocked(learningApi.listLearningDocuments).mockRejectedValue(
      new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Documents are temporarily unavailable.",
        "request-library-0001",
      ),
    );
    renderLibrary();

    expect(
      await screen.findByText("Documents are temporarily unavailable."),
    ).not.toBeNull();
    expect(screen.getByText(/request-library-0001/)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Try loading again" }),
    ).not.toBeNull();
  });
});

describe("Learning PDF upload", () => {
  it("consumes the upload intent, opens the form, and focuses its title", async () => {
    const { router } = renderLibrary("/learning?action=upload");

    const title = await screen.findByRole("textbox", {
      name: "Document title",
    });
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(router.state.location.search).toBe("");
    expect(learningApi.uploadLearningDocument).not.toHaveBeenCalled();
  });

  it("requires a title before submission", async () => {
    renderLibrary();
    await openUploadForm();
    await userEvent.upload(
      screen.getByLabelText("PDF file"),
      new File(["%PDF"], "synthetic.pdf", {
        type: "application/pdf",
      }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    const title = screen.getByLabelText("Document title");
    const error = screen.getByText("Enter a document title.");
    expect(title.getAttribute("aria-describedby")).toContain(error.id);
    expect(document.activeElement).toBe(title);
  });

  it("requires a PDF file before submission", async () => {
    renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Synthetic title",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    const file = screen.getByLabelText("PDF file");
    const error = screen.getByText("Choose a PDF file.");
    const guidance = screen.getByText(/PDF only, up to 15 MB\./);
    expect(guidance.id).toBe("learning-upload-guidance");
    expect(file.getAttribute("aria-describedby")).toContain(error.id);
    expect(file.getAttribute("aria-describedby")).toContain(guidance.id);
    expect(document.activeElement).toBe(file);
  });

  it("focuses an upload summary when multiple fields are invalid", async () => {
    renderLibrary();
    await openUploadForm();

    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    const summary = screen.getByRole("alert");
    expect(summary.classList.contains("validation-summary")).toBe(true);
    expect(document.activeElement).toBe(summary);
    expect(
      screen.getByText("Enter a document title."),
    ).not.toBeNull();
    expect(screen.getByText("Choose a PDF file.")).not.toBeNull();
  });

  it("provides non-PDF and 15 MB guidance", async () => {
    renderLibrary();
    await openUploadForm();
    const input = screen.getByLabelText("PDF file");
    const textFile = new File(["plain text"], "notes.txt", {
      type: "text/plain",
    });

    await userEvent.upload(input, textFile, {
      applyAccept: false,
    });

    expect(
      screen.getByText("Choose a PDF file no larger than 15 MB."),
    ).not.toBeNull();
    expect(screen.getByText(/OCR is not supported/i)).not.toBeNull();
  });

  it("reports the selected PDF filename without claiming drag and drop", async () => {
    renderLibrary();
    await openUploadForm();

    await userEvent.upload(
      screen.getByLabelText("PDF file"),
      new File(["%PDF"], "selected-private-notes.pdf", {
        type: "application/pdf",
      }),
    );

    expect(
      screen.getByText("Selected: selected-private-notes.pdf"),
    ).not.toBeNull();
    expect(screen.queryByText(/drag and drop/i)).toBeNull();
  });

  it("prevents duplicate submission while upload is pending", async () => {
    vi.mocked(learningApi.uploadLearningDocument).mockReturnValue(
      new Promise(() => undefined),
    );
    renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Synthetic title",
    );
    await userEvent.upload(
      screen.getByLabelText("PDF file"),
      new File(["%PDF"], "synthetic.pdf", {
        type: "application/pdf",
      }),
    );
    const submit = screen.getByRole("button", {
      name: "Upload document",
    });

    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(learningApi.uploadLearningDocument).toHaveBeenCalledTimes(1);
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect(submit.textContent).toBe("Uploading…");
  });

  it("binds an accepted upload to its exact processing job", async () => {
    vi.mocked(learningApi.uploadLearningDocument).mockResolvedValue({
      document: learningDocument({
        status: "uploaded",
        pageCount: 0,
        chunkCount: 0,
      }),
      job: {
        id: jobId,
        type: "learning.document.process",
        status: "queued",
      },
      requestId: "request-upload-0001",
    });
    renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Synthetic title",
    );
    await userEvent.upload(
      screen.getByLabelText("PDF file"),
      new File(["%PDF"], "synthetic.pdf", {
        type: "application/pdf",
      }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    await waitFor(() => {
      expect(learningPolling.pollLearningJob).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId,
          documentId,
          fetchJob: learningApi.fetchLearningJob,
        }),
      );
    });
  });

  it("preserves title and file after a recoverable failure", async () => {
    vi.mocked(learningApi.uploadLearningDocument).mockRejectedValue(
      new ApiError(
        503,
        "UPLOAD_UNAVAILABLE",
        "Upload is temporarily unavailable.",
        "request-upload-0002",
      ),
    );
    renderLibrary();
    await openUploadForm();
    const title = screen.getByLabelText(
      "Document title",
    ) as HTMLInputElement;
    const fileInput = screen.getByLabelText(
      "PDF file",
    ) as HTMLInputElement;
    await userEvent.type(title, "Keep this title");
    await userEvent.upload(
      fileInput,
      new File(["%PDF"], "keep-this.pdf", {
        type: "application/pdf",
      }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    expect(
      await screen.findByText("Upload is temporarily unavailable."),
    ).not.toBeNull();
    expect(title.value).toBe("Keep this title");
    expect(fileInput.files?.[0]?.name).toBe("keep-this.pdf");
    expect(screen.getByText(/request-upload-0002/)).not.toBeNull();
  });

  it("shows paused polling and resumes only on explicit action", async () => {
    vi.mocked(learningApi.uploadLearningDocument).mockResolvedValue({
      document: learningDocument({
        status: "uploaded",
        pageCount: 0,
        chunkCount: 0,
      }),
      job: {
        id: jobId,
        type: "learning.document.process",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob)
      .mockResolvedValueOnce({
        reason: "paused",
        cause: "transport-failure",
        job: undefined,
      })
      .mockResolvedValueOnce({
        reason: "cancelled",
        job: undefined,
      });
    renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Synthetic title",
    );
    await userEvent.upload(
      screen.getByLabelText("PDF file"),
      new File(["%PDF"], "synthetic.pdf", {
        type: "application/pdf",
      }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Upload document" }),
    );

    const resume = await screen.findByRole("button", {
      name: "Resume status checks",
    });
    expect(screen.getByText(/Status checks are paused/)).not.toBeNull();
    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(1);

    await userEvent.click(resume);
    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(2);
  });

  it("aborts obsolete requests on unmount", async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(learningApi.listLearningDocuments).mockImplementation(
      async (_input, receivedSignal) => {
        signal = receivedSignal;
        return new Promise(() => undefined);
      },
    );
    const view = renderLibrary();

    view.unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("restores focus when the inline upload form is cancelled", async () => {
    renderLibrary();
    const trigger = screen.getByRole("button", { name: "Upload PDF" });
    await userEvent.click(trigger);

    await userEvent.click(
      screen.getByRole("button", { name: "Cancel upload" }),
    );

    expect(document.activeElement).toBe(trigger);
  });

  it("does not persist document upload state in browser storage", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Private title",
    );

    expect(local).not.toHaveBeenCalled();
  });

  it("clears private inline state when the authenticated account changes", async () => {
    const view = renderLibrary();
    await openUploadForm();
    await userEvent.type(
      screen.getByLabelText("Document title"),
      "Private account-scoped title",
    );

    mockedAccountId = "second-library-user-id";
    view.rerender(
      <MemoryRouter>
        <LearningDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Private account-scoped title"),
      ).toBeNull();
      expect(screen.queryByLabelText("Document title")).toBeNull();
    });
  });
});
