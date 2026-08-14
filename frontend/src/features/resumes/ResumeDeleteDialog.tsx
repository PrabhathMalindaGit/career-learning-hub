import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../api/apiClient";
import { Dialog } from "../../components/Dialog";
import { deleteResume } from "./resumeApi";
import type { ResumeRecord } from "./types";

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
  return { message: "The Resume could not be deleted. Try again." };
}

export function ResumeDeleteDialog({
  resume,
  onDeleted,
}: {
  resume: Pick<ResumeRecord, "id" | "title">;
  onDeleted(resumeId: string): void;
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
    if (busy || confirmation !== resume.title) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      await deleteResume(resume.id, controller.signal);
      if (controller.signal.aborted) return;
      setOpen(false);
      setConfirmation("");
      onDeleted(resume.id);
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
        className="resume-danger-button resume-record-delete-action"
        onClick={() => {
          setConfirmation("");
          setError(null);
          setOpen(true);
        }}
      >
        Delete resume
      </button>

      <Dialog
        open={open}
        labelledBy={headingId}
        describedBy={descriptionId}
        initialFocusRef={inputRef}
        returnFocusRef={triggerRef}
        onCancel={close}
        canDismissOnEscape={!busy}
        className="resume-delete-dialog"
      >
        <form className="resume-delete-form" onSubmit={submit}>
          <p className="resume-kicker">Permanent action</p>
          <h2 id={headingId}>Permanently delete Resume</h2>
          <div id={descriptionId} className="resume-delete-warning">
            <p>
              You are permanently deleting <strong>{resume.title}</strong>.
            </p>
            <p>
              Its saved versions, analyses, Candidate Photo, and associated
              imported Resume PDF source files will also be removed.
            </p>
            <p>This deletion cannot be undone.</p>
          </div>

          <label className="resume-delete-confirmation">
            <span>Type the Resume title exactly to confirm</span>
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
            <div className="resume-state resume-state--error" role="alert">
              <p>{error.message}</p>
              {error.requestId ? (
                <p className="request-id">Request ID: {error.requestId}</p>
              ) : null}
            </div>
          ) : null}

          <div className="resume-delete-actions">
            <button
              type="button"
              className="resume-secondary-button"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="resume-danger-button"
              disabled={busy || confirmation !== resume.title}
            >
              {busy ? "Deleting…" : "Permanently delete Resume"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
