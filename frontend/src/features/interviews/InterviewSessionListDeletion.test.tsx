import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewSessionListPage } from "./InterviewSessionListPage";
import * as interviewApi from "./interviewApi";
import * as deletionApi from "./interviewDeletionApi";

vi.mock("./interviewApi", () => ({
  listInterviewSessions: vi.fn(),
  updateInterviewSessionStatus: vi.fn(),
}));

vi.mock("./interviewDeletionApi", () => ({
  deleteInterviewSession: vi.fn(),
}));

vi.mock("./InterviewCreateDialog", () => ({
  InterviewCreateDialog: () => null,
}));

const session = {
  id: "507f1f77bcf86cd799439011",
  title: "Delete Interview Session",
  targetRole: "Software Engineer",
  experienceLevel: "Mid-level",
  focusTopics: [],
  skillGaps: [],
  mode: "written-practice" as const,
  status: "active" as const,
  questionCount: 3,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

describe("InterviewSessionListPage deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deletionApi.deleteInterviewSession).mockResolvedValue();
    vi.mocked(interviewApi.listInterviewSessions)
      .mockResolvedValueOnce({
        sessions: [session],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      })
      .mockResolvedValue({
        sessions: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
  });

  it("deletes an active session without requiring archive and refreshes the collection", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <InterviewSessionListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: `Open ${session.title}` }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "Type the session title exactly to confirm",
      }),
      session.title,
    );
    await user.click(
      screen.getByRole("button", { name: "Permanently delete session" }),
    );

    await waitFor(() =>
      expect(deletionApi.deleteInterviewSession).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(interviewApi.listInterviewSessions).toHaveBeenCalledTimes(2),
    );
    expect(
      screen.queryByRole("link", { name: `Open ${session.title}` }),
    ).toBeNull();
  });
});
