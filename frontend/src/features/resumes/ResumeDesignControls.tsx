import { useEffect, useState } from "react";

import type { ResumeDesign } from "./types";
import {
  DEFAULT_RESUME_FONT,
  DEFAULT_RESUME_PALETTE,
  DEFAULT_RESUME_TEMPLATE,
  isResumeFontFamily,
  isResumePaletteId,
  isResumeTemplateId,
  RESUME_FONTS,
  RESUME_PALETTES,
  RESUME_TEMPLATES,
  type ResumePresentationSelection,
} from "./resumeTemplateRegistry";

interface ResumeDesignStatus {
  readonly tone: "success" | "error";
  readonly message: string;
  readonly requestId?: string;
}

interface ResumeDesignControlsProps {
  readonly design: ResumeDesign;
  readonly saving: boolean;
  readonly status?: ResumeDesignStatus;
  readonly onPreviewChange: (selection: ResumePresentationSelection) => void;
  readonly onSave: (selection: ResumePresentationSelection) => void;
}

interface DraftSelection {
  readonly templateId: string;
  readonly fontFamily: string;
  readonly colorPaletteId: string;
}

function safeCanonicalSelection(design: ResumeDesign): DraftSelection {
  return {
    templateId: isResumeTemplateId(design.templateId) ? design.templateId : "",
    fontFamily:
      design.fontFamily && isResumeFontFamily(design.fontFamily)
        ? design.fontFamily
        : "",
    colorPaletteId: isResumePaletteId(design.colorPaletteId)
      ? design.colorPaletteId
      : "",
  };
}

function previewSelection(selection: DraftSelection): ResumePresentationSelection {
  return {
    templateId: isResumeTemplateId(selection.templateId)
      ? selection.templateId
      : DEFAULT_RESUME_TEMPLATE.id,
    fontFamily: isResumeFontFamily(selection.fontFamily)
      ? selection.fontFamily
      : DEFAULT_RESUME_FONT.value,
    colorPaletteId: isResumePaletteId(selection.colorPaletteId)
      ? selection.colorPaletteId
      : DEFAULT_RESUME_PALETTE.id,
  };
}

function completeSelection(
  selection: DraftSelection,
): ResumePresentationSelection | undefined {
  if (
    !isResumeTemplateId(selection.templateId) ||
    !isResumeFontFamily(selection.fontFamily) ||
    !isResumePaletteId(selection.colorPaletteId)
  ) {
    return undefined;
  }

  return {
    templateId: selection.templateId,
    fontFamily: selection.fontFamily,
    colorPaletteId: selection.colorPaletteId,
  };
}

export function ResumeDesignControls({
  design,
  saving,
  status,
  onPreviewChange,
  onSave,
}: ResumeDesignControlsProps) {
  const canonical = safeCanonicalSelection(design);
  const [draft, setDraft] = useState<DraftSelection>(canonical);

  useEffect(() => {
    setDraft(safeCanonicalSelection(design));
  }, [design.colorPaletteId, design.fontFamily, design.templateId]);

  const hasUnavailableSavedChoice =
    canonical.templateId === "" ||
    canonical.fontFamily === "" ||
    canonical.colorPaletteId === "";
  const dirty =
    draft.templateId !== canonical.templateId ||
    draft.fontFamily !== canonical.fontFamily ||
    draft.colorPaletteId !== canonical.colorPaletteId;
  const approvedSelection = completeSelection(draft);

  const updateDraft = (next: DraftSelection) => {
    setDraft(next);
    onPreviewChange(previewSelection(next));
  };

  return (
    <section className="resume-design-panel" aria-label="Resume design controls">
      <fieldset className="resume-design-fieldset" disabled={saving}>
        <legend>Resume design</legend>
        <p className="resume-design-summary">
          Choose a bounded layout, font, and color palette. Changes appear in the
          workspace preview before you save them.
        </p>

        {hasUnavailableSavedChoice ? (
          <p className="resume-design-fallback-note" role="status">
            Some saved design choices are no longer available. The preview uses ATS
            Classic, Slate, and Inter until you explicitly choose approved
            replacements.
          </p>
        ) : null}

        <div className="resume-design-grid">
          <fieldset className="resume-template-choices">
            <legend>Template</legend>
            <div className="resume-template-card-grid">
              {RESUME_TEMPLATES.map((option) => {
                const selected = draft.templateId === option.id;
                return (
                  <label
                    className={`resume-template-card${
                      selected ? " resume-template-card--selected" : ""
                    }`}
                    key={option.id}
                  >
                    <input
                      type="radio"
                      name="resume-template"
                      value={option.id}
                      checked={selected}
                      disabled={saving}
                      onChange={(event) => {
                        const templateId = event.currentTarget.value;
                        if (isResumeTemplateId(templateId)) {
                          updateDraft({ ...draft, templateId });
                        }
                      }}
                    />
                    <span className="resume-template-card-content">
                      <span
                        className="resume-template-card-preview"
                        data-template-preview={option.id}
                        aria-hidden="true"
                      >
                        <span className="resume-template-card-preview-heading" />
                        <span className="resume-template-card-preview-rule" />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="resume-template-card-heading">
                        <strong>{option.label}</strong>
                        {selected ? (
                          <span className="resume-template-card-selected">
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span className="resume-template-card-description">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label>
            <span>Font</span>
            <select
              value={draft.fontFamily}
              disabled={saving}
              onChange={(event) => {
                const fontFamily = event.currentTarget.value;
                if (fontFamily === "" || isResumeFontFamily(fontFamily)) {
                  updateDraft({ ...draft, fontFamily });
                }
              }}
            >
              {canonical.fontFamily === "" ? (
                <option value="" disabled>
                  Saved choice unavailable
                </option>
              ) : null}
              {RESUME_FONTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Palette</span>
            <select
              value={draft.colorPaletteId}
              disabled={saving}
              onChange={(event) => {
                const colorPaletteId = event.currentTarget.value;
                if (
                  colorPaletteId === "" ||
                  isResumePaletteId(colorPaletteId)
                ) {
                  updateDraft({ ...draft, colorPaletteId });
                }
              }}
            >
              {canonical.colorPaletteId === "" ? (
                <option value="" disabled>
                  Saved choice unavailable
                </option>
              ) : null}
              {RESUME_PALETTES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="resume-design-history-note">
          Historical saved content uses this current design because design choices
          are not saved with each version.
        </p>

        {dirty ? (
          <p className="resume-design-dirty-note">Design changes not saved</p>
        ) : null}

        {saving ? (
          <p className="resume-design-status" role="status">
            Saving resume design…
          </p>
        ) : null}

        {status && !saving ? (
          <p
            className={`resume-design-status resume-design-status--${status.tone}`}
            role={status.tone === "error" ? "alert" : "status"}
          >
            {status.message}
            {status.requestId ? (
              <span className="resume-request-id">
                {" "}
                Request ID: {status.requestId}
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="resume-design-actions">
          <button
            type="button"
            className="resume-secondary-button"
            disabled={saving || !dirty}
            onClick={() => {
              setDraft(canonical);
              onPreviewChange(previewSelection(canonical));
            }}
          >
            Reset changes
          </button>
          <button
            type="button"
            className="resume-primary-button"
            disabled={saving || !dirty || approvedSelection === undefined}
            onClick={() => {
              if (approvedSelection) {
                onSave(approvedSelection);
              }
            }}
          >
            Save design
          </button>
        </div>
      </fieldset>
    </section>
  );
}

export type { ResumeDesignStatus };
