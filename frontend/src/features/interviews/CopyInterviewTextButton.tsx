import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

export function CopyInterviewTextButton({
  label,
  text,
}: {
  label: "Model answer" | "Explanation";
  text: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    },
    [],
  );

  async function copyText() {
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    resetTimer.current = window.setTimeout(() => {
      setCopyState("idle");
      resetTimer.current = null;
    }, 2_000);
  }

  return (
    <span className="interview-copy-control">
      <button
        type="button"
        className="interview-copy-button"
        aria-label={`Copy ${label.toLocaleLowerCase()}`}
        onClick={() => void copyText()}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          width="16"
          height="16"
        >
          <path
            d="M7 6.25V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-1.75M4.5 7h7A1.5 1.5 0 0 1 13 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        Copy
      </button>
      <span
        className={`interview-copy-status interview-copy-status--${copyState}`}
        role="status"
        aria-label={`${label} copy status`}
      >
        {copyState === "copied"
          ? "Copied"
          : copyState === "failed"
            ? "Copy failed"
            : ""}
      </span>
    </span>
  );
}
