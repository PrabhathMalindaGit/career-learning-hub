import {
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
import * as resumeApi from "./resumeApi";
import { ResumeListPage } from "./ResumeListPage";
import * as polling from "./resumePolling";

vi.mock("./resumeApi", () => ({
  createResume: vi.fn(),
  fetchJob: vi.fn(),
  importResumePdf: vi.fn(),
  listResumes: vi.fn(),
}));

vi.mock("./resumePolling", async () => {
  const actual =
    await vi.importActual<typeof import("./resumePolling")>(
      "./resumePolling",
    );
  return {
    ...actual,
    pollResumeJob: vi.fn(),
  };
});

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const jobId = "507f1f77bcf86cd799439014";
const timestamp = "2026-07-24T10:00:00.000Z";

function resumeRecord() {
  return {
    id: resumeId,
    title: "Synthetic Platform Resume",
    status: "draft" as const,
    currentVersionId: versionId,
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4" as const,
      fontFamily: "Inter",
      showProfilePhoto: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function workspace() {
  return {
    resume: resumeRecord(),
    version: {
      id: versionId,
      resumeId,
      versionNumber: 1,
      source: "manual" as const,
      content: {
        basics: { fullName: "", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

function renderPage(initialEntry = "/resumes") {
  const router = createMemoryRouter(
    [
      { path: "/resumes", element: <ResumeListPage /> },
      {
        path: "/resumes/:resumeId",
        element: <h1>Opened resume</h1>,
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ResumeListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.listResumes).mockResolvedValue({
      resumes: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it("consumes the recognized create intent and focuses the title", async () => {
    const router = renderPage("/resumes?action=create");

    const title = await screen.findByRole("textbox", {
      name: "New resume title",
    });
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(router.state.location.search).toBe("");
    expect(resumeApi.createResume).not.toHaveBeenCalled();
  });

  it("ignores unknown intents without changing the URL", async () => {
    const router = renderPage("/resumes?action=unknown");

    await screen.findByRole("heading", { name: "Resume Studio" });
    expect(router.state.location.search).toBe("?action=unknown");
    expect(document.activeElement).not.toBe(
      screen.getByRole("textbox", { name: "New resume title" }),
    );
  });

  it("preserves the page heading, supporting copy, and list actions", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Resume Studio",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Create, import, and open your private resume records. Only validated server data is shown.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Create blank resume",
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Import private PDF",
      }),
    ).not.toBeNull();
  });

  it("shows factual loading and empty states", async () => {
    let resolveList:
      | ((value: Awaited<ReturnType<typeof resumeApi.listResumes>>) => void)
      | undefined;
    vi.mocked(resumeApi.listResumes).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    renderPage();
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    expect(document.querySelectorAll(".resume-skeleton-card")).toHaveLength(3);
    expect(document.body.textContent).not.toMatch(
      /score|recruiter|application views|progress/i,
    );

    resolveList?.({
      resumes: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
    expect(
      await screen.findByText(
        "No resumes yet. Create a blank resume or import a private PDF.",
      ),
    ).not.toBeNull();
  });

  it("renders only safe resume summary fields and opens a resume", async () => {
    vi.mocked(resumeApi.listResumes).mockResolvedValue({
      resumes: [resumeRecord()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    const router = renderPage();

    await screen.findByText("Synthetic Platform Resume");
    expect(screen.getByText("ATS Classic")).not.toBeNull();
    expect(screen.getByText("Slate palette")).not.toBeNull();
    expect(screen.getByText("Version 1")).not.toBeNull();
    expect(screen.getByText("Draft")).not.toBeNull();
    expect(
      document.querySelector('[data-resume-card-preview="ats-classic"]'),
    ).not.toBeNull();
    expect(screen.queryByText("Synthetic Candidate")).toBeNull();
    expect(document.body.textContent).not.toContain(resumeId);
    expect(document.body.textContent).not.toContain(versionId);
    expect(document.body.textContent).not.toMatch(
      /ats score|recruiter|application views|job outcomes|analysis count/i,
    );
    expect(document.body.textContent).not.toMatch(
      /ai resume analyser|resume builder/i,
    );
    await userEvent.click(
      screen.getByRole("link", { name: /open synthetic platform resume/i }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    });
  });

  it("shows a safe structured error and retries the current page", async () => {
    vi.mocked(resumeApi.listResumes)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "RESUMES_UNAVAILABLE",
          "Resumes are temporarily unavailable.",
          "list-request-id-0001",
        ),
      )
      .mockResolvedValueOnce({
        resumes: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    renderPage();

    expect(
      await screen.findByText("Resumes are temporarily unavailable."),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: list-request-id-0001")).not
      .toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Retry list" }));
    expect(
      await screen.findByText(
        "No resumes yet. Create a blank resume or import a private PDF.",
      ),
    ).not.toBeNull();
  });

  it("uses a labelled pager with caller-owned boundaries and page loading", async () => {
    vi.mocked(resumeApi.listResumes).mockImplementation(
      async (query) => ({
        resumes: [resumeRecord()],
        pagination: {
          page: query?.page ?? 1,
          limit: 20,
          total: 21,
          pages: 2,
        },
      }),
    );
    renderPage();

    const pager = await screen.findByRole("navigation", {
      name: "Resume pages",
    });
    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);
    expect(pager.textContent).toContain("Page 1");

    await userEvent.click(next);
    await waitFor(() => {
      expect(resumeApi.listResumes).toHaveBeenLastCalledWith(
        { page: 2, limit: 20 },
        expect.any(AbortSignal),
      );
    });
  });

  it("validates title and prevents duplicate create submissions", async () => {
    vi.mocked(resumeApi.createResume).mockReturnValue(
      new Promise(() => undefined),
    );
    renderPage();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Create blank resume" }),
    );
    const createTitle = screen.getByRole("textbox", {
      name: "New resume title",
    });
    const createTitleError = screen.getByText(
      "Enter a title with 1–120 characters.",
    );
    expect(createTitle.getAttribute("aria-describedby")).toContain(
      createTitleError.id,
    );
    expect(document.activeElement).toBe(createTitle);
    await user.type(
      createTitle,
      "Synthetic Resume",
    );
    const submit = screen.getByRole("button", {
      name: "Create blank resume",
    });
    await user.click(submit);
    await user.click(submit);

    expect(resumeApi.createResume).toHaveBeenCalledTimes(1);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect(submit.textContent).toBe("Creating…");
  });

  it("associates import errors and focuses a summary for multiple failures", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );

    await user.click(
      screen.getByRole("button", { name: "Import private PDF" }),
    );

    const title = screen.getByRole("textbox", {
      name: "Imported resume title",
    });
    const file = screen.getByLabelText("Private PDF");
    const titleError = screen.getByText(
      "Enter a title with 1–120 characters.",
    );
    const fileError = screen.getByText(
      "Choose one PDF no larger than 15 MB.",
    );
    const summary = screen.getByRole("alert");

    expect(title.getAttribute("aria-describedby")).toContain(titleError.id);
    expect(file.getAttribute("aria-describedby")).toContain(fileError.id);
    expect(document.activeElement).toBe(summary);
    expect(resumeApi.importResumePdf).not.toHaveBeenCalled();
  });

  it("offers a keyboard-operable private PDF dropzone", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    const input = screen.getByLabelText("Private PDF");
    const openPicker = screen.getByRole("button", {
      name: "Choose a private PDF",
    });
    const click = vi.spyOn(input as HTMLInputElement, "click");

    openPicker.focus();
    await user.keyboard("{Enter}");

    expect(openPicker).toBe(document.activeElement);
    expect(click).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("group", { name: "Private PDF dropzone" }),
    ).not.toBeNull();
    expect(screen.getByText(/PDF only · maximum 15 MB/i)).not.toBeNull();
    expect(screen.getByText(/processed privately/i)).not.toBeNull();
  });

  it("shows drag-over feedback and accepts a dropped PDF selection", async () => {
    renderPage();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    const dropzone = screen.getByRole("group", {
      name: "Private PDF dropzone",
    });
    const file = new File(["%PDF-synthetic"], "dropped-synthetic.pdf", {
      type: "application/pdf",
    });

    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });
    expect(dropzone.getAttribute("data-drag-active")).toBe("true");

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });
    expect(dropzone.getAttribute("data-drag-active")).toBe("false");
    expect(screen.getByText("dropped-synthetic.pdf")).not.toBeNull();
    expect(screen.getByText("14 B")).not.toBeNull();
  });

  it("navigates only after a validated create response", async () => {
    vi.mocked(resumeApi.createResume).mockResolvedValue(workspace());
    const router = renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "New resume title" }),
      "Synthetic Resume",
    );
    await user.click(
      screen.getByRole("button", { name: "Create blank resume" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    });
  });

  it("accepts one bounded PDF and navigates after validated job completion", async () => {
    vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
      id: jobId,
      type: "resume.import-pdf",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "resume.import-pdf",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "import",
          resumeId,
          versionId,
          versionNumber: 1,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    const router = renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Imported resume title" }),
      "Imported Resume",
    );
    const file = new File(["%PDF-synthetic"], "synthetic.pdf", {
      type: "application/pdf",
    });
    await user.upload(
      screen.getByLabelText("Private PDF"),
      file,
    );
    expect(screen.getByText("synthetic.pdf")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Import private PDF" }),
    );

    expect(resumeApi.importResumePdf).toHaveBeenCalledWith(
      "Imported Resume",
      file,
      expect.any(AbortSignal),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    });
  });

  it("shows a provider-neutral message when PDF import fails", async () => {
    vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
      id: jobId,
      type: "resume.import-pdf",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "resume.import-pdf",
        status: "failed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        error: {
          code: "AI_PROVIDER_NOT_CONFIGURED",
          message: "Gemini is not configured.",
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Imported resume title" }),
      "Imported Resume",
    );
    await user.upload(
      screen.getByLabelText("Private PDF"),
      new File(["%PDF-synthetic"], "synthetic.pdf", {
        type: "application/pdf",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Import private PDF" }),
    );

    expect(
      await screen.findByText(
        "The import job failed without creating a resume.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Gemini is not configured.")).toBeNull();
  });

  it("rejects a non-PDF before enqueue", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Imported resume title" }),
      "Imported Resume",
    );
    fireEvent.change(screen.getByLabelText("Private PDF"), {
      target: {
        files: [
          new File(["text"], "notes.txt", { type: "text/plain" }),
        ],
      },
    });
    await user.click(
      screen.getByRole("button", { name: "Import private PDF" }),
    );

    expect(
      screen.getByText("Choose one PDF no larger than 15 MB."),
    ).not.toBeNull();
    const file = screen.getByLabelText("Private PDF");
    const fileError = screen.getByText(
      "Choose one PDF no larger than 15 MB.",
    );
    expect(file.getAttribute("aria-describedby")).toContain(fileError.id);
    expect(document.activeElement).toBe(file);
    expect(resumeApi.importResumePdf).not.toHaveBeenCalled();
  });
});
