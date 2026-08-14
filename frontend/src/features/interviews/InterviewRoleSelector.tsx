import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { INTERVIEW_ROLE_OPTIONS } from "./interviewRoleGuidance";
import "./interviewCreateGuidance.css";

export interface InterviewRoleSelectorProps {
  value: string;
  disabled?: boolean;
  error?: string;
  onChange(next: string): void;
}

function roleKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function InterviewRoleSelector({
  value,
  disabled = false,
  error,
  onChange,
}: InterviewRoleSelectorProps) {
  const [query, setQuery] = useState(value);
  const trimmedQuery = query.trim();
  const normalizedQuery = roleKey(trimmedQuery);
  const selectedKey = roleKey(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return [];
    return INTERVIEW_ROLE_OPTIONS.filter((option) =>
      roleKey(option.label).includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const exactBuiltIn = INTERVIEW_ROLE_OPTIONS.find(
    (option) => roleKey(option.label) === normalizedQuery,
  );
  const showResults = normalizedQuery.length > 0 && filtered.length > 0;
  const showCustomAction = normalizedQuery.length > 0 && !exactBuiltIn;

  function adopt(next: string) {
    onChange(next);
    setQuery(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || filtered.length !== 1) return;
    event.preventDefault();
    adopt(filtered[0]!.label);
  }

  return (
    <div className="interview-role-selector">
      <div className="interview-role-selector__heading">
        <label htmlFor="interview-target-role">Target role</label>
        {value ? <small>Selected: {value}</small> : <small>Choose one role</small>}
      </div>

      <div
        className="interview-role-selector__shortcuts"
        aria-label="Common target roles"
      >
        {INTERVIEW_ROLE_OPTIONS.map((option) => (
          <button
            key={option.family}
            type="button"
            className="interview-role-chip"
            aria-pressed={selectedKey === roleKey(option.label)}
            disabled={disabled}
            onClick={() => adopt(option.label)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="interview-role-selector__search">
        <label htmlFor="interview-target-role">Search or enter another role</label>
        <input
          id="interview-target-role"
          className="field-control"
          type="search"
          role="combobox"
          required
          aria-label="Target role"
          aria-autocomplete="list"
          aria-controls="interview-role-options"
          aria-expanded={showResults}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "interview-target-role-error" : undefined}
          disabled={disabled}
          value={query}
          maxLength={200}
          placeholder="Search or type a custom role…"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        {showResults ? (
          <div
            id="interview-role-options"
            className="interview-role-selector__results"
            role="listbox"
            aria-label="Matching roles"
          >
            {filtered.map((option) => (
              <button
                key={option.family}
                type="button"
                role="option"
                aria-selected={selectedKey === roleKey(option.label)}
                disabled={disabled}
                onClick={() => adopt(option.label)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {showCustomAction ? (
          <button
            type="button"
            className="interview-role-selector__custom-action interview-secondary-button"
            disabled={disabled}
            onClick={() => adopt(trimmedQuery)}
          >
            {`Use “${trimmedQuery}”`}
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          className="field-error interview-field-error"
          id="interview-target-role-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
