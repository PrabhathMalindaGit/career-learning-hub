import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ApiError } from "../../api/apiClient";
import { CardOverflowActions } from "../../components/CardOverflowActions";
import {
  deleteFlashcardSet,
  deleteLearningConversation,
  deleteQuiz,
} from "./learningChildDeletionApi";
import "./learningDeletion.css";

export type LearningChildKind = "conversation" | "flashcard-set" | "quiz";

type SafeError = {
  message: string;
  requestId?: string;
};

type LearningChildDeletionProps = {
  kind: LearningChildKind;
  id: string;
  title: string;
  documentId?: string;
  disabled?: boolean;
  onDeleted(id: string): void;
};

function actionLabel(kind: LearningChildKind): string {
  if (kind === "conversation") return "Delete conversation";
  if (kind === "flashcard-set") return "Delete flashcard set";
  return "Delete quiz";
}

function consequence(kind: LearningChildKind): string {
  if (kind === "conversation") {
    return "This permanently removes the conversation and all messages in it.";
  }
  if (kind === "flashcard-set") {
    return "This permanently removes the flashcard set and all cards in it.";
  }
  return "This permanently removes the quiz, its questions, and saved attempts.";
}

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId === undefined ? {} : { requestId: error.requestId }),
    };
  }
  return { message: "This item could not be deleted. Try again." };
}

// Feature 5.10 UI — Delete Learning conversation, flashcard set, or quiz.
export function LearningChildDeletion({
  kind,
  id,
  title,
  documentId,
  disabled = false,
  onDeleted,
}: LearningChildDeletionProps) {
  const titleId = useId();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<SafeError>();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const controllerRef = useRef<AbortController | undefined>(undefined);

  const closeConfirmation = useCallback(() => {
    if (deleting) return;
    setConfirmationOpen(false);
    setError(undefined);
    queueMicrotask(() => triggerRef.current?.focus());
  }, [deleting]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (confirmationOpen) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      cancelRef.current?.focus();
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [confirmationOpen]);

  const confirmDeletion = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (deleting) return;

      const controller = new AbortController();
      controllerRef.current?.abort();
      controllerRef.current = controller;
      setDeleting(true);
      setError(undefined);

      try {
        if (kind === "conversation") {
          if (!documentId) {
            throw new Error("Conversation document context is missing.");
          }
          await deleteLearningConversation(documentId, id, controller.signal);
        } else if (kind === "flashcard-set") {
          await deleteFlashcardSet(id, controller.signal);
        } else {
          await deleteQuiz(id, controller.signal);
        }

        if (controller.signal.aborted) return;
        setConfirmationOpen(false);
        onDeleted(id);
        queueMicrotask(() => triggerRef.current?.focus());
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(safeError(reason));
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = undefined;
          setDeleting(false);
        }
      }
    },
    [deleting, documentId, id, kind, onDeleted],
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
      dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  return (
    <div className="learning-child-deletion">
      {/* =========================================================
          FIND: DELETE LEARNING ITEM
          TYPE: UI
          FILE: frontend/src/features/learning/LearningChildDeletion.tsx
          STYLE FILE: frontend/src/features/learning/learningDeletion.css
          STYLE SELECTOR: .learning-delete-heading
          BACKEND: learningChildDeletion.service.ts -> FIND: DELETE LEARNING ITEM BACKEND
          ========================================================= */}
      <CardOverflowActions
        ariaLabel={`More actions for ${title}`}
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        className="learning-card-overflow"
        actions={[
          {
            id: `delete-${kind}`,
            label: actionLabel(kind),
            destructive: true,
            disabled: disabled || deleting,
            onSelect: (trigger) => {
              triggerRef.current = trigger;
              setError(undefined);
              setConfirmationOpen(true);
            },
          },
        ]}
      />

      <dialog
        ref={dialogRef}
        className="learning-deletion-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          closeConfirmation();
        }}
        onKeyDown={handleDialogKeyDown}
      >
        <form className="learning-deletion-form" onSubmit={confirmDeletion}>
          <div className="learning-delete-heading">
            <span className="learning-delete-warning-mark" aria-hidden="true">
              !
            </span>
            <div>
              <p className="learning-kicker">Permanent action</p>
              <h2 id={titleId}>Delete “{title}”?</h2>
            </div>
          </div>
          <p>{consequence(kind)}</p>
          <p className="learning-delete-irreversible">
            This action cannot be undone.
          </p>
          {error ? (
            <div className="learning-error" role="alert">
              <p>{error.message}</p>
              {error.requestId ? (
                <p className="request-id">Request ID: {error.requestId}</p>
              ) : null}
            </div>
          ) : null}
          <div className="learning-deletion-actions">
            <button
              ref={cancelRef}
              type="button"
              className="learning-secondary-button"
              disabled={deleting}
              onClick={closeConfirmation}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="learning-danger-button"
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
