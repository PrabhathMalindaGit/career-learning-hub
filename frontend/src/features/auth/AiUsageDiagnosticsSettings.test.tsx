import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as dashboardApi from "../dashboard/dashboardApi";
import type { DashboardProgress } from "../dashboard/types";
import { AiUsageDiagnosticsSettingsSection } from "./AiUsageDiagnosticsSettings";

vi.mock("../dashboard/dashboardApi", () => ({
  fetchProgressSnapshot: vi.fn(),
}));

function progressFixture(
  aiUsage: Partial<DashboardProgress["aiUsage"]> = {},
): DashboardProgress {
  return {
    generatedAt: "2026-08-16T06:00:00.000Z",
    window: {
      days: 30,
      start: "2026-07-17T06:00:00.000Z",
      end: "2026-08-16T06:00:00.000Z",
    },
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
      requestCount: 82,
      successCount: 80,
      failureCount: 2,
      inputTokens: 60511,
      outputTokens: 36299,
      totalTokens: 96810,
      estimatedCostUsd: 1.2345,
      estimatedCostEventCount: 82,
      averageLatencyMs: 11846,
      byFeature: [
        {
          feature: "resume.analysis",
          requestCount: 12,
          successCount: 12,
          failureCount: 0,
          inputTokens: 10000,
          outputTokens: 4000,
          estimatedCostUsd: 0.2,
        },
        {
          feature: "learning.document.chat",
          requestCount: 16,
          successCount: 15,
          failureCount: 1,
          inputTokens: 12000,
          outputTokens: 7000,
          estimatedCostUsd: 0.3,
        },
        {
          feature: "future.unknown.operation",
          requestCount: 1,
          successCount: 1,
          failureCount: 0,
          inputTokens: 10,
          outputTokens: 5,
          estimatedCostUsd: 0.001,
        },
      ],
      daily: [],
      ...aiUsage,
    },
  };
}

describe("AiUsageDiagnosticsSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.fetchProgressSnapshot).mockResolvedValue(
      progressFixture(),
    );
  });

  it("loads the fixed 30-day bounded snapshot and renders canonical usage", async () => {
    render(<AiUsageDiagnosticsSettingsSection />);

    const region = await screen.findByRole("region", {
      name: "AI usage & diagnostics",
    });

    await waitFor(() => {
      expect(dashboardApi.fetchProgressSnapshot).toHaveBeenCalledWith(
        {
          windowDays: 30,
          trendLimit: 3,
          recentDocumentLimit: 1,
        },
        expect.any(AbortSignal),
      );
    });

    expect(within(region).getByText("82")).not.toBeNull();
    expect(within(region).getByText("80")).not.toBeNull();
    expect(within(region).getByText("2")).not.toBeNull();
    expect(within(region).getByText("60,511")).not.toBeNull();
    expect(within(region).getByText("36,299")).not.toBeNull();
    expect(within(region).getByText("96,810")).not.toBeNull();
    expect(within(region).getByText("11.8 s")).not.toBeNull();
    expect(within(region).getByText("$1.2345")).not.toBeNull();
    expect(
      within(region).getByText(
        "Estimated across all recorded requests. Not an invoice.",
      ),
    ).not.toBeNull();
  });

  it("keeps technical operation details collapsed until requested", async () => {
    render(<AiUsageDiagnosticsSettingsSection />);
    const region = await screen.findByRole("region", {
      name: "AI usage & diagnostics",
    });
    const user = userEvent.setup();

    const details = within(region).getByTestId("ai-usage-technical-details");
    expect((details as HTMLDetailsElement).open).toBe(false);

    await user.click(
      within(region).getByText("Show technical details"),
    );

    expect((details as HTMLDetailsElement).open).toBe(true);
    expect(within(region).getByText("Resume analysis")).not.toBeNull();
    expect(within(region).getByText("resume.analysis")).not.toBeNull();
    expect(within(region).getByText("Learning chat")).not.toBeNull();
    expect(within(region).getByText("learning.document.chat")).not.toBeNull();
    expect(within(region).getByText("Other AI operation")).not.toBeNull();
    expect(within(region).getByText("future.unknown.operation")).not.toBeNull();
  });

  it.each([
    [82, 40, "Estimate covers 40 of 82 recorded requests. Not an invoice."],
    [82, 0, "No cost estimate is available for these requests."],
  ] as const)(
    "renders truthful cost coverage for %i requests / %i estimates",
    async (requestCount, estimatedCostEventCount, expected) => {
      vi.mocked(dashboardApi.fetchProgressSnapshot).mockResolvedValue(
        progressFixture({ requestCount, estimatedCostEventCount }),
      );

      render(<AiUsageDiagnosticsSettingsSection />);

      expect(await screen.findByText(expected)).not.toBeNull();
    },
  );

  it("renders a factual empty state without inventing latency or cost", async () => {
    vi.mocked(dashboardApi.fetchProgressSnapshot).mockResolvedValue(
      progressFixture({
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
      }),
    );

    render(<AiUsageDiagnosticsSettingsSection />);

    expect(
      await screen.findByText("No AI usage recorded in the last 30 days"),
    ).not.toBeNull();
    expect(screen.queryByText("0 ms")).toBeNull();
  });

  it("shows safe error evidence, retries only diagnostics, and aborts on unmount", async () => {
    vi.mocked(dashboardApi.fetchProgressSnapshot)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "AI_USAGE_UNAVAILABLE",
          "AI usage could not be loaded.",
          "settings-ai-usage-request-1",
        ),
      )
      .mockResolvedValueOnce(progressFixture());

    const user = userEvent.setup();
    const { unmount } = render(<AiUsageDiagnosticsSettingsSection />);

    expect(
      await screen.findByText("AI usage could not be loaded."),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: settings-ai-usage-request-1"),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Retry AI usage" }),
    );
    await waitFor(() => {
      expect(dashboardApi.fetchProgressSnapshot).toHaveBeenCalledTimes(2);
    });

    const signal = vi.mocked(dashboardApi.fetchProgressSnapshot).mock.calls[1]?.[1];
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
