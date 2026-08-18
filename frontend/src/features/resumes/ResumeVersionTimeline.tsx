import type { CSSProperties } from "react";
import type {
  Pagination,
  ResumeVersionMetadata,
  ResumeSource,
} from "./types";

type HistoryFailure = {
  message: string;
  requestId?: string;
};

type ResumeVersionTimelineProps = {
  versions: ResumeVersionMetadata[];
  currentVersionId?: string;
  selectedVersionId?: string;
  loadingVersionId?: string;
  loading: boolean;
  failure?: HistoryFailure;
  pagination?: Pagination;
  page: number;
  onView: (version: ResumeVersionMetadata) => void;
  onRetry: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function sourceLabel(source: unknown): string {
  switch (source) {
    case "manual":
      return "Manual edit";
    case "pdf-import":
      return "PDF import";
    case "ai-rewrite":
      return "AI suggestions";
    case "duplicate":
      return "Duplicated resume";
    default:
      return "Other source";
  }
}

function sourceTone(source: unknown): string {
  switch (source) {
    case "manual":
      return "manual";
    case "pdf-import":
      return "import";
    case "ai-rewrite":
      return "ai";
    case "duplicate":
      return "duplicate";
    default:
      return "unknown";
  }
}

function SourceIcon({ source }: { source: unknown }) {
  if (source === "pdf-import") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.5h7l3 3V20H7z" />
        <path d="M14 3.5V7h3M9.5 11h5M9.5 14h5M9.5 17h3" />
      </svg>
    );
  }
  if (source === "ai-rewrite") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3zM18.2 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7zM6.4 14.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z" />
      </svg>
    );
  }
  if (source === "duplicate") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="7" width="10" height="12" rx="1.5" />
        <path d="M15 7V5H6v11h2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 18.5 2.7-.6L18 7.6a1.8 1.8 0 0 0-2.6-2.6L5.1 15.3zM13.8 6.6l2.6 2.6M9 19h10" />
    </svg>
  );
}

function formatSavedAt(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

export function ResumeVersionSourceBadge({
  source,
}: {
  source: ResumeSource | unknown;
}) {
  return (
    <span
      className={`resume-version-source resume-version-source--${sourceTone(
        source,
      )}`}
    >
      <span className="resume-version-source-icon">
        <SourceIcon source={source} />
      </span>
      {sourceLabel(source)}
    </span>
  );
}

function VersionTimelineSkeleton() {
  return (
    <div
      className="resume-version-loading"
      role="status"
      aria-label="Loading version history"
    >
      <span>Loading version history…</span>
      <div className="resume-version-skeleton-list" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="resume-version-skeleton" key={index}>
            <span className="resume-version-skeleton-marker" />
            <span className="resume-version-skeleton-title" />
            <span className="resume-version-skeleton-meta" />
            <span className="resume-version-skeleton-action" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Feature 3.11 — Immutable Resume version-history timeline and read-only saved snapshots.
export function ResumeVersionTimeline({
  versions,
  currentVersionId,
  selectedVersionId,
  loadingVersionId,
  loading,
  failure,
  pagination,
  page,
  onView,
  onRetry,
  onPreviousPage,
  onNextPage,
}: ResumeVersionTimelineProps) {
  return (
    /* =========================================================
       FIND: VERSION HISTORY
       TYPE: UI
       FILE: frontend/src/features/resumes/ResumeVersionTimeline.tsx
       STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
       STYLE SELECTOR: .resume-version-history
       ========================================================= */
    <section
      className="resume-version-history"
      aria-labelledby="resume-version-history-title"
    >
      <header className="resume-version-history-header">
        <div>
          <p className="resume-kicker">Immutable timeline</p>
          {/* Feature 3.11 UI — Immutable Resume version history. */}
          <h2 id="resume-version-history-title">Version history</h2>
          <p className="resume-version-history-intro">
            Review saved milestones without changing your active draft.
          </p>
        </div>
        {pagination && pagination.total > 0 ? (
          <span className="resume-version-count">
            {pagination.total} saved{" "}
            {pagination.total === 1 ? "version" : "versions"}
          </span>
        ) : null}
      </header>

      {loading ? (
        <VersionTimelineSkeleton />
      ) : failure ? (
        <div className="resume-version-failure" role="alert">
          <span className="resume-version-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 8v5M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <div>
            <h3>Version history could not be loaded</h3>
            <p>{failure.message}</p>
            {failure.requestId ? (
              <small>Request ID: {failure.requestId}</small>
            ) : null}
          </div>
          <button
            type="button"
            className="resume-version-action"
            onClick={onRetry}
          >
            Retry history
          </button>
        </div>
      ) : versions.length === 0 ? (
        <div className="resume-version-empty">
          <span className="resume-version-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 3.5h7l3 3V20H7z" />
              <path d="M14 3.5V7h3M10 12h4M10 15h4" />
            </svg>
          </span>
          <div>
            <h3>No saved versions yet</h3>
            <p>
              New saved versions will appear here as an immutable timeline.
            </p>
          </div>
        </div>
      ) : (
        <ol className="resume-version-timeline">
          {versions.map((version, index) => {
            const isCurrent = version.id === currentVersionId;
            const isSelected = version.id === selectedVersionId;
            const isLoading = version.id === loadingVersionId;
            const summary = version.changeSummary?.trim();
            const actionLabel = isLoading
              ? `Loading saved version ${version.versionNumber}`
              : isSelected
                ? `Viewing saved version ${version.versionNumber}`
                : isCurrent
                  ? `View current saved version ${version.versionNumber}`
                  : `View saved version ${version.versionNumber}`;

            return (
              <li
                className={`resume-version-item${
                  isCurrent ? " resume-version-item--current" : ""
                }${isSelected ? " resume-version-item--selected" : ""}`}
                style={{ "--resume-version-order": index } as CSSProperties}
                key={version.id}
              >
                <div className="resume-version-marker" aria-hidden="true">
                  <span>{version.versionNumber}</span>
                </div>
                <article className="resume-version-card">
                  <div className="resume-version-card-copy">
                    <div className="resume-version-title-row">
                      <h3>Version {version.versionNumber}</h3>
                      {isCurrent ? (
                        <span className="resume-version-current-label">
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="m3 8 3 3 7-7" />
                          </svg>
                          Current version
                        </span>
                      ) : (
                        <span className="resume-version-historical-label">
                          Historical
                        </span>
                      )}
                    </div>
                    <div className="resume-version-metadata">
                      <ResumeVersionSourceBadge source={version.source} />
                      <time dateTime={version.createdAt}>
                        Saved {formatSavedAt(version.createdAt)}
                      </time>
                    </div>
                    {summary ? (
                      <p className="resume-version-summary">{summary}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="resume-version-action"
                    disabled={isSelected || isLoading}
                    aria-busy={isLoading || undefined}
                    aria-label={actionLabel}
                    onClick={() => onView(version)}
                  >
                    {isLoading
                      ? "Loading…"
                      : isSelected
                        ? "Viewing"
                        : isCurrent
                          ? "Review saved draft"
                          : "Review snapshot"}
                    {!isLoading && !isSelected ? (
                      <svg viewBox="0 0 18 18" aria-hidden="true">
                        <path d="m7 4 5 5-5 5" />
                      </svg>
                    ) : null}
                  </button>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {pagination && pagination.pages > 1 ? (
        <nav className="resume-pagination" aria-label="Version pages">
          <button
            type="button"
            className="resume-version-action"
            disabled={loading || page <= 1}
            onClick={onPreviousPage}
          >
            Previous versions
          </button>
          <span>
            Version page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="resume-version-action"
            disabled={loading || page >= pagination.pages}
            onClick={onNextPage}
          >
            Next versions
          </button>
        </nav>
      ) : null}
    </section>
  );
}
