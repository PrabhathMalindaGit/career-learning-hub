import { resumeContentInputToDraft } from "./resumeDraft";
import { ResumePreview } from "./ResumePreview";
import type { ResumeContentInput, ResumeDesign } from "./types";

interface ResumeRecoveryReviewProps {
  content: ResumeContentInput;
  baselineVersionNumber: number;
  currentVersionNumber: number;
  design: ResumeDesign;
  candidatePhotoUrl?: string;
  discardError: boolean;
  onDiscard: () => void;
}

export function ResumeRecoveryReview({
  content,
  baselineVersionNumber,
  currentVersionNumber,
  design,
  candidatePhotoUrl,
  discardError,
  onDiscard,
}: ResumeRecoveryReviewProps) {
  return (
    <main
      className="resume-recovery-review"
      aria-labelledby="resume-recovery-review-title"
    >
      <header className="resume-recovery-review-warning">
        <p className="resume-kicker">Read-only recovery review</p>
        <h1 id="resume-recovery-review-title">
          Recovered unsaved draft — based on an older saved version
        </h1>
        <p>
          This content is not the current Resume. It cannot be saved or
          exported. You may select and copy useful text before discarding it.
        </p>
        <div className="resume-recovery-version-context">
          <span>Recovered draft based on Version {baselineVersionNumber}</span>
          <span>Current saved Resume: Version {currentVersionNumber}</span>
        </div>
      </header>

      <ResumePreview
        draft={resumeContentInputToDraft(content)}
        label="Recovered draft preview"
        headingId="resume-recovery-preview-title"
        ariaLabel="Recovered unsaved Resume draft preview"
        pageSize={design.pageSize}
        design={design}
        candidatePhotoUrl={candidatePhotoUrl}
      />

      {discardError ? (
        <p className="resume-dialog-error" role="alert">
          Local recovery could not be discarded. Please try again.
        </p>
      ) : null}
      <div className="resume-dialog-actions">
        <button
          type="button"
          className="destructive-button resume-danger-button"
          onClick={onDiscard}
        >
          Discard recovery and return to current Resume
        </button>
      </div>
    </main>
  );
}
