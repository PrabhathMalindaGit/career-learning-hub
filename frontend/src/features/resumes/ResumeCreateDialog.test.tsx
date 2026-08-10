import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { ResumeCreateDialog } from "./ResumeCreateDialog";
import * as resumeApi from "./resumeApi";
import * as polling from "./resumePolling";

vi.mock("./resumeApi", () => ({
  confirmResumePdfImport: vi.fn(),
  createResume: vi.fn(),
  fetchJob: vi.fn(),
  importResumePdf: vi.fn(),
}));

vi.mock("./resumePolling", () => ({
  pollResumeJob: vi.fn(),
}));

const workspace = {
  resume: {
    id: "507f1f77bcf86cd799439011",
    title: "Synthetic Resume",
    status: "draft" as const,
    currentVersionId: "507f1f77bcf86cd799439012",
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4" as const,
      fontFamily: "Inter",
      showProfilePhoto: false,
    },
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
  },
  version: {
    id: "507f1f77bcf86cd799439012",
    resumeId: "507f1f77bcf86cd799439011",
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
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
  },
};

const reviewContent = {
  basics: {
    fullName: "Synthetic Candidate",
    email: "candidate@example.test",
    links: [],
  },
  experience: [
    {
      id: "123e4567-e89b-42d3-a456-426614174001",
      employer: "Synthetic Company",
      jobTitle: "Engineer",
      isCurrent: false,
      bullets: [],
    },
  ],
  education: [],
  skills: [
    {
      id: "123e4567-e89b-42d3-a456-426614174002",
      name: "Tools",
      keywords: ["Git"],
    },
    {
      id: "123e4567-e89b-42d3-a456-426614174003",
      name: "Testing",
      keywords: ["Vitest"],
    },
  ],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

function completedReviewJob() {
  return {
    id: "507f1f77bcf86cd799439014",
    type: "resume.import-pdf" as const,
    status: "completed" as const,
    progress: 100,
    attempts: 1,
    maxAttempts: 3,
    phase: "completed" as const,
    phaseSequence: 5,
    canRetry: false,
    result: { kind: "import-review" as const, content: reviewContent },
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:01.000Z",
  };
}

async function submitReviewImport(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
    id: completedReviewJob().id,
    type: "resume.import-pdf",
    status: "queued",
  });
  vi.mocked(polling.pollResumeJob).mockResolvedValue({
    reason: "terminal",
    job: completedReviewJob(),
  });
  await user.click(screen.getByRole("button", { name: "Create Resume" }));
  await user.click(screen.getByRole("button", { name: "Import PDF" }));
  await user.type(
    screen.getByRole("textbox", { name: "Imported resume title" }),
    "Reviewed Resume",
  );
  await user.upload(
    screen.getByLabelText("Resume PDF"),
    new File(["%PDF"], "review.pdf", { type: "application/pdf" }),
  );
  await user.click(screen.getByRole("button", { name: "Import private PDF" }));
}

function Harness({
  onCreated = vi.fn(),
}: {
  onCreated?: (value: typeof workspace) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <MemoryRouter>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Create Resume
      </button>
      <ResumeCreateDialog
        open={open}
        returnFocusRef={triggerRef}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </MemoryRouter>
  );
}

describe("ResumeCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers three ordered keyboard-operable methods without starting work", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Create Resume" });
    await userEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Create Resume" });
    const methods = ["Guided setup", "Start blank", "Import PDF"].map(
      (name) => within(dialog).getByRole("button", { name }),
    );
    expect(methods).toHaveLength(3);
    expect(methods.map((button) => button.textContent)).toEqual([
      "RecommendedGuided setupBuild a resume using editable suggestions.",
      "Start blankCreate an empty resume.",
      "Import PDFImport an existing resume.",
    ]);
    const recommendedBadge = within(methods[0]).getByText("Recommended");
    expect(
      recommendedBadge.classList.contains("resume-create-method-badge"),
    ).toBe(true);
    expect(recommendedBadge.id).not.toBe("");
    expect(methods[0].getAttribute("aria-describedby")).toBe(
      recommendedBadge.id,
    );
    expect(
      within(dialog)
        .getByRole("button", { name: "Cancel" })
        .closest(".resume-create-methods-footer"),
    ).not.toBeNull();
    expect(document.activeElement).toBe(methods[0]);
    expect(resumeApi.createResume).not.toHaveBeenCalled();
    expect(resumeApi.importResumePdf).not.toHaveBeenCalled();

    methods[0].focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Guided setup" })).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Guided setup" })).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Import PDF" }));
    expect(screen.getByRole("heading", { name: "Import PDF" })).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.click(trigger);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Guided setup" }),
    );
  });

  it("validates, trims, and creates a blank resume exactly once", async () => {
    const onCreated = vi.fn();
    let resolveCreate: ((value: typeof workspace) => void) | undefined;
    vi.mocked(resumeApi.createResume).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    const title = screen.getByRole("textbox", { name: "Resume title" });
    const submit = screen.getByRole("button", { name: "Create blank resume" });

    await user.click(submit);
    expect(document.activeElement).toBe(title);
    expect(screen.getByText("Enter a title with 1–120 characters.")).not.toBeNull();

    await user.type(title, "  Synthetic Resume  ");
    await user.click(submit);
    await user.click(submit);
    expect(resumeApi.createResume).toHaveBeenCalledTimes(1);
    expect(resumeApi.createResume).toHaveBeenCalledWith(
      { title: "Synthetic Resume" },
      expect.any(AbortSignal),
    );
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    resolveCreate?.(workspace);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workspace));
  });

  it("keeps a busy request open and renders safe request-ID errors", async () => {
    vi.mocked(resumeApi.createResume)
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "RESUME_CREATE_UNAVAILABLE",
          "Resume creation is temporarily unavailable.",
          "create-request-id-0001",
        ),
      );
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    await user.type(screen.getByRole("textbox", { name: "Resume title" }), "Busy");
    await user.click(screen.getByRole("button", { name: "Create blank resume" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).not.toBeNull();

    unmount();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    await user.type(screen.getByRole("textbox", { name: "Resume title" }), "Error");
    await user.click(screen.getByRole("button", { name: "Create blank resume" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Resume creation is temporarily unavailable. Request ID: create-request-id-0001",
    );
  });

  it("uses the canonical upload and preserves import polling resilience", async () => {
    const jobId = "507f1f77bcf86cd799439014";
    const processingJob = {
      id: jobId,
      type: "resume.import-pdf" as const,
      status: "processing" as const,
      progress: 40,
      attempts: 1,
      maxAttempts: 3,
      phase: "contacting_provider" as const,
      phaseSequence: 2,
      canRetry: false,
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:01.000Z",
    };
    vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
      id: jobId,
      type: "resume.import-pdf",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockImplementation(async (options) => {
      options.onUpdate?.(processingJob);
      return { reason: "timeout", job: processingJob };
    });
    render(<Harness />);
    const user = userEvent.setup();
    const file = new File(["%PDF-synthetic"], "synthetic.pdf", {
      type: "application/pdf",
    });

    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Import PDF" }));
    await user.type(screen.getByRole("textbox", { name: "Imported resume title" }), " Imported Resume ");
    await user.upload(screen.getByLabelText("Resume PDF"), file);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Import private PDF" }));

    expect(resumeApi.importResumePdf).toHaveBeenCalledWith(
      "Imported Resume",
      file,
      expect.any(AbortSignal),
    );
    expect(await screen.findByText("Import processing")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Check status" })).not.toBeNull();
  });

  it("explains unavailable Gemini import without exposing provider details", async () => {
    vi.mocked(resumeApi.importResumePdf).mockRejectedValue(
      new ApiError(
        503,
        "AI_PROVIDER_NOT_CONFIGURED",
        "Internal provider configuration detail.",
        "import-request-id-0001",
      ),
    );
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Import PDF" }));
    await user.type(screen.getByRole("textbox", { name: "Imported resume title" }), "Import");
    await user.upload(
      screen.getByLabelText("Resume PDF"),
      new File(["%PDF"], "resume.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Import private PDF" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("PDF import needs a connected Gemini account.");
    expect(alert.textContent).toContain("Request ID: import-request-id-0001");
    expect(alert.textContent).not.toContain("Internal provider configuration detail.");
    expect(screen.getByRole("link", { name: "Open Settings" }).getAttribute("href")).toBe("/settings");
  });

  it("shows deterministic read-only Import Review evidence before adoption", async () => {
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await submitReviewImport(user);

    expect(await screen.findByRole("heading", { name: "Import Review" })).not.toBeNull();
    expect(screen.getByText("Full name extracted")).not.toBeNull();
    expect(screen.getByText("Email extracted")).not.toBeNull();
    expect(screen.getByText("2 entries extracted")).not.toBeNull();
    expect(screen.getByText("1 entry extracted")).not.toBeNull();
    expect(screen.getByText("Not found")).not.toBeNull();
    expect(screen.queryByText(/confidence|needs review|certainty/i)).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    const previewDisclosure = screen.getByText("Preview extracted Resume").closest("details");
    expect(previewDisclosure?.open).toBe(false);
    expect(resumeApi.confirmResumePdfImport).not.toHaveBeenCalled();
    expect(resumeApi.createResume).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Import PDF" })).not.toBeNull();
    expect(resumeApi.confirmResumePdfImport).not.toHaveBeenCalled();
  });

  it("confirms once, retains review on safe failure, and adopts only validated success", async () => {
    const onCreated = vi.fn();
    let resolveConfirmation: ((value: typeof workspace) => void) | undefined;
    vi.mocked(resumeApi.confirmResumePdfImport)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "RESUME_IMPORT_CONFIRM_FAILED",
          "Confirmation is temporarily unavailable.",
          "confirm-request-id-0001",
        ),
      )
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveConfirmation = resolve;
      }));
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await submitReviewImport(user);
    const confirm = await screen.findByRole("button", {
      name: "Confirm and open in editor",
    });

    await user.click(confirm);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Request ID: confirm-request-id-0001",
    );
    expect(screen.getByRole("heading", { name: "Import Review" })).not.toBeNull();
    expect(onCreated).not.toHaveBeenCalled();

    await user.click(confirm);
    await user.click(confirm);
    expect(resumeApi.confirmResumePdfImport).toHaveBeenCalledTimes(2);
    expect(resumeApi.confirmResumePdfImport).toHaveBeenLastCalledWith(
      completedReviewJob().id,
      expect.any(AbortSignal),
    );
    resolveConfirmation?.(workspace);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workspace));
  });

  it("closes a review without confirming or creating", async () => {
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await submitReviewImport(user);
    await screen.findByRole("heading", { name: "Import Review" });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(resumeApi.confirmResumePdfImport).not.toHaveBeenCalled();
    expect(resumeApi.createResume).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("reconciles an already-adopted poll result through the idempotent confirm endpoint", async () => {
    const adoptedJob = {
      ...completedReviewJob(),
      result: {
        kind: "import-adopted" as const,
        resumeId: workspace.resume.id,
        versionId: workspace.version.id,
        versionNumber: 1,
      },
    };
    vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
      id: adoptedJob.id,
      type: "resume.import-pdf",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: adoptedJob,
    });
    vi.mocked(resumeApi.confirmResumePdfImport).mockResolvedValue(workspace);
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Import PDF" }));
    await user.type(
      screen.getByRole("textbox", { name: "Imported resume title" }),
      "Adopted Resume",
    );
    await user.upload(
      screen.getByLabelText("Resume PDF"),
      new File(["%PDF"], "adopted.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Import private PDF" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workspace));
    expect(resumeApi.confirmResumePdfImport).toHaveBeenCalledTimes(1);
    expect(resumeApi.createResume).not.toHaveBeenCalled();
  });

  it("creates guided content in one canonical request", async () => {
    const onCreated = vi.fn();
    vi.mocked(resumeApi.createResume).mockResolvedValue(workspace);
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Guided setup" }));
    await user.type(screen.getByRole("textbox", { name: "Resume title" }), " Guided ");
    await user.type(screen.getByRole("combobox", { name: "Target role" }), "Custom Role");
    await user.click(screen.getByRole("checkbox", { name: "Use target role as Resume headline" }));
    await user.click(screen.getByRole("button", { name: "Create guided resume" }));

    expect(resumeApi.createResume).toHaveBeenCalledTimes(1);
    expect(resumeApi.createResume).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Guided",
        content: expect.objectContaining({
          basics: { fullName: "", headline: "Custom Role", links: [] },
          skills: [],
        }),
      }),
      expect.any(AbortSignal),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workspace));
  });
});
