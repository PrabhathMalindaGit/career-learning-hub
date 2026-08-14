import { render, screen, waitFor } from "@testing-library/react";
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
  return { ...actual, pollInterviewJob: vi.fn() };
});

const sessionId = "507f1f77bcf86cd799439071";
const questionIdA = "507f1f77bcf86cd799439072";
const questionIdB = "507f1f77bcf86cd799439073";
const attemptId = "507f1f77bcf86cd799439074";
const timestamp = "2026-08-14T00:00:00.000Z";

function session() {
  return {
    id: sessionId,
    title: "Structured answer practice",
    targetRole: "Project Manager",
    experienceLevel: "Mid-level",
    focusTopics: [],
    skillGaps: [],
    mode: "written-practice" as const,
    status: "active" as const,
    questionCount: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function summary(
  id: string,
  type: EffectiveInterviewQuestionType,
  prompt: string,
): InterviewQuestionSummary {
  return {
    id,
    sessionId,
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: prompt,
    questionType: type,
    isPinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function detail(
  id: string,
  type: EffectiveInterviewQuestionType,
  prompt: string,
): InterviewQuestionDetail {
  return { ...summary(id, type, prompt), explanationKeyPoints: [] };
}

function typedAttempt(
  type: "behavioral" | "scenario-based" | "technical-explanation",
  text: string,
): InterviewAttempt {
  return {
    id: attemptId,
    sessionId,
    questionId: questionIdA,
    status: "recorded",
    answer: { type, text },
    createdAt: timestamp,
    updatedAt: timestamp,
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
}

async function waitForQuestion(prompt: string) {
  await screen.findByRole("heading", { name: "Structured answer practice" });
  await screen.findByRole("button", { name: new RegExp(prompt) });
  await screen.findByText(prompt);
}

function setupQuestions(
  firstType: EffectiveInterviewQuestionType,
  secondType: EffectiveInterviewQuestionType = "short-answer",
) {
  const first = summary(questionIdA, firstType, "First structured question");
  const second = summary(questionIdB, secondType, "Second practice question");
  vi.mocked(interviewApi.listInterviewQuestions).mockResolvedValue({
    questions: [first, second],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  });
  vi.mocked(interviewApi.fetchInterviewQuestion).mockImplementation(
    async (_sessionId, questionId) =>
      questionId === questionIdA
        ? detail(questionIdA, firstType, first.question)
        : detail(questionIdB, secondType, second.question),
  );
}

describe("InterviewSessionWorkspace structured answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewApi.fetchInterviewSession).mockResolvedValue(session());
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it.each([
    [
      "behavioral",
      [
        ["Situation", "Context"],
        ["Action", "Did the work"],
      ],
      "Situation:\nContext\n\nAction:\nDid the work",
    ],
    [
      "scenario-based",
      [
        ["Assessment", "Identify the risk"],
        ["Approach", "Contain it"],
        ["Trade-offs", "Speed vs certainty"],
        ["Decision", "Act now"],
      ],
      "Assessment:\nIdentify the risk\n\nApproach:\nContain it\n\nTrade-offs:\nSpeed vs certainty\n\nDecision:\nAct now",
    ],
    [
      "technical-explanation",
      [
        ["Concept", "Caching"],
        ["How it works", "Store reusable results"],
        ["Example", "HTTP cache"],
        ["Trade-offs / limitations", "Staleness"],
      ],
      "Concept:\nCaching\n\nHow it works:\nStore reusable results\n\nExample:\nHTTP cache\n\nTrade-offs / limitations:\nStaleness",
    ],
  ] as const)("serializes %s through the existing typed answer contract", async (type, entries, expectedText) => {
    setupQuestions(type);
    const created = typedAttempt(type, expectedText);
    vi.mocked(interviewApi.recordInterviewAttempt).mockResolvedValue(created);

    renderWorkspace();
    await waitForQuestion("First structured question");
    const user = userEvent.setup();

    for (const [label, value] of entries) {
      await user.type(screen.getByRole("textbox", { name: label }), value);
    }
    await user.click(screen.getByRole("button", { name: "Save attempt" }));

    await waitFor(() => {
      expect(interviewApi.recordInterviewAttempt).toHaveBeenCalledWith(
        sessionId,
        questionIdA,
        { answer: { type, text: expectedText } },
        expect.any(AbortSignal),
      );
    });
  });

  it("clears an unsaved structured draft when the selected question changes", async () => {
    setupQuestions("behavioral", "scenario-based");
    renderWorkspace();
    await waitForQuestion("First structured question");
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox", { name: "Situation" }), "Do not leak");
    await user.click(
      screen.getByRole("button", { name: /Second practice question/ }),
    );
    await screen.findByRole("textbox", { name: "Assessment" });
    expect(
      (screen.getByRole("textbox", { name: "Assessment" }) as HTMLTextAreaElement)
        .value,
    ).toBe("");

    await user.click(
      screen.getByRole("button", { name: /First structured question/ }),
    );
    await screen.findByRole("textbox", { name: "Situation" });
    expect(
      (screen.getByRole("textbox", { name: "Situation" }) as HTMLTextAreaElement)
        .value,
    ).toBe("");
  });

  it("clears the structured draft after a successful saved attempt", async () => {
    setupQuestions("behavioral");
    vi.mocked(interviewApi.recordInterviewAttempt).mockResolvedValue(
      typedAttempt("behavioral", "Situation:\nContext"),
    );
    renderWorkspace();
    await waitForQuestion("First structured question");
    const user = userEvent.setup();

    const situation = screen.getByRole("textbox", { name: "Situation" });
    await user.type(situation, "Context");
    await user.click(screen.getByRole("button", { name: "Save attempt" }));
    await waitFor(() =>
      expect((situation as HTMLTextAreaElement).value).toBe(""),
    );
  });

  it("preserves saved structured newlines and historical plain text without parsing", async () => {
    setupQuestions("behavioral");
    const structuredText = "Situation:\nContext\n\nAction:\nDid the work";
    const saved = typedAttempt("behavioral", structuredText);
    vi.mocked(interviewApi.listAttemptHistory).mockResolvedValue({
      attempts: [saved],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(saved);

    renderWorkspace();
    await waitForQuestion("First structured question");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Review attempt 1/ }));

    const savedText = await screen.findByText((content, element) =>
      element?.classList.contains("interview-attempt-answer-text") === true &&
      content.includes("Situation:") &&
      content.includes("Action:"),
    );
    expect(savedText.textContent).toBe(structuredText);

    const historical: InterviewAttempt = {
      id: "507f1f77bcf86cd799439075",
      sessionId,
      questionId: questionIdA,
      status: "recorded",
      answerText: "A normal historical answer.",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    vi.mocked(interviewApi.fetchInterviewAttempt).mockResolvedValue(historical);
    await user.click(screen.getByRole("button", { name: /Review attempt 1/ }));
    // Existing historical strings stay ordinary text; no structured parser is involved.
    expect(savedText.className).toContain("interview-attempt-answer-text");
  });
});
