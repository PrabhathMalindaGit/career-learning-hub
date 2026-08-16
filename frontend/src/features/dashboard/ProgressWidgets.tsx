import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { dashboardScorePresentation } from "./dashboardScorePresentation";
import type { DashboardProgress } from "./types";

interface ProgressWidgetsProps {
  data: DashboardProgress;
}

function scoreLabel(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
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
  score,
  action,
}: {
  className: string;
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  score: number | null;
  action?: {
    label: string;
    to: string;
  };
}) {
  const interpretation =
    score === null ? null : dashboardScorePresentation(score);

  return (
    <article className={`dashboard-metric ${className}`}>
      <div className="dashboard-metric__heading">
        {icon}
        <p>{label}</p>
      </div>
      <strong>{value}</strong>
      {interpretation ? (
        <span
          className={`dashboard-metric__interpretation dashboard-metric__interpretation--${interpretation.level}`}
        >
          {interpretation.label}
        </span>
      ) : null}
      <small>{detail}</small>
      {action ? (
        <Link className="dashboard-metric__action" to={action.to}>
          {action.label}
        </Link>
      ) : null}
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
  const resumeAverage = data.resumeReadiness.averageScoreInWindow;
  const interviewAverage = data.interviews.averageFeedbackScore;
  const quizAverage = data.learning.quizPerformance.averageScore;

  return (
    <>
      <section
        className="dashboard-performance-metrics"
        aria-label="Performance summary"
      >
        <Metric
          className="dashboard-metric--resume"
          label="Resume performance"
          value={scoreLabel(resumeAverage)}
          score={resumeAverage}
          detail={
            resumeAverage === null
              ? "No Resume analysis in this period."
              : `${countLabel(
                  data.resumeReadiness.analysesInWindow,
                  "analysis",
                  "analyses",
                )} across ${countLabel(
                  data.resumeReadiness.analyzedResumesInWindow,
                  "resume",
                )}`
          }
          action={
            resumeAverage === null
              ? { label: "Analyze a Resume", to: "/resumes" }
              : undefined
          }
          icon={
            <MetricIcon>
              <path d="M6 3h9l3 3v15H6z" />
              <path d="M9 11h6M9 15h6M9 7h3" />
            </MetricIcon>
          }
        />
        <Metric
          className="dashboard-metric--interview"
          label="Interview feedback"
          value={scoreLabel(interviewAverage)}
          score={interviewAverage}
          detail={
            interviewAverage === null
              ? "No scored feedback in this period."
              : `${data.interviews.feedbackCompletedInWindow} scored of ${countLabel(
                  data.interviews.attemptsInWindow,
                  "attempt",
                )}`
          }
          action={
            interviewAverage === null
              ? {
                  label: "Practice interview",
                  to: "/interviews?action=create",
                }
              : undefined
          }
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
          value={scoreLabel(quizAverage)}
          score={quizAverage}
          detail={
            quizAverage === null
              ? "No Quiz results in this period."
              : `${data.learning.quizPerformance.totalCorrectAnswers} of ${countLabel(
                  data.learning.quizPerformance.totalQuestionsAnswered,
                  "answer",
                )} correct`
          }
          action={
            quizAverage === null
              ? { label: "Open Learning", to: "/learning" }
              : undefined
          }
          icon={
            <MetricIcon>
              <path d="m4 6 8-3 8 3-8 3z" />
              <path d="M6 8v7c3 3 9 3 12 0V8" />
            </MetricIcon>
          }
        />
      </section>

      <article className="dashboard-readiness-card dashboard-readiness-card--compact">
        <header>
          <div>
            <p className="dashboard-kicker">Resume Studio</p>
            <h2>Latest Resume readiness</h2>
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
                Recorded {new Date(latest.createdAt).toLocaleDateString()}
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
              <p>Create and analyze a Resume to record readiness here.</p>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
