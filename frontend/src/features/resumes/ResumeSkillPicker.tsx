import { useId, useMemo, useState } from "react";
import {
  SKILL_CATEGORIES,
  mergeSkillSelections,
  normalizeSkillKey,
  type SkillSelection,
} from "./resumeGuidance";
import type { DraftSkill } from "./types";

export interface ResumeSkillPickerProps {
  value: readonly DraftSkill[];
  suggestedKeywords?: readonly string[];
  suggestionLabel?: string;
  disabled?: boolean;
  onChange(value: DraftSkill[]): void;
}

export function ResumeSkillPicker({
  value,
  suggestedKeywords = [],
  suggestionLabel,
  disabled = false,
  onChange,
}: ResumeSkillPickerProps) {
  const categoryListId = useId();
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [customSkill, setCustomSkill] = useState("");
  const [customGroup, setCustomGroup] = useState("Skills");
  const [status, setStatus] = useState("");
  const query = normalizeSkillKey(search);
  const suggested = suggestedKeywords.filter((keyword, index, all) =>
    all.findIndex(
      (candidate) => normalizeSkillKey(candidate) === normalizeSkillKey(keyword),
    ) === index,
  );
  const categories = useMemo(
    () =>
      SKILL_CATEGORIES.map((category) => ({
        ...category,
        skills: category.skills.filter((skill) =>
          normalizeSkillKey(skill).includes(query),
        ),
      })).filter((category) => category.skills.length > 0),
    [query],
  );

  function toggle(keyword: string, selected: boolean) {
    setChecked((current) => {
      const next = new Set(current);
      const key = normalizeSkillKey(keyword);
      if (selected) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function apply() {
    const selections: SkillSelection[] = SKILL_CATEGORIES.flatMap((category) =>
      category.skills
        .filter((skill) => checked.has(normalizeSkillKey(skill)))
        .map((keyword) => ({ groupName: category.name, keyword })),
    );
    if (customSkill.trim() && customGroup.trim()) {
      selections.push({
        groupName: customGroup,
        keyword: customSkill,
      });
    }
    const next = mergeSkillSelections(value, selections);
    onChange(next);
    const count = next.reduce((total, group) => total + group.keywords.length, 0);
    setStatus(`${count} ${count === 1 ? "skill" : "skills"} applied.`);
    setCustomSkill("");
  }

  function remove(groupIndex: number, keywordIndex: number) {
    const removedKeyword = value[groupIndex]?.keywords[keywordIndex];
    const next = value
      .map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? {
              ...group,
              keywords: group.keywords.filter(
                (_keyword, currentKeywordIndex) =>
                  currentKeywordIndex !== keywordIndex,
              ),
            }
          : { ...group, keywords: [...group.keywords] },
      )
      .filter((group) => group.keywords.length > 0);
    onChange(next);
    if (removedKeyword !== undefined) {
      setChecked((current) => {
        const nextChecked = new Set(current);
        nextChecked.delete(normalizeSkillKey(removedKeyword));
        return nextChecked;
      });
    }
    setStatus("Skill removed.");
  }

  return (
    <div className="resume-skill-picker" role="group" aria-label="Skill picker">
      {suggested.length > 0 ? (
        <fieldset
          className="resume-role-skill-suggestions"
          disabled={disabled}
        >
          <legend>{`Suggested for ${suggestionLabel ?? "this role"}`}</legend>
          <p>Suggestions remain unchecked until you select them.</p>
          <div className="resume-skill-options resume-skill-options--suggested">
            {suggested.map((skill) => (
              <label key={skill}>
                <input
                  type="checkbox"
                  checked={checked.has(normalizeSkillKey(skill))}
                  onChange={(event) => toggle(skill, event.target.checked)}
                />
                <span>{skill}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="resume-selected-skills">
        <strong>Selected skills</strong>
        {value.length > 0 ? (
          <div className="resume-selected-skill-groups">
            {value.map((group, groupIndex) => (
              <div key={group.clientKey}>
                <span>{group.name}</span>
                {group.keywords.map((keyword, keywordIndex) => (
                  <button
                    key={`${normalizeSkillKey(keyword)}-${keywordIndex}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => remove(groupIndex, keywordIndex)}
                  >
                    Remove {keyword}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p>No skills selected yet.</p>
        )}
      </div>

      <details className="resume-skill-catalogue-disclosure">
        <summary>Browse all skills</summary>
        <div className="resume-skill-catalogue-content">
          <label className="field-label">
            Search skills
            <input
              type="search"
              className="field-control"
              value={search}
              disabled={disabled}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="resume-skill-catalogue">
            {categories.map((category) => (
              <fieldset key={category.name} disabled={disabled}>
                <legend>{category.name}</legend>
                <div className="resume-skill-options">
                  {category.skills.map((skill) => (
                    <label key={skill}>
                      <input
                        type="checkbox"
                        checked={checked.has(normalizeSkillKey(skill))}
                        onChange={(event) => toggle(skill, event.target.checked)}
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </details>

      <div className="resume-skill-custom-helper">
        <strong>Add a custom skill</strong>
        <div className="resume-skill-custom">
          <label className="field-label">
            Custom skill
            <input
              className="field-control"
              value={customSkill}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => setCustomSkill(event.target.value)}
            />
          </label>
          <label className="field-label">
            Custom skill group
            <input
              className="field-control"
              list={categoryListId}
              value={customGroup}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => setCustomGroup(event.target.value)}
            />
          </label>
          <datalist id={categoryListId}>
            {SKILL_CATEGORIES.map((category) => (
              <option key={category.name} value={category.name} />
            ))}
          </datalist>
        </div>
      </div>

      <button
        type="button"
        className="secondary-button resume-skill-apply"
        disabled={disabled}
        onClick={apply}
      >
        Add selected skills
      </button>
      <p role="status" aria-live="polite">{status}</p>
    </div>
  );
}
