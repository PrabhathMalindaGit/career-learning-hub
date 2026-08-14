import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../api/apiClient";
import { Dialog } from "../../components/Dialog";
import { deleteInterviewSession } from "./interviewDeletionApi";
import type { InterviewSessionSummary } from "./types";
import "./interviewDeletion.css";

type SafeError = {
  message: string;
  requestId?: string;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    };
  }
  return { message: "The interview session could not be deleted. Try again." };
}

export function InterviewDeleteDialog({
  session,
  onDeleted,
}: {
  session: Pick<InterviewSessionSummary, "id" | "title" | "targetRole">;
  onDeleted(sessionId: string): void;
}) {
  const headingId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SafeError | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  function close() {
    if (busy) return;
    setOpen(false);
    setConfirmation("");
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmation !== session.title) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      await deleteInterviewSession(session.id, controller.signal);
      if (controller.signal.aborted) return;
      setOpen(false);
      setConfirmation("");
      onDeleted(session.id);
    } catch (nextError) {
      if (!controller.signal.aborted) setError(safeError(nextError));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="interview-danger-button interview-delete-trigger"
        onClick={() => {
          setConfirmation("");
          setError(null);
          setOpen(true);
        }}
      >
        Delete permanently
      </button>

      <Dialog
        open={open}
        labelledBy={headingId}
        describedBy={descriptionId}
        initialFocusRef={inputRef}
        returnFocusRef={triggerRef}
        onCancel={close}
        canDismissOnEscape={!busy}
        className="interview-delete-dialog"
      >
        <form className="interview-delete-form" onSubmit={submit}>
          <p className="interview-kicker">Permanent action</p>
          <h2 id={headingId}>Permanently delete interview session</h2>
          <div id={descriptionId} className="interview-delete-warning">
            <p>
              You are permanently deleting <strong>{session.title}</strong>
              {session.targetRole ? ` for ${session.targetRole}` : ""}.
            </p>
            <p>
              Questions and Saved Attempts / Attempt History will also be
              removed permanently.
            </p>
            <p>This deletion cannot be undone.</p>
          </div>

          <label className="interview-delete-confirmation">
            <span>Type the session title exactly to confirm</span>
            <input
              ref={inputRef}
              type="text"
              value={confirmation}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>

          {error ? (
            <div className="interview-field-error interview-delete-error" role="alert">
              <p>{error.message}</p>
              {error.requestId ? (
                <p className="request-id">Request ID: {error.requestId}</p>
              ) : null}
            </div>
          ) : null}

          <div className="interview-delete-actions">
            <button
              type="button"
              className="interview-secondary-button"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="interview-danger-button"
              disabled={busy || confirmation !== session.title}
            >
              {busy ? "Deleting…" : "Permanently delete session"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
