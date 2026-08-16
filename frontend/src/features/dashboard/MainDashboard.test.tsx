import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ApiError } from "../../api/apiClient";
import type {
  DashboardActivityPage,
  DashboardProgress,
} from "./types";
import * as dashboardApi from "./dashboardApi";
import { MainDashboard } from "./MainDashboard";

vi.mock("./dashboardApi", () => ({
  fetchDashboardActivity: vi.fn(),
  fetchProgressSnapshot: vi.fn(),
}));

function progressFixture(): DashboardProgress {
  return {
    generatedAt: "2026-07-24T10:00:00.000Z",
    window: {
      days: 30,
      start: "2026-06-24T10:00:00.000Z",
      end: "2026-07-24T10:00:00.000Z",
    },
    resumeReadiness: {
      latest: {
        analysisId: "analysis-1",
        resumeId: "resume-1",
        resumeVersionId: "version-1",
        targetRole: "Platform engineer",
        score: 84,
        scoreBreakdown: {
          keywordMatch: 20,
          clarity: 21,
          evidence: 22,
          formatting: 21,
        },
        createdAt: "2026-07-23T10:00:00.000Z",
      },
      previousScore: 79,
      changeFromPrevious: 5,
      averageScoreInWindow: 81.5,
      analysesInWindow: 2,
      analyzedResumesInWindow: 1,
      trend: [
        {
          analysisId: "analysis-1",
          resumeId: "resume-1",
          targetRole: "Platform engineer",
          score: 84,
          createdAt: "2026-07-23T10:00:00.000Z",
        },
      ],
    },
    interviews: {
      attemptsInWindow: 3,
      feedbackCompletedInWindow: 2,
      averageFeedbackScore: 76,
      bestFeedbackScore: 82,
      latestFeedbackScore: 82,
      activeSessions: 1,
      completedSessions: 2,
      trend: [
        {
          attemptId: "attempt-1",
          sessionId: "session-1",
          questionId: "question-1",
          score: 82,
          completedAt: "2026-07-22T10:00:00.000Z",
        },
      ],
    },
    learning: {
      documentCounts: {
        total: 2,
        uploaded: 0,
        processing: 0,
        ready: 2,
        failed: 0,
        deleting: 0,
      },
      recentDocuments: [
        {
          documentId: "document-1",
          title: "Distributed systems notes",
          status: "ready",
          pageCount: 12,
          chunkCount: 34,
          processedAt: "2026-07-20T10:00:00.000Z",
          updatedAt: "2026-07-20T10:00:00.000Z",
        },
      ],
      quizPerformance: {
        attemptsInWindow: 2,
        averageScore: 75,
        bestScore: 80,
        latestScore: 80,
        totalQuestionsAnswered: 20,
        totalCorrectAnswers: 15,
        trend: [
          {
            attemptId: "quiz-attempt-1",
            quizId: "quiz-1",
            documentId: "document-1",
            scorePercent: 80,
            correctCount: 8,
            questionCount: 10,
            completedAt: "2026-07-21T10:00:00.000Z",
          },
        ],
      },
    },
    aiUsage: {
      requestCount: 2,
      successCount: 1,
      failureCount: 1,
      inputTokens: 1200,
      outputTokens: 400,
      totalTokens: 1600,
      estimatedCostUsd: 0.0123,
      estimatedCostEventCount: 1,
      averageLatencyMs: 840,
      byFeature: [
        {
          feature: "resume-analysis",
          requestCount: 2,
          successCount: 1,
          failureCount: 1,
          inputTokens: 1200,
          outputTokens: 400,
          estimatedCostUsd: 0.0123,
        },
      ],
      daily: [],
    },
  };
}

function emptyProgressFixture(): DashboardProgress {
  const fixture = progressFixture();
  return {
    ...fixture,
    resumeReadiness: {
      latest: null,
      previousScore: null,
      changeFromPrevious: null,
      averageScoreInWindow: null,
      analysesInWindow: 0,
      analyzedResumesInWindow: 0,
      trend: [],
    },
    interviews: {
      attemptsInWindow: 0,
      feedbackCompletedInWindow: 0,
      averageFeedbackScore: null,
      bestFeedbackScore: null,
      latestFeedbackScore: null,
      activeSessions: 0,
      completedSessions: 0,
      trend: [],
    },
    learning: {
      documentCounts: {
        total: 0,
        uploaded: 0,
        processing: 0,
        ready: 0,
        failed: 0,
        deleting: 0,
      },
      recentDocuments: [],
      quizPerformance: {
        attemptsInWindow: 0,
        averageScore: null,
        bestScore: null,
        latestScore: null,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        trend: [],
      },
    },
    aiUsage: {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      estimatedCostEventCount: 0,
      averageLatencyMs: null,
      byFeature: [],
      daily: [],
    },
  };
}

function activityPage(
  page = 1,
  pages = 1,
): DashboardActivityPage {
  return {
    events: [
      {
        id: `activity-${page}-first`,
        type: "quiz.completed",
        resourceType: "quiz-attempt",
        origin: "api",
        occurredAt: "2026-07-24T09:00:00.000Z",
      },
      {
        id: `activity-${page}-second`,
        type: "unknown.private.event",
        origin: "worker",
        occurredAt: "2026-07-23T09:00:00.000Z",
      },
    ],
    pagination: {
      page,
      limit: 5,
      total: pages * 5,
      pages,
    },
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function setSuccessfulDefaults() {
  vi.mocked(
    dashboardApi.fetchProgressSnapshot,
  ).mockResolvedValue(progressFixture());
  vi.mocked(
    dashboardApi.fetchDashboardActivity,
  ).mockResolvedValue(activityPage());
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <MainDashboard />
    </MemoryRouter>,
  );
}

describe("MainDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSuccessfulDefaults();
  });

  it("announces independent initial progress and activity loading", () => {
    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockReturnValue(
      new Promise<DashboardProgress>(() => undefined),
    );
    vi.mocked(
      dashboardApi.fetchDashboardActivity,
    ).mockReturnValue(
      new Promise<DashboardActivityPage>(() => undefined),
    );

    renderDashboard();

    expect(screen.getByText("Loading progress")).not.toBeNull();
    expect(screen.getByText("Loading activity")).not.toBeNull();
  });

  it("renders the compact dashboard header and user outcome metrics", async () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Continue your work and review recent progress across Resume Studio, Interview Coach, and Learning Workspace.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("group", { name: "Performance period" }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "30 days" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    expect(await screen.findByText("82%")).not.toBeNull();
    expect(screen.getByText("76%")).not.toBeNull();
    expect(screen.getByText("75%")).not.toBeNull();
    expect(screen.getByText("84%")).not.toBeNull();
    expect(
      screen.getByText("Distributed systems notes"),
    ).not.toBeNull();

    const scoreMeters = screen.getAllByRole("meter");
    expect(scoreMeters).toHaveLength(4);
    expect(
      screen.getByRole("meter", {
        name: "Resume readiness: 84 out of 100",
      }),
    ).not.toBeNull();
  });

  it("uses owned dashboard data to build contextual continuation links", async () => {
    renderDashboard();

    const continuation = await screen.findByRole("navigation", {
      name: "Continue your work",
    });
    expect(
      within(continuation)
        .getByRole("link", { name: /Continue Resume/i })
        .getAttribute("href"),
    ).toBe("/resumes/resume-1");
    expect(
      within(continuation)
        .getByRole("link", { name: /Continue Interview/i })
        .getAttribute("href"),
    ).toBe("/interviews/session-1");
    expect(
      within(continuation)
        .getByRole("link", { name: /Open Learning Document/i })
        .getAttribute("href"),
    ).toBe("/learning/documents/document-1");
  });

  it("falls back to creation actions and purposeful empty states when no work exists", async () => {
    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockResolvedValue(emptyProgressFixture());

    renderDashboard();

    expect(
      await screen.findByText("No performance recorded in this period"),
    ).not.toBeNull();
    expect(screen.getByText("No Resume analysis yet")).not.toBeNull();
    expect(
      screen.getByText("No scored feedback in this period."),
    ).not.toBeNull();
    expect(screen.queryByText("Unavailable")).toBeNull();

    const continuation = screen.getByRole("navigation", {
      name: "Continue your work",
    });
    expect(
      within(continuation).getByRole("link", {
        name: /Create Resume/i,
      }),
    ).not.toBeNull();
    expect(
      within(continuation).getByRole("link", {
        name: /Start Interview Session/i,
      }),
    ).not.toBeNull();
    expect(
      within(continuation).getByRole("link", {
        name: /Upload Learning Document/i,
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Practice interview" }),
    ).not.toBeNull();
  });

  it("does not expose internal AI diagnostics, provider claims, or raw record IDs", async () => {
    renderDashboard();

    await screen.findAllByText("Platform engineer");
    const content = document.body.textContent ?? "";

    expect(content).toContain("Career Learning Hub");
    expect(content).not.toMatch(
      /AI usage|Total tokens|Input \/ output|Average latency|Estimated cost|resume-analysis|provider/i,
    );
    expect(content).not.toMatch(
      /analysis-1|resume-1|version-1|attempt-1|document-1|activity-1/i,
    );
  });

  it("requests bounded trend and document summaries for the dashboard", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(
        dashboardApi.fetchProgressSnapshot,
      ).toHaveBeenCalledWith(
        {
          windowDays: 30,
          trendLimit: 5,
          recentDocumentLimit: 3,
        },
        expect.any(AbortSignal),
      );
    });
    await waitFor(() => {
      expect(
        dashboardApi.fetchDashboardActivity,
      ).toHaveBeenCalledWith(
        { page: 1, limit: 5 },
        expect.any(AbortSignal),
      );
    });
  });

  it("requests all four approved performance periods and communicates the active selection", async () => {
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(
        dashboardApi.fetchProgressSnapshot,
      ).toHaveBeenCalledTimes(1);
    });

    for (const windowDays of [7, 90, 365] as const) {
      const control = screen.getByRole("button", {
        name: `${windowDays} days`,
      });
      await user.click(control);
      await waitFor(() => {
        expect(
          dashboardApi.fetchProgressSnapshot,
        ).toHaveBeenLastCalledWith(
          expect.objectContaining({
            windowDays,
            trendLimit: 5,
            recentDocumentLimit: 3,
          }),
          expect.any(AbortSignal),
        );
      });
      expect(control.getAttribute("aria-pressed")).toBe("true");
    }
  });

  it("aborts an obsolete progress request and ignores its stale response", async () => {
    const first = deferred<DashboardProgress>();
    const second = deferred<DashboardProgress>();
    vi.mocked(dashboardApi.fetchProgressSnapshot)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(
        dashboardApi.fetchProgressSnapshot,
      ).toHaveBeenCalledTimes(1);
    });
    const firstSignal = vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mock.calls[0]?.[1];

    await user.click(
      screen.getByRole("button", { name: "7 days" }),
    );
    expect(firstSignal?.aborted).toBe(true);

    const fresh = progressFixture();
    second.resolve({
      ...fresh,
      resumeReadiness: {
        ...fresh.resumeReadiness,
        averageScoreInWindow: 91,
      },
    });
    expect(await screen.findByText("91%")).not.toBeNull();

    first.resolve(progressFixture());
    await waitFor(() => {
      expect(screen.queryByText("82%")).toBeNull();
    });
  });

  it("keeps progress visible when activity fails and retries only activity", async () => {
    vi.mocked(
      dashboardApi.fetchDashboardActivity,
    ).mockRejectedValue(
      new ApiError(
        503,
        "ACTIVITY_UNAVAILABLE",
        "Activity is temporarily unavailable.",
        "activity-request-id-1",
      ),
    );
    renderDashboard();
    const user = userEvent.setup();

    expect(await screen.findByText("82%")).not.toBeNull();
    expect(
      await screen.findByText(
        "Activity is temporarily unavailable.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: activity-request-id-1"),
    ).not.toBeNull();

    vi.mocked(
      dashboardApi.fetchDashboardActivity,
    ).mockResolvedValue(activityPage());
    await user.click(
      screen.getByRole("button", { name: "Retry activity" }),
    );

    await waitFor(() => {
      expect(
        dashboardApi.fetchDashboardActivity,
      ).toHaveBeenCalledTimes(2);
    });
    expect(
      dashboardApi.fetchProgressSnapshot,
    ).toHaveBeenCalledTimes(1);
  });

  it("keeps activity visible when progress fails and retries only progress", async () => {
    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockRejectedValue(
      new ApiError(
        503,
        "PROGRESS_UNAVAILABLE",
        "Progress is temporarily unavailable.",
        "progress-request-id-1",
        { privateValidationDetails: "must not render" },
      ),
    );
    renderDashboard();
    const user = userEvent.setup();

    expect(
      await screen.findByText("Quiz completed"),
    ).not.toBeNull();
    expect(
      await screen.findByText(
        "Progress is temporarily unavailable.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: progress-request-id-1"),
    ).not.toBeNull();
    expect(screen.queryByText("must not render")).toBeNull();

    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockResolvedValue(progressFixture());
    await user.click(
      screen.getByRole("button", { name: "Retry progress" }),
    );

    await waitFor(() => {
      expect(
        dashboardApi.fetchProgressSnapshot,
      ).toHaveBeenCalledTimes(2);
    });
    expect(
      dashboardApi.fetchDashboardActivity,
    ).toHaveBeenCalledTimes(1);
  });

  it("renders safe activity labels in returned order without private event names", async () => {
    renderDashboard();

    const feed = await screen.findByRole("region", {
      name: "Recent activity",
    });
    const rows = within(feed).getAllByRole("article");
    expect(rows[0]?.textContent).toContain("Quiz completed");
    expect(rows[1]?.textContent).toContain("Recorded activity");
    expect(feed.textContent).not.toContain("unknown.private.event");
    expect(feed.textContent).not.toContain("metadata");
  });

  it("keeps activity pagination behind an explicit View all disclosure", async () => {
    vi.mocked(dashboardApi.fetchDashboardActivity)
      .mockResolvedValueOnce(activityPage(1, 2))
      .mockResolvedValueOnce(activityPage(2, 2))
      .mockResolvedValueOnce(activityPage(1, 2));
    renderDashboard();
    const user = userEvent.setup();

    expect(
      await screen.findByRole("button", { name: "View all activity" }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Previous activity page" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "View all activity" }),
    );
    const previous = screen.getByRole("button", {
      name: "Previous activity page",
    });
    const next = screen.getByRole("button", {
      name: "Next activity page",
    });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);

    await user.click(next);
    await screen.findByText("Page 2 of 2");
    expect((next as HTMLButtonElement).disabled).toBe(true);

    await user.click(
      screen.getByRole("button", {
        name: "Show recent activity only",
      }),
    );
    await waitFor(() => {
      expect(
        dashboardApi.fetchDashboardActivity,
      ).toHaveBeenLastCalledWith(
        { page: 1, limit: 5 },
        expect.any(AbortSignal),
      );
    });
    expect(
      screen.queryByRole("button", { name: "Previous activity page" }),
    ).toBeNull();
  });

  it("does not present an in-flight activity page as empty", async () => {
    const nextPage = deferred<DashboardActivityPage>();
    vi.mocked(dashboardApi.fetchDashboardActivity)
      .mockResolvedValueOnce(activityPage(1, 2))
      .mockReturnValueOnce(nextPage.promise);
    renderDashboard();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "View all activity" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next activity page" }),
    );

    expect(
      await screen.findByText("Loading selected activity page"),
    ).not.toBeNull();
    expect(
      screen.queryByText("No recorded activity is available."),
    ).toBeNull();
  });

  it("aborts an obsolete activity page and ignores its stale response", async () => {
    const initial = activityPage(1, 3);
    const secondPage = deferred<DashboardActivityPage>();
    const thirdPage = deferred<DashboardActivityPage>();
    vi.mocked(dashboardApi.fetchDashboardActivity)
      .mockResolvedValueOnce(initial)
      .mockReturnValueOnce(secondPage.promise)
      .mockReturnValueOnce(thirdPage.promise);
    renderDashboard();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "View all activity" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next activity page" }),
    );
    await waitFor(() => {
      expect(
        dashboardApi.fetchDashboardActivity,
      ).toHaveBeenCalledTimes(2);
    });
    const pageTwoSignal = vi.mocked(
      dashboardApi.fetchDashboardActivity,
    ).mock.calls[1]?.[1];

    await user.click(
      screen.getByRole("button", { name: "Next activity page" }),
    );
    expect(pageTwoSignal?.aborted).toBe(true);

    thirdPage.resolve(activityPage(3, 3));
    expect(await screen.findByText("Page 3 of 3")).not.toBeNull();

    secondPage.resolve(activityPage(2, 3));
    await waitFor(() => {
      expect(screen.queryByText("Page 2 of 3")).toBeNull();
    });
  });
});
