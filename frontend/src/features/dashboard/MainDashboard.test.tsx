import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      daily: [
        {
          date: "2026-07-23",
          requestCount: 2,
          successCount: 1,
          failureCount: 1,
          inputTokens: 1200,
          outputTokens: 400,
          estimatedCostUsd: 0.0123,
        },
      ],
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
      limit: 10,
      total: pages * 10,
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

    render(<MainDashboard />);

    expect(screen.getByText("Loading progress")).not.toBeNull();
    expect(screen.getByText("Loading activity")).not.toBeNull();
  });

  it("renders a clear page heading and returned domain metrics", async () => {
    render(<MainDashboard />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Unified dashboard",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Owned progress recorded across resumes, interviews, learning, quizzes, and AI usage in the last 30 days.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("group", { name: "Progress window" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "7 days" }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "30 days" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "90 days" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "365 days" }),
    ).not.toBeNull();
    expect(await screen.findByText("84%")).not.toBeNull();
    expect(screen.getByText("76%")).not.toBeNull();
    expect(screen.getByText("75%")).not.toBeNull();
    expect(
      screen.getByText("Distributed systems notes"),
    ).not.toBeNull();
    expect(screen.getByText("1,600")).not.toBeNull();
    expect(screen.getByText("840 ms")).not.toBeNull();

    const scoreMeters = screen.getAllByRole("meter");
    expect(scoreMeters).toHaveLength(3);
    expect(scoreMeters[0]?.getAttribute("aria-valuenow")).toBe(
      "84",
    );
    expect(scoreMeters[0]?.getAttribute("aria-valuemin")).toBe(
      "0",
    );
    expect(scoreMeters[0]?.getAttribute("aria-valuemax")).toBe(
      "100",
    );
  });

  it("shows factual zero counts and unavailable null scores", async () => {
    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockResolvedValue(emptyProgressFixture());

    render(<MainDashboard />);

    expect(
      await screen.findByText("No recorded dashboard data"),
    ).not.toBeNull();
    expect(
      screen.getAllByText("Unavailable").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("0 requests").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/sample|demo|streak/i),
    ).toBeNull();
  });

  it("uses singular labels for returned counts of one", async () => {
    const fixture = progressFixture();
    vi.mocked(
      dashboardApi.fetchProgressSnapshot,
    ).mockResolvedValue({
      ...fixture,
      resumeReadiness: {
        ...fixture.resumeReadiness,
        analysesInWindow: 1,
        analyzedResumesInWindow: 1,
      },
      interviews: {
        ...fixture.interviews,
        attemptsInWindow: 1,
        feedbackCompletedInWindow: 1,
      },
      learning: {
        ...fixture.learning,
        quizPerformance: {
          ...fixture.learning.quizPerformance,
          totalQuestionsAnswered: 1,
          totalCorrectAnswers: 1,
        },
      },
      aiUsage: {
        ...fixture.aiUsage,
        requestCount: 1,
        successCount: 1,
        failureCount: 0,
        estimatedCostEventCount: 1,
      },
    });

    render(<MainDashboard />);

    expect(
      await screen.findByText("1 analysis across 1 resume"),
    ).not.toBeNull();
    expect(screen.getByText("1 scored of 1 attempt")).not.toBeNull();
    expect(screen.getByText("1 of 1 answer correct")).not.toBeNull();
    expect(
      screen.getAllByText("1 request").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText("1 point").length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("requests all four approved windows and communicates the active selection", async () => {
    render(<MainDashboard />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(
        dashboardApi.fetchProgressSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ windowDays: 30 }),
        expect.any(AbortSignal),
      );
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
          expect.objectContaining({ windowDays }),
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
    render(<MainDashboard />);
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

    const fresh = {
      ...progressFixture(),
      window: {
        ...progressFixture().window,
        days: 7,
      },
      resumeReadiness: {
        ...progressFixture().resumeReadiness,
        latest: (() => {
          const latest =
            progressFixture().resumeReadiness.latest;
          if (!latest) {
            throw new Error("Expected a resume analysis fixture.");
          }
          return { ...latest, score: 91 };
        })(),
      },
    };
    second.resolve(fresh);
    expect(await screen.findByText("91%")).not.toBeNull();

    first.resolve(progressFixture());
    await waitFor(() => {
      expect(screen.queryByText("84%")).toBeNull();
    });
  });

  it.each([
    [0, 0, "No cost estimates recorded"],
    [3, 1, "Partial estimated cost"],
    [3, 3, "Estimated cost"],
  ] as const)(
    "labels %i requests with %i cost estimates as %s",
    async (requestCount, estimatedCostEventCount, label) => {
      const fixture = progressFixture();
      vi.mocked(
        dashboardApi.fetchProgressSnapshot,
      ).mockResolvedValue({
        ...fixture,
        aiUsage: {
          ...fixture.aiUsage,
          requestCount,
          successCount: requestCount,
          failureCount: 0,
          estimatedCostEventCount,
        },
      });

      render(<MainDashboard />);

      expect(await screen.findByText(label)).not.toBeNull();
    },
  );

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
    render(<MainDashboard />);
    const user = userEvent.setup();

    expect(await screen.findByText("84%")).not.toBeNull();
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
    render(<MainDashboard />);
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
    expect(
      screen.queryByText("must not render"),
    ).toBeNull();

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

  it("renders safe activity labels in returned order without metadata", async () => {
    render(<MainDashboard />);

    const feed = await screen.findByRole("region", {
      name: "Recent activity",
    });
    const rows = within(feed).getAllByRole("article");
    expect(rows[0]?.textContent).toContain("Quiz completed");
    expect(rows[1]?.textContent).toContain("Recorded activity");
    expect(feed.textContent).not.toContain("unknown.private.event");
    expect(feed.textContent).not.toContain("resource");
    expect(feed.textContent).not.toContain("metadata");
  });

  it("bounds activity pagination and navigates Previous and Next", async () => {
    vi.mocked(dashboardApi.fetchDashboardActivity)
      .mockResolvedValueOnce(activityPage(1, 2))
      .mockResolvedValueOnce(activityPage(2, 2))
      .mockResolvedValueOnce(activityPage(1, 2));
    render(<MainDashboard />);
    const user = userEvent.setup();

    const previous = await screen.findByRole("button", {
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
    expect((previous as HTMLButtonElement).disabled).toBe(false);

    await user.click(previous);
    await screen.findByText("Page 1 of 2");
    expect(
      dashboardApi.fetchDashboardActivity,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
      expect.any(AbortSignal),
    );
  });

  it("does not present an in-flight activity page as empty", async () => {
    const nextPage = deferred<DashboardActivityPage>();
    vi.mocked(dashboardApi.fetchDashboardActivity)
      .mockResolvedValueOnce(activityPage(1, 2))
      .mockReturnValueOnce(nextPage.promise);
    render(<MainDashboard />);
    const user = userEvent.setup();

    await screen.findByText("Page 1 of 2");
    await user.click(
      screen.getByRole("button", {
        name: "Next activity page",
      }),
    );

    expect(
      await screen.findByText(
        "Loading selected activity page",
      ),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "No recorded activity is available.",
      ),
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
    render(<MainDashboard />);
    const user = userEvent.setup();

    await screen.findByText("Page 1 of 3");
    await user.click(
      screen.getByRole("button", {
        name: "Next activity page",
      }),
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
      screen.getByRole("button", {
        name: "Next activity page",
      }),
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
