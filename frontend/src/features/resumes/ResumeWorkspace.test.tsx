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
import * as polling from "./resumePolling";
import { ResumeWorkspace } from "./ResumeWorkspace";
import type {
  ResumeAnalysis,
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
}));

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

function workspace(
  activeVersionId = versionId,
  fullName = "Synthetic Candidate",
  ownerResumeId = resumeId,
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
    expect(
      (screen.getByLabelText("Full name") as HTMLInputElement).value,
    ).toBe("Synthetic Candidate");
    expect(
      screen
        .getByLabelText("Resume preview")
        .getAttribute("data-template"),
    ).toBe("ats-classic");
    expect(screen.queryByText("unknown-persisted-template")).toBeNull();
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
    expect(screen.getByText("Historical Candidate")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Return to current draft" }),
    );
    expect(
      (screen.getByLabelText("Full name") as HTMLInputElement).value,
    ).toBe("Draft Candidate");
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
        name: /built a reliable service/i,
      }),
    );
    await user.click(apply);
    expect(
      screen.getByRole("dialog", {
        name: "Apply selected suggestions",
      }),
    ).not.toBeNull();
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

  it("blocks in-app departure with managed keyboard focus and lets the user stay", async () => {
    const router = renderWorkspace();
    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Full name");
    await user.type(fullName, " changed");

    void router.navigate("/dashboard");
    expect(
      await screen.findByRole("dialog", {
        name: "Unsaved changes",
      }),
    ).not.toBeNull();
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
});
