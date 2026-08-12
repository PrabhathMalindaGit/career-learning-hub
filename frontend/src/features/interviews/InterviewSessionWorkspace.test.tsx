import {
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
import * as interviewPolling from "./interviewPolling";
import { InterviewSessionWorkspace } from "./InterviewSessionWorkspace";
import type {
  InterviewAttempt,
  InterviewQuestionDetail,
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
const timestamp = "2026-07-25T08:00:00.000Z";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function session(status: "active" | "completed" | "archived" = "active") {
  return {
    id: sessionId,
    title: "Platform interview preparation",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["API design", "Reliability"],
    skillGaps: ["Concurrency"],
    jobDescription: "Build secure APIs.",
    mode: "written-practice" as const,
    status,
    questionCount: 1,
    ...(status === "completed" ? { completedAt: timestamp } : {}),
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
    userNotes: "Review idempotency.",
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

function alternateQuestion() {
  return {
    ...questionDetail(),
    id: "507f1f77bcf86cd799439027",
    category: "Reliability",
    question: "How would you recover a poisoned queue?",
    userNotes: "Canonical alternate notes.",
    modelAnswer: "Quarantine poison messages.",
    explanation: "Use bounded retries and a dead-letter queue.",
    explanationKeyPoints: ["Quarantine", "Replay"],
  };
}

function attempt(withFeedback = false) {
  return {
    id: attemptId,
    sessionId,
    questionId,
    answerText: "I would use a durable queue and idempotency keys.",
    status: withFeedback
      ? ("feedback-completed" as const)
      : ("recorded" as const),
    ...(withFeedback
      ? {
          feedback: {
            score: 76,
            summary: "A clear foundation with room for failure analysis.",
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

function alternateAttempt(withFeedback = false): InterviewAttempt {
  return {
    ...attempt(withFeedback),
    id: "507f1f77bcf86cd799439028",
    answerText: "I would quarantine and inspect poison messages.",
  };
}

function apiFailure(
  message: string,
  requestId = "workspace-request-id-0001",
) {
  return new ApiError(
    503,
    "INTERVIEW_UNAVAILABLE",
    message,
    requestId,
    { internal: "must-not-render" },
  );
}

function renderWorkspace(
  initialSessionId = sessionId,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/interviews/:sessionId",
        element: <InterviewSessionWorkspace />,
      },
    ],
    { initialEntries: [`/interviews/${initialSessionId}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("InterviewSessionWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(
      session(),
    );
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

  it("loads route-owned context, preserves server question order, and opens validated detail", async () => {
    renderWorkspace();
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);

    expect(
      await screen.findByRole("heading", {
        name: "Platform interview preparation",
      }),
    ).not.toBeNull();
    const breadcrumbs = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    expect(breadcrumbs.textContent).toContain(
      "Platform interview preparation",
    );
    expect(breadcrumbs.textContent).not.toContain(sessionId);
    expect(screen.getByText("Backend Engineer · Mid-level")).not.toBeNull();
    expect(
      await screen.findByRole("button", {
        name: /How would you design a reliable job processor/,
      }),
    ).not.toBeNull();
    expect(
      await screen.findByText(
        "Discuss delivery guarantees and recovery.",
      ),
    ).not.toBeNull();
    expect(interviewApi.fetchInterviewSession).toHaveBeenCalledWith(
      sessionId,
      expect.any(AbortSignal),
    );
    const backLink = screen.getByRole("link", {
      name: "← All interview sessions",
    });
    expect(backLink.getAttribute("href")).toBe("/interviews");
    expect(
      backLink.classList.contains("workspace-back-link"),
    ).toBe(true);
  });

  it("renders three real context entries without an empty grid item when no job description exists", async () => {
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue({
      ...session(),
      jobDescription: undefined,
    });
    renderWorkspace();

    const context = await screen.findByRole("region", {
      name: "Session context",
    });
    const contextGrid = context.querySelector("dl");
    const entries = Array.from(
      contextGrid?.querySelectorAll(":scope > div") ?? [],
    );

    expect(contextGrid?.className).toBe(
      "interview-context-grid interview-context-grid--three",
    );
    expect(entries).toHaveLength(3);
    expect(
      entries.map((entry) => entry.querySelector("dt")?.textContent),
    ).toEqual(["Focus topics", "Skill gaps", "Updated"]);
    expect(
      entries.every(
        (entry) =>
          entry.querySelector("dt")?.textContent?.trim() &&
          entry.querySelector("dd")?.textContent?.trim(),
      ),
    ).toBe(true);
    expect(
      within(context).queryByText("Job description"),
    ).toBeNull();
  });

  it("keeps all four real context entries when a job description exists", async () => {
    renderWorkspace();

    const context = await screen.findByRole("region", {
      name: "Session context",
    });
    const contextGrid = context.querySelector("dl");
    const entries = Array.from(
      contextGrid?.querySelectorAll(":scope > div") ?? [],
    );

    expect(contextGrid?.className).toBe(
      "interview-context-grid interview-context-grid--four",
    );
    expect(entries).toHaveLength(4);
    expect(
      entries.map((entry) => entry.querySelector("dt")?.textContent),
    ).toEqual([
      "Focus topics",
      "Skill gaps",
      "Job description",
      "Updated",
    ]);
    expect(within(context).getByText("Build secure APIs.")).not.toBeNull();
  });

  it("clears route-owned state and ignores late detail from the prior session", async () => {
    const nextSessionId = "507f1f77bcf86cd799439026";
    let resolveOldDetail:
      | ((value: ReturnType<typeof questionDetail>) => void)
      | undefined;
    vi.mocked(interviewApi.fetchInterviewSession).mockImplementation(
      async (id) =>
        id === sessionId
          ? session()
          : {
              ...session(),
              id: nextSessionId,
              title: "Second interview session",
              questionCount: 0,
            },
    );
    vi.mocked(interviewApi.listInterviewQuestions).mockImplementation(
      async (id) =>
        id === sessionId
          ? {
              questions: [questionSummary()],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            }
          : {
              questions: [],
              pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            },
    );
    vi.mocked(interviewApi.fetchInterviewQuestion).mockReturnValue(
      new Promise((resolve) => {
        resolveOldDetail = resolve;
      }),
    );
    const router = renderWorkspace();
    await screen.findByRole("button", {
      name: /How would you design a reliable job processor/,
    });

    await router.navigate(`/interviews/${nextSessionId}`);
    expect(
      await screen.findByRole("heading", {
        name: "Second interview session",
      }),
    ).not.toBeNull();
    resolveOldDetail?.(questionDetail());

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Discuss delivery guarantees and recovery.",
        ),
      ).toBeNull();
    });
    expect(
      screen.getByText("No questions match these filters."),
    ).not.toBeNull();
  });

  it("clears question-detail loading when the next route has no questions", async () => {
    const nextSessionId = "507f1f77bcf86cd799439030";
    vi.mocked(interviewApi.fetchInterviewSession).mockImplementation(
      async (id) =>
        id === sessionId
          ? session()
          : {
              ...session(),
              id: nextSessionId,
              title: "Empty interview session",
              questionCount: 0,
            },
    );
    vi.mocked(interviewApi.listInterviewQuestions).mockImplementation(
      async (id) =>
        id === sessionId
          ? {
              questions: [questionSummary()],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            }
          : {
              questions: [],
              pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            },
    );
    vi.mocked(interviewApi.fetchInterviewQuestion).mockReturnValue(
      new Promise(() => undefined),
    );
    const router = renderWorkspace();
    await screen.findByRole("button", {
      name: /How would you design a reliable job processor/,
    });

    await router.navigate(`/interviews/${nextSessionId}`);
    expect(
      await screen.findByRole("heading", {
        name: "Empty interview session",
      }),
    ).not.toBeNull();
    expect(
      await screen.findByText("No questions match these filters."),
    ).not.toBeNull();

    expect(screen.queryByText("Loading question…")).toBeNull();
    expect(
      screen.getByText(
        "Choose a question to review its private practice record.",
      ),
    ).not.toBeNull();
  });

  it("saves and clears notes only through explicit actions", async () => {
    vi.mocked(interviewApi.saveQuestionNotes).mockImplementation(
      async (_sessionId, _questionId, notes) => ({
        ...questionDetail(),
        userNotes: notes,
      }),
    );
    renderWorkspace();
    const notes = await screen.findByRole("textbox", {
      name: "Private notes",
    });
    const user = userEvent.setup();
    await user.clear(notes);
    await user.type(notes, "Compare delivery semantics.");
    expect(interviewApi.saveQuestionNotes).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save notes" }));
    expect(interviewApi.saveQuestionNotes).toHaveBeenLastCalledWith(
      sessionId,
      questionId,
      "Compare delivery semantics.",
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Notes saved.")).not.toBeNull();
    expect(
      (screen.getByRole("button", {
        name: "Save notes",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Clear notes" }));
    expect(interviewApi.saveQuestionNotes).toHaveBeenLastCalledWith(
      sessionId,
      questionId,
      "",
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Notes cleared.")).not.toBeNull();
  });

  it("adds a bounded manual question and adopts its canonical identity", async () => {
    vi.mocked(interviewApi.addManualQuestion).mockResolvedValue({
      ...questionDetail(),
      id: "507f1f77bcf86cd799439025",
      question: "How do you handle poison messages?",
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Add manually" }),
    );
    const form = document.getElementById("manual-question-form");
    expect(form).not.toBeNull();
    const manual = within(form as HTMLFormElement);
    await user.type(
      manual.getByRole("textbox", { name: "Category" }),
      "Reliability",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Question" }),
      "How do you handle poison messages?",
    );
    await user.click(
      manual.getByRole("button", { name: "Add question" }),
    );

    expect(interviewApi.addManualQuestion).toHaveBeenCalledWith(
      sessionId,
      {
        category: "Reliability",
        difficulty: "medium",
        question: "How do you handle poison messages?",
      },
      expect.any(AbortSignal),
    );
    await waitFor(() => {
      expect(interviewApi.listInterviewQuestions).toHaveBeenCalledTimes(2);
    });
  });

  it("adopts the canonical pin response and reloads server order", async () => {
    vi.mocked(interviewApi.setQuestionPinned).mockResolvedValue({
      ...questionDetail(),
      isPinned: true,
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });

    await userEvent.click(
      screen.getByRole("button", { name: "Pin question" }),
    );

    expect(interviewApi.setQuestionPinned).toHaveBeenCalledWith(
      sessionId,
      questionId,
      true,
      expect.any(AbortSignal),
    );
    expect(
      await screen.findByRole("button", { name: "Unpin" }),
    ).not.toBeNull();
    await waitFor(() => {
      expect(interviewApi.listInterviewQuestions).toHaveBeenCalledTimes(2);
    });
  });

  it("preserves a failed answer draft and clears it only after canonical success", async () => {
    vi.mocked(interviewApi.recordInterviewAttempt)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "ATTEMPT_UNAVAILABLE",
          "The attempt could not be recorded.",
          "attempt-request-0001",
        ),
      )
      .mockResolvedValueOnce(attempt());
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(),
    );
    renderWorkspace();
    const answer = await screen.findByRole("textbox", {
      name: "Written answer",
    });
    const user = userEvent.setup();
    await user.type(answer, "My private answer draft.");
    await user.click(
      screen.getByRole("button", { name: "Save attempt" }),
    );

    expect(
      await screen.findByText(/The attempt could not be recorded\./),
    ).not.toBeNull();
    const answerError = screen.getByText(
      /The attempt could not be recorded\./,
    ).closest('[role="alert"]');
    expect(answer.getAttribute("aria-invalid")).toBe("true");
    expect(answer.getAttribute("aria-describedby")).toContain(
      answerError?.id,
    );
    expect((answer as HTMLTextAreaElement).value).toBe(
      "My private answer draft.",
    );

    await user.click(
      screen.getByRole("button", { name: "Save attempt" }),
    );
    await waitFor(() => {
      expect((answer as HTMLTextAreaElement).value).toBe("");
    });
    expect(interviewApi.recordInterviewAttempt).toHaveBeenCalledTimes(2);
  });

  it("shows historical attempts as read-only and qualifies feedback scores", async () => {
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt(true)],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(true),
    );
    renderWorkspace();

    await userEvent.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    expect(
      await screen.findByText(
        "I would use a durable queue and idempotency keys.",
      ),
    ).not.toBeNull();
    const feedbackHeading = screen.getByRole("heading", {
      name: "Model-generated practice guidance",
    });
    const feedback = feedbackHeading.closest("section");
    expect(feedback).not.toBeNull();
    expect(
      within(feedback as HTMLElement).getByText("76/100"),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "This is not a hiring prediction, an objective evaluation, or a guarantee. Model guidance may be imperfect.",
      ),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: /edit attempt/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /delete attempt/i }),
    ).toBeNull();
  });

  it("copies only visible model-answer and explanation text with accessible outcomes", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    renderWorkspace();

    await screen.findByRole("textbox", { name: "Written answer" });
    await user.click(
      screen.getByRole("button", { name: "Copy model answer" }),
    );
    expect(writeText).toHaveBeenLastCalledWith(
      "Use durable queues and idempotent consumers.",
    );
    expect(
      screen.getByRole("status", { name: "Model answer copy status" })
        .textContent,
    ).toBe("Copied");

    await user.click(
      screen.getByRole("button", { name: "Copy explanation" }),
    );
    expect(writeText).toHaveBeenLastCalledWith(
      "Discuss delivery guarantees and recovery.",
    );
    expect(
      screen.getByRole("status", { name: "Explanation copy status" })
        .textContent,
    ).toBe("Copied");
    expect(writeText).not.toHaveBeenCalledWith(
      expect.stringContaining(questionId),
    );
  });

  it("shows a safe copy failure and omits controls for missing text", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(new Error("private clipboard detail"));
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue({
      ...questionDetail(),
      modelAnswer: undefined,
    });
    renderWorkspace();

    await screen.findByRole("textbox", { name: "Written answer" });
    expect(
      screen.queryByRole("button", { name: "Copy model answer" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Copy explanation" }),
    );
    expect(
      screen.getByRole("status", { name: "Explanation copy status" })
        .textContent,
    ).toBe("Copy failed");
    expect(screen.queryByText("private clipboard detail")).toBeNull();
  });

  it("does not render copy controls when the current detail has no copyable text", async () => {
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue({
      ...questionDetail(),
      modelAnswer: undefined,
      explanation: undefined,
      explanationKeyPoints: [],
    });
    renderWorkspace();

    await screen.findByRole("textbox", { name: "Written answer" });
    expect(
      screen.queryByRole("button", { name: "Copy model answer" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Copy explanation" }),
    ).toBeNull();
  });

  it("presents pinned state visibly without rendering raw record IDs", async () => {
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [{ ...questionSummary(), isPinned: true }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue({
      ...questionDetail(),
      isPinned: true,
    });
    renderWorkspace();

    await screen.findByRole("textbox", { name: "Written answer" });
    expect(screen.getAllByText("Pinned").length).toBeGreaterThan(0);
    expect(screen.queryByText(sessionId)).toBeNull();
    expect(screen.queryByText(questionId)).toBeNull();
    expect(screen.queryByText(attemptId)).toBeNull();
  });

  it("handles an already-available explanation without polling", async () => {
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue({
      ...questionDetail(),
      explanation: undefined,
      explanationKeyPoints: [],
    });
    vi.mocked(interviewApi.requestQuestionExplanation).mockResolvedValue({
      kind: "available",
      question: {
        ...questionDetail(),
        explanation: "Canonical explanation now available.",
      },
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });

    await userEvent.click(
      screen.getByRole("button", { name: "Request explanation" }),
    );

    expect(
      await screen.findByText("Canonical explanation now available."),
    ).not.toBeNull();
    expect(interviewPolling.pollInterviewJob).not.toHaveBeenCalled();
  });

  it("polls a queued explanation and reloads canonical detail", async () => {
    const withoutExplanation = {
      ...questionDetail(),
      explanation: undefined,
      explanationKeyPoints: [],
    };
    vi.mocked(interviewApi.fetchInterviewQuestion)
      .mockResolvedValueOnce(withoutExplanation)
      .mockResolvedValue({
        ...questionDetail(),
        explanation: "Explanation loaded after the queued job.",
      });
    vi.mocked(interviewApi.requestQuestionExplanation).mockResolvedValue({
      kind: "queued",
      job: {
        id: jobId,
        type: "interview.question.explain",
        status: "queued",
      },
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.question.explain",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "explanation",
          questionId,
          explanationReady: true,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    await screen.findByRole("button", { name: "Request explanation" });

    await userEvent.click(
      screen.getByRole("button", { name: "Request explanation" }),
    );

    expect(interviewPolling.pollInterviewJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId,
        expectedType: "interview.question.explain",
        expectedResultId: questionId,
      }),
    );
    expect(
      await screen.findByText(
        "Explanation loaded after the queued job.",
      ),
    ).not.toBeNull();
  });

  it("adopts already-available feedback only after an explicit request", async () => {
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(),
    );
    vi.mocked(interviewApi.requestAttemptFeedback).mockResolvedValue({
      kind: "available",
      attempt: attempt(true),
    });
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    expect(interviewApi.requestAttemptFeedback).not.toHaveBeenCalled();

    await userEvent.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );

    expect(interviewApi.requestAttemptFeedback).toHaveBeenCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
      questionId,
    );
    expect(
      await screen.findByText("Model-generated practice guidance"),
    ).not.toBeNull();
    expect(interviewApi.fetchInterviewAttempt).toHaveBeenLastCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
      questionId,
    );
  });

  it("polls queued feedback and reloads the bound canonical attempt", async () => {
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt)
      .mockResolvedValueOnce(attempt())
      .mockResolvedValue(attempt(true));
    vi.mocked(interviewApi.requestAttemptFeedback).mockResolvedValue({
      kind: "queued",
      attemptId,
      job: {
        id: jobId,
        type: "interview.attempt.feedback",
        status: "queued",
      },
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.attempt.feedback",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "feedback",
          attemptId,
          score: 76,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    await userEvent.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );

    expect(interviewPolling.pollInterviewJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId,
        expectedType: "interview.attempt.feedback",
        expectedResultId: attemptId,
      }),
    );
    expect(
      await screen.findByText("Model-generated practice guidance"),
    ).not.toBeNull();
    expect(interviewApi.fetchInterviewAttempt).toHaveBeenLastCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
      questionId,
    );
    const fetchJob = vi.mocked(interviewPolling.pollInterviewJob).mock
      .calls[0]?.[0].fetchJob;
    await fetchJob?.(jobId);
    expect(interviewApi.fetchInterviewJob).toHaveBeenCalledWith(
      jobId,
      undefined,
      {
        expectedType: "interview.attempt.feedback",
        expectedResultId: attemptId,
      },
    );
  });

  it("clears completed feedback messaging when another attempt is selected", async () => {
    let feedbackReady = false;
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt(), alternateAttempt()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockImplementation(
      async (_session, id) =>
        id === attemptId ? attempt(feedbackReady) : alternateAttempt(),
    );
    vi.mocked(interviewApi.requestAttemptFeedback).mockImplementation(
      async () => {
        feedbackReady = true;
        return {
          kind: "queued",
          attemptId,
          job: {
            id: jobId,
            type: "interview.attempt.feedback",
            status: "queued",
          },
        };
      },
    );
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.attempt.feedback",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "feedback",
          attemptId,
          score: 76,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    const user = userEvent.setup();
    const attemptButtons = await screen.findAllByRole("button", {
      name: /Review attempt/,
    });
    await user.click(attemptButtons[0]!);
    await user.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );
    expect(
      await screen.findByText("Practice feedback is ready."),
    ).not.toBeNull();

    await user.click(attemptButtons[1]!);

    await waitFor(() => {
      expect(
        screen.queryByText("Practice feedback is ready."),
      ).toBeNull();
    });
    expect(
      await screen.findByText(
        "I would quarantine and inspect poison messages.",
      ),
    ).not.toBeNull();
  });

  it("uses one generation UUID, polls the accepted job, and reloads canonical questions", async () => {
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
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "generation",
          insertedCount: 3,
          duplicateCount: 0,
          questionIds: [questionId],
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });

    await userEvent.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    await waitFor(() => {
      expect(interviewApi.generateInterviewQuestions).toHaveBeenCalledWith(
        sessionId,
        {
          requestId: "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
          count: 10,
          categories: [],
        },
        expect.any(AbortSignal),
      );
    });
    expect(interviewPolling.pollInterviewJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId,
        expectedType: "interview.questions.generate",
      }),
    );
    await waitFor(() => {
      expect(interviewApi.listInterviewQuestions).toHaveBeenCalledTimes(2);
    });
  });

  it("reuses a generation UUID only after an ambiguous transport interruption", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(
        "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
      ),
    });
    vi.mocked(interviewApi.generateInterviewQuestions)
      .mockRejectedValueOnce(new TypeError("network interrupted"))
      .mockResolvedValueOnce({
        id: jobId,
        type: "interview.questions.generate",
        status: "queued",
      });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.questions.generate",
        status: "failed",
        progress: 20,
        attempts: 1,
        maxAttempts: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });
    const generate = screen.getByRole("button", {
      name: "Generate questions",
    });

    await userEvent.click(generate);
    await screen.findByText(
      "The request could not be completed. Try again.",
    );
    await userEvent.click(generate);

    await waitFor(() => {
      expect(
        interviewApi.generateInterviewQuestions,
      ).toHaveBeenCalledTimes(2);
    });
    const firstInput = vi.mocked(
      interviewApi.generateInterviewQuestions,
    ).mock.calls[0]?.[1];
    const secondInput = vi.mocked(
      interviewApi.generateInterviewQuestions,
    ).mock.calls[1]?.[1];
    expect(firstInput?.requestId).toBe(secondInput?.requestId);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("reuses a generation UUID after a malformed successful response", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(
        "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
      ),
    });
    vi.mocked(interviewApi.generateInterviewQuestions)
      .mockRejectedValueOnce(
        new ApiError(
          502,
          "INVALID_INTERVIEW_RESPONSE",
          "The server returned an invalid interview response.",
          "generation-request-id-0001",
        ),
      )
      .mockResolvedValueOnce({
        id: jobId,
        type: "interview.questions.generate",
        status: "queued",
      });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.questions.generate",
        status: "failed",
        progress: 20,
        attempts: 1,
        maxAttempts: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });
    const generate = screen.getByRole("button", {
      name: "Generate questions",
    });

    await userEvent.click(generate);
    await screen.findByText(
      "The server returned an invalid interview response.",
    );
    await userEvent.click(generate);

    await waitFor(() => {
      expect(
        interviewApi.generateInterviewQuestions,
      ).toHaveBeenCalledTimes(2);
    });
    const firstInput = vi.mocked(
      interviewApi.generateInterviewQuestions,
    ).mock.calls[0]?.[1];
    const secondInput = vi.mocked(
      interviewApi.generateInterviewQuestions,
    ).mock.calls[1]?.[1];
    expect(firstInput?.requestId).toBe(secondInput?.requestId);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("uses a new UUID for an explicit generation retry after terminal failure", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(
          "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
        )
        .mockReturnValueOnce(
          "efdf2cb4-e2ef-4939-93fb-0143ea577d48",
        ),
    });
    vi.mocked(interviewApi.generateInterviewQuestions).mockResolvedValue({
      id: jobId,
      type: "interview.questions.generate",
      status: "queued",
    });
    vi.mocked(interviewPolling.pollInterviewJob)
      .mockResolvedValueOnce({
        reason: "terminal",
        job: {
          id: jobId,
          type: "interview.questions.generate",
          status: "failed",
          progress: 20,
          attempts: 1,
          maxAttempts: 3,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
      .mockResolvedValueOnce({
        reason: "terminal",
        job: {
          id: jobId,
          type: "interview.questions.generate",
          status: "cancelled",
          progress: 20,
          attempts: 1,
          maxAttempts: 3,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });
    renderWorkspace();
    await screen.findByRole("textbox", { name: "Written answer" });
    const generate = screen.getByRole("button", {
      name: "Generate questions",
    });

    await userEvent.click(generate);
    await screen.findByText(
      "The AI request did not complete. Try again only when you want to start a new request.",
    );
    await userEvent.click(generate);

    await waitFor(() => {
      expect(
        interviewApi.generateInterviewQuestions,
      ).toHaveBeenCalledTimes(2);
    });
    const calls = vi.mocked(interviewApi.generateInterviewQuestions).mock
      .calls;
    expect(calls[0]?.[1].requestId).not.toBe(calls[1]?.[1].requestId);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  it.each(["completed", "archived"] as const)(
    "keeps %s sessions read-only while retaining records",
    async (status) => {
      vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(
        session(status),
      );
      renderWorkspace();

      expect(
        await screen.findByText(
          status === "completed"
            ? /Completed sessions are read-mostly\./
            : /Archived sessions are read-only\./,
        ),
      ).not.toBeNull();
      expect(
        await screen.findByRole("button", {
          name: /How would you design a reliable job processor/,
        }),
      ).not.toBeNull();
      expect(
        screen.queryByRole("button", { name: "Generate questions" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", {
          name: "Save attempt",
        }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Save notes" }),
      ).toBeNull();
    },
  );

  it("adopts only approved canonical lifecycle transitions", async () => {
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockResolvedValue(
      session("completed"),
    );
    vi.mocked(interviewApi.fetchInterviewSession)
      .mockResolvedValueOnce(session())
      .mockResolvedValue(session("completed"));
    renderWorkspace();
    await screen.findByRole("heading", {
      name: "Platform interview preparation",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Mark completed" }),
    );

    expect(interviewApi.updateInterviewSessionStatus).toHaveBeenCalledWith(
      sessionId,
      "completed",
      expect.any(AbortSignal),
    );
    expect(
      await screen.findByText(/Completed sessions are read-mostly\./),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /mark active/i }),
    ).toBeNull();
  });

  it("keeps pin state bound to the selected question and blocks duplicate pin writes", async () => {
    const pinRequest = deferred<InterviewQuestionDetail>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId ? questionDetail() : alternateQuestion(),
    );
    vi.mocked(interviewApi.setQuestionPinned).mockReturnValue(
      pinRequest.promise,
    );
    renderWorkspace();
    const user = userEvent.setup();
    const pin = await screen.findByRole("button", {
      name: "Pin question",
    });

    await user.click(pin);
    expect((pin as HTMLButtonElement).disabled).toBe(true);
    await user.click(pin);
    expect(interviewApi.setQuestionPinned).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    expect(
      await screen.findByText("Canonical alternate notes."),
    ).not.toBeNull();

    pinRequest.resolve({ ...questionDetail(), isPinned: true });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reliability" }),
      ).not.toBeNull();
    });
    expect(screen.queryByRole("button", { name: "Unpin" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Pin question" }),
    ).not.toBeNull();
  });

  it("does not let a late notes save overwrite the next question notes or answer draft", async () => {
    const notesRequest = deferred<InterviewQuestionDetail>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId ? questionDetail() : alternateQuestion(),
    );
    vi.mocked(interviewApi.saveQuestionNotes).mockReturnValue(
      notesRequest.promise,
    );
    renderWorkspace();
    const user = userEvent.setup();
    const notes = await screen.findByRole("textbox", {
      name: "Private notes",
    });
    await user.clear(notes);
    await user.type(notes, "Pending notes for A.");
    await user.click(screen.getByRole("button", { name: "Save notes" }));
    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    const nextNotes = await screen.findByRole("textbox", {
      name: "Private notes",
    });
    const nextAnswer = screen.getByRole("textbox", {
      name: "Written answer",
    });
    await user.clear(nextNotes);
    await user.type(nextNotes, "Draft notes for B.");
    await user.type(nextAnswer, "Draft answer for B.");

    notesRequest.resolve({
      ...questionDetail(),
      userNotes: "Canonical saved notes for A.",
    });

    await waitFor(() => {
      expect((nextNotes as HTMLTextAreaElement).value).toBe(
        "Draft notes for B.",
      );
    });
    expect((nextAnswer as HTMLTextAreaElement).value).toBe(
      "Draft answer for B.",
    );
    expect(screen.queryByText("Notes saved.")).toBeNull();
  });

  it("ignores late explanation polling and detail reload after selecting another question", async () => {
    const pollRequest =
      deferred<Awaited<ReturnType<typeof interviewPolling.pollInterviewJob>>>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId
          ? {
              ...questionDetail(),
              explanation: undefined,
              explanationKeyPoints: [],
            }
          : alternateQuestion(),
    );
    vi.mocked(interviewApi.requestQuestionExplanation).mockResolvedValue({
      kind: "queued",
      job: {
        id: jobId,
        type: "interview.question.explain",
        status: "queued",
      },
    });
    vi.mocked(interviewPolling.pollInterviewJob).mockReturnValue(
      pollRequest.promise,
    );
    renderWorkspace();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Request explanation",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    await screen.findByText(
      "Use bounded retries and a dead-letter queue.",
    );

    pollRequest.resolve({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.question.explain",
        status: "completed",
        progress: 100,
        attempts: 1,
        maxAttempts: 3,
        result: {
          kind: "explanation",
          questionId,
          explanationReady: true,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Use bounded retries and a dead-letter queue."),
      ).not.toBeNull();
    });
    expect(
      screen.queryByText("Discuss delivery guarantees and recovery."),
    ).toBeNull();
    expect(screen.queryByText("Explanation is ready.")).toBeNull();
  });

  it("does not clear or select from a late attempt recorded for the prior question", async () => {
    const recordRequest = deferred<InterviewAttempt>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId ? questionDetail() : alternateQuestion(),
    );
    vi.mocked(interviewApi.recordInterviewAttempt).mockReturnValue(
      recordRequest.promise,
    );
    renderWorkspace();
    const user = userEvent.setup();
    const firstAnswer = await screen.findByRole("textbox", {
      name: "Written answer",
    });
    await user.type(firstAnswer, "Attempt for A.");
    await user.click(
      screen.getByRole("button", { name: "Save attempt" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    const nextAnswer = await screen.findByRole("textbox", {
      name: "Written answer",
    });
    await user.type(nextAnswer, "Draft answer for B.");

    recordRequest.resolve(attempt());

    await waitFor(() => {
      expect((nextAnswer as HTMLTextAreaElement).value).toBe(
        "Draft answer for B.",
      );
    });
    expect(
      screen.queryByText("Attempt saved. Another submission will be saved separately."),
    ).toBeNull();
    expect(
      screen.queryByText(
        "I would use a durable queue and idempotency keys.",
      ),
    ).toBeNull();
  });

  it("keeps feedback bound to the selected attempt and passes expected question identities", async () => {
    const feedbackRequest =
      deferred<Awaited<ReturnType<typeof interviewApi.requestAttemptFeedback>>>();
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt(), alternateAttempt()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockImplementation(
      async (_session, id) =>
        id === attemptId ? attempt() : alternateAttempt(),
    );
    vi.mocked(interviewApi.requestAttemptFeedback).mockReturnValue(
      feedbackRequest.promise,
    );
    renderWorkspace();
    const user = userEvent.setup();
    const attemptButtons = await screen.findAllByRole("button", {
      name: /Review attempt/,
    });
    await user.click(attemptButtons[0]!);
    await screen.findByText(
      "I would use a durable queue and idempotency keys.",
    );
    expect(interviewApi.fetchInterviewAttempt).toHaveBeenLastCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
      questionId,
    );
    await user.click(
      screen.getByRole("button", { name: "Request feedback" }),
    );
    expect(interviewApi.requestAttemptFeedback).toHaveBeenCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
      questionId,
    );

    await user.click(attemptButtons[1]!);
    await screen.findByText(
      "I would quarantine and inspect poison messages.",
    );
    feedbackRequest.resolve({
      kind: "available",
      attempt: attempt(true),
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "I would quarantine and inspect poison messages.",
        ),
      ).not.toBeNull();
    });
    expect(
      screen.queryByText("Model-generated practice guidance"),
    ).toBeNull();
  });

  it("aborts and ignores stale session, question, and attempt mutations on a route change", async () => {
    const nextSessionId = "507f1f77bcf86cd799439029";
    const statusRequest = deferred<ReturnType<typeof session>>();
    const pinRequest = deferred<InterviewQuestionDetail>();
    const feedbackRequest =
      deferred<Awaited<ReturnType<typeof interviewApi.requestAttemptFeedback>>>();
    vi.mocked(interviewApi.fetchInterviewSession).mockImplementation(
      async (id) =>
        id === sessionId
          ? session()
          : {
              ...session(),
              id: nextSessionId,
              title: "Route B interview",
              questionCount: 0,
            },
    );
    vi.mocked(interviewApi.listInterviewQuestions).mockImplementation(
      async (id) =>
        id === sessionId
          ? {
              questions: [questionSummary()],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            }
          : {
              questions: [],
              pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            },
    );
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(),
    );
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockReturnValue(
      statusRequest.promise,
    );
    vi.mocked(interviewApi.setQuestionPinned).mockReturnValue(
      pinRequest.promise,
    );
    vi.mocked(interviewApi.requestAttemptFeedback).mockReturnValue(
      feedbackRequest.promise,
    );
    const router = renderWorkspace();
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Pin question" });
    await user.click(
      screen.getByRole("button", { name: "Mark completed" }),
    );
    await user.click(screen.getByRole("button", { name: "Pin question" }));
    await user.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );

    const statusSignal = vi.mocked(
      interviewApi.updateInterviewSessionStatus,
    ).mock.calls[0]?.[2];
    const pinSignal = vi.mocked(interviewApi.setQuestionPinned).mock
      .calls[0]?.[3];
    const feedbackSignal = vi.mocked(
      interviewApi.requestAttemptFeedback,
    ).mock.calls[0]?.[2];
    await router.navigate(`/interviews/${nextSessionId}`);
    expect(
      await screen.findByRole("heading", { name: "Route B interview" }),
    ).not.toBeNull();
    expect(statusSignal?.aborted).toBe(true);
    expect(pinSignal?.aborted).toBe(true);
    expect(feedbackSignal?.aborted).toBe(true);

    statusRequest.resolve(session("completed"));
    pinRequest.resolve({ ...questionDetail(), isPinned: true });
    feedbackRequest.resolve({
      kind: "available",
      attempt: attempt(true),
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Route B interview" }),
      ).not.toBeNull();
    });
    expect(screen.queryByText(/Session marked completed/)).toBeNull();
    expect(
      screen.queryByText("Model-generated practice guidance"),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Unpin" })).toBeNull();
  });

  it("filters attempts by status, resets page, invalidates obsolete reads, and clears an absent selection", async () => {
    const obsoletePage = deferred<{
      attempts: InterviewAttempt[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>();
    vi.mocked(interviewApi.listAttemptHistory).mockImplementation(
      async (_id, input) => {
        const request = input ?? {};
        if (request.status === "feedback-queued") {
          return {
            attempts: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          };
        }
        if (request.page === 2) return obsoletePage.promise;
        return {
          attempts: [attempt()],
          pagination: { page: 1, limit: 20, total: 1, pages: 2 },
        };
      },
    );
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(),
    );
    renderWorkspace();
    const user = userEvent.setup();
    expect(
      await screen.findByRole("combobox", { name: "Attempt status" }),
    ).not.toBeNull();
    await waitFor(() => {
      expect(interviewApi.listAttemptHistory).toHaveBeenCalledWith(
        sessionId,
        {
          page: 1,
          limit: 20,
          questionId,
        },
        expect.any(AbortSignal),
      );
    });
    await user.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    const history = screen
      .getByRole("heading", { name: "Saved attempts" })
      .closest("section");
    expect(history).not.toBeNull();
    await user.click(
      within(history as HTMLElement).getByRole("button", {
        name: "Next",
      }),
    );
    await waitFor(() => {
      expect(
        vi.mocked(interviewApi.listAttemptHistory).mock.calls.some(
          (call) => call[1]?.page === 2,
        ),
      ).toBe(true);
    });
    const obsoleteSignal = vi
      .mocked(interviewApi.listAttemptHistory)
      .mock.calls.find((call) => call[1]?.page === 2)?.[2];

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Attempt status" }),
      "feedback-queued",
    );
    expect(obsoleteSignal?.aborted).toBe(true);
    await waitFor(() => {
      expect(interviewApi.listAttemptHistory).toHaveBeenLastCalledWith(
        sessionId,
        {
          page: 1,
          limit: 20,
          questionId,
          status: "feedback-queued",
        },
        expect.any(AbortSignal),
      );
    });
    expect(
      within(history as HTMLElement).queryByText("Page 1"),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "System design" }),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "I would use a durable queue and idempotency keys.",
      ),
    ).toBeNull();

    obsoletePage.resolve({
      attempts: [alternateAttempt()],
      pagination: { page: 2, limit: 20, total: 1, pages: 2 },
    });
    await waitFor(() => {
      expect(
        screen.getByText("No saved written attempts for this question yet."),
      ).not.toBeNull();
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Attempt status" }),
      "",
    );
    await waitFor(() => {
      const lastInput = vi.mocked(interviewApi.listAttemptHistory).mock
        .calls.at(-1)?.[1];
      expect(lastInput).not.toHaveProperty("status");
    });
    expect(
      screen.getByRole("option", { name: "All statuses" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("option", { name: "Saved" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("option", { name: "Feedback queued" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("option", { name: "Feedback processing" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("option", { name: "Feedback ready" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("option", { name: "Feedback unavailable" }),
    ).not.toBeNull();
  });

  it("renders safe request IDs for initial errors without leaking details or empty labels", async () => {
    vi.mocked(interviewApi.fetchInterviewSession).mockRejectedValueOnce(
      apiFailure(
        "The interview workspace is unavailable.",
        "initial-request-id-0001",
      ),
    );
    renderWorkspace();

    expect(
      await screen.findByText("Request ID: initial-request-id-0001"),
    ).not.toBeNull();
    expect(screen.queryByText(/must-not-render/)).toBeNull();

    vi.mocked(interviewApi.fetchInterviewSession).mockRejectedValueOnce(
      new Error("raw internal transport failure"),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Retry session" }),
    );
    expect(
      await screen.findByText(
        "The request could not be completed. Try again.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText(/raw internal transport failure/)).toBeNull();
    expect(screen.queryByText(/^Request ID:\s*$/)).toBeNull();
  });

  it("renders request IDs for status, manual, pin, notes, and answer failures", async () => {
    vi.mocked(interviewApi.updateInterviewSessionStatus).mockRejectedValue(
      apiFailure("Status failed.", "status-request-id-0001"),
    );
    vi.mocked(interviewApi.addManualQuestion).mockRejectedValue(
      apiFailure("Manual failed.", "manual-request-id-0001"),
    );
    vi.mocked(interviewApi.setQuestionPinned).mockRejectedValue(
      apiFailure("Pin failed.", "pin-request-id-0001"),
    );
    vi.mocked(interviewApi.saveQuestionNotes).mockRejectedValue(
      apiFailure("Notes failed.", "notes-request-id-0001"),
    );
    vi.mocked(interviewApi.recordInterviewAttempt).mockRejectedValue(
      apiFailure("Answer failed.", "answer-request-id-0001"),
    );
    renderWorkspace();
    const user = userEvent.setup();
    const notes = await screen.findByRole("textbox", {
      name: "Private notes",
    });
    const answer = screen.getByRole("textbox", {
      name: "Written answer",
    });

    await user.click(
      screen.getByRole("button", { name: "Mark completed" }),
    );
    expect(
      await screen.findByText("Request ID: status-request-id-0001"),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Add manually" }),
    );
    const manual = within(
      document.getElementById("manual-question-form") as HTMLFormElement,
    );
    await user.type(
      manual.getByRole("textbox", { name: "Category" }),
      "Reliability",
    );
    await user.type(
      manual.getByRole("textbox", { name: "Question" }),
      "Why can retries fail?",
    );
    await user.click(
      manual.getByRole("button", { name: "Add question" }),
    );
    expect(
      await screen.findByText("Request ID: manual-request-id-0001"),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Pin question" }));
    expect(
      await screen.findByText("Request ID: pin-request-id-0001"),
    ).not.toBeNull();

    await user.clear(notes);
    await user.type(notes, "Updated notes.");
    await user.click(screen.getByRole("button", { name: "Save notes" }));
    expect(
      await screen.findByText("Request ID: notes-request-id-0001"),
    ).not.toBeNull();

    await user.type(answer, "A private practice answer.");
    await user.click(
      screen.getByRole("button", { name: "Save attempt" }),
    );
    expect(
      await screen.findByText("Request ID: answer-request-id-0001"),
    ).not.toBeNull();
    expect(screen.queryByText(/must-not-render/)).toBeNull();
  });

  it("renders request IDs for question-list and attempt-list failures", async () => {
    vi.mocked(interviewApi.listInterviewQuestions).mockRejectedValue(
      apiFailure("Question list failed.", "question-list-request-id-0001"),
    );
    vi.mocked(interviewApi.listAttemptHistory).mockRejectedValue(
      apiFailure("Attempt list failed.", "attempt-list-request-id-0001"),
    );
    renderWorkspace();

    expect(
      await screen.findByText(
        "Request ID: question-list-request-id-0001",
      ),
    ).not.toBeNull();
    expect(
      await screen.findByText(
        "Request ID: attempt-list-request-id-0001",
      ),
    ).not.toBeNull();
  });

  it("renders request IDs for question-detail and attempt-detail failures", async () => {
    vi.mocked(interviewApi.fetchInterviewQuestion).mockRejectedValue(
      apiFailure(
        "Question detail failed.",
        "question-detail-request-id-0001",
      ),
    );
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockRejectedValue(
      apiFailure(
        "Attempt detail failed.",
        "attempt-detail-request-id-0001",
      ),
    );
    renderWorkspace();

    expect(
      await screen.findByText(
        "Request ID: question-detail-request-id-0001",
      ),
    ).not.toBeNull();
    await userEvent.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    expect(
      await screen.findByText(
        "Request ID: attempt-detail-request-id-0001",
      ),
    ).not.toBeNull();
  });

  it("renders request IDs for generation, explanation, feedback, and poll transport failures", async () => {
    vi.mocked(interviewApi.fetchInterviewQuestion).mockResolvedValue({
      ...questionDetail(),
      explanation: undefined,
      explanationKeyPoints: [],
    });
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(
      attempt(),
    );
    vi.mocked(interviewApi.generateInterviewQuestions).mockRejectedValueOnce(
      apiFailure("Generation failed.", "generation-request-id-0001"),
    );
    vi.mocked(interviewApi.requestQuestionExplanation).mockRejectedValueOnce(
      apiFailure("Explanation failed.", "explanation-request-id-0001"),
    );
    vi.mocked(interviewApi.requestAttemptFeedback)
      .mockRejectedValueOnce(
        apiFailure("Feedback failed.", "feedback-request-id-0001"),
      )
      .mockResolvedValueOnce({
        kind: "queued",
        attemptId,
        job: {
          id: jobId,
          type: "interview.attempt.feedback",
          status: "queued",
        },
      });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "transport-failure",
      job: undefined,
      error: apiFailure(
        "Polling failed.",
        "poll-transport-request-id-0001",
      ),
    });
    renderWorkspace();
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Request explanation" });

    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );
    expect(
      await screen.findByText("Request ID: generation-request-id-0001"),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Request explanation" }),
    );
    expect(
      await screen.findByText(
        "Request ID: explanation-request-id-0001",
      ),
    ).not.toBeNull();

    await user.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );
    expect(
      await screen.findByText("Request ID: feedback-request-id-0001"),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Request feedback" }),
    );
    expect(
      await screen.findByText(
        "Request ID: poll-transport-request-id-0001",
      ),
    ).not.toBeNull();
    expect(screen.queryByText(/must-not-render/)).toBeNull();
  });

  it("keeps a newer same-scope explanation operation pending when an aborted operation settles", async () => {
    const firstExplanation =
      deferred<Awaited<ReturnType<typeof interviewApi.requestQuestionExplanation>>>();
    const secondExplanation =
      deferred<Awaited<ReturnType<typeof interviewApi.requestQuestionExplanation>>>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) => ({
        ...(id === questionId ? questionDetail() : alternateQuestion()),
        explanation: undefined,
        explanationKeyPoints: [],
      }),
    );
    vi.mocked(interviewApi.requestQuestionExplanation)
      .mockReturnValueOnce(firstExplanation.promise)
      .mockReturnValueOnce(secondExplanation.promise);
    renderWorkspace();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Request explanation",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Request explanation",
      }),
    );

    firstExplanation.resolve({
      kind: "available",
      question: {
        ...questionDetail(),
        explanation: "Stale explanation for A.",
      },
    });
    await waitFor(() => {
      expect(
        interviewApi.requestQuestionExplanation,
      ).toHaveBeenCalledTimes(2);
    });
    const currentButton = screen.getByRole("button", {
      name: "Request explanation",
    }) as HTMLButtonElement;
    expect(currentButton.disabled).toBe(true);
    expect(screen.queryByText("Stale explanation for A.")).toBeNull();

    secondExplanation.resolve({
      kind: "available",
      question: {
        ...alternateQuestion(),
        explanation: "Current explanation for B.",
      },
    });
    expect(
      await screen.findByText("Current explanation for B."),
    ).not.toBeNull();
  });

  it("keeps a new route generation operation and ambiguous UUID isolated from a stale generation", async () => {
    const nextSessionId = "507f1f77bcf86cd799439030";
    const firstGeneration =
      deferred<Awaited<ReturnType<typeof interviewApi.generateInterviewQuestions>>>();
    const secondGeneration =
      deferred<Awaited<ReturnType<typeof interviewApi.generateInterviewQuestions>>>();
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(
          "a4d20e66-4af2-4dd2-834b-fad9fe354a6f",
        )
        .mockReturnValueOnce(
          "efdf2cb4-e2ef-4939-93fb-0143ea577d48",
        )
        .mockReturnValueOnce(
          "f52e495f-973c-4539-a657-c98255441a31",
        ),
    });
    vi.mocked(interviewApi.fetchInterviewSession).mockImplementation(
      async (id) =>
        id === sessionId
          ? session()
          : {
              ...session(),
              id: nextSessionId,
              title: "Generation route B",
              questionCount: 0,
            },
    );
    vi.mocked(interviewApi.listInterviewQuestions).mockImplementation(
      async (id) =>
        id === sessionId
          ? {
              questions: [questionSummary()],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            }
          : {
              questions: [],
              pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            },
    );
    vi.mocked(interviewApi.generateInterviewQuestions)
      .mockReturnValueOnce(firstGeneration.promise)
      .mockReturnValueOnce(secondGeneration.promise)
      .mockResolvedValueOnce({
        id: jobId,
        type: "interview.questions.generate",
        status: "queued",
      });
    vi.mocked(interviewPolling.pollInterviewJob).mockResolvedValue({
      reason: "terminal",
      job: {
        id: jobId,
        type: "interview.questions.generate",
        status: "failed",
        progress: 20,
        attempts: 1,
        maxAttempts: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    const router = renderWorkspace();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Generate questions",
      }),
    );
    await router.navigate(`/interviews/${nextSessionId}`);
    await screen.findByRole("heading", { name: "Generation route B" });
    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );

    firstGeneration.reject(
      apiFailure("Stale generation failed.", "stale-generation-id-0001"),
    );
    await waitFor(() => {
      expect(
        interviewApi.generateInterviewQuestions,
      ).toHaveBeenCalledTimes(2);
    });
    const stayedPending = (
      screen.getByRole("button", {
        name: "Generate questions",
      }) as HTMLButtonElement
    ).disabled;

    secondGeneration.reject(new TypeError("ambiguous B transport"));
    await screen.findByText(
      "The request could not be completed. Try again.",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate questions" }),
    );
    await waitFor(() => {
      expect(
        interviewApi.generateInterviewQuestions,
      ).toHaveBeenCalledTimes(3);
    });
    const calls = vi.mocked(interviewApi.generateInterviewQuestions).mock
      .calls;
    expect(stayedPending).toBe(true);
    expect(calls[1]?.[1].requestId).toBe(
      "efdf2cb4-e2ef-4939-93fb-0143ea577d48",
    );
    expect(calls[2]?.[1].requestId).toBe(calls[1]?.[1].requestId);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  it("never commits an obsolete question attempt list after selecting another question", async () => {
    const firstQuestionAttempts = deferred<{
      attempts: InterviewAttempt[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId ? questionDetail() : alternateQuestion(),
    );
    vi.mocked(interviewApi.listAttemptHistory).mockImplementation(
      async (_session, input) => {
        if (input?.questionId === questionId) {
          return firstQuestionAttempts.promise;
        }
        if (input?.questionId === alternateQuestion().id) {
          return {
            attempts: [alternateAttempt()],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 },
          };
        }
        return {
          attempts: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        };
      },
    );
    vi.mocked(interviewApi.fetchInterviewAttempt).mockImplementation(
      async (_session, id) =>
        id === attemptId ? attempt() : alternateAttempt(),
    );
    renderWorkspace();
    const user = userEvent.setup();
    await waitFor(() => {
      expect(interviewApi.listAttemptHistory).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({ questionId }),
        expect.any(AbortSignal),
      );
    });

    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    await screen.findByText("Canonical alternate notes.");
    firstQuestionAttempts.resolve({
      attempts: [attempt()],
      pagination: { page: 1, limit: 20, total: 77, pages: 4 },
    });

    await user.click(
      await screen.findByRole("button", { name: /Review attempt/ }),
    );
    expect(
      await screen.findByText(
        "I would quarantine and inspect poison messages.",
      ),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "I would use a durable queue and idempotency keys.",
      ),
    ).toBeNull();
    expect(screen.queryByText("77")).toBeNull();
  });

  it("keeps a newer pin for the same question pending when an older pin settles", async () => {
    const oldPin = deferred<InterviewQuestionDetail>();
    const newPin = deferred<InterviewQuestionDetail>();
    vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
      questions: [questionSummary(), alternateQuestion()],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
      async (_session, id) =>
        id === questionId ? questionDetail() : alternateQuestion(),
    );
    vi.mocked(interviewApi.setQuestionPinned)
      .mockReturnValueOnce(oldPin.promise)
      .mockReturnValueOnce(newPin.promise);
    renderWorkspace();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Pin question" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /How would you recover a poisoned queue/,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /How would you design a reliable job processor/,
      }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Pin question" }),
    );

    oldPin.resolve({ ...questionDetail(), isPinned: true });
    await waitFor(() => {
      expect(interviewApi.setQuestionPinned).toHaveBeenCalledTimes(2);
    });
    const currentPin = screen.getByRole("button", {
      name: "Pin question",
    }) as HTMLButtonElement;
    expect(currentPin.disabled).toBe(true);
    await user.click(currentPin);
    expect(interviewApi.setQuestionPinned).toHaveBeenCalledTimes(2);

    newPin.resolve({ ...questionDetail(), isPinned: true });
    expect(
      await screen.findByRole("button", { name: "Unpin" }),
    ).not.toBeNull();
  });

  it("renders only trimmed canonical request IDs", async () => {
    vi.mocked(interviewApi.fetchInterviewSession)
      .mockRejectedValueOnce(
        apiFailure("Malformed ID.", "invalid request id"),
      )
      .mockRejectedValueOnce(apiFailure("Whitespace ID.", "   "))
      .mockRejectedValueOnce(
        apiFailure("Valid ID.", "valid-request-id-0001"),
      );
    renderWorkspace();
    const user = userEvent.setup();

    await screen.findByText("Malformed ID.");
    expect(screen.queryByText(/Request ID:/)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Retry session" }),
    );
    await screen.findByText("Whitespace ID.");
    expect(screen.queryByText(/Request ID:/)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Retry session" }),
    );
    expect(
      await screen.findByText("Request ID: valid-request-id-0001"),
    ).not.toBeNull();
  });
});
