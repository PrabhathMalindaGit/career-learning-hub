import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

type DashboardApiModule = typeof import("./dashboardApi");

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function progressFixture() {
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

function activityFixture() {
  return {
    events: [
      {
        id: "activity-1",
        type: "quiz.completed",
        resourceType: "quiz-attempt",
        resourceId: "private-resource-id",
        origin: "api",
        metadata: {
          prompt: "private prompt",
          scorePercent: 80,
        },
        occurredAt: "2026-07-24T09:00:00.000Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1,
    },
  };
}

async function loadDashboardApi(): Promise<DashboardApiModule> {
  vi.resetModules();
  vi.stubEnv(
    "VITE_API_URL",
    "https://api.example.test/api/v1",
  );
  return import("./dashboardApi");
}

describe("dashboardApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([7, 30, 90, 365] as const)(
    "serializes the approved %i-day progress window",
    async (windowDays) => {
      const { fetchProgressSnapshot } =
        await loadDashboardApi();
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          success: true,
          data: {
            ...progressFixture(),
            window: {
              ...progressFixture().window,
              days: windowDays,
            },
          },
        }),
      );

      await fetchProgressSnapshot({
        windowDays,
        trendLimit: 12,
        recentDocumentLimit: 6,
      });

      expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
        `https://api.example.test/api/v1/dashboard/progress?windowDays=${windowDays}&trendLimit=12&recentDocumentLimit=6`,
      );
    },
  );

  it("uses the activity endpoint and serializes bounded pagination and filters", async () => {
    const { fetchDashboardActivity } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: activityFixture(),
      }),
    );

    await fetchDashboardActivity({
      page: -4,
      limit: 500,
      type: "quiz.completed",
      origin: "api",
      resourceType: "quiz-attempt",
    });

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/v1/dashboard/activity?page=1&limit=100&type=quiz.completed&origin=api&resourceType=quiz-attempt",
    );
  });

  it("does not serialize a user ID", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: progressFixture(),
      }),
    );

    await fetchProgressSnapshot({ windowDays: 30 });

    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).not
      .toContain("user");
  });

  it("forwards AbortSignal through the shared client", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: progressFixture(),
      }),
    );

    await fetchProgressSnapshot(
      { windowDays: 30 },
      controller.signal,
    );

    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal).toBe(
      controller.signal,
    );
  });

  it("preserves structured API errors from the shared client", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "DASHBOARD_UNAVAILABLE",
            message: "Dashboard data is temporarily unavailable.",
            requestId: "dashboard-request-id-1",
          },
        },
        503,
      ),
    );

    await expect(
      fetchProgressSnapshot({ windowDays: 30 }),
    ).rejects.toMatchObject({
      status: 503,
      code: "DASHBOARD_UNAVAILABLE",
      message: "Dashboard data is temporarily unavailable.",
      requestId: "dashboard-request-id-1",
    });
  });

  it("accepts nullable score and latency metrics", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    const base = progressFixture();
    const fixture = {
      ...base,
      resumeReadiness: {
        ...base.resumeReadiness,
        latest: null,
        previousScore: null,
        changeFromPrevious: null,
        averageScoreInWindow: null,
      },
      interviews: {
        ...base.interviews,
        averageFeedbackScore: null,
        bestFeedbackScore: null,
        latestFeedbackScore: null,
      },
      learning: {
        ...base.learning,
        quizPerformance: {
          ...base.learning.quizPerformance,
          averageScore: null,
          bestScore: null,
          latestScore: null,
        },
      },
      aiUsage: {
        ...base.aiUsage,
        averageLatencyMs: null,
      },
    };
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: fixture }),
    );

    const result = await fetchProgressSnapshot({
      windowDays: 30,
    });

    expect(result.resumeReadiness.latest).toBeNull();
    expect(result.interviews.averageFeedbackScore).toBeNull();
    expect(
      result.learning.quizPerformance.averageScore,
    ).toBeNull();
    expect(result.aiUsage.averageLatencyMs).toBeNull();
  });

  it("rejects malformed progress structures", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          ...progressFixture(),
          learning: null,
        },
      }),
    );

    await expect(
      fetchProgressSnapshot({ windowDays: 30 }),
    ).rejects.toMatchObject({
      code: "INVALID_DASHBOARD_RESPONSE",
    });
  });

  it("rejects invalid numeric progress metrics", async () => {
    const { fetchProgressSnapshot } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          ...progressFixture(),
          aiUsage: {
            ...progressFixture().aiUsage,
            totalTokens: Number.NaN,
          },
        },
      }),
    );

    await expect(
      fetchProgressSnapshot({ windowDays: 30 }),
    ).rejects.toMatchObject({
      code: "INVALID_DASHBOARD_RESPONSE",
    });
  });

  it("rejects malformed activity responses and pagination", async () => {
    const { fetchDashboardActivity } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          ...activityFixture(),
          pagination: {
            ...activityFixture().pagination,
            pages: -1,
          },
        },
      }),
    );

    await expect(
      fetchDashboardActivity({ page: 1, limit: 10 }),
    ).rejects.toMatchObject({
      code: "INVALID_DASHBOARD_RESPONSE",
    });
  });

  it("accepts safe activity fields without exposing metadata or resource IDs", async () => {
    const { fetchDashboardActivity } =
      await loadDashboardApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: activityFixture(),
      }),
    );

    const result = await fetchDashboardActivity({
      page: 1,
      limit: 10,
    });

    expect(result.events).toEqual([
      {
        id: "activity-1",
        type: "quiz.completed",
        resourceType: "quiz-attempt",
        origin: "api",
        occurredAt: "2026-07-24T09:00:00.000Z",
      },
    ]);
    expect(result.events[0]).not.toHaveProperty("metadata");
    expect(result.events[0]).not.toHaveProperty("resourceId");
  });
});
