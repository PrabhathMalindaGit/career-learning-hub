import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeListPage } from "./ResumeListPage";
import * as resumeApi from "./resumeApi";

vi.mock("./resumeApi", () => ({
  listResumes: vi.fn(),
  deleteResume: vi.fn(),
}));

vi.mock("./ResumeCreateDialog", () => ({
  ResumeCreateDialog: () => null,
}));

vi.mock("./ResumeMiniDocument", () => ({
  ResumeMiniDocument: () => <div data-testid="resume-preview" />,
}));

const resume = {
  id: "507f1f77bcf86cd799439011",
  title: "Delete From Collection",
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
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

describe("ResumeListPage deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.deleteResume).mockResolvedValue();
    vi.mocked(resumeApi.listResumes)
      .mockResolvedValueOnce({
        resumes: [resume],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      })
      .mockResolvedValue({
        resumes: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
  });

  it("exposes permanent deletion beside Open Resume and refreshes canonical collection", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResumeListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: `Open Resume: ${resume.title}` }),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Delete resume" }));
    await user.type(
      screen.getByRole("textbox", {
        name: "Type the Resume title exactly to confirm",
      }),
      resume.title,
    );
    await user.click(
      screen.getByRole("button", { name: "Permanently delete Resume" }),
    );

    await waitFor(() => expect(resumeApi.deleteResume).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(resumeApi.listResumes).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole("link", { name: `Open Resume: ${resume.title}` }),
    ).toBeNull();
  });
});
