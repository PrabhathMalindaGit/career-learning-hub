import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Dialog } from "../../components/Dialog";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import { ResumeGuidedSetup } from "./ResumeGuidedSetup";
import { ResumeImportPhotoChoices } from "./ResumeImportPhotoChoices";
import { ResumePdfUpload } from "./ResumePdfUpload";
import { ResumePreview } from "./ResumePreview";
import {
  confirmResumePdfImport,
  createResume,
  fetchJob,
  importResumePdf,
} from "./resumeApi";
import { resumeContentToDraft } from "./resumeDraft";
import { pollResumeJob } from "./resumePolling";
import type {
  CreateResumeInput,
  ResumeContent,
  ResumeImportPhotoCandidate,
  ResumeJob,
  ResumeWorkspaceData,
} from "./types";

export type ResumeCreateMethod =
  | "choose"
  | "guided"
  | "blank"
  | "import"
  | "review";

export interface ResumeCreateDialogProps {
  open: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose(): void;
  onCreated(workspace: ResumeWorkspaceData): void;
}

type SafeError = {
  message: string;
  requestId?: string;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "The request could not be completed. Try again." };
}

function safeImportError(error: unknown): SafeError {
  if (
    error instanceof ApiError &&
    (error.code === "AI_PROVIDER_NOT_CONFIGURED" ||
      error.code === "PROVIDER_NOT_CONFIGURED")
  ) {
    return {
      message: "PDF import needs a connected Gemini account.",
      requestId: error.requestId,
    };
  }
  return safeError(error);
}

function validTitle(value: string): boolean {
  const length = value.trim().length;
  return length >= 1 && length <= 120;
}

// Features 3.2.1–3.2.3 — Resume creation modes.
// Provides Guided setup, Start blank, and staged private PDF import/review
// before the resulting resume opens in the canonical Resume Studio workspace.
export function ResumeCreateDialog({
  open,
  returnFocusRef,
  onClose,
  onCreated,
}: ResumeCreateDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const titleId = useId();
  const recommendedId = useId();
  const guidedRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const importTitleRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [method, setMethod] = useState<ResumeCreateMethod>("choose");
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [error, setError] = useState<SafeError | null>(null);
  const [busy, setBusy] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitleError, setImportTitleError] = useState(false);
  const [importFileError, setImportFileError] = useState<string>();
  const [importJob, setImportJob] = useState<
    Pick<ResumeJob, "id" | "type" | "status"> | ResumeJob | null
  >(null);
  const [pollPaused, setPollPaused] = useState(false);
  const [importReview, setImportReview] = useState<{
    jobId: string;
    content: ResumeContent;
    photoCandidates: ResumeImportPhotoCandidate[];
  } | null>(null);
  const [selectedImportPhotoAssetId, setSelectedImportPhotoAssetId] = useState<
    string | undefined
  >(undefined);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (open) return;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setMethod("choose");
    setTitle("");
    setTitleError(false);
    setError(null);
    setBusy(false);
    setImportTitle("");
    setImportFile(null);
    setImportTitleError(false);
    setImportFileError(undefined);
    setImportJob(null);
    setPollPaused(false);
    setImportReview(null);
    setSelectedImportPhotoAssetId(undefined);
    setConfirmBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open || method !== "blank") return;
    titleRef.current?.focus();
  }, [method, open]);

  useEffect(() => {
    if (!open || method !== "review") return;
    confirmRef.current?.focus();
  }, [method, open]);

  function choose(
    nextMethod: Exclude<ResumeCreateMethod, "choose" | "review">,
  ) {
    setTitleError(false);
    setError(null);
    setImportTitleError(false);
    setImportFileError(undefined);
    setMethod(nextMethod);
  }

  function backToChooser() {
    if (busy) return;
    setTitleError(false);
    setError(null);
    setImportTitleError(false);
    setImportFileError(undefined);
    setMethod("choose");
    window.setTimeout(() => guidedRef.current?.focus(), 0);
  }

  async function submitBlank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!validTitle(title)) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setTitleError(false);
    setError(null);
    try {
      const workspace = await createResume(
        { title: title.trim() },
        controller.signal,
      );
      if (!controller.signal.aborted) onCreated(workspace);
    } catch (nextError) {
      if (!controller.signal.aborted) setError(safeError(nextError));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  async function submitGuided(input: CreateResumeInput): Promise<void> {
    if (busy) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const workspace = await createResume(input, controller.signal);
      if (!controller.signal.aborted) onCreated(workspace);
    } catch (nextError) {
      if (!controller.signal.aborted) setError(safeError(nextError));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  const startPolling = useCallback(
    async (
      accepted: Pick<ResumeJob, "id" | "type" | "status">,
      controller: AbortController,
    ) => {
      setPollPaused(false);
      const result = await pollResumeJob({
        jobId: accepted.id,
        expectedType: "resume.import-pdf",
        fetchJob,
        signal: controller.signal,
        onUpdate: setImportJob,
      });
      if (controller.signal.aborted) return;
      if (result.reason === "terminal") {
        setImportJob(result.job);
        if (
          result.job.status === "completed" &&
          result.job.result?.kind === "import-review"
        ) {
          setSelectedImportPhotoAssetId(undefined);
          setImportReview({
            jobId: result.job.id,
            content: result.job.result.content,
            photoCandidates: result.job.result.photoCandidates ?? [],
          });
          setMethod("review");
        } else if (
          result.job.status === "completed" &&
          result.job.result?.kind === "import-adopted"
        ) {
          const workspace = await confirmResumePdfImport(
            result.job.id,
            controller.signal,
          );
          if (!controller.signal.aborted) onCreated(workspace);
        }
      } else if (result.reason === "timeout") {
        if (result.job) setImportJob(result.job);
        setPollPaused(true);
      } else if (result.reason === "transport-failure") {
        if (result.job) setImportJob(result.job);
        setPollPaused(true);
        setError(safeImportError(result.error));
      }
    },
    [onCreated],
  );

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const titleInvalid = !validTitle(importTitle);
    setImportTitleError(titleInvalid);
    if (!importFile) setImportFileError("Choose one PDF no larger than 15 MB.");
    if (titleInvalid || !importFile) {
      if (titleInvalid) importTitleRef.current?.focus();
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    setImportTitleError(false);
    setImportFileError(undefined);
    try {
      const accepted = await importResumePdf(
        importTitle.trim(),
        importFile,
        controller.signal,
      );
      setImportJob(accepted);
      await startPolling(accepted, controller);
    } catch (nextError) {
      if (!controller.signal.aborted) setError(safeImportError(nextError));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  async function cancelImport(signal: AbortSignal): Promise<void> {
    if (!importJob || !("progress" in importJob)) return;
    const cancelled = await cancelJob(importJob.id, signal);
    if (signal.aborted) return;
    if (cancelled.id !== importJob.id || cancelled.type !== importJob.type) {
      throw new ApiError(
        502,
        "INVALID_RESUME_JOB",
        "The server returned a mismatched resume job.",
      );
    }
    if (cancelled.status !== "cancelled") {
      setImportJob({
        ...importJob,
        status: "processing",
        phase: cancelled.phase,
        phaseSequence: cancelled.phaseSequence,
        canRetry: cancelled.canRetry,
        updatedAt: cancelled.updatedAt,
      });
      return;
    }
    controllerRef.current?.abort();
    setBusy(false);
    setImportJob({
      ...importJob,
      status: "cancelled",
      phase: cancelled.phase,
      phaseSequence: cancelled.phaseSequence,
      canRetry: cancelled.canRetry,
      updatedAt: cancelled.updatedAt,
    });
  }

  async function retryImport(signal: AbortSignal): Promise<void> {
    if (!importJob || !("progress" in importJob)) return;
    const retried = await retryJob(importJob.id, signal);
    if (signal.aborted) return;
    if (retried.type !== "resume.import-pdf") {
      throw new ApiError(
        502,
        "INVALID_RESUME_JOB",
        "The server returned a mismatched resume job.",
      );
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const accepted = {
      id: retried.id,
      type: "resume.import-pdf" as const,
      status: "queued" as const,
    };
    setImportJob(accepted);
    setBusy(true);
    await startPolling(accepted, controller).finally(() => {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    });
  }

  function backToImport() {
    if (confirmBusy) return;
    setError(null);
    setImportReview(null);
    setSelectedImportPhotoAssetId(undefined);
    setImportJob(null);
    setPollPaused(false);
    setMethod("import");
    window.setTimeout(() => importTitleRef.current?.focus(), 0);
  }

  async function confirmImport(): Promise<void> {
    if (!importReview || confirmBusy) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setConfirmBusy(true);
    setError(null);
    try {
      const workspace = selectedImportPhotoAssetId
        ? await confirmResumePdfImport(
            importReview.jobId,
            controller.signal,
            selectedImportPhotoAssetId,
          )
        : await confirmResumePdfImport(importReview.jobId, controller.signal);
      if (!controller.signal.aborted) onCreated(workspace);
    } catch (nextError) {
      if (!controller.signal.aborted) setError(safeError(nextError));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setConfirmBusy(false);
      }
    }
  }

  function extractedCount(count: number): string {
    if (count === 0) return "Not found";
    return `${count} ${count === 1 ? "entry" : "entries"} extracted`;
  }

  return (
    <Dialog
      open={open}
      labelledBy={headingId}
      describedBy={descriptionId}
      initialFocusRef={guidedRef}
      returnFocusRef={returnFocusRef}
      onCancel={onClose}
      canDismissOnEscape={!busy && !confirmBusy}
      className="resume-dialog resume-create-dialog-shell"
    >
      <div className="resume-create-dialog">
        <div className="resume-create-dialog-intro">
          <h2 id={headingId}>Create Resume</h2>
          <p id={descriptionId}>
            Choose how you want to begin. Everything you add remains editable.
          </p>
        </div>

        {method === "choose" ? (
          <div className="resume-create-methods">
            {/* =========================================================
                FIND: GUIDED SETUP
                TYPE: UI
                FILE: frontend/src/features/resumes/ResumeCreateDialog.tsx
                STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
                STYLE SELECTOR: .resume-create-methods > .resume-create-method--recommended
                ========================================================= */}
            <button
              ref={guidedRef}
              type="button"
              aria-label="Guided setup"
              aria-describedby={recommendedId}
              className="resume-create-method resume-create-method--recommended"
              onClick={() => choose("guided")}
            >
              <span id={recommendedId} className="resume-create-method-badge">
                Recommended
              </span>
              {/* Feature 3.2.1 UI — Guided setup. */}
              <strong>Guided setup</strong>
              <span>Build a resume using editable suggestions.</span>
            </button>
            {/* =========================================================
                FIND: START BLANK
                TYPE: UI
                FILE: frontend/src/features/resumes/ResumeCreateDialog.tsx
                STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
                STYLE SELECTOR: .resume-create-methods > button
                ========================================================= */}
            <button
              type="button"
              aria-label="Start blank"
              className="resume-create-method"
              onClick={() => choose("blank")}
            >
              {/* Feature 3.2.2 UI — Start blank. */}
              <strong>Start blank</strong>
              <span>Create an empty resume.</span>
            </button>
            {/* =========================================================
                FIND: IMPORT RESUME PDF
                TYPE: UI
                FILE: frontend/src/features/resumes/ResumeCreateDialog.tsx
                STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
                STYLE SELECTOR: .resume-create-methods > button
                BACKEND: resumeAnalysis.jobs.ts -> FIND: IMPORT RESUME PDF BACKEND
                ========================================================= */}
            <button
              type="button"
              aria-label="Import PDF"
              className="resume-create-method"
              onClick={() => choose("import")}
            >
              {/* Feature 3.2.3 UI — Import PDF. */}
              <strong>Import PDF</strong>
              <span>Import an existing resume.</span>
            </button>
            <div className="resume-dialog-actions resume-create-methods-footer">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {method === "blank" ? (
          <form
            className="resume-create-blank"
            onSubmit={(event) => void submitBlank(event)}
            noValidate
          >
            <h3>Start blank</h3>
            <p>Begin with an empty Resume and add only the details you choose.</p>
            <div className="field-shell">
              <label className="field-label required-label" htmlFor={titleId}>
                Resume title
              </label>
              <input
                ref={titleRef}
                id={titleId}
                className="field-control"
                value={title}
                maxLength={120}
                required
                aria-invalid={titleError}
                aria-describedby={titleError ? `${titleId}-error` : undefined}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            {titleError ? (
              <p id={`${titleId}-error`} className="field-error">
                Enter a title with 1–120 characters.
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="field-error">
                {error.message}
                {error.requestId ? ` Request ID: ${error.requestId}` : ""}
              </p>
            ) : null}
            <div className="resume-dialog-actions">
              <button type="button" disabled={busy} onClick={backToChooser}>
                Back
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? "Creating…" : "Create blank resume"}
              </button>
            </div>
          </form>
        ) : null}

        {method === "guided" ? (
          <>
            <ResumeGuidedSetup
              disabled={busy}
              onBack={backToChooser}
              onSubmit={submitGuided}
            />
            {error ? (
              <p role="alert" className="field-error">
                {error.message}
                {error.requestId ? ` Request ID: ${error.requestId}` : ""}
              </p>
            ) : null}
          </>
        ) : null}

        {method === "import" ? (
          <form
            className="resume-create-import"
            onSubmit={(event) => void submitImport(event)}
            noValidate
          >
            <div className="resume-create-import-intro">
              <h3>Import PDF</h3>
              <p>Select a private PDF to parse and review before adoption.</p>
            </div>
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor={`${titleId}-import`}
              >
                Imported resume title
              </label>
              <input
                ref={importTitleRef}
                id={`${titleId}-import`}
                className="field-control"
                value={importTitle}
                maxLength={120}
                required
                aria-invalid={importTitleError}
                aria-describedby={
                  importTitleError ? `${titleId}-import-error` : undefined
                }
                onChange={(event) => setImportTitle(event.target.value)}
              />
            </div>
            {importTitleError ? (
              <p id={`${titleId}-import-error`} className="field-error">
                Enter a title with 1–120 characters.
              </p>
            ) : null}
            <ResumePdfUpload
              file={importFile}
              error={importFileError}
              busy={busy}
              onChange={(file) => {
                setImportFile(file);
                setImportFileError(undefined);
              }}
            />
            {error ? (
              <p role="alert" className="field-error">
                {error.message}
                {error.message ===
                "PDF import needs a connected Gemini account." ? (
                  <>
                    {" "}
                    <Link to="/settings">Open Settings</Link>.
                  </>
                ) : null}
                {error.requestId ? ` Request ID: ${error.requestId}` : ""}
              </p>
            ) : null}
            {importJob ? (
              <div className="resume-job-state">
                <strong>Import {importJob.status}</strong>
                {"progress" in importJob ? (
                  <>
                    <span>{importJob.progress}% checked</span>
                    <JobResilienceActions
                      job={normalizeSafeJob(importJob)}
                      onCancel={cancelImport}
                      onRetry={retryImport}
                    />
                  </>
                ) : (
                  <span>Waiting for the first status check.</span>
                )}
                {"progress" in importJob && importJob.status === "failed" ? (
                  <small>
                    {importJob.error?.code === "AI_PROVIDER_NOT_CONFIGURED" ||
                    importJob.error?.code === "PROVIDER_NOT_CONFIGURED"
                      ? "PDF import needs a connected Gemini account."
                      : "The import job failed without creating a resume."}
                  </small>
                ) : null}
                {pollPaused ? (
                  <button
                    type="button"
                    onClick={() => {
                      const controller = new AbortController();
                      controllerRef.current = controller;
                      setBusy(true);
                      void startPolling(importJob, controller).finally(() => {
                        if (controllerRef.current === controller) {
                          controllerRef.current = null;
                          setBusy(false);
                        }
                      });
                    }}
                  >
                    Check status
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="resume-dialog-actions">
              <button type="button" disabled={busy} onClick={backToChooser}>
                Back
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? "Checking import…" : "Import private PDF"}
              </button>
            </div>
          </form>
        ) : null}

        {method === "review" && importReview ? (
          <section
            className="resume-import-review"
            aria-labelledby={`${headingId}-review`}
          >
            <div>
              <h3 id={`${headingId}-review`}>Import Review</h3>
              <p>Review what was extracted before creating your editable Resume.</p>
            </div>
            <div className="resume-import-review-evidence">
              <section>
                <h4>Basics</h4>
                <p>
                  {importReview.content.basics.fullName.trim()
                    ? "Full name extracted"
                    : "Full name not found"}
                </p>
                <p>
                  {importReview.content.basics.email?.trim()
                    ? "Email extracted"
                    : "Email not found"}
                </p>
              </section>
              <section>
                <h4>Skills</h4>
                <p>{extractedCount(importReview.content.skills.length)}</p>
              </section>
              <section>
                <h4>Experience</h4>
                <p>{extractedCount(importReview.content.experience.length)}</p>
              </section>
              <section>
                <h4>Education</h4>
                <p>{extractedCount(importReview.content.education.length)}</p>
              </section>
            </div>
            {importReview.photoCandidates.length > 0 ? (
              <ResumeImportPhotoChoices
                candidates={importReview.photoCandidates}
                selectedAssetId={selectedImportPhotoAssetId}
                disabled={confirmBusy}
                onChange={setSelectedImportPhotoAssetId}
              />
            ) : null}
            <details className="resume-import-review-preview">
              <summary>Preview extracted Resume</summary>
              <ResumePreview
                draft={resumeContentToDraft(importReview.content)}
                label="Extracted Resume preview"
                ariaLabel="Imported Resume preview"
              />
            </details>
            {error ? (
              <p role="alert" className="field-error">
                {error.message}
                {error.requestId ? ` Request ID: ${error.requestId}` : ""}
              </p>
            ) : null}
            <div className="resume-dialog-actions">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={backToImport}
              >
                Back
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="primary-button"
                disabled={confirmBusy}
                aria-busy={confirmBusy}
                onClick={() => void confirmImport()}
              >
                {confirmBusy ? "Confirming…" : "Confirm and open in editor"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </Dialog>
  );
}
