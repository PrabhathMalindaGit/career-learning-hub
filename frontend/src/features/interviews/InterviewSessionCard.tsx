import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { InterviewDeleteDialog } from "./InterviewDeleteDialog";
import { updateInterviewSessionStatus } from "./interviewApi";
import type {
  InterviewMode,
  InterviewSessionStatus,
  InterviewSessionSummary,
} from "./types";

const modeLabels: Record<InterviewMode, string> = {
  study: "Study",
  "written-practice": "Written practice",
  "mock-interview": "Mock interview",
};

const statusLabels: Record<InterviewSessionStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

function roleInitials(role: string): string {
  return role
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join("");
}

function differsMeaningfully(title: string, role: string): boolean {
  return title.trim().toLocaleLowerCase() !== role.trim().toLocaleLowerCase();
}

export function InterviewSessionCard({
  session,
  onDeleted = () => undefined,
}: {
  session: InterviewSessionSummary;
  onDeleted?(sessionId: string): void;
}) {
  const navigate = useNavigate();
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const updatedLabel = new Date(session.updatedAt).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  async function restoreSession() {
    if (restoreBusy || session.status !== "archived") return;
    const controller = new AbortController();
    setRestoreBusy(true);
    setRestoreError(null);
    try {
      await updateInterviewSessionStatus(
        session.id,
        "active",
        controller.signal,
      );
      navigate(`/interviews/${session.id}`);
    } catch (error) {
      setRestoreError(
        error instanceof ApiError
          ? error.message
          : "The archived session could not be restored. Try again.",
      );
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <li
      className={`interview-session-card interview-session-card--${session.status}`}
    >
      <div className="interview-session-card__identity" aria-hidden="true">
        <span>{roleInitials(session.targetRole)}</span>
      </div>
      <div className="interview-session-card__body">
        <div className="interview-session-card__heading">
          <div>
            <h3>{session.targetRole}</h3>
            {differsMeaningfully(session.title, session.targetRole) ? (
              <p className="interview-session-card__title">
                {session.title}
              </p>
            ) : null}
          </div>
          <span
            className={`interview-lifecycle interview-lifecycle--${session.status}`}
          >
            {statusLabels[session.status]}
          </span>
        </div>

        <div
          className="interview-session-card__metadata"
          aria-label="Session details"
        >
          <span>{session.experienceLevel}</span>
          <span>{modeLabels[session.mode]}</span>
        </div>

        {restoreError ? (
          <p className="interview-field-error" role="alert">
            {restoreError}
          </p>
        ) : null}

        <div className="interview-session-card__footer">
          <div
            className="interview-session-card__count"
            aria-label={`${session.questionCount} ${
              session.questionCount === 1 ? "question" : "questions"
            }`}
          >
            <strong>{session.questionCount}</strong>
            <span>
              {session.questionCount === 1 ? "question" : "questions"}
            </span>
          </div>
          <p className="interview-session-card__updated">
            <span>Last updated</span>
            <time dateTime={session.updatedAt}>{updatedLabel}</time>
          </p>
          {session.status === "archived" ? (
            <button
              type="button"
              className="interview-secondary-button"
              disabled={restoreBusy}
              onClick={() => void restoreSession()}
            >
              {restoreBusy ? "Restoring…" : "Restore session"}
            </button>
          ) : null}
          <InterviewDeleteDialog session={session} onDeleted={onDeleted} />
          <Link
            className="interview-session-card__action"
            to={`/interviews/${session.id}`}
            aria-label={`Open ${session.title}`}
          >
            Open session
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
