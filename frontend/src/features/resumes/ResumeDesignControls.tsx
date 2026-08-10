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
  resolveResumePresentation,
  type ResumePresentationSelection,
} from "./resumeTemplateRegistry";
import { ResumeMiniDocument } from "./ResumeMiniDocument";

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
  const [customizing, setCustomizing] = useState(false);

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
  const presentation = resolveResumePresentation(previewSelection(draft));
  const appearanceSummary = [
    presentation.template.option.label,
    presentation.font.option.value,
    presentation.palette.option.label,
    design.pageSize === "LETTER" ? "Letter" : "A4",
  ].join(" • ");

  const updateDraft = (next: DraftSelection) => {
    setDraft(next);
    onPreviewChange(previewSelection(next));
  };

  return (
    <section className="resume-design-panel" aria-label="Resume design controls">
      <fieldset className="resume-design-fieldset" disabled={saving}>
        <legend>Resume appearance</legend>
        <div className="resume-design-overview">
          <div>
            <p className="resume-design-current">{appearanceSummary}</p>
            <p className="resume-design-summary">
              Preview changes immediately, then save the choices you want to keep.
            </p>
          </div>
          <button
            type="button"
            className="resume-secondary-button resume-design-customize"
            aria-expanded={customizing}
            aria-controls="resume-design-customization"
            onClick={() => setCustomizing((current) => !current)}
          >
            {customizing ? "Close customization" : "Customize"}
          </button>
        </div>

        {hasUnavailableSavedChoice ? (
          <p className="resume-design-fallback-note" role="status">
            Some saved design choices are no longer available. The preview uses ATS
            Classic, Slate, and Inter until you explicitly choose approved
            replacements.
          </p>
        ) : null}

        {customizing ? (
          <div
            id="resume-design-customization"
            className="resume-design-customization"
          >
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
                          <ResumeMiniDocument
                            templateId={option.id}
                            colorPaletteId={draft.colorPaletteId}
                            fontFamily={draft.fontFamily}
                            context="template"
                          />
                          <span className="resume-template-card-heading">
                            <strong>{option.label}</strong>
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

              <fieldset className="resume-design-choice-group">
                <legend>Font</legend>
                <div className="resume-font-card-grid">
                  {RESUME_FONTS.map((option) => {
                    const selected = draft.fontFamily === option.value;
                    return (
                      <label
                        className={`resume-choice-card resume-font-card${
                          selected ? " resume-choice-card--selected" : ""
                        }`}
                        key={option.value}
                      >
                        <input
                          type="radio"
                          name="resume-font"
                          value={option.value}
                          checked={selected}
                          disabled={saving}
                          onChange={(event) => {
                            const fontFamily = event.currentTarget.value;
                            if (isResumeFontFamily(fontFamily)) {
                              updateDraft({ ...draft, fontFamily });
                            }
                          }}
                        />
                        <span className="resume-choice-card-content">
                          <span
                            className="resume-font-card-preview"
                            data-font-preview={option.value}
                            style={{ fontFamily: option.stack }}
                            aria-hidden="true"
                          >
                            Shape the work. Show the impact.
                          </span>
                          <span className="resume-choice-card-heading">
                            <strong>{option.value}</strong>
                          </span>
                          <span className="resume-choice-card-description">
                            {option.label}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="resume-design-choice-group">
                <legend>Palette</legend>
                <div className="resume-palette-card-grid">
                  {RESUME_PALETTES.map((option) => {
                    const selected = draft.colorPaletteId === option.id;
                    return (
                      <label
                        className={`resume-choice-card resume-palette-card${
                          selected ? " resume-choice-card--selected" : ""
                        }`}
                        key={option.id}
                      >
                        <input
                          type="radio"
                          name="resume-palette"
                          value={option.id}
                          checked={selected}
                          disabled={saving}
                          onChange={(event) => {
                            const colorPaletteId = event.currentTarget.value;
                            if (isResumePaletteId(colorPaletteId)) {
                              updateDraft({ ...draft, colorPaletteId });
                            }
                          }}
                        />
                        <span className="resume-choice-card-content">
                          <span
                            className={`resume-palette-card-preview ${option.className}`}
                            data-palette-preview={option.id}
                            aria-hidden="true"
                          >
                            <span className="resume-palette-card-heading">Aa</span>
                            <span className="resume-palette-card-body" />
                            <span className="resume-palette-card-body resume-palette-card-body--short" />
                            <span className="resume-palette-card-accent" />
                          </span>
                          <span className="resume-choice-card-heading">
                            <strong>{option.label}</strong>
                          </span>
                          <span className="resume-choice-card-description">
                            Heading, body, and accent roles
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <p className="resume-design-history-note">
              Historical saved content uses this current design because design
              choices are not saved with each version.
            </p>
          </div>
        ) : null}

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

        {customizing || dirty || saving || status ? (
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
        ) : null}
      </fieldset>
    </section>
  );
}

export type { ResumeDesignStatus };
