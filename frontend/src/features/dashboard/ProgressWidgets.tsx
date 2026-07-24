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

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="dashboard-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function ProgressWidgets({
  data,
}: ProgressWidgetsProps) {
  return (
    <section
      className="dashboard-metric-grid"
      aria-label="Recorded progress metrics"
    >
      <Metric
        label="Resume readiness"
        value={
          data.resumeReadiness.latest
            ? `${Math.round(
                data.resumeReadiness.latest.score,
              )}%`
            : "Unavailable"
        }
        detail={`${countLabel(
          data.resumeReadiness.analysesInWindow,
          "analysis",
          "analyses",
        )} across ${countLabel(
          data.resumeReadiness.analyzedResumesInWindow,
          "resume",
        )}`}
      />
      <Metric
        label="Interview feedback"
        value={scoreLabel(
          data.interviews.averageFeedbackScore,
        )}
        detail={`${data.interviews.feedbackCompletedInWindow} scored of ${countLabel(
          data.interviews.attemptsInWindow,
          "attempt",
        )}`}
      />
      <Metric
        label="Quiz performance"
        value={scoreLabel(
          data.learning.quizPerformance.averageScore,
        )}
        detail={`${data.learning.quizPerformance.totalCorrectAnswers} of ${countLabel(
          data.learning.quizPerformance.totalQuestionsAnswered,
          "answer",
        )} correct`}
      />
      <Metric
        label="AI usage"
        value={countLabel(data.aiUsage.requestCount, "request")}
        detail={`${data.aiUsage.successCount} successful · ${data.aiUsage.failureCount} failed`}
      />
    </section>
  );
}
