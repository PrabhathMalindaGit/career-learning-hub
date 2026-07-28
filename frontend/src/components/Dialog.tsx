import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface DialogProps {
  open: boolean;
  labelledBy: string;
  describedBy?: string;
  initialFocusRef: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onCancel(): void;
  canDismissOnEscape?: boolean;
  canDismissOnBackdrop?: boolean;
  className?: string;
  children: ReactNode;
}

export function Dialog({
  open,
  labelledBy,
  describedBy,
  initialFocusRef,
  returnFocusRef,
  onCancel,
  canDismissOnEscape = true,
  canDismissOnBackdrop = false,
  className,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const returnFocus =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    initialFocusRef.current?.focus();

    return () => {
      if (dialog.open) {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      }
      if (returnFocus?.isConnected) {
        returnFocus.focus();
      }
    };
  }, [initialFocusRef, open, returnFocusRef]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (canDismissOnEscape) onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (canDismissOnEscape) onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        focusableSelector,
      ) ?? [],
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first?.focus();
    }
  };

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    if (!canDismissOnBackdrop || event.target !== event.currentTarget) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const outsideDialog =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outsideDialog) {
      onCancel();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
    >
      {children}
    </dialog>
  );
}
