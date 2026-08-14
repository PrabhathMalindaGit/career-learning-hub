import type { KeyboardEvent } from "react";
import { mergeInterviewTags } from "./InterviewTagInput";
import "./interviewCreateGuidance.css";

export interface InterviewSuggestedTagInputProps {
  id: string;
  label: string;
  suggestions: readonly string[];
  values: string[];
  draft: string;
  disabled?: boolean;
  placeholder: string;
  helpText: string;
  error?: string;
  onValuesChange(next: string[]): void;
  onDraftChange(next: string): void;
  onError(next?: string): void;
}

export function InterviewSuggestedTagInput({
  id,
  label,
  suggestions,
  values,
  draft,
  disabled = false,
  placeholder,
  helpText,
  error,
  onValuesChange,
  onDraftChange,
  onError,
}: InterviewSuggestedTagInputProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const baseLabel = label.replace(/\s*·\s*Optional\s*$/i, "");
  const visible = Array.from(new Set([...suggestions, ...values]));

  function commit(raw: string) {
    const result = mergeInterviewTags(values, raw);
    if (result.error) {
      onError(result.error);
      return;
    }

    onValuesChange(result.values);
    onDraftChange("");
    onError(undefined);
  }

  function toggle(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((candidate) => candidate !== value));
      onError(undefined);
      return;
    }

    commit(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    commit(draft);
  }

  return (
    <div
      className="interview-suggested-tag-input"
      role="group"
      aria-labelledby={`${id}-label`}
    >
      <div className="interview-suggested-tag-input__heading">
        <label id={`${id}-label`} htmlFor={`${id}-custom`}>
          {label}
        </label>
        <small>{values.length} selected</small>
      </div>

      {visible.length > 0 ? (
        <div
          className="interview-suggested-tag-input__choices"
          aria-label={`${baseLabel} choices`}
        >
          {visible.map((value) => {
            const selected = values.includes(value);
            return (
              <button
                key={value}
                type="button"
                className="interview-suggested-tag-chip"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => toggle(value)}
              >
                <span aria-hidden="true">{selected ? "✓" : "+"}</span>
                {value}
              </button>
            );
          })}
        </div>
      ) : (
        <small className="interview-suggested-tag-input__help">
          Choose a Target role to see suggestions, or add your own.
        </small>
      )}

      <div className="interview-suggested-tag-input__custom">
        <label htmlFor={`${id}-custom`}>{`Custom ${baseLabel}`}</label>
        <div className="interview-suggested-tag-input__custom-row">
          <input
            id={`${id}-custom`}
            className="field-control"
            type="text"
            value={draft}
            disabled={disabled || values.length >= 50}
            placeholder={placeholder}
            aria-describedby={[helpId, error ? errorId : undefined]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              onDraftChange(event.target.value);
              if (error) onError(undefined);
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="interview-secondary-button"
            disabled={disabled || values.length >= 50 || !draft.trim()}
            onClick={() => commit(draft)}
          >
            Add
          </button>
        </div>
      </div>

      <small id={helpId} className="interview-suggested-tag-input__help">
        {helpText}
      </small>
      {error ? (
        <p id={errorId} className="interview-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
