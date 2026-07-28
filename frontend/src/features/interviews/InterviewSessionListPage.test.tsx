import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as interviewApi from "./interviewApi";
import { InterviewSessionListPage } from "./InterviewSessionListPage";

vi.mock("./interviewApi", () => ({
  createInterviewSession: vi.fn(),
  listInterviewSessions: vi.fn(),
}));

const sessionId = "507f1f77bcf86cd799439021";
const timestamp = "2026-07-25T08:00:00.000Z";

function sessionSummary() {
  return {
    id: sessionId,
    title: "Platform interview preparation",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["API design", "Reliability"],
    skillGaps: ["Concurrency"],
    mode: "written-practice" as const,
    status: "active" as const,
    questionCount: 8,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/interviews",
        element: <InterviewSessionListPage />,
      },
      {
        path: "/interviews/:sessionId",
        element: <h1>Opened interview session</h1>,
      },
    ],
    { initialEntries: ["/interviews"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("InterviewSessionListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it("preserves the page heading, supporting copy, and create action", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Interview Coach",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Organize role-specific questions, written practice, and model-generated guidance in private session records.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Create session" }),
    ).not.toBeNull();
  });

  it("shows factual loading and empty states", async () => {
    let resolveList:
      | ((
          value: Awaited<
            ReturnType<typeof interviewApi.listInterviewSessions>
          >,
        ) => void)
      | undefined;
    vi.mocked(interviewApi.listInterviewSessions).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    renderPage();
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);

    resolveList?.({
      sessions: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
    expect(
      await screen.findByText(
        "No interview sessions match this view. Create a private session to begin.",
      ),
    ).not.toBeNull();
  });

  it("renders validated summaries and opens the canonical session route", async () => {
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [sessionSummary()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    const router = renderPage();

    await screen.findByText("Platform interview preparation");
    expect(screen.getByText(/8 questions/)).not.toBeNull();
    expect(screen.queryByText("private-provider-payload")).toBeNull();
    await userEvent.click(
      screen.getByRole("link", {
        name: "Open Platform interview preparation",
      }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/interviews/${sessionId}`,
      );
    });
  });

  it("filters the collection by lifecycle status", async () => {
    renderPage();
    await screen.findByText(
      "No interview sessions match this view. Create a private session to begin.",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Completed" }),
    );

    await waitFor(() => {
      expect(interviewApi.listInterviewSessions).toHaveBeenLastCalledWith(
        { page: 1, limit: 20, status: "completed" },
        expect.any(AbortSignal),
      );
    });
  });

  it("shows a safe structured list error and retries", async () => {
    vi.mocked(interviewApi.listInterviewSessions)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "INTERVIEWS_UNAVAILABLE",
          "Interview sessions are temporarily unavailable.",
          "interview-list-request-0001",
        ),
      )
      .mockResolvedValueOnce({
        sessions: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    renderPage();

    expect(
      await screen.findByText(
        "Interview sessions are temporarily unavailable.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: interview-list-request-0001"),
    ).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Retry list" }),
    );
    expect(
      await screen.findByText(
        "No interview sessions match this view. Create a private session to begin.",
      ),
    ).not.toBeNull();
  });

  it("uses a labelled pager with caller-owned boundaries and page loading", async () => {
    vi.mocked(interviewApi.listInterviewSessions).mockImplementation(
      async (query) => ({
        sessions: [sessionSummary()],
        pagination: {
          page: query?.page ?? 1,
          limit: 20,
          total: 21,
          pages: 2,
        },
      }),
    );
    renderPage();

    const pager = await screen.findByRole("navigation", {
      name: "Interview session pages",
    });
    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);
    expect(pager.textContent).toContain("Page 1");

    await userEvent.click(next);
    await waitFor(() => {
      expect(
        interviewApi.listInterviewSessions,
      ).toHaveBeenLastCalledWith(
        { page: 2, limit: 20 },
        expect.any(AbortSignal),
      );
    });
  });

  it("validates the create form, excludes unsupported modes, and prevents duplicate submits", async () => {
    vi.mocked(interviewApi.createInterviewSession).mockReturnValue(
      new Promise(() => undefined),
    );
    renderPage();
    await screen.findByText(
      "No interview sessions match this view. Create a private session to begin.",
    );
    const user = userEvent.setup();

    expect(
      screen.queryByRole("option", { name: /mock interview/i }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Create session" }),
    );
    const summary = screen.getByRole("alert");
    expect(summary.textContent).toContain("Review the highlighted fields");
    expect(summary.textContent).toContain("Session title");
    expect(summary.textContent).toContain("Target role");
    expect(summary.classList.contains("validation-summary")).toBe(true);
    expect(document.activeElement).toBe(summary);

    await user.type(
      screen.getByRole("textbox", { name: "Session title" }),
      "  Platform preparation  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "  Backend Engineer  ",
    );
    await user.clear(
      screen.getByRole("textbox", { name: "Experience level" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Experience level" }),
      "  Mid-level  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Focus topics/ }),
      " API design, Reliability, API design ",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Skill gaps/ }),
      " Concurrency ",
    );

    const submit = screen.getByRole("button", {
      name: "Create session",
    });
    await user.click(submit);
    await user.click(submit);

    expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1);
    expect(interviewApi.createInterviewSession).toHaveBeenCalledWith(
      {
        title: "Platform preparation",
        targetRole: "Backend Engineer",
        experienceLevel: "Mid-level",
        focusTopics: ["API design", "Reliability"],
        skillGaps: ["Concurrency"],
        mode: "written-practice",
      },
      expect.any(AbortSignal),
    );
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(submit.getAttribute("aria-busy")).toBe("true");
  });

  it("focuses the only invalid field instead of rendering a summary", async () => {
    renderPage();
    await screen.findByText(
      "No interview sessions match this view. Create a private session to begin.",
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Session title" }),
      "Platform preparation",
    );

    await user.click(
      screen.getByRole("button", { name: "Create session" }),
    );

    const targetRole = screen.getByRole("textbox", {
      name: "Target role",
    });
    expect(document.activeElement).toBe(targetRole);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("navigates only after a validated create response", async () => {
    vi.mocked(interviewApi.createInterviewSession).mockResolvedValue({
      session: {
        ...sessionSummary(),
        jobDescription: "Synthetic job description",
      },
      questions: [],
    });
    const router = renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No interview sessions match this view. Create a private session to begin.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Session title" }),
      "Platform preparation",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Backend Engineer",
    );
    await user.click(
      screen.getByRole("button", { name: "Create session" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/interviews/${sessionId}`,
      );
    });
  });
});
