import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    generatedAt: "2026-08-16T05:00:00.000Z",
    window: {
      days: 30,
      start: "2026-07-17T05:00:00.000Z",
      end: "2026-08-16T05:00:00.000Z",
    },
    resumeReadiness: {
      latest: {
        analysisId: "analysis-1",
        resumeId: "resume-1",
        resumeVersionId: "version-1",
        targetRole: "Software engineer",
        score: 84,
        scoreBreakdown: {
          keywordMatch: 20,
          clarity: 21,
          evidence: 22,
          formatting: 21,
        },
        createdAt: "2026-08-15T05:00:00.000Z",
      },
      previousScore: 79,
      changeFromPrevious: 5,
      averageScoreInWindow: 81,
      analysesInWindow: 3,
      analyzedResumesInWindow: 1,
      trend: [
        {
          analysisId: "analysis-1",
          resumeId: "resume-1",
          targetRole: "Software engineer",
          score: 84,
          createdAt: "2026-08-15T05:00:00.000Z",
        },
      ],
    },
    interviews: {
      attemptsInWindow: 2,
      feedbackCompletedInWindow: 1,
      averageFeedbackScore: 76,
      bestFeedbackScore: 76,
      latestFeedbackScore: 76,
      activeSessions: 1,
      completedSessions: 0,
      trend: [
        {
          attemptId: "attempt-1",
          sessionId: "session-1",
          questionId: "question-1",
          score: 76,
          completedAt: "2026-08-14T05:00:00.000Z",
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
          title: "Operating systems notes",
          status: "ready",
          pageCount: 12,
          chunkCount: 24,
          processedAt: "2026-08-13T05:00:00.000Z",
          updatedAt: "2026-08-13T05:00:00.000Z",
        },
      ],
      quizPerformance: {
        attemptsInWindow: 2,
        averageScore: 68,
        bestScore: 80,
        latestScore: 80,
        totalQuestionsAnswered: 20,
        totalCorrectAnswers: 14,
        trend: [
          {
            attemptId: "quiz-attempt-1",
            quizId: "quiz-1",
            documentId: "document-1",
            scorePercent: 80,
            correctCount: 8,
            questionCount: 10,
            completedAt: "2026-08-12T05:00:00.000Z",
          },
        ],
      },
    },
    aiUsage: {
      requestCount: 4,
      successCount: 4,
      failureCount: 0,
      inputTokens: 2400,
      outputTokens: 800,
      totalTokens: 3200,
      estimatedCostUsd: 0.02,
      estimatedCostEventCount: 4,
      averageLatencyMs: 950,
      byFeature: [
        {
          feature: "resume-analysis",
          requestCount: 4,
          successCount: 4,
          failureCount: 0,
          inputTokens: 2400,
          outputTokens: 800,
          estimatedCostUsd: 0.02,
        },
      ],
      daily: [],
    },
  };
}

function activityFixture(): DashboardActivityPage {
  return {
    events: [
      {
        id: "activity-1",
        type: "learning.quiz.generated",
        resourceType: "quiz",
        origin: "worker",
        occurredAt: "2026-08-16T04:00:00.000Z",
      },
      {
        id: "activity-2",
        type: "resume.analysis.completed",
        resourceType: "resume-analysis",
        origin: "worker",
        occurredAt: "2026-08-15T04:00:00.000Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 5,
      total: 12,
      pages: 3,
    },
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <MainDashboard />
    </MemoryRouter>,
  );
}

describe("Phase 19D Dashboard refinements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.fetchProgressSnapshot).mockResolvedValue(
      progressFixture(),
    );
    vi.mocked(dashboardApi.fetchDashboardActivity).mockResolvedValue(
      activityFixture(),
    );
  });

  it("uses contextual continuation actions and compact performance-period controls", async () => {
    renderDashboard();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Dashboard" }),
    ).not.toBeNull();

    const continuation = screen.getByRole("navigation", {
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

    expect(
      screen.getByRole("group", { name: "Performance period" }),
    ).not.toBeNull();

    await waitFor(() => {
      expect(dashboardApi.fetchProgressSnapshot).toHaveBeenCalledWith(
        {
          windowDays: 30,
          trendLimit: 5,
          recentDocumentLimit: 3,
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("shows user-outcome metrics without internal AI diagnostics", async () => {
    renderDashboard();

    expect(await screen.findByText("Resume performance")).not.toBeNull();
    expect(
      screen.getAllByText("Interview feedback").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Quiz performance")).not.toBeNull();
    expect(screen.queryByText("AI usage")).toBeNull();
    expect(screen.queryByText("Total tokens")).toBeNull();
    expect(screen.queryByText("Average latency")).toBeNull();
    expect(screen.queryByText("resume-analysis")).toBeNull();
  });

  it("uses a purposeful Interview empty state instead of Unavailable", async () => {
    const fixture = progressFixture();
    vi.mocked(dashboardApi.fetchProgressSnapshot).mockResolvedValue({
      ...fixture,
      interviews: {
        ...fixture.interviews,
        attemptsInWindow: 0,
        feedbackCompletedInWindow: 0,
        averageFeedbackScore: null,
        bestFeedbackScore: null,
        latestFeedbackScore: null,
        trend: [],
      },
    });

    renderDashboard();

    expect(
      await screen.findByText("No scored feedback in this period."),
    ).not.toBeNull();
    expect(screen.queryByText("Unavailable")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Practice interview" }),
    ).not.toBeNull();
  });

  it("keeps recent activity compact until the user asks to browse it", async () => {
    renderDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(dashboardApi.fetchDashboardActivity).toHaveBeenCalledWith(
        { page: 1, limit: 5 },
        expect.any(AbortSignal),
      );
    });

    expect(await screen.findByText("Quiz created")).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Previous activity page" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "View all activity" }),
    );

    expect(
      screen.getByRole("button", { name: "Previous activity page" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Next activity page" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Show recent activity only" }),
    ).not.toBeNull();
  });
});
