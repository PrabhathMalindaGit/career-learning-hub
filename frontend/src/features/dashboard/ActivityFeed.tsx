import type { CSSProperties } from "react";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import type {
  DashboardActivityItem,
  DashboardActivityPage,
} from "./types";

interface ActivityFeedProps {
  events: DashboardActivityItem[];
  pagination: DashboardActivityPage["pagination"];
  currentPage: number;
  refreshing: boolean;
  expanded: boolean;
  onExpand(): void;
  onCollapse(): void;
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
  "interview.questions.generated": "Interview questions created",
  "interview.question.explained": "Interview guidance created",
  "interview.attempt.recorded": "Interview attempt recorded",
  "interview.attempt.feedback.completed": "Interview feedback completed",
  "learning.document.uploaded": "Learning document uploaded",
  "learning.document.processed": "Learning document processed",
  "learning.document.deleted": "Learning document deleted",
  "learning.flashcards.generated": "Flashcards created",
  "learning.quiz.generated": "Quiz created",
  "learning.chat.response.generated": "Learning chat answered",
  "quiz.completed": "Quiz completed",
};

function activityLabel(type: string): string {
  return activityLabels[type] ?? "Recorded activity";
}

function activityModule(type: string): string {
  if (type.startsWith("resume.")) {
    return "Resume Studio";
  }
  if (type.startsWith("interview.")) {
    return "Interview Coach";
  }
  if (
    type.startsWith("learning.") ||
    type.startsWith("quiz.")
  ) {
    return "Learning Workspace";
  }

  return "Career Learning Hub";
}

export function ActivityFeed({
  events,
  pagination,
  currentPage,
  refreshing,
  expanded,
  onExpand,
  onCollapse,
  onPrevious,
  onNext,
}: ActivityFeedProps) {
  const totalPages = Math.max(1, pagination.pages);
  const hasMoreActivity =
    pagination.pages > 1 || pagination.total > events.length;

  return (
    <section
      className="dashboard-panel dashboard-activity-panel"
      aria-labelledby="activity-feed-title"
    >
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Across your workspace</p>
          <h2 id="activity-feed-title">Recent activity</h2>
        </div>
        <span className="dashboard-chip">{pagination.total} total</span>
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
            heading={<strong>No recent activity yet</strong>}
            body="No recorded activity is available."
          />
        ) : (
          events.map((event, index) => (
            <article
              className="dashboard-activity-item"
              key={event.id}
              style={{
                "--dashboard-row-index": index,
              } as CSSProperties}
            >
              <span
                className={`dashboard-activity-origin dashboard-origin-${event.origin}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="7" />
                  <path d="M12 8v4l3 2" />
                </svg>
              </span>
              <div>
                <strong>{activityLabel(event.type)}</strong>
                <p>
                  {activityModule(event.type)} ·{" "}
                  {new Date(event.occurredAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      {!expanded && hasMoreActivity ? (
        <div className="dashboard-activity-disclosure">
          <button type="button" onClick={onExpand}>
            View all activity
          </button>
        </div>
      ) : null}

      {expanded ? (
        <div className="dashboard-activity-expanded-controls">
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
          <button
            className="dashboard-activity-collapse"
            type="button"
            onClick={onCollapse}
          >
            Show recent activity only
          </button>
        </div>
      ) : null}
    </section>
  );
}
