import type { DashboardOverview } from "./types";

interface ProgressWidgetsProps {
  data: DashboardOverview;
}

function scoreLabel(value: number | null): string {
  return value === null ? "No data" : `${Math.round(value)}%`;
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "purple" | "blue" | "amber";
}) {
  return (
    <article className={`dashboard-metric dashboard-tone-${tone}`}>
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
      <MetricCard
        label="Resume readiness"
        value={
          data.resumeReadiness.latest
            ? `${data.resumeReadiness.latest.score}%`
            : "No analysis"
        }
        detail={
          data.resumeReadiness.latest
            ? `${data.resumeReadiness.latest.targetRole} · ${data.resumeReadiness.analysesInWindow} analyses in window`
            : "Run a resume analysis to establish a score."
        }
        tone="green"
      />

      <MetricCard
        label="Interview feedback"
        value={scoreLabel(
          data.interviews.averageFeedbackScore,
        )}
        detail={`${data.interviews.feedbackCompletedInWindow} scored attempts · ${data.interviews.attemptsInWindow} total attempts`}
        tone="purple"
      />

      <MetricCard
        label="Quiz performance"
        value={scoreLabel(
          data.learning.quizPerformance.averageScore,
        )}
        detail={`${data.learning.quizPerformance.totalCorrectAnswers}/${data.learning.quizPerformance.totalQuestionsAnswered} recorded answers correct`}
        tone="blue"
      />

      <MetricCard
        label="AI usage"
        value={String(data.aiUsage.requestCount)}
        detail={`${data.aiUsage.successCount} successful · ${data.aiUsage.failureCount} failed requests`}
        tone="amber"
      />
    </section>
  );
}
