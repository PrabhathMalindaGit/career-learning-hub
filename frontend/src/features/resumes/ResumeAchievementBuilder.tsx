import { useState } from "react";

import {
  EXPERIENCE_ACTION_STARTERS,
  composeAchievement,
} from "./resumeGuidance";

interface ResumeAchievementBuilderProps {
  disabled?: boolean;
  onAdd(text: string): void;
}

export function ResumeAchievementBuilder({
  disabled = false,
  onAdd,
}: ResumeAchievementBuilderProps) {
  const [action, setAction] = useState("");
  const [work, setWork] = useState("");
  const [technology, setTechnology] = useState("");
  const [result, setResult] = useState("");
  const [editedPreview, setEditedPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const composedPreview = composeAchievement({
    action,
    work,
    technology,
    result,
  });
  const preview = editedPreview ?? composedPreview;

  function reset() {
    setAction("");
    setWork("");
    setTechnology("");
    setResult("");
    setEditedPreview(null);
    setError("");
  }

  function addAchievement() {
    if (!action.trim() || !work.trim()) {
      setError("Action and What did you do are required.");
      return;
    }
    if (!preview.trim()) {
      setError("Achievement preview cannot be empty.");
      return;
    }
    onAdd(preview.trim());
    reset();
  }

  return (
    <details className="resume-achievement-builder">
      <summary>Build an achievement</summary>
      <p className="resume-inline-guidance">
        Combine only facts you provide. You can edit the result before adding it.
      </p>
      <div className="resume-form-grid">
        <label>
          Action
          <select
            disabled={disabled}
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setError("");
            }}
          >
            <option value="">Choose an action</option>
            {EXPERIENCE_ACTION_STARTERS.map((starter) => (
              <option key={starter} value={starter}>
                {starter}
              </option>
            ))}
          </select>
        </label>
        <label>
          What did you do?
          <input
            disabled={disabled}
            maxLength={1_000}
            value={work}
            onChange={(event) => {
              setWork(event.target.value);
              setError("");
            }}
          />
        </label>
        <label>
          Technology (optional)
          <input
            disabled={disabled}
            maxLength={500}
            value={technology}
            onChange={(event) => setTechnology(event.target.value)}
          />
        </label>
        <label>
          Result (optional)
          <input
            disabled={disabled}
            maxLength={500}
            value={result}
            onChange={(event) => setResult(event.target.value)}
          />
        </label>
        <label className="resume-field-wide">
          Achievement preview
          <textarea
            disabled={disabled}
            maxLength={2_000}
            rows={3}
            value={preview}
            onChange={(event) => {
              setEditedPreview(event.target.value);
              setError("");
            }}
          />
        </label>
      </div>
      {error ? <p role="alert" className="resume-field-error">{error}</p> : null}
      <button type="button" disabled={disabled} onClick={addAchievement}>
        Add achievement bullet
      </button>
    </details>
  );
}
