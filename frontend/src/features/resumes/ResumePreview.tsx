import type { ResumeDesign, ResumeDraft } from "./types";
import {
  DEFAULT_RESUME_FONT,
  DEFAULT_RESUME_PALETTE,
  DEFAULT_RESUME_TEMPLATE,
  resolveResumePresentation,
} from "./resumeTemplateRegistry";
import { ResumeTemplateLayout } from "./ResumeTemplateLayouts";
import "./resumeCandidatePhoto.css";
import "./resumeTemplateDifferentiation.css";

interface ResumePreviewProps {
  draft: ResumeDraft;
  label?: string;
  headingId?: string;
  ariaLabel?: string;
  pageSize?: ResumeDesign["pageSize"];
  design?: ResumeDesign;
  candidatePhotoUrl?: string;
  printOnly?: boolean;
}

export function ResumePreview({
  draft,
  label = "Live preview",
  headingId = "resume-preview-title",
  ariaLabel = "Resume preview",
  pageSize,
  design,
  candidatePhotoUrl,
  printOnly = false,
}: ResumePreviewProps) {
  const resolved = resolveResumePresentation(
    design ?? {
      templateId: DEFAULT_RESUME_TEMPLATE.id,
      fontFamily: DEFAULT_RESUME_FONT.value,
      colorPaletteId: DEFAULT_RESUME_PALETTE.id,
    },
  );
  const effectivePageSize = pageSize ?? design?.pageSize ?? "A4";
  const showCandidatePhoto =
    design?.showProfilePhoto === true && candidatePhotoUrl !== undefined;

  return (
    <section
      className={`resume-panel resume-preview-panel${
        printOnly ? " resume-print-surface" : ""
      }`}
      {...(printOnly
        ? { "aria-label": label }
        : { "aria-labelledby": headingId })}
      tabIndex={printOnly ? undefined : 0}
      data-page-size={effectivePageSize}
    >
      {printOnly ? (
        <style>{`@media print { @page { size: ${
          effectivePageSize === "LETTER" ? "Letter" : "A4"
        }; margin: 12mm; } }`}</style>
      ) : (
        <header className="resume-panel-header">
          <div>
            <p className="resume-kicker">{resolved.template.option.label}</p>
            <h2 id={headingId}>{label}</h2>
          </div>
          <span className="resume-status">
            {effectivePageSize === "LETTER" ? "Letter" : "A4"}
          </span>
        </header>
      )}

      <article
        className={`resume-paper ${resolved.template.option.className} ${resolved.font.option.className} ${resolved.palette.option.className}`}
        data-template={resolved.template.option.id}
        data-font={resolved.font.option.value}
        data-palette={resolved.palette.option.id}
        aria-label={ariaLabel}
      >
        <ResumeTemplateLayout
          draft={draft}
          templateId={resolved.template.option.id}
          showCandidatePhoto={showCandidatePhoto}
          {...(candidatePhotoUrl !== undefined ? { candidatePhotoUrl } : {})}
        />
      </article>
    </section>
  );
}
