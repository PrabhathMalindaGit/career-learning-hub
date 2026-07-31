import { useMemo } from "react";
import type { ResumeSuggestion } from "./types";
import {
  diffResumeText,
  type ResumeDiffSegment,
} from "./resumeWordDiff";

interface ResumeSuggestionComparisonProps {
  suggestion: ResumeSuggestion;
  position: number;
  selected: boolean;
  disabled?: boolean;
  onToggle(): void;
}

function OriginalText({ segments }: { segments: ResumeDiffSegment[] }) {
  return segments.map((segment, index) =>
    segment.type === "removed" ? (
      <del key={index}>{segment.text}</del>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

function SuggestedText({ segments }: { segments: ResumeDiffSegment[] }) {
  return segments.map((segment, index) =>
    segment.type === "added" ? (
      <ins key={index}>{segment.text}</ins>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

export function ResumeSuggestionComparison({
  suggestion,
  position,
  selected,
  disabled = false,
  onToggle,
}: ResumeSuggestionComparisonProps) {
  const comparison = useMemo(
    () =>
      diffResumeText(
        suggestion.originalText,
        suggestion.rewrittenText,
      ),
    [suggestion.originalText, suggestion.rewrittenText],
  );

  return (
    <article
      className={`resume-suggestion${
        selected ? " resume-suggestion--selected" : ""
      }`}
      aria-labelledby={`resume-suggestion-title-${position}`}
    >
      <header className="resume-suggestion-heading">
        <div>
          <span className="resume-suggestion-number" aria-hidden="true">
            {String(position).padStart(2, "0")}
          </span>
          <div>
            <p>Suggested change</p>
            <h4 id={`resume-suggestion-title-${position}`}>
              Suggestion {position}
            </h4>
          </div>
        </div>
        <label className="resume-suggestion-selection">
          <input
            type="checkbox"
            aria-label={`Select suggestion ${position}`}
            checked={selected}
            disabled={disabled}
            onChange={onToggle}
          />
          <span>Select suggestion {position}</span>
          <small>{selected ? "Selected" : "Not selected"}</small>
        </label>
      </header>
      <div className="resume-suggestion-comparison">
        <section className="resume-suggestion-copy resume-suggestion-copy-original">
          <header>
            <h5>Original</h5>
            <span className="resume-diff-indicator">Removed</span>
          </header>
          <p>
            <OriginalText segments={comparison.original} />
          </p>
        </section>
        <section className="resume-suggestion-copy resume-suggestion-copy-suggested">
          <header>
            <h5>Suggested rewrite</h5>
            <span className="resume-diff-indicator">Added</span>
          </header>
          <p>
            <SuggestedText segments={comparison.suggested} />
          </p>
        </section>
      </div>
      <section className="resume-suggestion-reason">
        <span className="resume-suggestion-reason-mark" aria-hidden="true">
          i
        </span>
        <div>
          <h5>Reason</h5>
          <p>{suggestion.rationale}</p>
        </div>
      </section>
      {suggestion.verificationRequired ? (
        <p className="resume-suggestion-warning">
          <strong>Verification required</strong>
          <span>Verify facts and placeholders before accepting.</span>
        </p>
      ) : null}
    </article>
  );
}
