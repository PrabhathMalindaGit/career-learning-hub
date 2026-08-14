import { useEffect, useRef, useState } from "react";
import { phaseLabel, type SafeJob } from "./jobResilience";

interface JobResilienceActionsProps {
  job: SafeJob;
  onCancel?: (signal: AbortSignal) => Promise<unknown>;
  onRetry?: (signal: AbortSignal) => Promise<unknown>;
}

function actionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The job action could not be completed.";
}

export function JobResilienceActions({
  job,
  onCancel,
  onRetry,
}: JobResilienceActionsProps) {
  const [busyAction, setBusyAction] = useState<"cancel" | "retry">();
  const busyActionRef = useRef(false);
  const actionController = useRef<AbortController | undefined>(undefined);
  const [error, setError] = useState<string>();
  useEffect(() => () => actionController.current?.abort(), []);
  const canCancel =
    (job.status === "queued" || job.status === "processing") &&
    job.phase !== "persisting" &&
    onCancel !== undefined;
  const canRetry = job.canRetry && onRetry !== undefined;
  const statusMessage =
    job.status === "completed" && job.type === "interview.questions.generate"
      ? "✓ Questions generated successfully"
      : job.status === "completed" && job.type === "interview.question.explain"
        ? "✓ Explanation ready"
        : phaseLabel(job.phase);

  async function runAction(
    action: "cancel" | "retry",
    handler: (signal: AbortSignal) => Promise<unknown>,
  ): Promise<void> {
    if (busyActionRef.current) return;
    busyActionRef.current = true;
    setBusyAction(action);
    setError(undefined);
    const controller = new AbortController();
    actionController.current = controller;
    try {
      await handler(controller.signal);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(actionErrorMessage(caught));
    } finally {
      if (controller.signal.aborted) return;
      if (actionController.current === controller) {
        actionController.current = undefined;
      }
      busyActionRef.current = false;
      setBusyAction(undefined);
    }
  }

  return (
    <div
      className="job-resilience-actions"
      data-job-type={job.type}
      data-job-status={job.status}
    >
      <p role="status" aria-live="polite">
        {statusMessage}
      </p>
      <div className="job-resilience-actions__buttons">
        {canCancel ? (
          <button
            type="button"
            className="button button--secondary"
            disabled={busyAction !== undefined}
            aria-busy={busyAction === "cancel"}
            onClick={() => void runAction("cancel", onCancel)}
          >
            Cancel
          </button>
        ) : null}
        {canRetry ? (
          <button
            type="button"
            className="button button--secondary"
            disabled={busyAction !== undefined}
            aria-busy={busyAction === "retry"}
            onClick={() => void runAction("retry", onRetry)}
          >
            Retry
          </button>
        ) : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
