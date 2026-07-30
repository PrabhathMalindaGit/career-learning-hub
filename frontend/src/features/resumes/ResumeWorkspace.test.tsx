import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
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
import * as resumePrint from "./resumePrint";
import * as polling from "./resumePolling";
import { ResumeWorkspace } from "./ResumeWorkspace";
import type {
  ResumeAnalysis,
  ResumeDesign,
  ResumeWorkspaceData,
} from "./types";

vi.mock("./resumeApi", () => ({
  applyResumeSuggestions: vi.fn(),
  fetchJob: vi.fn(),
  fetchResume: vi.fn(),
  fetchResumeAnalysis: vi.fn(),
  fetchResumeVersion: vi.fn(),
  listResumeVersions: vi.fn(),
  queueResumeAnalysis: vi.fn(),
  saveResumeVersion: vi.fn(),
  updateResumeDesign: vi.fn(),
}));

vi.mock("./resumePrint", async () => {
  const actual =
    await vi.importActual<typeof import("./resumePrint")>(
      "./resumePrint",
    );
  return { ...actual, openResumePrint: vi.fn() };
});

vi.mock("./resumePolling", async () => {
  const actual =
    await vi.importActual<typeof import("./resumePolling")>(
      "./resumePolling",
    );
  return { ...actual, pollResumeJob: vi.fn() };
});

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const nextVersionId = "507f1f77bcf86cd799439013";
const analysisId = "507f1f77bcf86cd799439014";
const jobId = "507f1f77bcf86cd799439015";
const stableId = "123e4567-e89b-42d3-a456-426614174000";
const suggestionId = "123e4567-e89b-42d3-a456-426614174001";
const timestamp = "2026-07-24T10:00:00.000Z";
const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

function workspace(
  activeVersionId = versionId,
  fullName = "Synthetic Candidate",
  ownerResumeId = resumeId,
  designOverride: Partial<ResumeDesign> = {},
): ResumeWorkspaceData {
  return {
    resume: {
      id: ownerResumeId,
      title: "Synthetic Platform Resume",
      status: "draft",
      currentVersionId: activeVersionId,
      latestVersionNumber: activeVersionId === versionId ? 1 : 2,
      design: {
        templateId: "unknown-persisted-template",
        colorPaletteId: "unknown-persisted-palette",
        pageSize: "A4",
        fontFamily: "unknown-persisted-font",
        showProfilePhoto: false,
        ...designOverride,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    version: {
      id: activeVersionId,
      resumeId: ownerResumeId,
      versionNumber: activeVersionId === versionId ? 1 : 2,
      source: "manual",
      content: {
        basics: { fullName, links: [] },
        experience: [
          {
            id: stableId,
            employer: "Example",
            jobTitle: "Engineer",
            isCurrent: true,
            bullets: [],
          },
        ],
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

function analysis(): ResumeAnalysis {
  return {
    id: analysisId,
    resumeId,
    resumeVersionId: versionId,
    target: { role: "Platform Engineer" },
    scoreBreakdown: {
      keywordMatch: 20,
      clarity: 21,
      evidence: 22,
      formatting: 23,
    },
    totalScore: 86,
    issues: [
      {
        code: "MISSING_EVIDENCE",
        severity: "medium",
        message: "Add evidence where it is factual.",
      },
    ],
    strengths: [
      {
        title: "Clear scope",
        detail: "Responsibilities are easy to scan.",
      },
    ],
    missingKeywords: ["observability"],
    suggestions: [
      {
        id: suggestionId,
        bulletId: stableId,
        originalText: "Built a service.",
        rewrittenText: "Built a reliable service.",
        rationale: "Adds specificity.",
        verificationRequired: true,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function renderWorkspace() {
  const router = createMemoryRouter(
    [
      { path: "/resumes/:resumeId", element: <ResumeWorkspace /> },
      { path: "/dashboard", element: <h1>Dashboard destination</h1> },
    ],
    { initialEntries: [`/resumes/${resumeId}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ResumeWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.fetchResume).mockResolvedValue(workspace());
    vi.mocked(resumeApi.listResumeVersions).mockResolvedValue({
      versions: [
        {
          id: versionId,
          versionNumber: 1,
          source: "manual",
          changeSummary: "Initial version",
          createdAt: timestamp,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
  });

  it("loads the route-owned canonical workspace and renders the neutral A4 preview", async () => {
    renderWorkspace();
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);

    expect(
      await screen.findByRole("heading", {
        name: "Synthetic Platform Resume",
      }),
    ).not.toBeNull();
    const breadcrumbs = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(breadcrumbs.textContent).toContain("Synthetic Platform Resume");
    expect(breadcrumbs.textContent).not.toContain(resumeId);
    expect(
      (screen.getByLabelText("Full name") as HTMLInputElement).value,
    ).toBe("Synthetic Candidate");
    expect(
      screen
        .getByLabelText("Resume preview")
        .getAttribute("data-template"),
    ).toBe("ats-classic");
    expect(screen.queryByText("unknown-persisted-template")).toBeNull();
    expect(
      screen.getByText(/saved design choices are no longer available/i),
    ).not.toBeNull();
    expect(resumeApi.updateResumeDesign).not.toHaveBeenCalled();
  });

  it("stacks the editor, preview, assessments, and history without a sticky live preview", async () => {
    renderWorkspace();
    await screen.findByLabelText("Full name");

    const editor = screen.getByRole("region", {
      name: "Resume editor",
    });
    const preview = screen.getByRole("region", {
      name: "Live preview",
    });
    const roleAwareAssessment = screen.getByRole("complementary", {
      name: "Role-aware assessment",
    });
    const aiAssessment = screen.getByRole("complementary", {
      name: "AI-assisted assessment",
    });
    const versionHistory = screen.getByRole("region", {
      name: "Version history",
    });
    const applySuggestions = screen.getByRole("button", {
      name: "Apply selected suggestions",
    });
    const workspaceGrid = editor.parentElement;

    expect(workspaceGrid?.classList.contains("resume-workspace-grid")).toBe(
      true,
    );
    expect(Array.from(workspaceGrid?.children ?? [])).toEqual([
      editor,
      preview,
      roleAwareAssessment,
      aiAssessment,
    ]);
    expect(
      aiAssessment.compareDocumentPosition(versionHistory) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(aiAssessment.contains(applySuggestions)).toBe(true);

    const workspaceGridRule = resumeWorkspaceCss.match(
      /\.resume-workspace-grid\s*\{([^}]*)\}/,
    )?.[1];
    const previewPanelRule = resumeWorkspaceCss.match(
      /\.resume-preview-panel\s*\{([^}]*)\}/,
    )?.[1];
    const livePaperRule = resumeWorkspaceCss.match(
      /\.resume-workspace-grid > \.resume-preview-panel \.resume-paper\s*\{([^}]*)\}/,
    )?.[1];

    expect(workspaceGridRule).toContain(
      "grid-template-columns: minmax(0, 1fr);",
    );
    expect(previewPanelRule).toContain("position: static;");
    expect(previewPanelRule).not.toContain("position: sticky;");
    expect(livePaperRule).toContain("max-width: 860px;");
    expect(livePaperRule).toContain("margin-inline: auto;");
  });

  it("edits with stable identity, previews live, and adopts the canonical save response", async () => {
    vi.mocked(resumeApi.saveResumeVersion).mockResolvedValue(
      workspace(nextVersionId, "Updated Candidate"),
    );
    renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");

    await user.clear(fullName);
    await user.type(fullName, "Updated Candidate");
    expect(screen.getByText("Unsaved changes")).not.toBeNull();
    expect(
      screen.getByLabelText("Resume preview").textContent,
    ).toContain("Updated Candidate");
    await user.click(
      screen.getByRole("button", { name: "Save new version" }),
    );

    await waitFor(() => {
      expect(resumeApi.saveResumeVersion).toHaveBeenCalledWith(
        resumeId,
        expect.objectContaining({
          expectedCurrentVersionId: versionId,
          content: expect.objectContaining({
            experience: [
              expect.objectContaining({ id: stableId }),
            ],
          }),
        }),
        expect.any(AbortSignal),
      );
    });
    expect(
      await screen.findByText("Version 2 saved."),
    ).not.toBeNull();
    expect(screen.queryByText("Unsaved changes")).toBeNull();
  });

  it("prints the canonical saved current version and blocks the mutable dirty draft", async () => {
    vi.mocked(resumePrint.openResumePrint).mockResolvedValue(true);
    renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    const printButton = screen.getByRole("button", {
      name: "Open print dialog for saved version 1",
    });

    expect(screen.getByText("Current saved version 1")).not.toBeNull();
    expect((printButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(printButton);
    expect(resumePrint.openResumePrint).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "synthetic-platform-resume-v1-a4",
      }),
    );

    await user.clear(fullName);
    await user.type(fullName, "Mutable Draft Candidate");

    expect((printButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/save new version or discard/i)).not.toBeNull();
    const printSurface = screen.getByLabelText(
      "Printable current saved version 1",
    );
    expect(printSurface.textContent).toContain("Synthetic Candidate");
    expect(printSurface.textContent).not.toContain(
      "Mutable Draft Candidate",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Save new version",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      (
        screen.getByRole("button", {
          name: "Discard draft changes",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("persists Letter through the design endpoint and reconciles only the canonical response", async () => {
    let resolveDesign:
      | ((value: ResumeWorkspaceData["resume"]) => void)
      | undefined;
    vi.mocked(resumeApi.updateResumeDesign).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDesign = resolve;
        }),
    );
    renderWorkspace();
    const user = userEvent.setup();
    const paperSize = await screen.findByRole("combobox", {
      name: "Paper size",
    });

    await user.selectOptions(paperSize, "LETTER");

    expect(resumeApi.updateResumeDesign).toHaveBeenCalledWith(
      resumeId,
      expect.objectContaining({ pageSize: "LETTER" }),
      expect.any(AbortSignal),
    );
    expect((paperSize as HTMLSelectElement).disabled).toBe(true);
    expect((paperSize as HTMLSelectElement).value).toBe("A4");

    resolveDesign?.({
      ...workspace().resume,
      design: { ...workspace().resume.design, pageSize: "LETTER" },
    });

    await waitFor(() =>
      expect((paperSize as HTMLSelectElement).value).toBe("LETTER"),
    );
    expect(screen.getByText("Paper size saved as Letter.")).not.toBeNull();
  });

  it("preserves A4 and displays a safe request ID when a page-size update fails", async () => {
    vi.mocked(resumeApi.updateResumeDesign).mockRejectedValue(
      new ApiError(
        500,
        "DESIGN_UPDATE_FAILED",
        "The design could not be updated.",
        "page-size-request-0001",
      ),
    );
    renderWorkspace();
    const user = userEvent.setup();
    const paperSize = await screen.findByRole("combobox", {
      name: "Paper size",
    });

    await user.selectOptions(paperSize, "LETTER");

    expect(
      await screen.findByText("The paper size could not be saved."),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: page-size-request-0001"),
    ).not.toBeNull();
    expect((paperSize as HTMLSelectElement).value).toBe("A4");
    expect(screen.queryByText("Paper size saved as Letter.")).toBeNull();
  });

  it("previews and explicitly saves approved design values without changing content or version identity", async () => {
    vi.mocked(resumeApi.fetchResume).mockResolvedValue(
      workspace(versionId, "Synthetic Candidate", resumeId, {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        fontFamily: "Inter",
      }),
    );
    vi.mocked(resumeApi.updateResumeDesign).mockResolvedValue({
      ...workspace().resume,
      design: {
        templateId: "modern-professional",
        colorPaletteId: "navy",
        pageSize: "A4",
        fontFamily: "Georgia",
        showProfilePhoto: false,
      },
    });
    renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");

    await user.click(
      screen.getByRole("radio", { name: /Modern Professional/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /Georgia/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /Navy/i }),
    );

    const draftPreview = screen.getByLabelText("Resume preview");
    expect(
      draftPreview.classList.contains(
        "resume-template-modern-professional",
      ),
    ).toBe(true);
    expect(draftPreview.classList.contains("resume-font-georgia")).toBe(true);
    expect(draftPreview.classList.contains("resume-palette-navy")).toBe(true);
    expect((fullName as HTMLInputElement).value).toBe("Synthetic Candidate");
    expect(screen.queryByText("Unsaved changes")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Save design" }));

    await waitFor(() => {
      expect(resumeApi.updateResumeDesign).toHaveBeenCalledWith(
        resumeId,
        {
          templateId: "modern-professional",
          colorPaletteId: "navy",
          pageSize: "A4",
          fontFamily: "Georgia",
          showProfilePhoto: false,
        },
        expect.any(AbortSignal),
      );
    });
    expect(await screen.findByText("Resume design saved.")).not.toBeNull();
    expect(resumeApi.saveResumeVersion).not.toHaveBeenCalled();
    expect(screen.getByText("Version 1 saved")).not.toBeNull();
    expect((fullName as HTMLInputElement).value).toBe("Synthetic Candidate");
    expect(
      screen.getByLabelText("Printable saved resume")
        .classList.contains("resume-template-modern-professional"),
    ).toBe(true);
  });

  it("preserves canonical design and request ID after a failed explicit save", async () => {
    vi.mocked(resumeApi.fetchResume).mockResolvedValue(
      workspace(versionId, "Synthetic Candidate", resumeId, {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        fontFamily: "Inter",
      }),
    );
    vi.mocked(resumeApi.updateResumeDesign).mockRejectedValue(
      new ApiError(
        500,
        "DESIGN_UPDATE_FAILED",
        "The design could not be updated.",
        "design-request-0002",
      ),
    );
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");

    await user.click(
      screen.getByRole("radio", { name: /Compact Technical/i }),
    );
    await user.click(screen.getByRole("button", { name: "Save design" }));

    expect(
      await screen.findByText("The resume design could not be saved."),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: design-request-0002")).not.toBeNull();
    expect(
      screen.getByLabelText("Printable saved resume")
        .getAttribute("data-template"),
    ).toBe("ats-classic");
    expect(screen.queryByText("Resume design saved.")).toBeNull();
  });

  it("serializes design and paper-size mutations so neither can overwrite the other", async () => {
    vi.mocked(resumeApi.fetchResume).mockResolvedValue(
      workspace(versionId, "Synthetic Candidate", resumeId, {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        fontFamily: "Inter",
      }),
    );
    let resolveDesign:
      | ((value: ResumeWorkspaceData["resume"]) => void)
      | undefined;
    vi.mocked(resumeApi.updateResumeDesign).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDesign = resolve;
        }),
    );
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");
    await user.click(
      screen.getByRole("radio", { name: /Forest/i }),
    );
    await user.click(screen.getByRole("button", { name: "Save design" }));

    expect(
      (screen.getByRole("combobox", {
        name: "Paper size",
      }) as HTMLSelectElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", {
        name: /ATS Classic/i,
      }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(resumeApi.updateResumeDesign).toHaveBeenCalledTimes(1);

    resolveDesign?.({
      ...workspace().resume,
      design: {
        templateId: "ats-classic",
        colorPaletteId: "forest",
        pageSize: "A4",
        fontFamily: "Inter",
        showProfilePhoto: false,
      },
    });
    await waitFor(() => {
      expect(
        (screen.getByRole("combobox", {
          name: "Paper size",
        }) as HTMLSelectElement).disabled,
      ).toBe(false);
    });
  });

  it("retains a dirty draft and request ID after a save conflict", async () => {
    vi.mocked(resumeApi.fetchResume)
      .mockResolvedValueOnce(workspace())
      .mockResolvedValueOnce(workspace(nextVersionId));
    vi.mocked(resumeApi.listResumeVersions)
      .mockResolvedValueOnce({
        versions: [
          {
            id: versionId,
            versionNumber: 1,
            source: "manual",
            changeSummary: "Initial version",
            createdAt: timestamp,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      })
      .mockResolvedValueOnce({
        versions: [
          {
            id: nextVersionId,
            versionNumber: 2,
            source: "manual",
            changeSummary: "Concurrent version",
            createdAt: timestamp,
          },
          {
            id: versionId,
            versionNumber: 1,
            source: "manual",
            changeSummary: "Initial version",
            createdAt: timestamp,
          },
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      });
    vi.mocked(resumeApi.saveResumeVersion).mockRejectedValue(
      new ApiError(
        409,
        "RESUME_VERSION_CONFLICT",
        "The resume changed after it was loaded. Refresh before saving.",
        "save-request-id-0001",
      ),
    );
    renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Conflicted Candidate");
    await user.click(
      screen.getByRole("button", { name: "Save new version" }),
    );

    expect(
      await screen.findByText(
        "A newer version exists. Reload and review before saving again.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: save-request-id-0001")).not
      .toBeNull();
    expect(
      (screen.getByLabelText("Full name") as HTMLInputElement).value,
    ).toBe("Conflicted Candidate");
    expect(screen.getByText("Unsaved changes")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Reload and review" }),
    );

    await waitFor(() => {
      expect(resumeApi.fetchResume).toHaveBeenCalledTimes(2);
      expect(resumeApi.listResumeVersions).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Version 2 saved")).not.toBeNull();
    expect(screen.getByText("Current version")).not.toBeNull();
  });

  it("shows a historical snapshot read-only without replacing the active draft", async () => {
    const historical = workspace().version;
    vi.mocked(resumeApi.fetchResumeVersion).mockResolvedValue({
      ...historical,
      content: {
        ...historical.content,
        basics: {
          ...historical.content.basics,
          fullName: "Historical Candidate",
        },
      },
    });
    renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Draft Candidate");
    await user.click(
      screen.getByRole("button", { name: "View version 1" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Read-only version 1",
      }),
    ).not.toBeNull();
    expect(screen.getAllByText("Historical Candidate")).toHaveLength(2);
    expect(screen.getByText("Historical saved version 1")).not.toBeNull();
    expect(
      screen.getByLabelText("Printable historical saved version 1")
        .textContent,
    ).toContain("Historical Candidate");
    expect(
      screen.getByText(/historical saved content uses this current design/i),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Return to current draft" }),
    );
    expect(
      (screen.getByLabelText("Full name") as HTMLInputElement).value,
    ).toBe("Draft Candidate");
  });

  it("clears a prior historical print source when another snapshot fails", async () => {
    const historical = workspace().version;
    vi.mocked(resumeApi.fetchResumeVersion)
      .mockResolvedValueOnce({
        ...historical,
        content: {
          ...historical.content,
          basics: {
            ...historical.content.basics,
            fullName: "First Historical Candidate",
          },
        },
      })
      .mockRejectedValueOnce(
        new ApiError(
          404,
          "RESUME_VERSION_NOT_FOUND",
          "Resume version not found.",
          "snapshot-request-0001",
        ),
      );
    vi.mocked(resumeApi.listResumeVersions).mockResolvedValue({
      versions: [
        {
          id: versionId,
          versionNumber: 1,
          source: "manual",
          createdAt: timestamp,
        },
        {
          id: nextVersionId,
          versionNumber: 2,
          source: "manual",
          createdAt: timestamp,
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    renderWorkspace();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "View version 1" }),
    );
    expect(
      await screen.findAllByText("First Historical Candidate"),
    ).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "View version 2" }),
    );

    expect(
      await screen.findByText("We could not load that resume version."),
    ).not.toBeNull();
    expect(
      screen.queryByLabelText("Printable historical saved version 1"),
    ).toBeNull();
    expect(
      screen.getByLabelText("Printable current saved version 1").textContent,
    ).toContain("Synthetic Candidate");
    expect(
      screen.getByText("Request ID: snapshot-request-0001"),
    ).not.toBeNull();
  });

  it("discards a stale snapshot response when the route resume identity changes", async () => {
    const otherResumeId = "507f1f77bcf86cd799439099";
    const otherVersionId = "507f1f77bcf86cd799439098";
    let resolveSnapshot:
      | ((value: ResumeWorkspaceData["version"]) => void)
      | undefined;
    vi.mocked(resumeApi.fetchResume).mockImplementation(
      async (requestedResumeId) =>
        requestedResumeId === otherResumeId
          ? workspace(
              otherVersionId,
              "Other Synthetic Candidate",
              otherResumeId,
            )
          : workspace(),
    );
    vi.mocked(resumeApi.fetchResumeVersion).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        }),
    );
    const router = renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Private role context",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Company (optional)" }),
      "Private company context",
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "Job description (optional)",
      }),
      "Private job context",
    );

    await user.click(
      screen.getByRole("button", { name: "View version 1" }),
    );
    await waitFor(() => {
      expect(resumeApi.fetchResumeVersion).toHaveBeenCalledTimes(1);
    });
    const snapshotSignal = vi.mocked(resumeApi.fetchResumeVersion).mock
      .calls[0]?.[2];
    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 1",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    await router.navigate(`/resumes/${otherResumeId}`);
    expect(
      await screen.findByRole("heading", {
        name: "Synthetic Platform Resume",
      }),
    ).not.toBeNull();
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Full name") as HTMLInputElement).value,
      ).toBe("Other Synthetic Candidate");
    });
    expect(
      (
        screen.getByRole("textbox", {
          name: "Target role",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Company (optional)",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Job description (optional)",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("");

    resolveSnapshot?.(workspace().version);
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Read-only version 1",
        }),
      ).toBeNull();
    });
    expect(snapshotSignal?.aborted).toBe(true);
  });

  it("blocks analysis while dirty and displays validated completed guidance for the saved version", async () => {
    vi.mocked(resumeApi.queueResumeAnalysis).mockResolvedValue({
      id: jobId,
      type: "resume.analyze",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "resume.analyze",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "analysis",
          analysisId,
          resumeId,
          resumeVersionId: versionId,
          totalScore: 86,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    vi.mocked(resumeApi.fetchResumeAnalysis).mockResolvedValue(
      analysis(),
    );
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Platform Engineer",
    );
    await user.type(screen.getByLabelText("Full name"), " changed");
    expect(
      (
        screen.getByRole("button", {
          name: "Run AI-assisted assessment",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    const discard = screen.getByRole("button", {
      name: "Discard draft changes",
    });
    const save = screen.getByRole("button", {
      name: "Save new version",
    });
    expect(discard.classList.contains("quiet-button")).toBe(true);
    expect(save.classList.contains("primary-button")).toBe(true);
    await user.click(discard);
    await user.click(
      screen.getByRole("button", {
        name: "Run AI-assisted assessment",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "AI-assisted assessment",
      }),
    ).not.toBeNull();
    expect(screen.getByText("86")).not.toBeNull();
    expect(screen.getByText("observability")).not.toBeNull();
    expect(document.body.textContent).not.toContain("ATS certification");
  });

  it("requires explicit suggestion selection and confirmation before atomic application", async () => {
    vi.mocked(resumeApi.queueResumeAnalysis).mockResolvedValue({
      id: jobId,
      type: "resume.analyze",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "resume.analyze",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "analysis",
          analysisId,
          resumeId,
          resumeVersionId: versionId,
          totalScore: 86,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    vi.mocked(resumeApi.fetchResumeAnalysis).mockResolvedValue(
      analysis(),
    );
    vi.mocked(resumeApi.applyResumeSuggestions).mockResolvedValue({
      ...workspace(nextVersionId),
      appliedCount: 1,
    });
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Platform Engineer",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Run AI-assisted assessment",
      }),
    );
    const apply = await screen.findByRole("button", {
      name: "Apply selected suggestions",
    });
    expect((apply as HTMLButtonElement).disabled).toBe(true);
    await user.click(
      screen.getByRole("checkbox", {
        name: "Select suggestion 1",
      }),
    );
    await user.click(apply);
    const applyDialog = screen.getByRole("dialog", {
      name: "Apply selected suggestions",
      description:
        "This creates a new immutable resume version. Review the resulting content for accuracy; this assessment will become stale.",
    });
    expect(applyDialog.tagName).toBe("DIALOG");
    const cancelApply = screen.getByRole("button", { name: "Cancel" });
    const createVersion = screen.getByRole("button", {
      name: "Create new version",
    });
    expect(document.activeElement).toBe(cancelApply);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(createVersion);
    await user.tab();
    expect(document.activeElement).toBe(cancelApply);
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", {
        name: "Apply selected suggestions",
      }),
    ).toBeNull();
    expect(document.activeElement).toBe(apply);
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Select suggestion 1",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    await user.click(apply);
    await user.click(
      screen.getByRole("button", { name: "Create new version" }),
    );

    await waitFor(() => {
      expect(resumeApi.applyResumeSuggestions).toHaveBeenCalledWith(
        resumeId,
        {
          analysisId,
          suggestionIds: [suggestionId],
        },
        expect.any(AbortSignal),
      );
    });
    expect(
      await screen.findByText("1 suggestion applied in version 2."),
    ).not.toBeNull();
    expect(screen.getByText("This assessment is stale.")).not.toBeNull();
  });

  it("preserves selection and presents a safe conflict when analysis application is rejected", async () => {
    vi.mocked(resumeApi.queueResumeAnalysis).mockResolvedValue({
      id: jobId,
      type: "resume.analyze",
      status: "queued",
    });
    vi.mocked(polling.pollResumeJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "resume.analyze",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "analysis",
          analysisId,
          resumeId,
          resumeVersionId: versionId,
          totalScore: 86,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    vi.mocked(resumeApi.fetchResumeAnalysis).mockResolvedValue(analysis());
    vi.mocked(resumeApi.applyResumeSuggestions).mockRejectedValue(
      new ApiError(
        409,
        "RESUME_VERSION_CONFLICT",
        "Stored analysis is stale.",
        "apply-request-id-0001",
      ),
    );
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByLabelText("Full name");
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Platform Engineer",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Run AI-assisted assessment",
      }),
    );
    const checkbox = await screen.findByRole("checkbox", {
      name: "Select suggestion 1",
    });
    await user.click(checkbox);
    await user.click(
      screen.getByRole("button", {
        name: "Apply selected suggestions",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Create new version" }),
    );

    expect(
      await screen.findByText(
        "This resume or assessment changed. Reload and review before applying suggestions.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: apply-request-id-0001")).not
      .toBeNull();
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  it("blocks in-app departure with managed keyboard focus and lets the user stay", async () => {
    const router = renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    await user.type(fullName, " changed");

    void router.navigate("/dashboard");
    const navigationDialog = await screen.findByRole("dialog", {
      name: "Unsaved changes",
      description:
        "Leaving now will discard changes that have not been saved as a new version.",
    });
    expect(navigationDialog.tagName).toBe("DIALOG");
    const keepEditing = screen.getByRole("button", {
      name: "Keep editing",
    });
    expect(document.activeElement).toBe(keepEditing);

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", {
        name: "Unsaved changes",
      }),
    ).toBeNull();
    expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    expect(document.activeElement).toBe(fullName);

    void router.navigate("/dashboard");
    expect(
      await screen.findByRole("dialog", {
        name: "Unsaved changes",
      }),
    ).not.toBeNull();
    const keepEditingAgain = screen.getByRole("button", {
      name: "Keep editing",
    });
    const leaveAgain = screen.getByRole("button", {
      name: "Leave without saving",
    });
    expect(leaveAgain.classList.contains("destructive-button")).toBe(true);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(leaveAgain);
    await user.tab();
    expect(document.activeElement).toBe(keepEditingAgain);
    await user.click(
      keepEditingAgain,
    );
    expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
  });

  it("preserves dirty-state and validation-summary behavior with the section index", async () => {
    renderWorkspace();
    const user = userEvent.setup();
    const email = await screen.findByLabelText("Email");
    await user.type(email, "invalid-address");
    const save = screen.getByRole("button", { name: "Save new version" });

    save.focus();
    await user.click(save);

    expect(screen.getByText("Unsaved changes")).not.toBeNull();
    expect(
      screen.getByRole("alert").textContent,
    ).toContain("Email needs a valid address.");
    expect(document.activeElement).toBe(save);
    expect(resumeApi.saveResumeVersion).not.toHaveBeenCalled();
    expect(
      screen.getByRole("navigation", { name: "Resume sections" }),
    ).not.toBeNull();
  });

  it("allows router-managed section navigation while the draft is dirty", async () => {
    const router = renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    await user.type(fullName, " changed");

    await user.click(
      screen.getByRole("link", { name: "Certifications" }),
    );

    expect(router.state.location.hash).toBe("#resume-section-certifications");
    expect(screen.queryByRole("dialog", { name: "Unsaved changes" })).toBeNull();
    expect(screen.getByText("Unsaved changes")).not.toBeNull();
  });
});
