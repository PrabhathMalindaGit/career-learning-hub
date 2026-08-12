import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as interviewApi from "./interviewApi";
import { InterviewSessionListPage } from "./InterviewSessionListPage";
import type { InterviewSessionSummary } from "./types";

vi.mock("./interviewApi", () => ({
  createInterviewSession: vi.fn(),
  listInterviewSessions: vi.fn(),
}));

vi.mock("./InterviewCreateDialog", () => ({
  InterviewCreateDialog: ({
    open,
    onRequestClose,
    onCreated,
  }: {
    open: boolean;
    onRequestClose(): void;
    onCreated(sessionId: string): void;
  }) =>
    open ? (
      <section role="dialog" aria-label="Create interview">
        <button type="button" onClick={onRequestClose}>
          Cancel create
        </button>
        <button
          type="button"
          onClick={() => onCreated("507f1f77bcf86cd799439021")}
        >
          Complete create
        </button>
      </section>
    ) : null,
}));

const sessionId = "507f1f77bcf86cd799439021";
const timestamp = "2026-07-25T08:00:00.000Z";

function sessionSummary(
  overrides: Partial<InterviewSessionSummary> = {},
): InterviewSessionSummary {
  return {
    id: sessionId,
    title: "Platform interview preparation",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["API design", "Reliability"],
    skillGaps: ["Concurrency"],
    mode: "written-practice",
    status: "active",
    questionCount: 8,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function renderPage(initialEntry = "/interviews") {
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
    { initialEntries: [initialEntry] },
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

  it("uses one prominent Create interview action instead of a permanent create form", async () => {
    const user = userEvent.setup();
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

    const create = screen.getByRole("button", {
      name: "Create interview",
    });
    expect(
      screen.queryByRole("textbox", { name: "Session title" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Create a session" }),
    ).toBeNull();

    await user.click(create);
    expect(
      screen.getByRole("dialog", { name: "Create interview" }),
    ).not.toBeNull();
  });

  it("consumes ?action=create, opens the create dialog, and removes the query parameter", async () => {
    const router = renderPage("/interviews?action=create");

    expect(
      await screen.findByRole("dialog", { name: "Create interview" }),
    ).not.toBeNull();
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("navigates to the canonical session workspace after the dialog reports creation", async () => {
    const user = userEvent.setup();
    const router = renderPage();

    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Complete create" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/interviews/${sessionId}`,
      );
    });
  });

  it("shows a creation-oriented empty state only for the unfiltered empty collection", async () => {
    renderPage();

    const empty = await screen.findByText(/No interview sessions yet\./);
    expect(empty.textContent).toMatch(/Create a practice session/i);
    expect(
      screen.queryByRole("navigation", {
        name: "Interview session pages",
      }),
    ).toBeNull();
  });

  it("shows a factual filtered empty state without telling the user to create another session", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/No interview sessions yet\./);

    await user.click(
      screen.getByRole("button", { name: "Completed" }),
    );

    const empty = await screen.findByText("No completed sessions yet.");
    expect(empty.textContent).not.toMatch(/create/i);
    await waitFor(() => {
      expect(interviewApi.listInterviewSessions).toHaveBeenLastCalledWith(
        { page: 1, limit: 20, status: "completed" },
        expect.any(AbortSignal),
      );
    });
  });

  it("renders role-first compact cards, suppresses redundant titles, and removes the Target role kicker", async () => {
    const secondId = "507f1f77bcf86cd799439099";
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [
        sessionSummary({
          title: "Architecture and incident response practice",
          targetRole: "Principal Platform Engineer",
          experienceLevel: "Staff-level",
          mode: "mock-interview",
          status: "completed",
          questionCount: 128,
        }),
        sessionSummary({
          id: secondId,
          title: "Frontend Engineer",
          targetRole: "Frontend Engineer",
          experienceLevel: "Senior",
          mode: "study",
          status: "archived",
          questionCount: 1,
        }),
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });

    renderPage();

    const list = await screen.findByRole("list", {
      name: "Interview sessions",
    });
    expect(
      within(list)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Principal Platform Engineer", "Frontend Engineer"]);
    expect(within(list).queryByText("Target role")).toBeNull();
    expect(
      list.querySelectorAll(".interview-session-card__title"),
    ).toHaveLength(1);
    expect(
      within(list).getByText("Architecture and incident response practice"),
    ).not.toBeNull();
    expect(within(list).getByText("Staff-level")).not.toBeNull();
    expect(within(list).getByText("Mock interview")).not.toBeNull();
    expect(within(list).getByText("Completed")).not.toBeNull();
    expect(within(list).getByLabelText("128 questions")).not.toBeNull();
    expect(within(list).getByLabelText("1 question")).not.toBeNull();
    expect(within(list).getAllByText("Open session")).toHaveLength(2);
    expect(screen.queryByText(sessionId)).toBeNull();
    expect(screen.queryByText(secondId)).toBeNull();
  });

  it("preserves server order and opens the canonical session route", async () => {
    const secondId = "507f1f77bcf86cd799439099";
    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [
        sessionSummary(),
        sessionSummary({
          id: secondId,
          title: "Frontend systems practice",
          targetRole: "Frontend Engineer",
        }),
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    const router = renderPage();

    const list = await screen.findByRole("list", {
      name: "Interview sessions",
    });
    expect(
      within(list)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Backend Engineer", "Frontend Engineer"]);

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

  it("hides pagination for zero or one page", async () => {
    renderPage();
    await screen.findByText(/No interview sessions yet\./);
    expect(
      screen.queryByRole("navigation", {
        name: "Interview session pages",
      }),
    ).toBeNull();
    cleanup();

    vi.mocked(interviewApi.listInterviewSessions).mockResolvedValue({
      sessions: [sessionSummary()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    renderPage();
    await screen.findByRole("list", { name: "Interview sessions" });
    expect(
      screen.queryByRole("navigation", {
        name: "Interview session pages",
      }),
    ).toBeNull();
  });

  it("shows bounded Previous and Next controls when the server reports multiple pages", async () => {
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
      expect(interviewApi.listInterviewSessions).toHaveBeenLastCalledWith(
        { page: 2, limit: 20 },
        expect.any(AbortSignal),
      );
    });
  });

  it("resets pagination to page 1 whenever the lifecycle filter changes", async () => {
    const user = userEvent.setup();
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

    await user.click(
      await screen.findByRole("button", { name: "Next" }),
    );
    await waitFor(() => {
      expect(interviewApi.listInterviewSessions).toHaveBeenLastCalledWith(
        { page: 2, limit: 20 },
        expect.any(AbortSignal),
      );
    });

    await user.click(
      screen.getByRole("button", { name: "Completed" }),
    );
    await waitFor(() => {
      expect(interviewApi.listInterviewSessions).toHaveBeenLastCalledWith(
        { page: 1, limit: 20, status: "completed" },
        expect.any(AbortSignal),
      );
    });
  });

  it("uses geometry-only session skeletons while loading", () => {
    vi.mocked(interviewApi.listInterviewSessions).mockReturnValue(
      new Promise(() => undefined),
    );

    renderPage();

    const loading = screen.getByRole("status", {
      name: "Loading interview sessions",
    });
    expect(
      loading.querySelectorAll(".interview-session-skeleton"),
    ).toHaveLength(3);
    expect(loading.textContent).toBe("Loading interview sessions…");
    expect(loading.textContent).not.toMatch(
      /engineer|active|completed|question|updated/i,
    );
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
      await screen.findByText(/No interview sessions yet\./),
    ).not.toBeNull();
  });
});
