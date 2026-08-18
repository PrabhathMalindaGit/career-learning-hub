import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import "./dashboardPhase19d.css";

const TREND_LIMIT = 5;
const RECENT_DOCUMENT_LIMIT = 3;
const RECENT_ACTIVITY_LIMIT = 5;
const EXPANDED_ACTIVITY_LIMIT = 10;

type DisplayError = {
  message: string;
  requestId?: string;
};

type ContinuationAction = {
  label: string;
  description: string;
  to: string;
  icon: "resume" | "interview" | "learning";
  tone: "forest" | "ink" | "amber";
};

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function statusLabel(status: string): string {
  if (status.length === 0) return status;
  return `${status[0]?.toUpperCase() ?? ""}${status.slice(1)}`;
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
      <span className="dashboard-status-message__icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>{error.message}</strong>
        <small>Try again.</small>
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
  name: ContinuationAction["icon"];
}) {
  const paths: Record<ContinuationAction["icon"], ReactNode> = {
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

function continuationActions(
  data: DashboardProgress,
): ContinuationAction[] {
  const latestResume = data.resumeReadiness.latest;
  const latestInterview =
    data.interviews.trend[data.interviews.trend.length - 1];
  const recentDocument = data.learning.recentDocuments[0];

  // Feature 2.2 UI — Continue/Create Resume dashboard shortcut.
  const resume: ContinuationAction = latestResume
    ? {
        label: "Continue Resume",
        description: `${latestResume.targetRole} · ${Math.round(latestResume.score)}% readiness`,
        to: `/resumes/${latestResume.resumeId}`,
        icon: "resume",
        tone: "forest",
      }
    : {
        label: "Create Resume",
        description: "Build a focused Resume in Resume Studio.",
        to: "/resumes?action=create",
        icon: "resume",
        tone: "forest",
      };

  // Feature 2.3 UI — Continue/Start Interview dashboard shortcut.
  const interview: ContinuationAction = latestInterview
    ? {
        label: "Continue Interview",
        description: `Latest feedback ${Math.round(latestInterview.score)}%`,
        to: `/interviews/${latestInterview.sessionId}`,
        icon: "interview",
        tone: "ink",
      }
    : data.interviews.activeSessions > 0
      ? {
          label: "Continue Interview",
          description: "Open your active Interview practice.",
          to: "/interviews",
          icon: "interview",
          tone: "ink",
        }
      : {
          label: "Start Interview Session",
          description: "Create a private practice session for a target role.",
          to: "/interviews?action=create",
          icon: "interview",
          tone: "ink",
        };

  // Feature 2.4 UI — Open/Upload Learning document dashboard shortcut.
  const learning: ContinuationAction = recentDocument
    ? {
        label: "Open Learning Document",
        description: `${recentDocument.title} · ${statusLabel(recentDocument.status)}`,
        to: `/learning/documents/${recentDocument.documentId}`,
        icon: "learning",
        tone: "amber",
      }
    : {
        label: "Upload Learning Document",
        description: "Add a private PDF to your Learning Workspace.",
        to: "/learning?action=upload",
        icon: "learning",
        tone: "amber",
      };

  return [resume, interview, learning];
}

function ContinueWorkActions({
  data,
}: {
  data: DashboardProgress;
}) {
  const actions = continuationActions(data);

  return (
    <nav
      className="dashboard-quick-start dashboard-continue-work"
      aria-labelledby="dashboard-continue-title"
    >
      <div className="dashboard-quick-start__header">
        <div>
          <p className="dashboard-kicker">Pick up where you left off</p>
          <h2 id="dashboard-continue-title">Continue your work</h2>
        </div>
        <p>
          Open a recent owned workspace, or start a new record when none exists.
        </p>
      </div>

      <div className="dashboard-quick-start__grid">
        {actions.map((action) => (
          <Link
            className={`dashboard-quick-start__link dashboard-quick-start__link--${action.tone}`}
            key={action.icon}
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
              ↗
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function PerformanceWindowControls({
  windowDays,
  onChange,
}: {
  windowDays: DashboardWindowDays;
  onChange(days: DashboardWindowDays): void;
}) {
  return (
    <section
      className="dashboard-performance-toolbar"
      aria-labelledby="dashboard-performance-period-title"
    >
      <div>
        <p className="dashboard-kicker">Performance</p>
        <h2 id="dashboard-performance-period-title">Performance period</h2>
        <p>
          Resume, Interview and Quiz scores and trends below use this period.
        </p>
      </div>
      <div
        className="dashboard-window-options"
        role="group"
        aria-label="Performance period"
      >
        {dashboardWindowDays.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={windowDays === days}
            onClick={() => onChange(days)}
          >
            {days} days
          </button>
        ))}
      </div>
    </section>
  );
}

function ScoreTrend({
  title,
  kicker,
  description,
  emptyTitle,
  emptyDescription,
  points,
}: {
  title: string;
  kicker: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  points: Array<{
    id: string;
    score: number;
    occurredAt: string;
    label: string;
  }>;
}) {
  return (
    <section className="dashboard-panel dashboard-trend-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <span className="dashboard-chip">
          {countLabel(points.length, "point")}
        </span>
      </header>
      <p className="dashboard-panel-intro">{description}</p>

      {points.length === 0 ? (
        <div className="dashboard-empty-state">
          <span className="dashboard-empty-state__icon" aria-hidden="true">
            ···
          </span>
          <div>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-trend-list">
          {points.map((point, index) => (
            <article
              className="dashboard-trend-row"
              key={point.id}
              style={
                {
                  "--dashboard-row-index": index,
                } as CSSProperties
              }
            >
              <div>
                <strong>{point.label}</strong>
                <small>
                  {new Date(point.occurredAt).toLocaleDateString()}
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
                    width: `${Math.max(0, Math.min(100, point.score))}%`,
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
    <section className="dashboard-panel dashboard-learning-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Learning Workspace</p>
          <h2>Learning documents</h2>
        </div>
        <span className="dashboard-chip">{counts.total} total</span>
      </header>

      <dl className="dashboard-status-grid">
        <div className="dashboard-status-grid__ready">
          <dt>Ready</dt>
          <dd>{counts.ready}</dd>
        </div>
        <div className="dashboard-status-grid__pending">
          <dt>Processing</dt>
          <dd>{counts.processing}</dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>{counts.uploaded}</dd>
        </div>
        <div className="dashboard-status-grid__failed">
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
            <span className="dashboard-empty-state__icon" aria-hidden="true">
              ≡
            </span>
            <div>
              <strong>No Learning documents yet</strong>
              <p>Upload a private PDF to build the Learning Workspace.</p>
            </div>
          </div>
        ) : (
          data.recentDocuments.map((document) => (
            <article
              className="dashboard-document-item"
              key={document.documentId}
            >
              <span className="dashboard-document-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 3h9l3 3v15H6z" />
                  <path d="M9 11h6M9 15h4" />
                </svg>
              </span>
              <div>
                <strong>{document.title}</strong>
                <small>
                  {countLabel(document.pageCount, "page")} ·{" "}
                  {countLabel(document.chunkCount, "chunk")} · Updated{" "}
                  {new Date(document.updatedAt).toLocaleDateString()}
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

function DashboardSkeleton({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`dashboard-skeleton ${compact ? "dashboard-skeleton--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="dashboard-sr-only">{label}</span>
      <div className="dashboard-skeleton-card dashboard-skeleton-card--feature">
        <span />
        <span />
        <span />
      </div>
      <div className="dashboard-skeleton-card">
        <span />
        <span />
      </div>
      <div className="dashboard-skeleton-card">
        <span />
        <span />
      </div>
    </div>
  );
}

function hasPerformanceInWindow(data: DashboardProgress): boolean {
  return (
    data.resumeReadiness.analysesInWindow > 0 ||
    data.interviews.attemptsInWindow > 0 ||
    data.learning.quizPerformance.attemptsInWindow > 0
  );
}

// Features 2.1–2.5 — Dashboard.
// Combines bounded progress outcomes, continuation/start shortcuts for the
// three workspaces, and recent activity without owning those feature domains.
export function MainDashboard() {
  const [windowDays, setWindowDays] =
    useState<DashboardWindowDays>(30);
  const [progress, setProgress] = useState<DashboardProgress>();
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState<DisplayError>();
  const [progressRetry, setProgressRetry] = useState(0);
  const progressRequestId = useRef(0);

  const [activityPage, setActivityPage] = useState(1);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [activity, setActivity] = useState<DashboardActivityPage>();
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<DisplayError>();
  const [activityRetry, setActivityRetry] = useState(0);
  const activityRequestId = useRef(0);
  const activityLimit = activityExpanded
    ? EXPANDED_ACTIVITY_LIMIT
    : RECENT_ACTIVITY_LIMIT;

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++progressRequestId.current;

    setProgress(undefined);
    setProgressError(undefined);
    setProgressLoading(true);

    void fetchProgressSnapshot(
      {
        windowDays,
        trendLimit: TREND_LIMIT,
        recentDocumentLimit: RECENT_DOCUMENT_LIMIT,
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
            displayError(error, "Progress could not be loaded."),
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
        limit: activityLimit,
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
            displayError(error, "Activity could not be loaded."),
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
  }, [activityLimit, activityPage, activityRetry]);

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
      progress?.learning.quizPerformance.trend.map((point) => ({
        id: point.attemptId,
        score: point.scorePercent,
        occurredAt: point.completedAt,
        label: `${point.correctCount} of ${point.questionCount} correct`,
      })) ?? [],
    [progress],
  );

  const activityMatchesRequest =
    activity?.pagination.page === activityPage &&
    activity.pagination.limit === activityLimit;
  const knownActivityTotal = activity?.pagination.total ?? 0;
  const activityPagination = activityMatchesRequest && activity
    ? activity.pagination
    : {
        page: activityPage,
        limit: activityLimit,
        total: knownActivityTotal,
        pages:
          knownActivityTotal === 0
            ? 0
            : Math.ceil(knownActivityTotal / activityLimit),
      };

  return (
    <section
      className="dashboard-layout"
      aria-labelledby="main-dashboard-title"
    >
      <PageHeader
        className="dashboard-heading dashboard-heading--compact"
        heading={
          <>
            <p className="eyebrow">Career Learning Hub</p>
            <h1 id="main-dashboard-title">Unified dashboard</h1>
          </>
        }
        description={
          <>
            <p>
              Continue your work and review recent progress across Resume Studio,
              Interview Coach, and Learning Workspace.
            </p>
            {progress?.generatedAt ? (
              <small>
                Updated {new Date(progress.generatedAt).toLocaleString()}
              </small>
            ) : null}
          </>
        }
      />

      {/* Feature 2.1 UI — Progress overview and performance period. */}
      <section
        className="dashboard-progress-section"
        aria-label="Progress overview"
      >
        {progress ? <ContinueWorkActions data={progress} /> : null}

        <PerformanceWindowControls
          windowDays={windowDays}
          onChange={setWindowDays}
        />

        {progressLoading ? (
          <DashboardSkeleton label="Loading progress" />
        ) : null}

        {progressError ? (
          <ErrorState
            error={progressError}
            retryLabel="Retry progress"
            onRetry={() => setProgressRetry((value) => value + 1)}
          />
        ) : null}

        {progress ? (
          <>
            {!hasPerformanceInWindow(progress) ? (
              <div className="dashboard-empty-banner">
                <span aria-hidden="true">↗</span>
                <div>
                  <strong>No performance recorded in this period</strong>
                  <p>
                    Resume analyses, scored Interview attempts, and Quiz results
                    will appear here when available.
                  </p>
                </div>
              </div>
            ) : null}

            <ProgressWidgets data={progress} />

            <div className="dashboard-content-grid">
              <ScoreTrend
                title="Resume analysis history"
                kicker="Resume Studio"
                description="Your five most recent stored analysis scores in this period."
                emptyTitle="No analysis history in this period"
                emptyDescription="Resume analysis scores will form this history."
                points={resumeTrend}
              />
              <ScoreTrend
                title="Interview progress"
                kicker="Interview Coach"
                description="Your five most recent completed feedback scores in this period."
                emptyTitle="No Interview feedback in this period"
                emptyDescription="Completed feedback will form this progress view."
                points={interviewTrend}
              />
              <LearningSummary data={progress.learning} />
              <ScoreTrend
                title="Quiz performance"
                kicker="Learning Workspace"
                description="Your five most recent completed Quiz scores in this period."
                emptyTitle="No Quiz results in this period"
                emptyDescription="Completed Quiz attempts will appear here."
                points={quizTrend}
              />
            </div>
          </>
        ) : null}
      </section>

      <section
        className="dashboard-activity-section"
        aria-label="Dashboard activity"
      >
        {!activity && activityLoading ? (
          <DashboardSkeleton label="Loading activity" compact />
        ) : null}

        {activityError ? (
          <ErrorState
            error={activityError}
            retryLabel="Retry activity"
            onRetry={() => setActivityRetry((value) => value + 1)}
          />
        ) : null}

        {activity ? (
          <ActivityFeed
            events={activityMatchesRequest ? activity.events : []}
            pagination={activityPagination}
            currentPage={activityPage}
            refreshing={activityLoading || !activityMatchesRequest}
            expanded={activityExpanded}
            onExpand={() => {
              setActivityPage(1);
              setActivityExpanded(true);
            }}
            onCollapse={() => {
              setActivityExpanded(false);
              setActivityPage(1);
            }}
            onPrevious={() =>
              setActivityPage((page) => Math.max(1, page - 1))
            }
            onNext={() =>
              setActivityPage((page) =>
                Math.min(
                  Math.max(1, activityPagination.pages),
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
