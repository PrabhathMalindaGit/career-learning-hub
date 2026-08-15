import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { CardOverflowActions } from "../../components/CardOverflowActions";
import {
  fetchLearningDocument,
  fetchLearningDocumentDeletionJob,
  requestLearningDocumentDeletion,
} from "./learningApi";
import { pollLearningJob } from "./learningPolling";
import type {
  LearningDocument,
  LearningDocumentDeletionJob,
} from "./types";

type DeletionState =
  | { status: "idle" | "confirmation" | "accepting" }
  | { status: "observing" }
  | {
      status: "queued" | "processing";
      jobId: string;
      requestId?: string;
    }
  | {
      status: "paused";
      jobId: string;
      requestId?: string;
      cause: "timeout" | "transport-failure";
    }
  | {
      status: "reconciling";
      jobId?: string;
      requestId?: string;
    }
  | {
      status: "failed" | "cancelled" | "uncertain";
      message: string;
      requestId?: string;
      jobId?: string;
      canRetry: boolean;
    };

type ReconciliationReason =
  | {
      kind: "uncertain";
      requestId?: string;
      jobId?: string;
    }
  | {
      kind: "terminal";
      job: LearningDocumentDeletionJob;
    };

function requestIdFrom(error: unknown): string | undefined {
  return error instanceof ApiError ? error.requestId : undefined;
}

function isCanonicalAbsence(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function initialState(document: LearningDocument): DeletionState {
  return document.status === "deleting"
    ? { status: "observing" }
    : { status: "idle" };
}

export function LearningDocumentDeletion({
  accountId,
  document,
  onDeletionAccepted,
  actionsOpen = false,
  onActionsOpenChange = () => undefined,
}: {
  accountId: string;
  document: LearningDocument;
  onDeletionAccepted(): void;
  actionsOpen?: boolean;
  onActionsOpenChange?(open: boolean): void;
}) {
  const navigate = useNavigate();
  const identity = `${accountId}:${document.id}`;
  const deletionTitleId = `learning-deletion-title-${document.id}`;
  const [state, setState] = useState<DeletionState>(() =>
    initialState(document),
  );
  const [confirmation, setConfirmation] = useState("");
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const operation = useRef(0);
  const accepting = useRef(false);
  const accepted = useRef(false);
  const acceptController = useRef<AbortController | undefined>(undefined);
  const pollController = useRef<AbortController | undefined>(undefined);
  const reconcileController = useRef<AbortController | undefined>(undefined);
  const activeIdentity = useRef(identity);

  const abortWork = useCallback(() => {
    acceptController.current?.abort();
    pollController.current?.abort();
    reconcileController.current?.abort();
    acceptController.current = undefined;
    pollController.current = undefined;
    reconcileController.current = undefined;
  }, []);

  const markDeletionAccepted = useCallback(() => {
    if (accepted.current) return;
    accepted.current = true;
    onDeletionAccepted();
  }, [onDeletionAccepted]);

  useEffect(() => {
    activeIdentity.current = identity;
    operation.current += 1;
    accepting.current = false;
    accepted.current = false;
    abortWork();
    setConfirmation("");
    setState(initialState(document));

    return () => {
      operation.current += 1;
      accepting.current = false;
      abortWork();
    };
  }, [abortWork, document.id, identity]);

  const dialogVisible =
    state.status === "confirmation" || state.status === "accepting";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogVisible) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      inputRef.current?.focus();
      return;
    }
    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [dialogVisible]);

  useEffect(() => {
    if (
      state.status === "failed" ||
      state.status === "cancelled" ||
      state.status === "uncertain" ||
      state.status === "paused"
    ) {
      statusRef.current?.focus();
    }
  }, [state.status]);

  const completeCanonicalDeletion = useCallback(() => {
    operation.current += 1;
    abortWork();
    setConfirmation("");
    markDeletionAccepted();
    navigate("/learning", { replace: true });
  }, [abortWork, markDeletionAccepted, navigate]);

  const reconcile = useCallback(
    async (reason: ReconciliationReason) => {
      reconcileController.current?.abort();
      const controller = new AbortController();
      reconcileController.current = controller;
      const currentOperation = ++operation.current;
      const requestId =
        reason.kind === "terminal" ? reason.job.requestId : reason.requestId;
      const jobId = reason.kind === "terminal" ? reason.job.id : reason.jobId;
      setState({
        status: "reconciling",
        ...(jobId === undefined ? {} : { jobId }),
        ...(requestId === undefined ? {} : { requestId }),
      });

      try {
        const result = await fetchLearningDocument(document.id, controller.signal);
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity ||
          result.document.id !== document.id
        ) {
          return;
        }

        const canRetry = result.document.status !== "deleting";
        if (reason.kind === "terminal") {
          if (reason.job.status === "failed") {
            setState({
              status: "failed",
              message:
                reason.job.error?.message ?? "The document could not be deleted.",
              canRetry,
              jobId: reason.job.id,
              ...(requestId === undefined ? {} : { requestId }),
            });
            return;
          }
          if (reason.job.status === "cancelled") {
            setState({
              status: "cancelled",
              message: "Document deletion was cancelled before completion.",
              canRetry,
              jobId: reason.job.id,
              ...(requestId === undefined ? {} : { requestId }),
            });
            return;
          }
        }

        setState({
          status: "uncertain",
          message: canRetry
            ? "The deletion request outcome is uncertain. The document still exists and can be reviewed before another attempt."
            : "The deletion request outcome is uncertain. The document is still marked for deletion.",
          canRetry,
          ...(jobId === undefined ? {} : { jobId }),
          ...(requestId === undefined ? {} : { requestId }),
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity
        ) {
          return;
        }
        if (isCanonicalAbsence(error)) {
          completeCanonicalDeletion();
          return;
        }
        setState({
          status: "uncertain",
          message:
            "The deletion request outcome is uncertain. The current document state could not be confirmed.",
          canRetry: false,
          ...(jobId === undefined ? {} : { jobId }),
          ...((requestIdFrom(error) ?? requestId) === undefined
            ? {}
            : { requestId: requestIdFrom(error) ?? requestId }),
        });
      }
    },
    [completeCanonicalDeletion, document.id, identity],
  );

  const runPolling = useCallback(
    async (
      jobId: string,
      phase: "queued" | "processing",
      requestId?: string,
    ) => {
      pollController.current?.abort();
      const controller = new AbortController();
      pollController.current = controller;
      const currentOperation = ++operation.current;
      setState({
        status: phase,
        jobId,
        ...(requestId === undefined ? {} : { requestId }),
      });

      try {
        const result = await pollLearningJob<LearningDocumentDeletionJob>({
          jobId,
          documentId: document.id,
          fetchJob: fetchLearningDocumentDeletionJob,
          signal: controller.signal,
          onUpdate: (job) => {
            if (
              controller.signal.aborted ||
              currentOperation !== operation.current ||
              activeIdentity.current !== identity
            ) {
              return;
            }
            if (job.status === "queued" || job.status === "processing") {
              setState({
                status: job.status,
                jobId,
                ...((job.requestId ?? requestId) === undefined
                  ? {}
                  : { requestId: job.requestId ?? requestId }),
              });
            }
          },
        });
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity ||
          result.reason === "cancelled"
        ) {
          return;
        }
        if (result.reason === "paused") {
          setState({
            status: "paused",
            cause: result.cause,
            jobId,
            ...((result.job?.requestId ?? requestId) === undefined
              ? {}
              : { requestId: result.job?.requestId ?? requestId }),
          });
          return;
        }
        await reconcile({ kind: "terminal", job: result.job });
      } catch (error) {
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity
        ) {
          return;
        }
        await reconcile({
          kind: "uncertain",
          jobId,
          requestId: requestIdFrom(error) ?? requestId,
        });
      }
    },
    [document.id, identity, reconcile],
  );

  const openConfirmation = useCallback(() => {
    if (
      document.status === "deleting" ||
      state.status === "accepting" ||
      state.status === "queued" ||
      state.status === "processing" ||
      state.status === "reconciling"
    ) {
      return;
    }
    setConfirmation("");
    setState({ status: "confirmation" });
  }, [document.status, state.status]);

  const closeConfirmation = useCallback(() => {
    if (state.status === "accepting") return;
    setConfirmation("");
    setState({ status: "idle" });
    queueMicrotask(() => triggerRef.current?.focus());
  }, [state.status]);

  const acceptDeletion = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (accepting.current || confirmation.trim() !== document.title) {
        return;
      }
      accepting.current = true;
      const controller = new AbortController();
      acceptController.current = controller;
      const currentOperation = ++operation.current;
      setState({ status: "accepting" });

      try {
        const result = await requestLearningDocumentDeletion(
          document.id,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity
        ) {
          return;
        }
        accepting.current = false;
        setConfirmation("");
        markDeletionAccepted();
        void runPolling(
          result.job.id,
          result.job.status === "processing" ? "processing" : "queued",
          result.requestId,
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          currentOperation !== operation.current ||
          activeIdentity.current !== identity
        ) {
          return;
        }
        accepting.current = false;
        setConfirmation("");
        await reconcile({
          kind: "uncertain",
          requestId: requestIdFrom(error),
        });
      }
    },
    [
      confirmation,
      document.id,
      document.title,
      identity,
      markDeletionAccepted,
      reconcile,
      runPolling,
    ],
  );

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeConfirmation();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "input:not(:disabled), button:not(:disabled)",
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (!event.shiftKey && globalThis.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (
      event.shiftKey &&
      globalThis.document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  const resumePolling = () => {
    if (state.status !== "paused") return;
    void runPolling(state.jobId, "processing", state.requestId);
  };

  const checkCanonicalStatus = () => {
    const trackedState = "jobId" in state ? state : undefined;
    void reconcile({
      kind: "uncertain",
      ...(trackedState?.jobId === undefined ? {} : { jobId: trackedState.jobId }),
      ...(trackedState?.requestId === undefined
        ? {}
        : { requestId: trackedState.requestId }),
    });
  };

  const canShowActions =
    document.status !== "deleting" &&
    (state.status === "idle" ||
      state.status === "confirmation" ||
      state.status === "accepting");

  return (
    <div className="learning-deletion">
      {canShowActions ? (
        <CardOverflowActions
          ariaLabel={`More actions for ${document.title}`}
          open={actionsOpen}
          onOpenChange={onActionsOpenChange}
          className="learning-card-overflow"
          actions={[
            {
              id: "delete-document",
              label: "Delete document",
              destructive: true,
              disabled: state.status === "accepting",
              onSelect: (trigger) => {
                triggerRef.current = trigger;
                openConfirmation();
              },
            },
          ]}
        />
      ) : null}

      {state.status === "observing" ? (
        <div
          ref={statusRef}
          className="learning-deletion-status"
          role="status"
          tabIndex={-1}
        >
          <h2>Document is being deleted</h2>
          <p>
            The deletion job is already in progress. This page will only use
            the canonical document state to check completion.
          </p>
          <p>Grounded chat is unavailable while deletion completes.</p>
          <p>Flashcards are unavailable while deletion completes.</p>
          <p>Quizzes are unavailable while deletion completes.</p>
          <button
            type="button"
            className="learning-secondary-button"
            onClick={checkCanonicalStatus}
          >
            Check deletion status
          </button>
        </div>
      ) : null}

      {state.status === "queued" || state.status === "processing" ? (
        <div
          ref={statusRef}
          className="learning-deletion-status"
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          <h2>
            {state.status === "queued" ? "Deletion queued" : "Deletion processing"}
          </h2>
          <p>Keep this page open while the same deletion job is checked.</p>
          {state.requestId ? (
            <p className="request-id">Request ID: {state.requestId}</p>
          ) : null}
        </div>
      ) : null}

      {state.status === "paused" ? (
        <div
          ref={statusRef}
          className="learning-deletion-status"
          role="status"
          tabIndex={-1}
        >
          <h2>Deletion checks paused</h2>
          <p>
            The backend deletion result is not known locally. Resume checks
            for the same job when ready.
          </p>
          {state.requestId ? (
            <p className="request-id">Request ID: {state.requestId}</p>
          ) : null}
          <button
            type="button"
            className="learning-secondary-button"
            onClick={resumePolling}
          >
            Resume deletion checks
          </button>
        </div>
      ) : null}

      {state.status === "reconciling" ? (
        <div
          className="learning-deletion-status"
          role="status"
          aria-live="polite"
        >
          <h2>Confirming document deletion</h2>
          <p>Checking the canonical document state.</p>
        </div>
      ) : null}

      {state.status === "failed" ||
      state.status === "cancelled" ||
      state.status === "uncertain" ? (
        <div
          ref={statusRef}
          className="learning-deletion-status learning-deletion-status--error"
          role="alert"
          tabIndex={-1}
        >
          <h2>
            {state.status === "failed"
              ? "Document deletion failed"
              : state.status === "cancelled"
                ? "Document deletion cancelled"
                : "Deletion outcome uncertain"}
          </h2>
          <p>{state.message}</p>
          {state.requestId ? (
            <p className="request-id">Request ID: {state.requestId}</p>
          ) : null}
          <button
            type="button"
            className="learning-secondary-button"
            onClick={state.canRetry ? openConfirmation : checkCanonicalStatus}
          >
            {state.canRetry ? "Review deletion again" : "Check deletion status"}
          </button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className="learning-deletion-dialog"
        aria-labelledby={deletionTitleId}
        onCancel={(event) => {
          event.preventDefault();
          closeConfirmation();
        }}
        onKeyDown={handleDialogKeyDown}
      >
        <form className="learning-deletion-form" onSubmit={acceptDeletion}>
          <div className="learning-delete-heading">
            <span className="learning-delete-warning-mark" aria-hidden="true">
              !
            </span>
            <div>
              <p className="learning-kicker">Permanent action</p>
              <h2 id={deletionTitleId}>Delete “{document.title}”?</h2>
            </div>
          </div>
          <p>
            This permanently removes the document and its related
            conversations, messages, flashcards, quizzes, and attempts.
          </p>
          <p className="learning-delete-irreversible">
            This action cannot be undone.
          </p>
          <label>
            <span>
              Type <strong>{document.title}</strong> to confirm
            </span>
            <input
              ref={inputRef}
              type="text"
              value={confirmation}
              disabled={state.status === "accepting"}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <div className="learning-deletion-actions">
            <button
              type="button"
              className="learning-secondary-button"
              disabled={state.status === "accepting"}
              onClick={closeConfirmation}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="learning-danger-button"
              disabled={
                state.status === "accepting" ||
                confirmation.trim() !== document.title
              }
            >
              {state.status === "accepting" ? "Accepting deletion…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
