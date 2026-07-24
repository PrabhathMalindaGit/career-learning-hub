import type { InterviewAttempt } from "./types";

interface AttemptHistoryProps {
  attempts: InterviewAttempt[];
  onRequestFeedback?(attemptId: string): void;
}

export function AttemptHistory({
  attempts,
  onRequestFeedback,
}: AttemptHistoryProps) {
  return (
    <section
      className="interview-panel"
      aria-labelledby="attempt-history-title"
    >
      <header className="interview-panel-header">
        <div>
          <p className="interview-kicker">Progress</p>
          <h3 id="attempt-history-title">Attempt history</h3>
        </div>
        <span className="interview-chip">
          {attempts.length}
        </span>
      </header>

      <div className="interview-attempt-list">
        {attempts.length === 0 ? (
          <div className="interview-empty-state">
            Written attempts and feedback will appear here.
          </div>
        ) : (
          attempts.map((attempt) => (
            <article
              className="interview-attempt-card"
              key={attempt._id}
            >
              <div>
                <strong>
                  {new Date(attempt.createdAt).toLocaleString()}
                </strong>
                <span>{attempt.status}</span>
              </div>

              <p>{attempt.answerText}</p>

              {attempt.feedback ? (
                <div className="interview-feedback">
                  <b>{attempt.feedback.score}/100</b>
                  <p>{attempt.feedback.summary}</p>
                </div>
              ) : (
                <button
                  type="button"
                  className="interview-secondary-button"
                  disabled={
                    attempt.status === "feedback-queued" ||
                    attempt.status === "feedback-processing"
                  }
                  onClick={() =>
                    onRequestFeedback?.(attempt._id)
                  }
                >
                  Request AI feedback
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
