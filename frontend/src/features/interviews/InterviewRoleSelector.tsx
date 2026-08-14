import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import "./interviewCreateGuidance.css";

export interface InterviewRoleSelectorProps {
  roleOptions: readonly string[];
  value: string;
  disabled?: boolean;
  error?: string;
  onChange(next: string): void;
}

function roleKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function InterviewRoleSelector({
  roleOptions,
  value,
  disabled = false,
  error,
  onChange,
}: InterviewRoleSelectorProps) {
  const [query, setQuery] = useState(value);
  const preserveQueryOnSelectionClear = useRef(false);
  const trimmedQuery = query.trim();
  const normalizedQuery = roleKey(trimmedQuery);
  const selectedKey = roleKey(value);

  useEffect(() => {
    if (value === "" && preserveQueryOnSelectionClear.current) {
      preserveQueryOnSelectionClear.current = false;
      return;
    }
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return [];
    return roleOptions.filter((option) =>
      roleKey(option).includes(normalizedQuery),
    );
  }, [normalizedQuery, roleOptions]);

  const exactBuiltIn = roleOptions.find(
    (option) => roleKey(option) === normalizedQuery,
  );
  const showResults = normalizedQuery.length > 0 && filtered.length > 0;
  const showCustomAction = normalizedQuery.length > 0 && !exactBuiltIn;

  function adopt(next: string) {
    preserveQueryOnSelectionClear.current = false;
    onChange(next);
    setQuery(next);
  }

  function editQuery(next: string) {
    setQuery(next);
    if (value && roleKey(next) !== selectedKey) {
      preserveQueryOnSelectionClear.current = true;
      onChange("");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || filtered.length !== 1) return;
    event.preventDefault();
    adopt(filtered[0]!);
  }

  return (
    <div className="interview-role-selector">
      <div className="interview-role-selector__heading">
        <label htmlFor="interview-target-role">Target role</label>
        {value ? <small>Selected: {value}</small> : <small>Choose one role</small>}
      </div>

      {roleOptions.length > 0 ? (
        <div
          className="interview-role-selector__shortcuts"
          aria-label="Suggested roles"
        >
          {roleOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="interview-role-chip"
              aria-pressed={selectedKey === roleKey(option)}
              disabled={disabled}
              onClick={() => adopt(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <small className="interview-role-selector__empty">
          Enter the role you want to practise for.
        </small>
      )}

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
          onChange={(event) => editQuery(event.target.value)}
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
                key={option}
                type="button"
                role="option"
                aria-selected={selectedKey === roleKey(option)}
                disabled={disabled}
                onClick={() => adopt(option)}
              >
                {option}
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
