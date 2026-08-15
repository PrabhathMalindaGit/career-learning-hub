import {
  resolveResumePresentation,
  type ResumeFontFamily,
  type ResumePaletteId,
  type ResumeTemplateId,
} from "./resumeTemplateRegistry";
import "./resumeTemplateDifferentiation.css";

interface ResumeMiniDocumentProps {
  readonly templateId: ResumeTemplateId | string;
  readonly colorPaletteId: ResumePaletteId | string;
  readonly fontFamily?: ResumeFontFamily | string;
  readonly context: "card" | "template";
}

function ClassicMiniature() {
  return (
    <span
      data-mini-layout="classic-stack"
      className="resume-mini-layout resume-mini-layout--classic"
    >
      <span className="resume-mini-identity" />
      <span className="resume-mini-stack-line resume-mini-stack-line--wide" />
      <span className="resume-mini-stack-line" />
      <span className="resume-mini-stack-line resume-mini-stack-line--short" />
      <span className="resume-mini-stack-line resume-mini-stack-line--wide" />
      <span className="resume-mini-stack-line" />
    </span>
  );
}

function ModernMiniature() {
  return (
    <span
      data-mini-layout="modern-sidebar"
      className="resume-mini-layout resume-mini-layout--modern"
    >
      <span className="resume-mini-modern-header" />
      <span className="resume-mini-modern-main" />
      <span className="resume-mini-modern-sidebar" />
    </span>
  );
}

function TechnicalMiniature() {
  return (
    <span
      data-mini-layout="technical-rail"
      className="resume-mini-layout resume-mini-layout--technical"
    >
      <span className="resume-mini-technical-header" />
      <span className="resume-mini-technical-rail" />
      <span className="resume-mini-technical-content" />
    </span>
  );
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

  const miniature =
    resolvedTemplateId === "modern-professional" ? (
      <ModernMiniature />
    ) : resolvedTemplateId === "compact-technical" ? (
      <TechnicalMiniature />
    ) : (
      <ClassicMiniature />
    );

  return (
    <span
      className={`resume-mini-document resume-mini-document--${resolvedTemplateId} ${resolved.font.option.className} ${resolved.palette.option.className}`}
      {...(context === "template"
        ? { "data-template-preview": resolvedTemplateId }
        : { "data-resume-card-preview": resolvedTemplateId })}
      aria-hidden="true"
    >
      {miniature}
    </span>
  );
}
