import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as interviewApi from "./interviewApi";
import * as interviewPolling from "./interviewPolling";
import { InterviewSessionWorkspace } from "./InterviewSessionWorkspace";
import type {
  EffectiveInterviewQuestionType,
  InterviewAttempt,
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

const sessionId = "507f1f77bcf86cd799439021";
const questionId = "507f1f77bcf86cd799439022";
const attemptId = "507f1f77bcf86cd799439023";
const jobId = "507f1f77bcf86cd799439024";
const timestamp = "2026-08-13T00:00:00.000Z";

function session() {
  return {
    id: sessionId,
    title: "Typed interview practice",
    targetRole: "Software Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["APIs"],
    skillGaps: [],
    mode: "written-practice" as const,
    status: "active" as const,
    questionCount: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionSummary(
  questionType: EffectiveInterviewQuestionType,
): InterviewQuestionSummary {
  return {
    id: questionId,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "A typed practice question.",
    questionType,
    ...(questionType === "multiple-choice"
      ? {
          multipleChoice: {
            options: [
              { id: "option-a", text: "First option" },
              { id: "option-b", text: "Second option" },
            ],
          },
        }
      : {}),
    isPinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function questionDetail(
  questionType: EffectiveInterviewQuestionType,
): InterviewQuestionDetail {
  return {
    ...questionSummary(questionType),
    explanationKeyPoints: [],
  };
}

function textAttempt(
  type: Exclude<
    EffectiveInterviewQuestionType,
    "legacy-open-response" | "multiple-choice"
  >,
  text: string,
): InterviewAttempt {
  return {
    id: attemptId,
    sessionId,
    questionId,
    answer: { type, text },
    status: "recorded",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function mcqAttempt(correct = false): InterviewAttempt {
  return {
    id: attemptId,
    sessionId,
    questionId,
    answer: {
      type: "multiple-choice",
      selectedOptionId: "option-a",
    },
    evaluation: {
      kind: "multiple-choice",
      score: correct ? 100 : 0,
      correct,
      correctOptionId: correct ? "option-a" : "option-b",
    },
    status: "recorded",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function renderWorkspace(type: EffectiveInterviewQuestionType) {
  vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
    questions: [questionSummary(type)],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  });
  vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue(
    questionDetail(type),
  );
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
  await screen.findByRole("heading", { name: "Typed interview practice" });
  await screen.findByRole("button", { name: /A typed practice question/ });
}

describe("InterviewSessionWorkspace typed question UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(session());
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it("makes Short Answer explicit in every default generation request", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(
        "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
      ),
    });
    vi.mocked(interviewApi.generateInterviewQuestions).mockResolvedValue({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.questions.generate",
        status: "cancelled",
        progress: 0,
        attempts: 0,
        maxAttempts: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace("short-answer");
    await waitForWorkspace();

    expect(
      (screen.getByRole("checkbox", {
        name: "Short Answer",
      }) as HTMLInputElement).checked,
    ).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    await waitFor(() => {
      expect(interviewApi.generateInterviewQuestions).toHaveBeenCalledWith(
        sessionId,
        {
          requestId: "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
          count: 10,
          categories: ["APIs"],
          questionTypes: ["short-answer"],
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("creates a manual MCQ with canonical option strings and a correct index", async () => {
    vi.mocked(interviewApi.addManualQuestion).mockResolvedValue(
      questionDetail("multiple-choice"),
    );
    renderWorkspace("short-answer");
    await waitForWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add manually" }));
    const form = document.getElementById("manual-question-form");
    if (!form) throw new Error("Manual question form was not found.");
    const manual = within(form);
    await user.selectOptions(
      manual.getByRole("combobox", { name: "Question type" }),
      "multiple-choice",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Category" }),
      " JavaScript ",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Question" }),
      "Which option is correct?",
    );
    const optionInputs = manual.getAllByRole("textbox", { name: /Option \d/ });
    await user.type(optionInputs[0]!, " First option ");
    await user.type(optionInputs[1]!, " Second option ");
    await user.click(manual.getAllByRole("radio", { name: "Correct" })[1]!);
    await user.click(manual.getByRole("button", { name: "Add question" }));

    expect(interviewApi.addManualQuestion).toHaveBeenCalledWith(
      sessionId,
      {
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question: "Which option is correct?",
        multipleChoice: {
          options: ["First option", "Second option"],
          correctOptionIndex: 1,
        },
      },
      expect.any(AbortSignal),
    );
  });

  it("submits a modern structured answer with the canonical type discriminator", async () => {
    const serialized = "Situation:\nA structured example.";
    const saved = textAttempt("behavioral", serialized);
    vi.mocked(interviewApi.recordInterviewAttempt).mockResolvedValue(saved);
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(saved);
    renderWorkspace("behavioral");
    await waitForWorkspace();
    const user = userEvent.setup();

    const answer = await screen.findByRole("textbox", {
      name: "Situation",
    });
    await user.type(answer, "  A structured example.  ");
    await user.click(screen.getByRole("button", { name: "Save attempt" }));

    expect(interviewApi.recordInterviewAttempt).toHaveBeenCalledWith(
      sessionId,
      questionId,
      {
        answer: {
          type: "behavioral",
          text: serialized,
        },
      },
      expect.any(AbortSignal),
    );
  });

  it("keeps MCQ explanation locked before submission and shows deterministic result after save", async () => {
    const saved = mcqAttempt(false);
    vi.mocked(interviewApi.recordInterviewAttempt).mockResolvedValue(saved);
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(saved);
    renderWorkspace("multiple-choice");
    await waitForWorkspace();
    const user = userEvent.setup();

    expect(
      await screen.findByText("Submit an attempt to unlock the explanation."),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Request explanation" }),
    ).toBeNull();
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [saved],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    await user.click(screen.getByRole("radio", { name: "First option" }));
    await user.click(screen.getByRole("button", { name: "Save attempt" }));

    expect(interviewApi.recordInterviewAttempt).toHaveBeenCalledWith(
      sessionId,
      questionId,
      {
        answer: {
          type: "multiple-choice",
          selectedOptionId: "option-a",
        },
      },
      expect.any(AbortSignal),
    );
    const reviewBadge = await screen.findByText("Needs review");
    const attemptDetail = reviewBadge.closest(".interview-attempt-detail");
    expect(attemptDetail).not.toBeNull();
    expect(within(attemptDetail as HTMLElement).getByText("0/100")).not.toBeNull();
    expect(
      within(attemptDetail as HTMLElement).getByText(/Correct answer:/).textContent,
    ).toContain("Second option");
    expect(
      screen.queryByRole("button", { name: "Request feedback" }),
    ).toBeNull();
  });

  it("shows the human Open response label without exposing the internal legacy token", async () => {
    renderWorkspace("legacy-open-response");
    await waitForWorkspace();

    expect(screen.getAllByText("Open response").length).toBeGreaterThan(0);
    expect(screen.queryByText("legacy-open-response")).toBeNull();
  });
});
