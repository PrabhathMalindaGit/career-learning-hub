import {
  resolveResumePresentation,
  type ResumeFontFamily,
  type ResumePaletteId,
  type ResumeTemplateId,
} from "./resumeTemplateRegistry";

interface ResumeMiniDocumentProps {
  readonly templateId: ResumeTemplateId | string;
  readonly colorPaletteId: ResumePaletteId | string;
  readonly fontFamily?: ResumeFontFamily | string;
  readonly context: "card" | "template";
}

export function ResumeMiniDocument({
  templateId,
  colorPaletteId,
  fontFamily,
  context,
}: ResumeMiniDocumentProps) {
  const resolved = resolveResumePresentation({
    templateId,
    colorPaletteId,
    fontFamily,
  });
  const resolvedTemplateId = resolved.template.option.id;

  return (
    <span
      className={`resume-mini-document resume-mini-document--${resolvedTemplateId} ${resolved.font.option.className} ${resolved.palette.option.className}`}
      {...(context === "template"
        ? { "data-template-preview": resolvedTemplateId }
        : { "data-resume-card-preview": resolvedTemplateId })}
      aria-hidden="true"
    >
      <span className="resume-mini-document__header">
        <span className="resume-mini-document__name" />
        <span className="resume-mini-document__role" />
        <span className="resume-mini-document__contact" />
      </span>
      <span className="resume-mini-document__section">
        <span className="resume-mini-document__section-title" />
        <span className="resume-mini-document__line resume-mini-document__line--long" />
        <span className="resume-mini-document__line" />
        <span className="resume-mini-document__line resume-mini-document__line--short" />
      </span>
      <span className="resume-mini-document__section">
        <span className="resume-mini-document__section-title" />
        <span className="resume-mini-document__line resume-mini-document__line--long" />
        <span className="resume-mini-document__line" />
      </span>
    </span>
  );
}
