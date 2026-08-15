import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../api/apiClient";
import { CardOverflowActions } from "../../components/CardOverflowActions";
import { Dialog } from "../../components/Dialog";
import { deleteResume } from "./resumeApi";
import type { ResumeRecord } from "./types";
import "./resumeDeletion.css";

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
  actionsOpen,
  onActionsOpenChange,
}: {
  resume: Pick<ResumeRecord, "id" | "title">;
  onDeleted(resumeId: string): void;
  actionsOpen: boolean;
  onActionsOpenChange(open: boolean): void;
}) {
  const headingId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
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
      <CardOverflowActions
        ariaLabel={`More actions for ${resume.title}`}
        open={actionsOpen}
        onOpenChange={onActionsOpenChange}
        className="resume-delete-overflow"
        actions={[
          {
            id: "delete-resume",
            label: "Delete resume",
            destructive: true,
            onSelect: (trigger) => {
              triggerRef.current = trigger;
              setConfirmation("");
              setError(null);
              setOpen(true);
            },
          },
        ]}
      />

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
          <div className="resume-delete-heading">
            <span className="resume-delete-warning-mark" aria-hidden="true">
              !
            </span>
            <div>
              <p className="resume-kicker">Permanent action</p>
              <h2 id={headingId}>Delete “{resume.title}”?</h2>
            </div>
          </div>
          <div id={descriptionId} className="resume-delete-warning">
            <p>
              This permanently removes the Resume, its saved versions,
              analyses, Candidate Photo, and associated imported Resume PDF
              source files.
            </p>
            <p className="resume-delete-irreversible">
              This action cannot be undone.
            </p>
          </div>

          <label className="resume-delete-confirmation">
            <span>
              Type <strong>{resume.title}</strong> exactly to confirm
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
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
