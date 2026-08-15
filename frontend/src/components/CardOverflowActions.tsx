import { useEffect, useId, useRef } from "react";

export type CardOverflowAction = {
  id: string;
  label: string;
  destructive?: boolean;
  separatorBefore?: boolean;
  disabled?: boolean;
  onSelect(trigger: HTMLButtonElement): void;
};

type CardOverflowActionsProps = {
  ariaLabel: string;
  open: boolean;
  onOpenChange(open: boolean): void;
  actions: readonly CardOverflowAction[];
  className?: string;
};

export function CardOverflowActions({
  ariaLabel,
  open,
  onOpenChange,
  actions,
  className = "",
}: CardOverflowActionsProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      queueMicrotask(() => triggerRef.current?.focus());
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div
      ref={rootRef}
      className={`card-overflow-actions ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="card-overflow-actions__trigger"
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {open ? (
        <div id={panelId} className="card-overflow-actions__panel">
          {actions.map((action) => (
            <div
              key={action.id}
              className={
                action.separatorBefore
                  ? "card-overflow-actions__group card-overflow-actions__group--separated"
                  : "card-overflow-actions__group"
              }
            >
              <button
                type="button"
                className={
                  action.destructive
                    ? "card-overflow-actions__action card-overflow-actions__action--destructive"
                    : "card-overflow-actions__action"
                }
                disabled={action.disabled}
                onClick={() => {
                  const trigger = triggerRef.current;
                  if (!trigger) return;
                  onOpenChange(false);
                  action.onSelect(trigger);
                }}
              >
                {action.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
