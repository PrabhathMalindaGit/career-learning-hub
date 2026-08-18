import { useEffect, useRef, useState } from "react";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionType,
} from "./types";
import "./interviewQuestionTypes.css";
import "./interviewGenerationStatus.css";
import "./interviewQuestionIndexNotes.css";

// Feature 4.6 — Interview question-type controls.
// UI: Interview workspace -> question generation/manual-question controls.
// Types: Multiple Choice, Short Answer, Coding, Behavioral, Scenario-based,
// and Technical Explanation. Styling: interviewQuestionTypes.css -> search
// "Feature 4.6".
export const QUESTION_TYPE_OPTIONS: ReadonlyArray<{
  value: InterviewQuestionType;
  label: string;
}> = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "short-answer", label: "Short Answer" },
  { value: "coding", label: "Coding" },
  { value: "behavioral", label: "Behavioral" },
  { value: "scenario-based", label: "Scenario-based" },
  {
    value: "technical-explanation",
    label: "Technical Explanation",
  },
];

export const QUESTION_TYPE_LABELS: Record<
  EffectiveInterviewQuestionType,
  string
> = {
  "multiple-choice": "Multiple Choice",
  "short-answer": "Short Answer",
  coding: "Coding",
  behavioral: "Behavioral",
  "scenario-based": "Scenario-based",
  "technical-explanation": "Technical Explanation",
  "legacy-open-response": "Open response",
};

export interface InterviewQuestionTypeControlsProps {
  count: number;
  selected: InterviewQuestionType[];
  explicitCounts?: Partial<Record<InterviewQuestionType, number>>;
  disabled?: boolean;
  onSelectedChange(next: InterviewQuestionType[]): void;
  onExplicitCountsChange(
    next?: Partial<Record<InterviewQuestionType, number>>,
  ): void;
}

export function interviewTypeCountsAreValid(
  count: number,
  selected: InterviewQuestionType[],
  explicitCounts?: Partial<Record<InterviewQuestionType, number>>,
): boolean {
  if (selected.length < 1) return false;
  if (explicitCounts === undefined) return true;
  return (
    selected.every((type) => {
      const value = explicitCounts[type];
      return Number.isInteger(value) && (value ?? 0) >= 0;
    }) &&
    selected.reduce((sum, type) => sum + (explicitCounts[type] ?? 0), 0) ===
      count
  );
}

function balancedCounts(
  count: number,
  selected: InterviewQuestionType[],
): Partial<Record<InterviewQuestionType, number>> {
  const base = Math.floor(count / selected.length);
  const remainder = count % selected.length;
  return selected.reduce<Partial<Record<InterviewQuestionType, number>>>(
    (result, type, index) => {
      result[type] = base + (index < remainder ? 1 : 0);
      return result;
    },
    {},
  );
}

export function InterviewQuestionTypeControls({
  count,
  selected,
  explicitCounts,
  disabled = false,
  onSelectedChange,
  onExplicitCountsChange,
}: InterviewQuestionTypeControlsProps) {
  const [countsOpen, setCountsOpen] = useState(
    explicitCounts !== undefined && selected.length > 1,
  );
  const [selectionError, setSelectionError] = useState(false);
  const [distributionNotice, setDistributionNotice] = useState("");
  const previousCountRef = useRef(count);
  const singleType = selected.length === 1 ? selected[0] : undefined;
  const singleTypeLabel = singleType
    ? QUESTION_TYPE_LABELS[singleType]
    : undefined;
  const questionNoun = count === 1 ? "question" : "questions";
  const explicitTotal = selected.reduce(
    (sum, type) => sum + (explicitCounts?.[type] ?? 0),
    0,
  );
  const explicitCountsValid = interviewTypeCountsAreValid(
    count,
    selected,
    explicitCounts,
  );
  const distributionLabel = countsOpen
    ? explicitCountsValid
      ? `Exact counts · ${explicitTotal} total`
      : `Exact counts · ${explicitTotal} of ${count}`
    : "Balanced automatically";

  useEffect(() => {
    if (previousCountRef.current === count) return;
    previousCountRef.current = count;

    if (explicitCounts !== undefined) {
      onExplicitCountsChange(undefined);
      setCountsOpen(false);
      setDistributionNotice(
        "Question count changed. Distribution reset to balanced.",
      );
    }
  }, [count, explicitCounts, onExplicitCountsChange]);

  function toggleType(type: InterviewQuestionType, checked: boolean) {
    setDistributionNotice("");
    if (checked) {
      if (selected.includes(type)) return;
      setSelectionError(false);
      onSelectedChange([...selected, type]);
      if (explicitCounts !== undefined) {
        onExplicitCountsChange({ ...explicitCounts, [type]: 0 });
      }
      return;
    }

    if (selected.length <= 1) {
      setSelectionError(true);
      return;
    }

    setSelectionError(false);
    const nextSelected = selected.filter((value) => value !== type);
    onSelectedChange(nextSelected);

    if (nextSelected.length === 1) {
      if (explicitCounts !== undefined) {
        onExplicitCountsChange(undefined);
      }
      setCountsOpen(false);
      return;
    }

    if (explicitCounts !== undefined) {
      const next = { ...explicitCounts };
      delete next[type];
      onExplicitCountsChange(next);
    }
  }

  function openCounts() {
    if (selected.length < 2) return;
    setDistributionNotice("");
    if (explicitCounts === undefined) {
      onExplicitCountsChange(balancedCounts(count, selected));
    }
    setCountsOpen(true);
  }

  return (
    <fieldset className="interview-type-controls" disabled={disabled}>
      <legend>Question types</legend>
      <p className="interview-type-controls__help">
        Choose one or more types. Balanced distribution is used unless you set
        exact counts.
      </p>
      <div className="interview-type-controls__options">
        {QUESTION_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="interview-type-choice">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) =>
                toggleType(option.value, event.target.checked)
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {selectionError ? (
        <p className="interview-type-controls__error" role="alert">
          Select at least one question type.
        </p>
      ) : null}

      <div className="interview-type-controls__distribution">
        <div>
          <strong>Distribution</strong>
          {singleTypeLabel ? (
            <span>{`All ${count} ${questionNoun} will be ${singleTypeLabel}.`}</span>
          ) : (
            <span>{distributionLabel}</span>
          )}
        </div>
        {singleTypeLabel ? null : !countsOpen ? (
          <button
            type="button"
            className="interview-secondary-button"
            aria-expanded="false"
            onClick={openCounts}
          >
            Set exact counts
          </button>
        ) : (
          <button
            type="button"
            className="interview-secondary-button"
            aria-expanded="true"
            onClick={() => {
              onExplicitCountsChange(undefined);
              setCountsOpen(false);
              setDistributionNotice("");
            }}
          >
            Use balanced distribution
          </button>
        )}
      </div>

      {distributionNotice ? (
        <p
          className="interview-type-controls__help interview-type-controls__status"
          aria-live="polite"
        >
          {distributionNotice}
        </p>
      ) : null}

      {selected.length > 1 && countsOpen && explicitCounts !== undefined ? (
        <div className="interview-type-counts">
          {selected.map((type) => (
            <label key={type}>
              {QUESTION_TYPE_LABELS[type]} count
              <input
                type="number"
                min={0}
                max={20}
                inputMode="numeric"
                value={explicitCounts[type] ?? 0}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  onExplicitCountsChange({
                    ...explicitCounts,
                    [type]: Number.isFinite(parsed) ? parsed : 0,
                  });
                }}
              />
            </label>
          ))}
          {!explicitCountsValid ? (
            <p className="interview-type-controls__error" role="alert">
              {`Exact counts total ${explicitTotal}; they must equal Question count ${count}.`}
            </p>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
