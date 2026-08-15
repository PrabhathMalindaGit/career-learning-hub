import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeCreateDialog } from "./ResumeCreateDialog";
import * as candidatePhoto from "./resumeCandidatePhoto";
import * as resumeApi from "./resumeApi";
import * as polling from "./resumePolling";

vi.mock("./resumeApi", () => ({
  confirmResumePdfImport: vi.fn(),
  createResume: vi.fn(),
  fetchJob: vi.fn(),
  fetchResumeImportPhotoCandidateSource: vi.fn(),
  importResumePdf: vi.fn(),
}));

vi.mock("./resumeCandidatePhoto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resumeCandidatePhoto")>();
  return {
    ...actual,
    loadCanonicalCandidatePhoto: vi.fn(),
  };
});

vi.mock("./resumePolling", () => ({
  pollResumeJob: vi.fn(),
}));

const jobId = "507f1f77bcf86cd799439014";
const photoAssetId = "507f1f77bcf86cd799439015";
const stableId = "123e4567-e89b-42d3-a456-426614174000";

const reviewContent = {
  basics: { fullName: "Synthetic Candidate", links: [] },
  experience: [],
  education: [],
  skills: [
    {
      id: stableId,
      name: "Technical Skills",
      keywords: ["TypeScript"],
    },
  ],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

const workspace = {
  resume: {
    id: "507f1f77bcf86cd799439011",
    title: "Imported Resume",
    status: "draft" as const,
    currentVersionId: "507f1f77bcf86cd799439012",
    candidatePhotoAssetId: photoAssetId,
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4" as const,
      fontFamily: "Inter",
      showProfilePhoto: true,
    },
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-15T00:00:00.000Z",
  },
  version: {
    id: "507f1f77bcf86cd799439012",
    resumeId: "507f1f77bcf86cd799439011",
    versionNumber: 1,
    source: "pdf-import" as const,
    content: reviewContent,
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-15T00:00:00.000Z",
  },
};

function completedReviewJob() {
  return {
    id: jobId,
    type: "resume.import-pdf" as const,
    status: "completed" as const,
    progress: 100,
    attempts: 1,
    maxAttempts: 3,
    phase: "completed" as const,
    phaseSequence: 5,
    canRetry: false,
    result: {
      kind: "import-review" as const,
      content: reviewContent,
      photoCandidates: [{ assetId: photoAssetId }],
    },
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-15T00:00:01.000Z",
  };
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

async function openReview(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(resumeApi.importResumePdf).mockResolvedValue({
    id: jobId,
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
    "Imported Resume",
  );
  await user.upload(
    screen.getByLabelText("Resume PDF"),
    new File(["%PDF"], "resume.pdf", { type: "application/pdf" }),
  );
  await user.click(screen.getByRole("button", { name: "Import private PDF" }));
  expect(
    await screen.findByRole("heading", { name: "Import Review" }),
  ).not.toBeNull();
}

describe("ResumeCreateDialog imported photo review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.fetchResumeImportPhotoCandidateSource).mockResolvedValue({
      url: "https://example.test/extracted-photo",
      expiresAt: "2026-08-15T01:00:00.000Z",
    });
    vi.mocked(candidatePhoto.loadCanonicalCandidatePhoto).mockResolvedValue(
      "blob:extracted-photo",
    );
  });

  it("shows extracted photo choices with no photo selected by default", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await openReview(user);

    expect(
      screen.getByRole("group", { name: "Possible candidate photo from PDF" }),
    ).not.toBeNull();
    expect(
      (
        screen.getByRole("radio", {
          name: "Do not import a photo",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (
        screen.getByRole("radio", {
          name: "Use extracted photo 1",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
  });

  it("keeps the existing bodyless confirmation path when no photo is selected", async () => {
    const onCreated = vi.fn();
    vi.mocked(resumeApi.confirmResumePdfImport).mockResolvedValue(workspace);
    render(<Harness onCreated={onCreated} />);
    const user = userEvent.setup();
    await openReview(user);

    await user.click(
      screen.getByRole("button", { name: "Confirm and open in editor" }),
    );

    expect(resumeApi.confirmResumePdfImport).toHaveBeenCalledWith(
      jobId,
      expect.any(AbortSignal),
    );
    expect(resumeApi.confirmResumePdfImport).not.toHaveBeenCalledWith(
      jobId,
      expect.any(AbortSignal),
      undefined,
    );
  });

  it("sends only the explicitly selected candidate when confirming", async () => {
    vi.mocked(resumeApi.confirmResumePdfImport).mockResolvedValue(workspace);
    render(<Harness />);
    const user = userEvent.setup();
    await openReview(user);

    await user.click(
      screen.getByRole("radio", { name: "Use extracted photo 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm and open in editor" }),
    );

    expect(resumeApi.confirmResumePdfImport).toHaveBeenCalledWith(
      jobId,
      expect.any(AbortSignal),
      photoAssetId,
    );
  });

  it("resets photo selection when returning to import", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await openReview(user);

    await user.click(
      screen.getByRole("radio", { name: "Use extracted photo 1" }),
    );
    expect(
      (
        screen.getByRole("radio", {
          name: "Use extracted photo 1",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Import PDF" })).not.toBeNull();
  });
});
