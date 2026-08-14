import type { ClipboardEvent, KeyboardEvent } from "react";

export const INTERVIEW_TAG_MAX_ITEMS = 50;
export const INTERVIEW_TAG_MAX_LENGTH = 120;

export interface InterviewTagMergeResult {
  values: string[];
  error?: string;
}

export function mergeInterviewTags(
  current: readonly string[],
  raw: string,
): InterviewTagMergeResult {
  const tokens = raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const overlongToken = tokens.find(
    (token) => token.length > INTERVIEW_TAG_MAX_LENGTH,
  );
  if (overlongToken) {
    return {
      values: [...current],
      error: `Each item must be ${INTERVIEW_TAG_MAX_LENGTH} characters or fewer.`,
    };
  }

  const next = [...current];
  const seen = new Set(current);
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    next.push(token);
  }

  if (next.length > INTERVIEW_TAG_MAX_ITEMS) {
    return {
      values: [...current],
      error: `You can add up to ${INTERVIEW_TAG_MAX_ITEMS} items.`,
    };
  }

  return { values: next };
}

interface InterviewTagInputProps {
  id: string;
  label: string;
  values: string[];
  draft: string;
  error?: string;
  placeholder?: string;
  helpText?: string;
  onValuesChange(next: string[]): void;
  onDraftChange(next: string): void;
  onError(next?: string): void;
}

export function InterviewTagInput({
  id,
  label,
  values,
  draft,
  error,
  placeholder,
  helpText,
  onValuesChange,
  onDraftChange,
  onError,
}: InterviewTagInputProps) {
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [helpText ? helpId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

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

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    commit(draft);
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted.includes(",")) return;

    event.preventDefault();
    commit(`${draft}${pasted}`);
  }

  function removeValue(value: string) {
    onValuesChange(values.filter((candidate) => candidate !== value));
    onError(undefined);
  }

  return (
    <div
      className="interview-tag-input"
      role="group"
      aria-labelledby={labelId}
    >
      <label id={labelId} htmlFor={id}>
        {label}
      </label>

      <div className="interview-tag-input__control">
        {values.map((value) => (
          <span className="interview-tag-input__chip" key={value}>
            <span>{value}</span>
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => removeValue(value)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            onDraftChange(event.target.value);
            if (error) onError(undefined);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
      </div>

      {helpText ? (
        <small id={helpId} className="interview-tag-input__help">
          {helpText}
        </small>
      ) : null}
      {error ? (
        <p id={errorId} className="interview-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
