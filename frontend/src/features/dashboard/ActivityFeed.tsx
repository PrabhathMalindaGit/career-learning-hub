import type {
  DashboardActivityItem,
  DashboardActivityPage,
} from "./types";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";

interface ActivityFeedProps {
  events: DashboardActivityItem[];
  pagination: DashboardActivityPage["pagination"];
  currentPage: number;
  refreshing: boolean;
  onPrevious(): void;
  onNext(): void;
}

const activityLabels: Readonly<Record<string, string>> = {
  "asset.created": "Asset created",
  "asset.deleted": "Asset deleted",
  "resume.created": "Resume created",
  "resume.version.created": "Resume version saved",
  "resume.design.updated": "Resume design updated",
  "resume.pdf.imported": "Resume PDF imported",
  "resume.analysis.completed": "Resume analysis completed",
  "resume.rewrites.applied": "Resume rewrites applied",
  "interview.session.created": "Interview session created",
  "interview.session.completed": "Interview session completed",
  "interview.question.created": "Interview question created",
  "interview.questions.generated": "Interview questions generated",
  "interview.question.explained": "Interview question explained",
  "interview.attempt.recorded": "Interview attempt recorded",
  "interview.attempt.feedback.completed":
    "Interview feedback completed",
  "learning.document.uploaded": "Learning document uploaded",
  "learning.document.processed": "Learning document processed",
  "learning.document.deleted": "Learning document deleted",
  "learning.flashcards.generated": "Flashcards generated",
  "learning.quiz.generated": "Quiz generated",
  "learning.chat.response.generated":
    "Document chat response generated",
  "quiz.completed": "Quiz completed",
};

function activityLabel(type: string): string {
  return activityLabels[type] ?? "Recorded activity";
}

export function ActivityFeed({
  events,
  pagination,
  currentPage,
  refreshing,
  onPrevious,
  onNext,
}: ActivityFeedProps) {
  const totalPages = Math.max(1, pagination.pages);

  return (
    <section
      className="dashboard-panel dashboard-activity-panel"
      aria-labelledby="activity-feed-title"
    >
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Chronological record</p>
          <h2 id="activity-feed-title">Recent activity</h2>
        </div>
        <span className="dashboard-chip">
          {pagination.total} total
        </span>
      </header>

      {refreshing && events.length > 0 ? (
        <p className="dashboard-refresh-status" role="status">
          Updating activity
        </p>
      ) : null}

      <div className="dashboard-activity-list">
        {refreshing && events.length === 0 ? (
          <StateSurface
            mode="status"
            className="dashboard-loading-page"
            body="Loading selected activity page"
          />
        ) : events.length === 0 ? (
          <StateSurface
            mode="static"
            className="dashboard-empty-state"
            body="No recorded activity is available."
          />
        ) : (
          events.map((event) => (
            <article
              className="dashboard-activity-item"
              key={event.id}
            >
              <span
                className={`dashboard-activity-origin dashboard-origin-${event.origin}`}
                aria-hidden="true"
              />
              <div>
                <strong>{activityLabel(event.type)}</strong>
                <p>
                  {new Date(event.occurredAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <Pager
        className="dashboard-pagination"
        label="Activity pagination"
        currentPage={`Page ${currentPage} of ${totalPages}`}
        previousLabel="Previous"
        nextLabel="Next"
        previousAriaLabel="Previous activity page"
        nextAriaLabel="Next activity page"
        previousDisabled={currentPage <= 1}
        nextDisabled={
          pagination.pages === 0 || currentPage >= pagination.pages
        }
        busy={refreshing}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </section>
  );
}
