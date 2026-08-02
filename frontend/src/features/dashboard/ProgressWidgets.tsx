import type { ReactNode } from "react";
import type { DashboardProgress } from "./types";

interface ProgressWidgetsProps {
  data: DashboardProgress;
}

function scoreLabel(value: number | null): string {
  return value === null ? "Unavailable" : `${Math.round(value)}%`;
}

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function MetricIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="dashboard-metric__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {children}
      </svg>
    </span>
  );
}

function Metric({
  className,
  label,
  value,
  detail,
  icon,
}: {
  className: string;
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className={`dashboard-metric ${className}`}>
      <div className="dashboard-metric__heading">
        {icon}
        <p>{label}</p>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ReadinessGauge({
  score,
}: {
  score: number;
}) {
  const safeScore = Math.max(0, Math.min(100, score));
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (safeScore / 100) * circumference;

  return (
    <div
      className="dashboard-readiness-gauge"
      role="meter"
      aria-label={`Resume readiness: ${safeScore} out of 100`}
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle
          className="dashboard-readiness-gauge__track"
          cx="80"
          cy="80"
          r={radius}
        />
        <circle
          className="dashboard-readiness-gauge__value"
          cx="80"
          cy="80"
          r={radius}
          pathLength={circumference}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>
        <strong>{Math.round(safeScore)}%</strong>
        <small>out of 100</small>
      </span>
    </div>
  );
}

export function ProgressWidgets({
  data,
}: ProgressWidgetsProps) {
  const latest = data.resumeReadiness.latest;

  return (
    <section
      className="dashboard-progress-composition"
      aria-label="Recorded progress metrics"
    >
      <article className="dashboard-readiness-card">
        <header>
          <div>
            <p className="dashboard-kicker">Resume Studio</p>
            <h2>Resume readiness</h2>
          </div>
          <span className="dashboard-chip">
            {countLabel(
              data.resumeReadiness.analysesInWindow,
              "analysis",
              "analyses",
            )}
          </span>
        </header>

        {latest ? (
          <div className="dashboard-readiness-card__body">
            <ReadinessGauge score={Math.round(latest.score)} />
            <div className="dashboard-readiness-card__details">
              <p>Latest analysis for</p>
              <strong>{latest.targetRole}</strong>
              <small>
                {countLabel(
                  data.resumeReadiness.analysesInWindow,
                  "analysis",
                  "analyses",
                )}{" "}
                across{" "}
                {countLabel(
                  data.resumeReadiness.analyzedResumesInWindow,
                  "resume",
                )}
              </small>
              <dl>
                <div>
                  <dt>Keyword match</dt>
                  <dd>{latest.scoreBreakdown.keywordMatch} / 25</dd>
                </div>
                <div>
                  <dt>Clarity</dt>
                  <dd>{latest.scoreBreakdown.clarity} / 25</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{latest.scoreBreakdown.evidence} / 25</dd>
                </div>
                <div>
                  <dt>Formatting</dt>
                  <dd>{latest.scoreBreakdown.formatting} / 25</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="dashboard-empty-state dashboard-empty-state--feature">
            <span className="dashboard-empty-state__icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <strong>No Resume analysis yet</strong>
              <p>
                Create and analyze a Resume to record readiness here.
              </p>
            </div>
          </div>
        )}
      </article>

      <div className="dashboard-metric-stack">
        <Metric
          className="dashboard-metric--interview"
          label="Interview feedback"
          value={scoreLabel(data.interviews.averageFeedbackScore)}
          detail={`${data.interviews.feedbackCompletedInWindow} scored of ${countLabel(
            data.interviews.attemptsInWindow,
            "attempt",
          )}`}
          icon={
            <MetricIcon>
              <path d="M4 5h16v11H9l-5 4z" />
              <path d="M8 9h8M8 12h5" />
            </MetricIcon>
          }
        />
        <Metric
          className="dashboard-metric--learning"
          label="Quiz performance"
          value={scoreLabel(
            data.learning.quizPerformance.averageScore,
          )}
          detail={`${data.learning.quizPerformance.totalCorrectAnswers} of ${countLabel(
            data.learning.quizPerformance.totalQuestionsAnswered,
            "answer",
          )} correct`}
          icon={
            <MetricIcon>
              <path d="m4 6 8-3 8 3-8 3z" />
              <path d="M6 8v7c3 3 9 3 12 0V8" />
            </MetricIcon>
          }
        />
        <Metric
          className="dashboard-metric--usage"
          label="AI usage"
          value={countLabel(data.aiUsage.requestCount, "request")}
          detail={`${data.aiUsage.successCount} successful · ${data.aiUsage.failureCount} failed`}
          icon={
            <MetricIcon>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              <path d="m5.6 5.6 2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
              <circle cx="12" cy="12" r="3.5" />
            </MetricIcon>
          }
        />
      </div>
    </section>
  );
}
