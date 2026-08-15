import { useEffect, useId, useRef, useState, type RefObject } from "react";
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
  open,
  returnFocusRef,
  onRequestClose,
  onDeleted,
}: {
  session: Pick<InterviewSessionSummary, "id" | "title" | "targetRole">;
  open: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  onRequestClose(): void;
  onDeleted(sessionId: string): void;
}) {
  const headingId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SafeError | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    setConfirmation("");
    setError(null);
  }, [open]);

  function close() {
    if (busy) return;
    setConfirmation("");
    setError(null);
    onRequestClose();
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
      setConfirmation("");
      onRequestClose();
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
    <Dialog
      open={open}
      labelledBy={headingId}
      describedBy={descriptionId}
      initialFocusRef={inputRef}
      returnFocusRef={returnFocusRef}
      onCancel={close}
      canDismissOnEscape={!busy}
      className="interview-delete-dialog"
    >
      <form className="interview-delete-form" onSubmit={submit}>
        <div className="interview-delete-heading">
          <span className="interview-delete-warning-mark" aria-hidden="true">
            !
          </span>
          <div>
            <p className="interview-kicker">Permanent action</p>
            <h2 id={headingId}>Delete “{session.title}”?</h2>
          </div>
        </div>

        <div id={descriptionId} className="interview-delete-warning">
          <p>
            This permanently removes the interview session
            {session.targetRole ? ` for ${session.targetRole}` : ""}, its
            generated questions, and Saved Attempts / Attempt History.
          </p>
          <p className="interview-delete-resume-note">
            The Resume used to create this session is not deleted.
          </p>
          <p className="interview-delete-irreversible">
            This action cannot be undone.
          </p>
        </div>

        <label className="interview-delete-confirmation">
          <span>
            Type <strong>{session.title}</strong> exactly to confirm
          </span>
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
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
