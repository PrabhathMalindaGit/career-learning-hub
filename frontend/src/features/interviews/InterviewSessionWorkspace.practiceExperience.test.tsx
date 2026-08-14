import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as interviewApi from "./interviewApi";
import * as interviewPolling from "./interviewPolling";
import { InterviewSessionWorkspace } from "./InterviewSessionWorkspace";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
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

const sessionId = "507f1f77bcf86cd799439031";
const questionId = "507f1f77bcf86cd799439032";
const jobId = "507f1f77bcf86cd799439033";
const timestamp = "2026-08-14T00:00:00.000Z";
const requestId = "bff56f38-6fbe-4d6c-961c-d79c36dc4111";

function session() {
  return {
    id: sessionId,
    title: "Practice experience refinement",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["MongoDB"],
    skillGaps: ["System Design"],
    mode: "written-practice" as const,
    status: "active" as const,
    questionCount: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionSummary(
  questionType: EffectiveInterviewQuestionType = "short-answer",
): InterviewQuestionSummary {
  return {
    id: questionId,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "A practice experience question.",
    questionType,
    isPinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionDetail(
  questionType: EffectiveInterviewQuestionType = "short-answer",
  starterCode?: string,
): InterviewQuestionDetail {
  return {
    ...questionSummary(questionType),
    ...(starterCode === undefined ? {} : { starterCode }),
    explanationKeyPoints: [],
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
  render(<RouterProvider router={router} />);
  return router;
}

async function waitForWorkspace() {
  await screen.findByRole("heading", {
    name: "Practice experience refinement",
  });
  await screen.findByRole("button", {
    name: /A practice experience question/,
  });
}

function completedGenerationJob() {
  return {
    reason: "terminal" as const,
    job: {
      id: jobId,
      type: "interview.questions.generate" as const,
      status: "completed" as const,
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result: {
        kind: "generation" as const,
        insertedCount: 1,
        duplicateCount: 0,
        questionIds: [questionId],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

describe("InterviewSessionWorkspace practice experience refinement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
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

  it("preselects session-context categories and sends only the user's final selection", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(requestId),
    });
    vi.mocked(interviewApi.generateInterviewQuestions).mockResolvedValue({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        ...completedGenerationJob().job,
        status: "cancelled",
        progress: 0,
        attempts: 0,
        result: undefined,
      },
    });

    renderWorkspace();
    await waitForWorkspace();

    const user = userEvent.setup();
    const mongo = screen.getByRole("button", { name: "MongoDB" });
    const systemDesign = screen.getByRole("button", {
      name: "System Design",
    });
    expect(mongo.getAttribute("aria-pressed")).toBe("true");
    expect(systemDesign.getAttribute("aria-pressed")).toBe("true");

    await user.click(systemDesign);
    await user.type(screen.getByLabelText("Custom categories"), "API Security");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    await waitFor(() => {
      expect(interviewApi.generateInterviewQuestions).toHaveBeenCalledWith(
        sessionId,
        {
          requestId,
          count: 10,
          categories: ["MongoDB", "API Security"],
          questionTypes: ["short-answer"],
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("allows an intentionally empty category selection", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(requestId),
    });
    vi.mocked(interviewApi.generateInterviewQuestions).mockResolvedValue({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        ...completedGenerationJob().job,
        status: "cancelled",
        progress: 0,
        attempts: 0,
        result: undefined,
      },
    });

    renderWorkspace();
    await waitForWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "MongoDB" }));
    await user.click(screen.getByRole("button", { name: "System Design" }));
    expect(screen.getByText("0 categories selected")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    await waitFor(() => {
      expect(interviewApi.generateInterviewQuestions).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({ categories: [] }),
        expect.any(AbortSignal),
      );
    });
  });

  it("preserves category choices when generation refreshes the same session", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(requestId),
    });
    vi.mocked(interviewApi.generateInterviewQuestions).mockResolvedValue({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue(
      completedGenerationJob(),
    );

    renderWorkspace();
    await waitForWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "System Design" }));
    await user.type(screen.getByLabelText("Custom categories"), "API Security");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    await waitFor(() => {
      expect(interviewApi.fetchInterviewSession).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByRole("button", { name: "System Design" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(screen.getByText("API Security")).not.toBeNull();
    expect(screen.getByText("2 categories selected")).not.toBeNull();
  });

  it("submits trimmed optional starter code for a manual Coding question", async () => {
    const starterCode = [
      "async function loadUser(userId) {",
      "  // TODO",
      "}",
    ].join("\n");
    vi.mocked(interviewApi.addManualQuestion).mockResolvedValue(
      questionDetail("coding", starterCode),
    );

    renderWorkspace();
    await waitForWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add manually" }));
    const form = document.getElementById("manual-question-form");
    if (!form) throw new Error("Manual question form was not found.");
    const manual = within(form);

    await user.selectOptions(
      manual.getByRole("combobox", { name: "Question type" }),
      "coding",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Category" }),
      " Node.js ",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Question" }),
      "Write a function that loads one owned user.",
    );
    await user.type(
      manual.getByRole("textbox", { name: /Starter code/i }),
      `  ${starterCode}  `,
    );
    await user.type(
      manual.getByRole("textbox", { name: /Model answer/i }),
      " Check ownership before returning the user. ",
    );
    await user.click(manual.getByRole("button", { name: "Add question" }));

    expect(interviewApi.addManualQuestion).toHaveBeenCalledWith(
      sessionId,
      {
        questionType: "coding",
        category: "Node.js",
        difficulty: "medium",
        question: "Write a function that loads one owned user.",
        starterCode,
        modelAnswer: "Check ownership before returning the user.",
      },
      expect.any(AbortSignal),
    );
  });

  it("clears stale manual starter code when leaving Coding", async () => {
    vi.mocked(interviewApi.addManualQuestion).mockResolvedValue(
      questionDetail("behavioral"),
    );

    renderWorkspace();
    await waitForWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add manually" }));
    const form = document.getElementById("manual-question-form");
    if (!form) throw new Error("Manual question form was not found.");
    const manual = within(form);
    const type = manual.getByRole("combobox", { name: "Question type" });

    await user.selectOptions(type, "coding");
    await user.type(
      manual.getByRole("textbox", { name: /Starter code/i }),
      "function stale() {}",
    );
    await user.selectOptions(type, "behavioral");
    expect(manual.queryByRole("textbox", { name: /Starter code/i })).toBeNull();

    await user.type(
      manual.getByRole("textbox", { name: "Category" }),
      "Leadership",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Question" }),
      "Describe a difficult technical decision.",
    );
    await user.click(manual.getByRole("button", { name: "Add question" }));

    expect(interviewApi.addManualQuestion).toHaveBeenCalledWith(
      sessionId,
      {
        questionType: "behavioral",
        category: "Leadership",
        difficulty: "medium",
        question: "Describe a difficult technical decision.",
      },
      expect.any(AbortSignal),
    );
  });
});
