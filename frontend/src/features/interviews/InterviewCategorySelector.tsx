import { useState, type FormEvent } from "react";
import "./interviewCategorySelector.css";

function categoryKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function canonicalInterviewCategorySuggestions(
  focusTopics: readonly string[],
  skillGaps: readonly string[],
): string[] {
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const raw of [...focusTopics, ...skillGaps]) {
    const value = raw.trim();
    const key = categoryKey(value);
    if (!value || seen.has(key)) continue;
    seen.add(key);
    suggestions.push(value);
    if (suggestions.length >= 50) break;
  }

  return suggestions;
}

export interface InterviewCategorySelectorProps {
  contextCategories: readonly string[];
  selected: string[];
  disabled?: boolean;
  onSelectedChange(next: string[]): void;
}

export function InterviewCategorySelector({
  contextCategories,
  selected,
  disabled = false,
  onSelectedChange,
}: InterviewCategorySelectorProps) {
  const [customDraft, setCustomDraft] = useState("");
  const contextByKey = new Map(
    contextCategories.map((category) => [categoryKey(category), category]),
  );
  const selectedKeys = new Set(selected.map(categoryKey));
  const customSelected = selected.filter(
    (category) => !contextByKey.has(categoryKey(category)),
  );

  function toggleContext(category: string) {
    const key = categoryKey(category);
    if (selectedKeys.has(key)) {
      onSelectedChange(
        selected.filter((value) => categoryKey(value) !== key),
      );
      return;
    }
    onSelectedChange([...selected, category].slice(0, 50));
  }

  function addCustom(event: FormEvent) {
    event.preventDefault();
    const value = customDraft.trim();
    if (!value) return;

    const key = categoryKey(value);
    if (selectedKeys.has(key)) {
      setCustomDraft("");
      return;
    }

    const canonicalContext = contextByKey.get(key);
    onSelectedChange(
      [...selected, canonicalContext ?? value].slice(0, 50),
    );
    setCustomDraft("");
  }

  function removeCustom(category: string) {
    const key = categoryKey(category);
    onSelectedChange(
      selected.filter((value) => categoryKey(value) !== key),
    );
  }

  return (
    <section
      className="interview-category-selector"
      aria-labelledby="interview-category-selector-title"
    >
      <div className="interview-category-selector__heading">
        <div>
          <strong id="interview-category-selector-title">Categories</strong>
          <small>Suggested from session context</small>
        </div>
        <small aria-live="polite">
          {selected.length} {selected.length === 1 ? "category" : "categories"}{" "}
          selected
        </small>
      </div>

      {contextCategories.length > 0 ? (
        <div
          className="interview-category-selector__suggestions"
          aria-label="Session-context category suggestions"
        >
          {contextCategories.map((category) => {
            const pressed = selectedKeys.has(categoryKey(category));
            return (
              <button
                key={categoryKey(category)}
                type="button"
                className="interview-category-chip"
                aria-pressed={pressed}
                disabled={disabled}
                onClick={() => toggleContext(category)}
              >
                <span aria-hidden="true">{pressed ? "✓" : "+"}</span>
                {category}
              </button>
            );
          })}
        </div>
      ) : (
        <small className="interview-category-selector__empty">
          No session topics are available yet. Add a custom category if useful.
        </small>
      )}

      <form
        className="interview-category-selector__custom"
        onSubmit={addCustom}
      >
        <label htmlFor="interview-custom-category">Custom categories</label>
        <div className="interview-category-selector__custom-row">
          <input
            id="interview-custom-category"
            value={customDraft}
            maxLength={120}
            disabled={disabled || selected.length >= 50}
            placeholder="Add a category…"
            onChange={(event) => setCustomDraft(event.target.value)}
          />
          <button
            type="submit"
            className="interview-secondary-button"
            disabled={
              disabled || selected.length >= 50 || !customDraft.trim()
            }
          >
            Add
          </button>
        </div>
      </form>

      {customSelected.length > 0 ? (
        <div
          className="interview-category-selector__custom-list"
          aria-label="Custom categories"
        >
          {customSelected.map((category) => (
            <span
              className="interview-category-selector__custom-chip"
              key={categoryKey(category)}
            >
              {category}
              <button
                type="button"
                aria-label={`Remove ${category}`}
                disabled={disabled}
                onClick={() => removeCustom(category)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
