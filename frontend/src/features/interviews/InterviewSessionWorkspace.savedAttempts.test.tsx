import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as interviewApi from "./interviewApi";
import { InterviewSessionWorkspace } from "./InterviewSessionWorkspace";
import type {
  InterviewAttempt,
  InterviewAttemptStatus,
} from "./types";

vi.mock("./interviewApi", () => ({
  addManualQuestion: vi.fn(),
  fetchInterviewAttempt: vi.fn(),
  fetchInterviewJob: vi.fn(),
  fetchInterviewQuestion: vi.fn(),
  fetchInterviewSession: vi.fn(),
  generateInterviewQuestions: vi.fn(),
  listAttemptHistory: vi.fn(),
  listInterviewQuestions: vi.fn(),
  recordInterviewAttempt: vi.fn(),
  requestAttemptFeedback: vi.fn(),
  requestQuestionExplanation: vi.fn(),
  saveQuestionNotes: vi.fn(),
  setQuestionPinned: vi.fn(),
  updateInterviewSessionStatus: vi.fn(),
}));

vi.mock("./interviewPolling", async () => {
  const actual =
    await vi.importActual<typeof import("./interviewPolling")>(
      "./interviewPolling",
    );
  return {
    ...actual,
    pollInterviewJob: vi.fn(),
  };
});

const sessionId = "507f1f77bcf86cd799439021";
const questionId = "507f1f77bcf86cd799439022";
const timestamp = "2026-07-25T08:00:00.000Z";

const statusOrder: InterviewAttemptStatus[] = [
  "recorded",
  "feedback-queued",
  "feedback-processing",
  "feedback-completed",
  "feedback-failed",
];

const expectedStatusLabels = [
  "Saved",
  "Feedback queued",
  "Feedback processing",
  "Feedback ready",
  "Feedback unavailable",
];

function session() {
  return {
    id: sessionId,
    title: "Platform interview preparation",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["API design"],
    skillGaps: ["Concurrency"],
    mode: "written-practice" as const,
    status: "active" as const,
    questionCount: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionSummary() {
  return {
    id: questionId,
    sessionId,
    source: "manual" as const,
    category: "System design",
    difficulty: "medium" as const,
    question: "How would you design a reliable job processor?",
    questionType: "legacy-open-response" as const,
    isPinned: false,
    userNotes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionDetail() {
  return {
    ...questionSummary(),
    modelAnswer: "Use durable queues and idempotent consumers.",
    explanation: "Discuss delivery guarantees and recovery.",
    explanationKeyPoints: ["Idempotency", "Backoff"],
  };
}

function attempt(
  status: InterviewAttemptStatus,
  index: number,
  withFeedback = false,
): InterviewAttempt {
  const id = `507f1f77bcf86cd7994390${30 + index}`;
  return {
    id,
    sessionId,
    questionId,
    answerText: `Saved answer ${index + 1}`,
    status,
    ...(withFeedback
      ? {
          feedback: {
            score: 76,
            summary: "Clear structure with room for deeper failure analysis.",
            strengths: ["Clear structure"],
            improvements: ["Discuss poison messages"],
            suggestedAnswerOutline: ["Requirements", "Failure modes"],
            completedAt: timestamp,
          },
        }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const attempts = statusOrder.map((status, index) =>
  attempt(status, index, status === "feedback-completed"),
);

function renderWorkspace() {
  const router = createMemoryRouter(
    [
      {
        path: "/interviews/:sessionId",
        element: <InterviewSessionWorkspace />,
      },
    ],
    { initialEntries: [`/interviews/${sessionId}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

async function waitForWorkspace() {
  await screen.findByRole("heading", {
    name: "Platform interview preparation",
  });
  await screen.findByRole("button", {
    name: /How would you design a reliable job processor/,
  });
  await screen.findByRole("textbox", { name: "Written answer" });
}

function attemptSection(): HTMLElement {
  const heading = screen.getByRole("heading", { name: "Saved attempts" });
  const section = heading.closest("section");
  if (!section) throw new Error("Saved attempts section was not found.");
  return section;
}

describe("InterviewSessionWorkspace Saved Attempts UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(session());
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue(
      questionDetail(),
    );
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts,
      pagination: { page: 1, limit: 20, total: attempts.length, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockImplementation(
      async (_sessionId, attemptId) =>
        attempts.find((item) => item.id === attemptId) ?? attempts[0],
    );
  });

  it("uses Saved Attempts terminology and removes immutable-record language from normal UI", async () => {
    renderWorkspace();
    await waitForWorkspace();

    expect(
      screen.getByRole("heading", { name: "Saved attempts" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Save another attempt" }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Each submission is saved separately so you can review your practice over time.",
      ),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save attempt" })).not.toBeNull();
    expect(screen.queryByText(/immutable/i)).toBeNull();
  });

  it("keeps raw attempt filter values while presenting user-facing status labels", async () => {
    renderWorkspace();
    await waitForWorkspace();

    const select = screen.getByRole("combobox", { name: "Attempt status" });
    const options = within(select).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "All statuses",
      ...expectedStatusLabels,
    ]);
    expect(
      options.slice(1).map((option) => (option as HTMLOptionElement).value),
    ).toEqual(statusOrder);

    const history = attemptSection();
    for (const label of expectedStatusLabels) {
      expect(within(history).getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("shows submitted date/time and Review attempt cues, with score only when feedback exists", async () => {
    renderWorkspace();
    await waitForWorkspace();

    const history = attemptSection();
    const list = history.querySelector(".interview-attempt-list");
    expect(list).not.toBeNull();
    const listScope = within(list as HTMLElement);

    expect(listScope.getAllByText(/Submitted /)).toHaveLength(attempts.length);
    expect(listScope.getAllByText("Review attempt")).toHaveLength(
      attempts.length,
    );
    expect(listScope.getAllByText(/76\/100/)).toHaveLength(1);
    expect(list?.textContent).not.toMatch(/undefined\/100|null\/100/);
  });

  it("hides attempt paging for zero or one page", async () => {
    renderWorkspace();
    await waitForWorkspace();

    expect(
      screen.queryByRole("navigation", { name: "Saved attempt pages" }),
    ).toBeNull();
    const history = attemptSection();
    expect(within(history).queryByText("Page 1")).toBeNull();
  });

  it("uses the shared Saved attempt pager only when the server reports multiple pages", async () => {
    vi.mocked(interviewApi.listAttemptHistory).mockImplementation(
      async (_sessionId, query) => ({
        attempts: [attempt("recorded", query?.page ?? 1)],
        pagination: {
          page: query?.page ?? 1,
          limit: 20,
          total: 21,
          pages: 2,
        },
      }),
    );
    renderWorkspace();
    await waitForWorkspace();

    const pager = await screen.findByRole("navigation", {
      name: "Saved attempt pages",
    });
    expect(pager.textContent).toContain("Page 1");

    const previous = within(pager).getByRole("button", { name: "Previous" });
    const next = within(pager).getByRole("button", { name: "Next" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);

    await userEvent.click(next);
    await waitFor(() => {
      expect(interviewApi.listAttemptHistory).toHaveBeenLastCalledWith(
        sessionId,
        { page: 2, limit: 20, questionId },
        expect.any(AbortSignal),
      );
    });
  });

  it("uses presentation labels in selected-attempt detail", async () => {
    renderWorkspace();
    await waitForWorkspace();

    const history = attemptSection();
    const list = history.querySelector(".interview-attempt-list");
    const firstButton = within(list as HTMLElement).getAllByRole("button")[0];
    await userEvent.click(firstButton);

    const detail = await waitFor(() => {
      const element = history.querySelector(".interview-attempt-detail");
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(within(detail).getByText("Saved")).not.toBeNull();
    expect(within(detail).getByText(/Submitted /)).not.toBeNull();
    expect(within(detail).queryByText("recorded")).toBeNull();
  });

  it("uses the new save action and success copy without changing attempt immutability", async () => {
    const saved = attempt("recorded", 9);
    vi.mocked(interviewApi.recordInterviewAttempt).mockResolvedValue(saved);
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(saved);
    renderWorkspace();
    await waitForWorkspace();

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Written answer" }),
      "I would use idempotency keys and bounded retries.",
    );
    await user.click(screen.getByRole("button", { name: "Save attempt" }));

    expect(interviewApi.recordInterviewAttempt).toHaveBeenCalledWith(
      sessionId,
      questionId,
      {
        answerText: "I would use idempotency keys and bounded retries.",
      },
      expect.any(AbortSignal),
    );
    expect(
      await screen.findByText(
        "Attempt saved. Another submission will be saved separately.",
      ),
    ).not.toBeNull();
  });
});