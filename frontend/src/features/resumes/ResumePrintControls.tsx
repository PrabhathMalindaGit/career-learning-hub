import type { ResumeDesign } from "./types";

export type ResumeExportReadiness =
  | { eligible: true; message: "Ready to print / save as PDF" }
  | { eligible: false; reasonId: string; message: string };

interface ResumePrintControlsProps {
  sourceKind: "current" | "historical";
  versionNumber: number;
  pageSize: ResumeDesign["pageSize"];
  readiness: ResumeExportReadiness;
  suggestedFilename: string;
  pageSizeSaving: boolean;
  printPreparing: boolean;
  sourceLoading?: boolean;
  error?: {
    message: string;
    requestId?: string;
  };
  onPageSizeChange: (pageSize: ResumeDesign["pageSize"]) => void;
  onPrint: () => void;
}

// Feature 3.8 — Print / Save as PDF paper-size and “Open print dialog” controls.
export function ResumePrintControls({
  sourceKind,
  versionNumber,
  pageSize,
  readiness,
  suggestedFilename,
  pageSizeSaving,
  printPreparing,
  sourceLoading = false,
  error,
  onPageSizeChange,
  onPrint,
}: ResumePrintControlsProps) {
  const sourceLabel =
    sourceKind === "historical"
      ? `Historical Version ${versionNumber}`
      : `Current saved version — Version ${versionNumber}`;
  const interactionDisabled = pageSizeSaving || printPreparing;

  return (
    <section
      className="resume-panel resume-print-controls"
      aria-labelledby="resume-print-controls-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Browser printing</p>
          <h2 id="resume-print-controls-title">Print / Save as PDF</h2>
        </div>
      </header>

      <p className="resume-muted-copy">
        Choose “Save as PDF” in your browser. Turn off “Headers and footers”
        for a clean Resume PDF.
      </p>

      <div className="resume-export-readiness">
        <p className="resume-export-readiness-source">{sourceLabel}</p>
        <p
          id={readiness.eligible ? undefined : readiness.reasonId}
          className={
            readiness.eligible
              ? "resume-export-ready"
              : "resume-export-blocked"
          }
        >
          {readiness.message}
        </p>
        <p>Page size: {pageSize === "LETTER" ? "Letter" : "A4"}</p>
        <p>Suggested filename: {suggestedFilename}</p>
      </div>

      <div className="resume-print-control-row">
        <label>
          Paper size
          <select
            value={pageSize}
            disabled={interactionDisabled}
            onChange={(event) =>
              onPageSizeChange(
                event.target.value as ResumeDesign["pageSize"],
              )
            }
          >
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
          </select>
        </label>
        {/* =========================================================
            FIND: PRINT RESUME
            TYPE: UI
            FILE: frontend/src/features/resumes/ResumePrintControls.tsx
            STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
            STYLE SELECTOR: .resume-print-controls
            ========================================================= */}
        <button
          className="resume-primary-button"
          type="button"
          aria-label={`Open print dialog for saved version ${versionNumber}`}
          disabled={!readiness.eligible || sourceLoading || interactionDisabled}
          aria-describedby={readiness.eligible ? undefined : readiness.reasonId}
          aria-busy={printPreparing}
          onClick={onPrint}
        >
          {/* Feature 3.8 UI — Print / Save as PDF. */}
          {printPreparing ? "Preparing print…" : "Open print dialog"}
        </button>
      </div>

      {pageSizeSaving ? (
        <p className="resume-inline-guidance" role="status">
          Saving paper size…
        </p>
      ) : null}
      {error ? (
        <div className="resume-notice resume-notice-error" role="alert">
          <span>{error.message}</span>
          {error.requestId ? (
            <small>Request ID: {error.requestId}</small>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
