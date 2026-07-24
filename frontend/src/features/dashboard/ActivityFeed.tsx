import type { DashboardActivityItem } from "./types";

interface ActivityFeedProps {
  events: DashboardActivityItem[];
}

const activityLabels: Record<string, string> = {
  "resume.created": "Resume created",
  "resume.version.created": "Resume version saved",
  "resume.analysis.completed": "Resume analysis completed",
  "resume.rewrites.applied": "Resume rewrites applied",
  "interview.session.created": "Interview session created",
  "interview.session.completed": "Interview session completed",
  "interview.attempt.recorded": "Interview attempt recorded",
  "interview.attempt.feedback.completed":
    "Interview feedback completed",
  "learning.document.uploaded": "Learning document uploaded",
  "learning.document.processed": "Learning document processed",
  "learning.document.deleted": "Learning document deleted",
  "learning.flashcards.generated": "Flashcards generated",
  "learning.quiz.generated": "Quiz generated",
  "learning.chat.response.generated": "Document chat response generated",
  "quiz.completed": "Quiz completed",
};

function displayLabel(type: string): string {
  return (
    activityLabels[type] ??
    type
      .split(/[._-]/)
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join(" ")
  );
}

function metadataSummary(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) return null;

  const details: string[] = [];

  if (typeof metadata.scorePercent === "number") {
    details.push(`${metadata.scorePercent}%`);
  }
  if (typeof metadata.totalScore === "number") {
    details.push(`${metadata.totalScore}%`);
  }
  if (typeof metadata.cardCount === "number") {
    details.push(`${metadata.cardCount} cards`);
  }
  if (typeof metadata.questionCount === "number") {
    details.push(`${metadata.questionCount} questions`);
  }
  if (typeof metadata.pageCount === "number") {
    details.push(`${metadata.pageCount} pages`);
  }
  if (typeof metadata.chunkCount === "number") {
    details.push(`${metadata.chunkCount} chunks`);
  }

  return details.length > 0 ? details.join(" · ") : null;
}

export function ActivityFeed({
  events,
}: ActivityFeedProps) {
  return (
    <section
      className="dashboard-panel"
      aria-labelledby="activity-feed-title"
    >
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Recorded events</p>
          <h3 id="activity-feed-title">Recent activity</h3>
        </div>
        <span className="dashboard-chip">{events.length}</span>
      </header>

      <div className="dashboard-activity-list">
        {events.length === 0 ? (
          <div className="dashboard-empty-state">
            No recorded activity is available yet.
          </div>
        ) : (
          events.map((event) => {
            const details = metadataSummary(event.metadata);

            return (
              <article
                className="dashboard-activity-item"
                key={event.id}
              >
                <span
                  className={`dashboard-activity-origin dashboard-origin-${event.origin}`}
                  aria-hidden="true"
                />

                <div>
                  <strong>{displayLabel(event.type)}</strong>
                  <p>
                    {new Date(event.occurredAt).toLocaleString()}
                    {details ? ` · ${details}` : ""}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
