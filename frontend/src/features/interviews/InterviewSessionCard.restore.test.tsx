import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as interviewApi from "./interviewApi";
import { InterviewSessionCard } from "./InterviewSessionCard";
import type { InterviewSessionSummary } from "./types";

vi.mock("./interviewApi", () => ({
  updateInterviewSessionStatus: vi.fn(),
}));

const sessionId = "507f1f77bcf86cd799439021";
const timestamp = "2026-08-14T00:00:00.000Z";

function archivedSession(): InterviewSessionSummary {
  return {
    id: sessionId,
    title: "Archived interview practice",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["APIs"],
    skillGaps: [],
    mode: "written-practice",
    status: "archived",
    questionCount: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function renderCard() {
  const router = createMemoryRouter(
    [
      {
        path: "/interviews",
        element: (
          <ul>
            <InterviewSessionCard session={archivedSession()} />
          </ul>
        ),
      },
      {
        path: "/interviews/:sessionId",
        element: <h1>Interview workspace</h1>,
      },
    ],
    { initialEntries: ["/interviews"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("InterviewSessionCard archived restore", () => {
  it("keeps Restore inside More actions and restores before reopening the workspace", async () => {
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockResolvedValue({
      ...archivedSession(),
      status: "active",
      updatedAt: "2026-08-14T00:01:00.000Z",
    });
    const router = renderCard();
    const user = userEvent.setup();

    expect(screen.queryByRole("button", { name: "Restore session" })).toBeNull();
    await user.click(
      screen.getByRole("button", {
        name: `More actions for ${archivedSession().title}`,
      }),
    );

    const restore = screen.getByRole("button", { name: "Restore session" });
    const permanentDelete = screen.getByRole("button", {
      name: "Delete permanently",
    });
    expect(restore.className).not.toContain(
      "card-overflow-actions__action--destructive",
    );
    expect(permanentDelete.className).toContain(
      "card-overflow-actions__action--destructive",
    );

    await user.click(restore);

    expect(interviewApi.updateInterviewSessionStatus).toHaveBeenCalledWith(
      sessionId,
      "active",
      expect.any(AbortSignal),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/interviews/${sessionId}`);
    });
  });
});
