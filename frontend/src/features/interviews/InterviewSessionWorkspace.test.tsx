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
    renderWorkspace();
    const answer = await screen.findByRole("textbox", {
      name: "Written answer",
    });
    const user = userEvent.setup();
    await user.type(answer, "My private answer draft.");
    await user.click(
      screen.getByRole("button", { name: "Record immutable attempt" }),
    );

    expect(
      await screen.findByText(/The attempt could not be recorded\./),
    ).not.toBeNull();
    expect((answer as HTMLTextAreaElement).value).toBe(
      "My private answer draft.",
    );

    await user.click(
      screen.getByRole("button", { name: "Record immutable attempt" }),
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
      await screen.findByRole("button", { name: /Open attempt/ }),
    );
    expect(
      await screen.findByText(
        "I would use a durable queue and idempotency keys.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Model-generated practice guidance"),
    ).not.toBeNull();
    expect(screen.getByText("76/100")).not.toBeNull();
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
      await screen.findByRole("button", { name: /Open attempt/ }),
    );
    expect(interviewApi.requestAttemptFeedback).not.toHaveBeenCalled();

    await userEvent.click(
      await screen.findByRole("button", { name: "Request feedback" }),
    );

    expect(interviewApi.requestAttemptFeedback).toHaveBeenCalledWith(
      sessionId,
      attemptId,
      expect.any(AbortSignal),
    );
    expect(
      await screen.findByText("Model-generated practice guidance"),
    ).not.toBeNull();
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
      await screen.findByRole("button", { name: /Open attempt/ }),
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
          name: "Record immutable attempt",
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
});
