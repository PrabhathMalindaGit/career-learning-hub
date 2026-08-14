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
  it("restores an archived session to active before reopening its workspace", async () => {
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockResolvedValue({
      ...archivedSession(),
      status: "active",
      updatedAt: "2026-08-14T00:01:00.000Z",
    });
    const router = renderCard();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Restore session" }),
    );

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
