import type { ResumeTemplateId } from "./resumeTemplateRegistry";
import type { ResumeDraft } from "./types";
import {
  ResumeCertificationsSection,
  ResumeEducationSection,
  ResumeExperienceSection,
  ResumeIdentityHeader,
  ResumeInterestsSection,
  ResumeLanguagesSection,
  ResumeProjectsSection,
  ResumeSkillsSection,
  ResumeSummarySection,
} from "./ResumeTemplateContent";

export interface ResumeTemplateLayoutProps {
  readonly draft: ResumeDraft;
  readonly templateId: ResumeTemplateId;
  readonly showCandidatePhoto: boolean;
  readonly candidatePhotoUrl?: string;
}

type ShellProps = Omit<ResumeTemplateLayoutProps, "templateId">;

function AtsClassicLayout(props: ShellProps) {
  const { draft } = props;
  return (
    <div
      data-resume-layout="ats-classic"
      className="resume-layout resume-layout--ats-classic"
    >
      <ResumeIdentityHeader {...props} variant="classic" />
      <ResumeSummarySection draft={draft} />
      <ResumeExperienceSection draft={draft} />
      <ResumeEducationSection draft={draft} />
      <ResumeSkillsSection draft={draft} />
      <ResumeProjectsSection draft={draft} />
      <ResumeCertificationsSection draft={draft} />
      <ResumeLanguagesSection draft={draft} />
      <ResumeInterestsSection draft={draft} />
    </div>
  );
}

function ModernProfessionalLayout(props: ShellProps) {
  const { draft } = props;
  return (
    <div
      data-resume-layout="modern-professional"
      className="resume-layout resume-layout--modern"
    >
      <ResumeIdentityHeader {...props} variant="modern" />
      <div className="resume-modern-columns">
        <div
          data-resume-region="modern-content"
          className="resume-modern-content"
        >
          <ResumeSummarySection draft={draft} />
          <ResumeExperienceSection draft={draft} />
          <ResumeProjectsSection draft={draft} />
        </div>
        <aside
          data-resume-region="modern-sidebar"
          className="resume-modern-sidebar"
          aria-label="Supporting resume details"
        >
          <ResumeSkillsSection draft={draft} />
          <ResumeEducationSection draft={draft} />
          <ResumeCertificationsSection draft={draft} />
          <ResumeLanguagesSection draft={draft} />
          <ResumeInterestsSection draft={draft} />
        </aside>
      </div>
    </div>
  );
}

function CompactTechnicalLayout(props: ShellProps) {
  const { draft } = props;
  return (
    <div
      data-resume-layout="compact-technical"
      className="resume-layout resume-layout--technical"
    >
      <ResumeIdentityHeader {...props} variant="technical" />
      <ResumeSummarySection draft={draft} />
      <ResumeSkillsSection draft={draft} />
      <ResumeExperienceSection draft={draft} entryLayout="technical-rail" />
      <ResumeProjectsSection draft={draft} entryLayout="technical-rail" />
      <ResumeEducationSection draft={draft} />
      <ResumeCertificationsSection draft={draft} />
      <ResumeLanguagesSection draft={draft} />
      <ResumeInterestsSection draft={draft} />
    </div>
  );
}

export function ResumeTemplateLayout(props: ResumeTemplateLayoutProps) {
  const shellProps: ShellProps = {
    draft: props.draft,
    showCandidatePhoto: props.showCandidatePhoto,
    ...(props.candidatePhotoUrl !== undefined
      ? { candidatePhotoUrl: props.candidatePhotoUrl }
      : {}),
  };

  switch (props.templateId) {
    case "modern-professional":
      return <ModernProfessionalLayout {...shellProps} />;
    case "compact-technical":
      return <CompactTechnicalLayout {...shellProps} />;
    case "ats-classic":
    default:
      return <AtsClassicLayout {...shellProps} />;
  }
}
