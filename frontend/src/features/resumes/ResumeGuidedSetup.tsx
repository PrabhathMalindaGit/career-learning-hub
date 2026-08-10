import { useId, useRef, useState } from "react";
import {
  JOB_TITLE_SUGGESTIONS,
  SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL,
  buildGuidedResumeContent,
  suggestedSkillsForRole,
  type ExperienceLevel,
} from "./resumeGuidance";
import { ResumeSkillPicker } from "./ResumeSkillPicker";
import type { CreateResumeInput, DraftSkill } from "./types";

export interface ResumeGuidedSetupProps {
  disabled?: boolean;
  onBack(): void;
  onSubmit(input: CreateResumeInput): Promise<void>;
}

function validTitle(value: string): boolean {
  const length = value.trim().length;
  return length >= 1 && length <= 120;
}

export function ResumeGuidedSetup({
  disabled = false,
  onBack,
  onSubmit,
}: ResumeGuidedSetupProps) {
  const roleListId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("entry");
  const [skills, setSkills] = useState<DraftSkill[]>([]);
  const [useTargetRoleAsHeadline, setUseTargetRoleAsHeadline] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = disabled || submitting;
  const suggestedSkills = suggestedSkillsForRole(targetRole);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!validTitle(title)) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    setTitleError(false);
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: buildGuidedResumeContent({
          targetRole,
          useTargetRoleAsHeadline,
          skills,
        }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="resume-guided-setup" onSubmit={(event) => void submit(event)} noValidate>
      <div className="resume-guided-intro">
        <h3>Guided setup</h3>
        <p>Choose only suggestions that are true for you. Everything remains editable.</p>
      </div>

      <section className="resume-guided-details" aria-labelledby={`${roleListId}-details`}>
        <div className="resume-guided-group-heading">
          <h4 id={`${roleListId}-details`}>Resume details</h4>
          <p>Set a private working title and optional role guidance.</p>
        </div>
        <label className="field-label required-label">
          Resume title
          <input
            ref={titleRef}
            className="field-control"
            value={title}
            maxLength={120}
            required
            disabled={busy}
            aria-invalid={titleError}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        {titleError ? (
          <p className="field-error">Enter a title with 1–120 characters.</p>
        ) : null}

        <label className="field-label">
          Target role
          <input
            className="field-control"
            list={roleListId}
            value={targetRole}
            maxLength={120}
            disabled={busy}
            onChange={(event) => setTargetRole(event.target.value)}
          />
        </label>
        <datalist id={roleListId}>
          {JOB_TITLE_SUGGESTIONS.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        <label className="field-label">
          Experience level (guidance only)
          <select
            className="field-control"
            value={experienceLevel}
            disabled={busy}
            onChange={(event) =>
              setExperienceLevel(event.target.value as ExperienceLevel)
            }
          >
            <option value="student">Student</option>
            <option value="entry">Entry level</option>
            <option value="mid">Mid level</option>
            <option value="senior">Senior level</option>
          </select>
        </label>
      </section>

      <section className="resume-guided-sections" aria-labelledby={`${roleListId}-sections`}>
        <h4 id={`${roleListId}-sections`}>Suggested sections</h4>
        <p>Guidance only — these do not create Resume content.</p>
        <ul
          className="resume-guided-section-chips"
          aria-label="Suggested Resume sections"
        >
          {SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL[experienceLevel].map(
            (section) => <li key={section}>{section}</li>,
          )}
        </ul>
      </section>

      <ResumeSkillPicker
        value={skills}
        suggestedKeywords={suggestedSkills}
        suggestionLabel={suggestedSkills.length > 0 ? targetRole : undefined}
        disabled={busy}
        onChange={setSkills}
      />

      <div className="resume-guided-footer">
        <label className="resume-checkbox-label">
          <input
            type="checkbox"
            checked={useTargetRoleAsHeadline}
            disabled={busy}
            onChange={(event) => setUseTargetRoleAsHeadline(event.target.checked)}
          />
          <span>Use target role as Resume headline</span>
        </label>

        <div className="resume-dialog-actions">
          <button type="button" disabled={busy} onClick={onBack}>Back</button>
          <button type="submit" className="primary-button" disabled={busy} aria-busy={submitting}>
            {submitting ? "Creating…" : "Create guided resume"}
          </button>
        </div>
      </div>
    </form>
  );
}
