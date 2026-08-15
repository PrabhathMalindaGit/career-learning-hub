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

const archivedSession = {
  ...session,
  id: "507f1f77bcf86cd799439099",
  title: "Archived Practice",
  status: "archived" as const,
};

describe("InterviewSessionListPage deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deletionApi.deleteInterviewSession).mockResolvedValue();
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockResolvedValue(
      undefined as never,
    );
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

  it("keeps Open session primary and exposes permanent deletion through More actions", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <InterviewSessionListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: `Open ${session.title}` }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Delete permanently" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: `More actions for ${session.title}` }),
    );
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    await user.type(
      screen.getByRole("textbox", {
        name: `Type ${session.title} exactly to confirm`,
      }),
      session.title,
    );
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
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

  it("keeps Restore and permanent Delete separate inside archived More actions", async () => {
    const user = userEvent.setup();
    vi.mocked(interviewApi.listInterviewSessions).mockReset();
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [archivedSession],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    render(
      <MemoryRouter>
        <InterviewSessionListPage />
      </MemoryRouter>,
    );

    const moreActions = await screen.findByRole("button", {
      name: `More actions for ${archivedSession.title}`,
    });
    expect(screen.queryByRole("button", { name: "Restore session" })).toBeNull();
    await user.click(moreActions);

    const restore = screen.getByRole("button", { name: "Restore session" });
    const remove = screen.getByRole("button", { name: "Delete permanently" });
    expect(restore.className).not.toContain("card-overflow-actions__action--destructive");
    expect(remove.className).toContain("card-overflow-actions__action--destructive");
    expect(remove.parentElement?.className).toContain(
      "card-overflow-actions__group--separated",
    );

    await user.click(restore);
    await waitFor(() =>
      expect(interviewApi.updateInterviewSessionStatus).toHaveBeenCalledWith(
        archivedSession.id,
        "active",
        expect.any(AbortSignal),
      ),
    );
  });

  it("keeps only one Interview overflow open at a time", async () => {
    const user = userEvent.setup();
    vi.mocked(interviewApi.listInterviewSessions).mockReset();
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [session, archivedSession],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });

    render(
      <MemoryRouter>
        <InterviewSessionListPage />
      </MemoryRouter>,
    );

    const first = await screen.findByRole("button", {
      name: `More actions for ${session.title}`,
    });
    const second = screen.getByRole("button", {
      name: `More actions for ${archivedSession.title}`,
    });

    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    await user.click(second);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(second.getAttribute("aria-expanded")).toBe("true");
  });
});
