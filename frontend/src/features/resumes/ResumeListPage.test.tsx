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

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/resumes", element: <ResumeListPage /> },
      {
        path: "/resumes/:resumeId",
        element: <h1>Opened resume</h1>,
      },
    ],
    { initialEntries: ["/resumes"] },
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
    expect(screen.queryByText("Synthetic Candidate")).toBeNull();
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
    expect(screen.getByText("Enter a title with 1–120 characters.")).not
      .toBeNull();
    await user.type(
      screen.getByRole("textbox", { name: "New resume title" }),
      "Synthetic Resume",
    );
    const submit = screen.getByRole("button", {
      name: "Create blank resume",
    });
    await user.click(submit);
    await user.click(submit);

    expect(resumeApi.createResume).toHaveBeenCalledTimes(1);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
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
    expect(resumeApi.importResumePdf).not.toHaveBeenCalled();
  });
});
