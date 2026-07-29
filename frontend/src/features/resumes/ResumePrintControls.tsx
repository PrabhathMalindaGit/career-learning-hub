import type { ResumeDesign } from "./types";

interface ResumePrintControlsProps {
  sourceKind: "current" | "historical";
  versionNumber: number;
  pageSize: ResumeDesign["pageSize"];
  dirty: boolean;
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

export function ResumePrintControls({
  sourceKind,
  versionNumber,
  pageSize,
  dirty,
  pageSizeSaving,
  printPreparing,
  sourceLoading = false,
  error,
  onPageSizeChange,
  onPrint,
}: ResumePrintControlsProps) {
  const sourceLabel =
    sourceKind === "historical"
      ? `Historical saved version ${versionNumber}`
      : `Current saved version ${versionNumber}`;
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
        <span className="resume-status">{sourceLabel}</span>
      </header>

      <p className="resume-muted-copy">
        This opens your browser print dialog. Choose Save as PDF there if
        needed. The browser controls the final filename and PDF settings.
      </p>

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
        <button
          className="resume-primary-button"
          type="button"
          aria-label={`Open print dialog for saved version ${versionNumber}`}
          disabled={dirty || sourceLoading || interactionDisabled}
          aria-busy={printPreparing}
          onClick={onPrint}
        >
          {printPreparing ? "Preparing print…" : "Open print dialog"}
        </button>
      </div>

      {pageSizeSaving ? (
        <p className="resume-inline-guidance" role="status">
          Saving paper size…
        </p>
      ) : null}
      {sourceLoading ? (
        <p className="resume-inline-guidance" role="status">
          Loading the selected saved version before printing…
        </p>
      ) : null}
      {dirty ? (
        <p className="resume-disclaimer" role="status">
          Printing is blocked because the editor has unsaved changes. Save
          New Version or Discard before printing a saved version.
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
