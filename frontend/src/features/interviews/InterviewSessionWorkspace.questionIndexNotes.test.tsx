import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as interviewApi from "./interviewApi";
import { InterviewSessionWorkspace } from "./InterviewSessionWorkspace";

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

const sessionId = "507f1f77bcf86cd799439071";
const firstQuestionId = "507f1f77bcf86cd799439072";
const secondQuestionId = "507f1f77bcf86cd799439073";
const pageTwoQuestionId = "507f1f77bcf86cd799439074";
const timestamp = "2026-08-14T04:30:00.000Z";

function session(status: "active" | "archived" = "active") {
  return {
    id: sessionId,
    title: "Question index refinement",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["MongoDB"],
    skillGaps: ["System Design"],
    mode: "written-practice" as const,
    status,
    questionCount: 21,
    ...(status === "archived" ? { archivedAt: timestamp } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionSummary(
  id = firstQuestionId,
  question = "How would you design a reliable queue?",
  userNotes = "Saved canonical note.",
) {
  return {
    id,
    sessionId,
    source: "manual" as const,
    category: "System design",
    difficulty: "medium" as const,
    question,
    questionType: "legacy-open-response" as const,
    isPinned: false,
    userNotes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionDetail(
  id = firstQuestionId,
  question = "How would you design a reliable queue?",
  userNotes = "Saved canonical note.",
) {
  return {
    ...questionSummary(id, question, userNotes),
    modelAnswer: "Use durable storage and idempotent consumers.",
    explanation: "Discuss delivery guarantees and recovery.",
    explanationKeyPoints: ["Idempotency", "Backoff"],
  };
}

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
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

describe("InterviewSessionWorkspace question index and notes refinement", () => {
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
      attempts: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it("shows display-only question numbers and continues from the page offset", async () => {
    vi.mocked(interviewApi.listInterviewQuestions).mockImplementation(
      async (_requestedSessionId, options) =>
        options?.page === 2
          ? {
              questions: [
                questionSummary(
                  pageTwoQuestionId,
                  "How would you recover a poisoned queue?",
                  "",
                ),
              ],
              pagination: { page: 2, limit: 20, total: 21, pages: 2 },
            }
          : {
              questions: [questionSummary()],
              pagination: { page: 1, limit: 20, total: 21, pages: 2 },
            },
    );
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_requestedSessionId, questionId) =>
        questionId === pageTwoQuestionId
          ? questionDetail(
              pageTwoQuestionId,
              "How would you recover a poisoned queue?",
              "",
            )
          : questionDetail(),
    );

    const { container } = renderWorkspace();
    await screen.findByRole("button", {
      name: /How would you design a reliable queue/,
    });

    expect(
      container.querySelector(".interview-question-number")?.textContent,
    ).toBe("01");

    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));

    await screen.findByRole("button", {
      name: /How would you recover a poisoned queue/,
    });
    expect(
      container.querySelector(".interview-question-number")?.textContent,
    ).toBe("21");
    await waitFor(() => {
      expect(interviewApi.fetchInterviewQuestion).toHaveBeenCalledWith(
        sessionId,
        pageTwoQuestionId,
        expect.any(AbortSignal),
      );
    });
  });

  it("keeps empty editable notes collapsed until Add note and cannot hide a dirty draft", async () => {
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue(
      questionDetail(firstQuestionId, undefined, ""),
    );
    renderWorkspace();

    await screen.findByText("Use durable storage and idempotent consumers.");
    expect(
      screen.queryByRole("textbox", { name: "Private notes" }),
    ).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add note" }));
    const notes = screen.getByRole("textbox", { name: "Private notes" });
    expect(notes).not.toBeNull();

    await user.type(notes, "Draft note that has not been saved.");
    expect(screen.queryByRole("button", { name: "Hide" })).toBeNull();
    expect(screen.getByText("Unsaved notes.")).not.toBeNull();
  });

  it("opens saved notes automatically and collapses again when the next canonical question is empty", async () => {
    const second = questionSummary(
      secondQuestionId,
      "How would you handle a retry storm?",
      "",
    );
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), second],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_requestedSessionId, questionId) =>
        questionId === secondQuestionId
          ? questionDetail(
              secondQuestionId,
              "How would you handle a retry storm?",
              "",
            )
          : questionDetail(),
    );

    renderWorkspace();
    const notes = (await screen.findByRole("textbox", {
      name: "Private notes",
    })) as HTMLTextAreaElement;
    expect(notes.value).toBe("Saved canonical note.");
    const hideButton = screen.getByRole("button", {
      name: "Hide",
    }) as HTMLButtonElement;
    expect(hideButton.disabled).toBe(false);

    await userEvent.setup().click(
      screen.getByRole("button", { name: /How would you handle a retry storm/ }),
    );

    await screen.findByRole("button", { name: "Add note" });
    expect(
      screen.queryByRole("textbox", { name: "Private notes" }),
    ).toBeNull();
  });

  it("does not expose an editable note action for an archived question with no saved note", async () => {
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(
      session("archived"),
    );
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue(
      questionDetail(firstQuestionId, undefined, ""),
    );

    renderWorkspace();
    await screen.findByText("Use durable storage and idempotent consumers.");

    expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Private notes" }),
    ).toBeNull();
  });
});
