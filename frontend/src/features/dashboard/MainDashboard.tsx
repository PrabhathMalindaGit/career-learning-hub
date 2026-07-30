import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { ActivityFeed } from "./ActivityFeed";
import {
  fetchDashboardActivity,
  fetchProgressSnapshot,
} from "./dashboardApi";
import { ProgressWidgets } from "./ProgressWidgets";
import type {
  DashboardActivityPage,
  DashboardProgress,
  DashboardWindowDays,
} from "./types";
import { dashboardWindowDays } from "./types";
import "./dashboard.css";

const ACTIVITY_LIMIT = 10;

const quickStartActions = [
  {
    label: "Create Resume",
    description: "Build a focused resume in Resume Studio.",
    to: "/resumes?action=create",
    icon: "resume",
  },
  {
    label: "Start Interview Session",
    description: "Create a private practice session for a target role.",
    to: "/interviews?action=create",
    icon: "interview",
  },
  {
    label: "Upload Learning Document",
    description: "Upload a private PDF to your learning library.",
    to: "/learning?action=upload",
    icon: "learning",
  },
] as const;

type DisplayError = {
  message: string;
  requestId?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function displayError(
  error: unknown,
  fallback: string,
): DisplayError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId
        ? { requestId: error.requestId }
        : {}),
    };
  }

  return { message: fallback };
}

function ErrorState({
  error,
  retryLabel,
  onRetry,
}: {
  error: DisplayError;
  retryLabel: string;
  onRetry(): void;
}) {
  return (
    <div
      className="dashboard-status-message dashboard-status-error"
      role="alert"
    >
      <div>
        <strong>{error.message}</strong>
        {error.requestId ? (
          <small>Request ID: {error.requestId}</small>
        ) : null}
      </div>
      <button type="button" onClick={onRetry}>
        {retryLabel}
      </button>
    </div>
  );
}

function QuickStartIcon({
  name,
}: {
  name: (typeof quickStartActions)[number]["icon"];
}) {
  const paths: Record<
    (typeof quickStartActions)[number]["icon"],
    ReactNode
  > = {
    resume: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 11h6M9 15h6M9 7h3" />
      </>
    ),
    interview: (
      <>
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    learning: (
      <>
        <path d="m3 7 9-4 9 4-9 4z" />
        <path d="M6 9v6c3 3 9 3 12 0V9" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function QuickStartActions() {
  return (
    <nav
      className="dashboard-quick-start"
      aria-labelledby="dashboard-quick-start-title"
    >
      <div className="dashboard-quick-start__header">
        <div>
          <p className="dashboard-kicker">Start here</p>
          <h2 id="dashboard-quick-start-title">Quick start</h2>
        </div>
        <p>Open an existing creation workflow.</p>
      </div>

      <div className="dashboard-quick-start__grid">
        {quickStartActions.map((action) => (
          <Link
            className="dashboard-quick-start__link"
            key={action.to}
            to={action.to}
          >
            <span className="dashboard-quick-start__icon">
              <QuickStartIcon name={action.icon} />
            </span>
            <span className="dashboard-quick-start__copy">
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </span>
            <span
              className="dashboard-quick-start__arrow"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function ScoreTrend({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: Array<{
    id: string;
    score: number;
    occurredAt: string;
    label: string;
  }>;
}) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Recorded trend</p>
          <h2>{title}</h2>
        </div>
        <span className="dashboard-chip">
          {countLabel(points.length, "point")}
        </span>
      </header>
      <p className="dashboard-panel-intro">{description}</p>

      {points.length === 0 ? (
        <div className="dashboard-empty-state">
          No scored records are available in this window.
        </div>
      ) : (
        <div className="dashboard-trend-list">
          {points.map((point) => (
            <article className="dashboard-trend-row" key={point.id}>
              <div>
                <strong>{point.label}</strong>
                <small>
                  {new Date(
                    point.occurredAt,
                  ).toLocaleDateString()}
                </small>
              </div>
              <div
                className="dashboard-score-track"
                role="meter"
                aria-label={`${point.score} out of 100`}
                aria-valuenow={point.score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, point.score),
                    )}%`,
                  }}
                />
              </div>
              <b>{countLabel(Math.round(point.score), "point")}</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LearningSummary({
  data,
}: {
  data: DashboardProgress["learning"];
}) {
  const counts = data.documentCounts;

  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Learning library</p>
          <h2>Learning documents</h2>
        </div>
        <span className="dashboard-chip">{counts.total} total</span>
      </header>

      <dl className="dashboard-status-grid">
        <div>
          <dt>Ready</dt>
          <dd>{counts.ready}</dd>
        </div>
        <div>
          <dt>Processing</dt>
          <dd>{counts.processing}</dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>{counts.uploaded}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{counts.failed}</dd>
        </div>
        <div>
          <dt>Deleting</dt>
          <dd>{counts.deleting}</dd>
        </div>
      </dl>

      <div className="dashboard-document-list">
        {data.recentDocuments.length === 0 ? (
          <div className="dashboard-empty-state">
            No learning documents are recorded.
          </div>
        ) : (
          data.recentDocuments.map((document) => (
            <article
              className="dashboard-document-item"
              key={document.documentId}
            >
              <div>
                <strong>{document.title}</strong>
                <small>
                  {countLabel(document.pageCount, "page")} ·{" "}
                  {countLabel(document.chunkCount, "chunk")} · Updated{" "}
                  {new Date(
                    document.updatedAt,
                  ).toLocaleDateString()}
                </small>
              </div>
              <span
                className={`dashboard-document-status dashboard-document-${document.status}`}
              >
                {document.status}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function AiUsageSummary({
  data,
}: {
  data: DashboardProgress["aiUsage"];
}) {
  const costLabel =
    data.estimatedCostEventCount === 0
      ? "No cost estimates recorded"
      : data.estimatedCostEventCount === data.requestCount
        ? "Estimated cost"
        : "Partial estimated cost";

  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Recorded infrastructure use</p>
          <h2>AI usage</h2>
        </div>
        <span className="dashboard-chip">
          {countLabel(data.requestCount, "request")}
        </span>
      </header>

      <dl className="dashboard-usage-grid">
        <div>
          <dt>Total tokens</dt>
          <dd>{data.totalTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Input / output</dt>
          <dd>
            {data.inputTokens.toLocaleString()} /{" "}
            {data.outputTokens.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt>Average latency</dt>
          <dd>
            {data.averageLatencyMs === null
              ? "Unavailable"
              : `${Math.round(data.averageLatencyMs)} ms`}
          </dd>
        </div>
        <div>
          <dt>{costLabel}</dt>
          <dd>
            {data.estimatedCostEventCount === 0
              ? "—"
              : currencyFormatter.format(
                  data.estimatedCostUsd,
                )}
          </dd>
        </div>
      </dl>
      <p className="dashboard-cost-note">
        USD estimates are recorded usage metadata, not provider billing.
      </p>

      <div className="dashboard-feature-list">
        {data.byFeature.length === 0 ? (
          <div className="dashboard-empty-state">
            No feature-level AI usage is recorded.
          </div>
        ) : (
          data.byFeature.map((feature) => (
            <article key={feature.feature}>
              <span>{feature.feature}</span>
              <strong>{feature.requestCount}</strong>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function hasRecordedData(data: DashboardProgress): boolean {
  return (
    data.resumeReadiness.analysesInWindow > 0 ||
    data.interviews.attemptsInWindow > 0 ||
    data.interviews.activeSessions > 0 ||
    data.interviews.completedSessions > 0 ||
    data.learning.documentCounts.total > 0 ||
    data.learning.quizPerformance.attemptsInWindow > 0 ||
    data.aiUsage.requestCount > 0
  );
}

export function MainDashboard() {
  const [windowDays, setWindowDays] =
    useState<DashboardWindowDays>(30);
  const [progress, setProgress] =
    useState<DashboardProgress>();
  const [progressLoading, setProgressLoading] =
    useState(true);
  const [progressError, setProgressError] =
    useState<DisplayError>();
  const [progressRetry, setProgressRetry] = useState(0);
  const progressRequestId = useRef(0);

  const [activityPage, setActivityPage] = useState(1);
  const [activity, setActivity] =
    useState<DashboardActivityPage>();
  const [activityLoading, setActivityLoading] =
    useState(true);
  const [activityError, setActivityError] =
    useState<DisplayError>();
  const [activityRetry, setActivityRetry] = useState(0);
  const activityRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++progressRequestId.current;

    setProgress(undefined);
    setProgressError(undefined);
    setProgressLoading(true);

    void fetchProgressSnapshot(
      {
        windowDays,
        trendLimit: 12,
        recentDocumentLimit: 6,
      },
      controller.signal,
    )
      .then((nextProgress) => {
        if (requestId === progressRequestId.current) {
          setProgress(nextProgress);
        }
      })
      .catch((error: unknown) => {
        if (
          requestId === progressRequestId.current &&
          !isAbortError(error)
        ) {
          setProgressError(
            displayError(
              error,
              "Progress could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (requestId === progressRequestId.current) {
          setProgressLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [progressRetry, windowDays]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++activityRequestId.current;

    setActivityError(undefined);
    setActivityLoading(true);

    void fetchDashboardActivity(
      {
        page: activityPage,
        limit: ACTIVITY_LIMIT,
      },
      controller.signal,
    )
      .then((nextActivity) => {
        if (requestId === activityRequestId.current) {
          setActivity(nextActivity);
        }
      })
      .catch((error: unknown) => {
        if (
          requestId === activityRequestId.current &&
          !isAbortError(error)
        ) {
          setActivityError(
            displayError(
              error,
              "Activity could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (requestId === activityRequestId.current) {
          setActivityLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activityPage, activityRetry]);

  const resumeTrend = useMemo(
    () =>
      progress?.resumeReadiness.trend.map((point) => ({
        id: point.analysisId,
        score: point.score,
        occurredAt: point.createdAt,
        label: point.targetRole,
      })) ?? [],
    [progress],
  );

  const interviewTrend = useMemo(
    () =>
      progress?.interviews.trend.map((point) => ({
        id: point.attemptId,
        score: point.score,
        occurredAt: point.completedAt,
        label: "Interview feedback",
      })) ?? [],
    [progress],
  );

  const quizTrend = useMemo(
    () =>
      progress?.learning.quizPerformance.trend.map(
        (point) => ({
          id: point.attemptId,
          score: point.scorePercent,
          occurredAt: point.completedAt,
          label: `${point.correctCount} of ${point.questionCount} correct`,
        }),
      ) ?? [],
    [progress],
  );

  const activityMatchesPage =
    activity?.pagination.page === activityPage;
  const activityPagination = activity?.pagination ?? {
    page: activityPage,
    limit: ACTIVITY_LIMIT,
    total: 0,
    pages: 0,
  };

  return (
    <section
      className="dashboard-layout"
      aria-labelledby="main-dashboard-title"
    >
      <PageHeader
        className="dashboard-heading"
        heading={
          <>
            <p className="eyebrow">Workspace overview</p>
            <h1 id="main-dashboard-title">Unified dashboard</h1>
          </>
        }
        description={
          <>
            <p>
              Owned progress recorded across resumes, interviews,
              learning, quizzes, and AI usage in the last {windowDays}{" "}
              days.
            </p>
            {progress?.generatedAt ? (
              <small>
                Updated{" "}
                {new Date(progress.generatedAt).toLocaleString()}
              </small>
            ) : null}
          </>
        }
        actions={
          <div>
            <span className="dashboard-control-label">
              Progress window
            </span>
            <div
              className="dashboard-window-options"
              role="group"
              aria-label="Progress window"
            >
              {dashboardWindowDays.map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={windowDays === days}
                  onClick={() => setWindowDays(days)}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
        }
      />
      <QuickStartActions />
      <section aria-label="Progress overview">
        {progressLoading ? (
          <div
            className="dashboard-status-message"
            role="status"
            aria-live="polite"
          >
            Loading progress
          </div>
        ) : null}

        {progressError ? (
          <ErrorState
            error={progressError}
            retryLabel="Retry progress"
            onRetry={() =>
              setProgressRetry((value) => value + 1)
            }
          />
        ) : null}

        {progress ? (
          <>
            {!hasRecordedData(progress) ? (
              <div className="dashboard-empty-banner">
                <strong>No recorded dashboard data</strong>
                <p>
                  This account has no owned records for the selected
                  progress window.
                </p>
              </div>
            ) : null}

            <ProgressWidgets data={progress} />

            <div className="dashboard-content-grid">
              <ScoreTrend
                title="Resume readiness"
                description="Stored analysis scores in chronological order."
                points={resumeTrend}
              />
              <ScoreTrend
                title="Interview feedback"
                description="Completed feedback scores in chronological order."
                points={interviewTrend}
              />
              <ScoreTrend
                title="Quiz performance"
                description="Completed quiz scores in chronological order."
                points={quizTrend}
              />
              <LearningSummary data={progress.learning} />
              <AiUsageSummary data={progress.aiUsage} />
            </div>
          </>
        ) : null}
      </section>

      <section
        className="dashboard-activity-section"
        aria-label="Dashboard activity"
      >
        {!activity && activityLoading ? (
          <div
            className="dashboard-status-message"
            role="status"
            aria-live="polite"
          >
            Loading activity
          </div>
        ) : null}

        {activityError ? (
          <ErrorState
            error={activityError}
            retryLabel="Retry activity"
            onRetry={() =>
              setActivityRetry((value) => value + 1)
            }
          />
        ) : null}

        {activity ? (
          <ActivityFeed
            events={
              activityMatchesPage ? activity.events : []
            }
            pagination={activityPagination}
            currentPage={activityPage}
            refreshing={activityLoading}
            onPrevious={() =>
              setActivityPage((page) =>
                Math.max(1, page - 1),
              )
            }
            onNext={() =>
              setActivityPage((page) =>
                Math.min(
                  Math.max(
                    1,
                    activityPagination.pages,
                  ),
                  page + 1,
                ),
              )
            }
          />
        ) : null}
      </section>
    </section>
  );
}
