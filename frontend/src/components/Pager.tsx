import type { ReactNode } from "react";

interface PagerProps {
  label: string;
  currentPage: ReactNode;
  previousLabel: ReactNode;
  nextLabel: ReactNode;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious(): void;
  onNext(): void;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  busy?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function Pager({
  label,
  currentPage,
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  previousAriaLabel,
  nextAriaLabel,
  busy = false,
  className,
  buttonClassName,
}: PagerProps) {
  return (
    <nav
      className={["pager", className].filter(Boolean).join(" ")}
      aria-label={label}
      aria-busy={busy || undefined}
    >
      <button
        type="button"
        className={buttonClassName}
        aria-label={previousAriaLabel}
        disabled={previousDisabled || busy}
        onClick={onPrevious}
      >
        {previousLabel}
      </button>
      <span aria-live="polite">{currentPage}</span>
      <button
        type="button"
        className={buttonClassName}
        aria-label={nextAriaLabel}
        disabled={nextDisabled || busy}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </nav>
  );
}
