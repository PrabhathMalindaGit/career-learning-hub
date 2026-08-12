import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as resumeApi from "./resumeApi";
import { ResumeWorkspace } from "./ResumeWorkspace";
import type { ResumeWorkspaceData } from "./types";

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

vi.mock("./resumePrint", () => ({
  createResumeSuggestedFilename: vi.fn(() => "snapshot-edit-test.pdf"),
  createResumePrintTitle: vi.fn(() => "Snapshot edit test"),
  openResumePrint: vi.fn(),
}));

vi.mock("./resumePolling", () => ({
  pollResumeJob: vi.fn(),
}));

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "snapshot-edit-user" },
  }),
}));

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const stableId = "123e4567-e89b-42d3-a456-426614174000";
const timestamp = "2026-08-12T04:30:00.000Z";

function workspace(): ResumeWorkspaceData {
  return {
    resume: {
      id: resumeId,
      title: "Snapshot Editing Resume",
      status: "draft",
      currentVersionId: versionId,
      latestVersionNumber: 1,
      design: {
        templateId: "ats-classic",
        colorPaletteId: "navy",
        pageSize: "A4",
        fontFamily: "Georgia",
        showProfilePhoto: false,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    version: {
      id: versionId,
      resumeId,
      versionNumber: 1,
      source: "manual",
      content: {
        basics: {
          fullName: "Snapshot Candidate",
          links: [],
        },
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

function renderWorkspace() {
  const router = createMemoryRouter(
    [{ path: "/resumes/:resumeId", element: <ResumeWorkspace /> }],
    { initialEntries: [`/resumes/${resumeId}`] },
  );
  render(<RouterProvider router={router} />);
}

describe("ResumeWorkspace snapshot editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    const current = workspace();
    vi.mocked(resumeApi.fetchResume).mockResolvedValue(current);
    vi.mocked(resumeApi.fetchResumeVersion).mockResolvedValue(current.version);
    vi.mocked(resumeApi.listResumeVersions).mockResolvedValue({
      versions: [
        {
          id: versionId,
          versionNumber: 1,
          source: "manual",
          createdAt: timestamp,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
  });

  it("returns to the current draft when editing begins with a saved snapshot open", async () => {
    renderWorkspace();
    const user = userEvent.setup();

    await screen.findByLabelText("Full name");
    await user.click(
      screen.getByRole("button", { name: "View current saved version 1" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Read-only version 1" }),
    ).not.toBeNull();

    const fullName = screen.getByLabelText("Full name") as HTMLInputElement;
    await user.clear(fullName);
    await user.type(fullName, "Edited after snapshot");

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Read-only version 1" }),
      ).toBeNull();
    });
    expect(fullName.value).toBe("Edited after snapshot");
    expect(screen.getByText("Unsaved changes")).not.toBeNull();
    expect(
      (screen.getByRole("button", {
        name: "Save new version",
      }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(resumeApi.saveResumeVersion).not.toHaveBeenCalled();
  });

  it("keeps a late snapshot response from reopening after editing starts", async () => {
    let resolveSnapshot:
      | ((value: ResumeWorkspaceData["version"]) => void)
      | undefined;
    vi.mocked(resumeApi.fetchResumeVersion).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        }),
    );

    renderWorkspace();
    const user = userEvent.setup();
    const fullName = (await screen.findByLabelText(
      "Full name",
    )) as HTMLInputElement;

    await user.click(
      screen.getByRole("button", { name: "View current saved version 1" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Loading selected saved version",
      }),
    ).not.toBeNull();

    await user.clear(fullName);
    await user.type(fullName, "Edited while snapshot loads");

    expect(fullName.value).toBe("Edited while snapshot loads");
    expect(screen.getByText("Unsaved changes")).not.toBeNull();

    await act(async () => {
      resolveSnapshot?.(workspace().version);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Read-only version 1" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", {
          name: "Loading selected saved version",
        }),
      ).toBeNull();
    });
    expect(
      (screen.getByRole("button", {
        name: "Save new version",
      }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(resumeApi.saveResumeVersion).not.toHaveBeenCalled();
  });
});
