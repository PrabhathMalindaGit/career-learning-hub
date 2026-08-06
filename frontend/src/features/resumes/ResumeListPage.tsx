import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import {
  createResume,
  fetchJob,
  importResumePdf,
  listResumes,
} from "./resumeApi";
import { ResumeMiniDocument } from "./ResumeMiniDocument";
import { pollResumeJob } from "./resumePolling";
import { resolveResumePresentation } from "./resumeTemplateRegistry";
import type {
  Pagination,
  ResumeJob,
  ResumeRecord,
} from "./types";
import "./resumeWorkspace.css";

const PAGE_SIZE = 20;
const MAX_PDF_SIZE = 15 * 1024 * 1024;

type SafeError = {
  message: string;
  requestId?: string;
};

type ImportFieldErrors = {
  title?: string;
  file?: string;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      requestId: error.requestId,
    };
  }
  return {
    message: "The request could not be completed. Try again.",
  };
}

function validTitle(value: string): boolean {
  const length = value.trim().length;
  return length >= 1 && length <= 120;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function ResumeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const createTitleId = useId();
  const importTitleId = useId();
  const importFileId = useId();
  const [page, setPage] = useState(1);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<SafeError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createTitle, setCreateTitle] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<SafeError | null>(null);
  const [createTitleError, setCreateTitleError] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDragDepth, setImportDragDepth] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<SafeError | null>(null);
  const [importFieldErrors, setImportFieldErrors] =
    useState<ImportFieldErrors>({});
  const [importJob, setImportJob] = useState<
    Pick<ResumeJob, "id" | "type" | "status"> | ResumeJob | null
  >(null);
  const [pollPaused, setPollPaused] = useState(false);
  const listSequence = useRef(0);
  const importController = useRef<AbortController | null>(null);
  const createTitleRef = useRef<HTMLInputElement>(null);
  const importTitleRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importErrorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
    window.setTimeout(() => createTitleRef.current?.focus(), 100);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const sequence = ++listSequence.current;
    const controller = new AbortController();
    setLoading(true);
    setListError(null);

    void listResumes(
      { page, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((result) => {
        if (sequence !== listSequence.current) return;
        setResumes(result.resumes);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (sequence === listSequence.current) {
          setListError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === listSequence.current) setLoading(false);
      });

    return () => controller.abort();
  }, [page, reloadKey]);

  useEffect(
    () => () => {
      importController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const errorFields = Object.keys(
      importFieldErrors,
    ) as (keyof ImportFieldErrors)[];
    if (errorFields.length > 1) {
      importErrorSummaryRef.current?.focus();
    } else if (errorFields[0] === "title") {
      importTitleRef.current?.focus();
    } else if (errorFields[0] === "file") {
      importFileRef.current?.focus();
    }
  }, [importFieldErrors]);

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
          result.job.result?.kind === "import"
        ) {
          navigate(`/resumes/${result.job.result.resumeId}`);
        }
      } else if (result.reason === "timeout") {
        setPollPaused(true);
      } else if (result.reason === "transport-failure") {
        setPollPaused(true);
        setImportError(safeError(result.error));
      }
    },
    [navigate],
  );

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    if (createBusy) return;
    if (!validTitle(createTitle)) {
      setCreateTitleError(true);
      createTitleRef.current?.focus();
      return;
    }
    setCreateBusy(true);
    setCreateError(null);
    setCreateTitleError(false);
    const controller = new AbortController();
    try {
      const result = await createResume(
        createTitle.trim(),
        controller.signal,
      );
      navigate(`/resumes/${result.resume.id}`);
    } catch (error) {
      setCreateError(safeError(error));
    } finally {
      setCreateBusy(false);
    }
  }

  async function submitImport(event: React.FormEvent) {
    event.preventDefault();
    if (importBusy) return;
    const nextFieldErrors: ImportFieldErrors = {};
    if (!validTitle(importTitle)) {
      nextFieldErrors.title = "Enter a title with 1–120 characters.";
    }
    if (
      !importFile ||
      importFile.type !== "application/pdf" ||
      importFile.size <= 0 ||
      importFile.size > MAX_PDF_SIZE
    ) {
      nextFieldErrors.file = "Choose one PDF no larger than 15 MB.";
    }
    setImportFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }
    if (!importFile) return;

    importController.current?.abort();
    const controller = new AbortController();
    importController.current = controller;
    setImportBusy(true);
    setImportError(null);
    setImportFieldErrors({});
    try {
      const accepted = await importResumePdf(
        importTitle.trim(),
        importFile,
        controller.signal,
      );
      setImportJob(accepted);
      await startPolling(accepted, controller);
    } catch (error) {
      if (!controller.signal.aborted) setImportError(safeError(error));
    } finally {
      if (importController.current === controller) {
        setImportBusy(false);
      }
    }
  }

  async function cancelImport(signal: AbortSignal): Promise<void> {
    if (!importJob || !("progress" in importJob)) return;
    const cancelled = await cancelJob(importJob.id, signal);
    if (signal.aborted) return;
    if (cancelled.id !== importJob.id || cancelled.type !== importJob.type) {
      throw new ApiError(502, "INVALID_RESUME_JOB", "The server returned a mismatched resume job.");
    }
    if (cancelled.status !== "cancelled") {
      setImportJob({ ...importJob, status: "processing", phase: cancelled.phase, phaseSequence: cancelled.phaseSequence, canRetry: cancelled.canRetry, updatedAt: cancelled.updatedAt });
      return;
    }
    importController.current?.abort();
    setImportBusy(false);
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
      throw new ApiError(502, "INVALID_RESUME_JOB", "The server returned a mismatched resume job.");
    }
    importController.current?.abort();
    const controller = new AbortController();
    importController.current = controller;
    const accepted = {
      id: retried.id,
      type: "resume.import-pdf" as const,
      status: "queued" as const,
    };
    setImportJob(accepted);
    setImportBusy(true);
    await startPolling(accepted, controller).finally(() => {
      if (importController.current === controller) setImportBusy(false);
    });
  }

  return (
    <section className="resume-list-page" aria-labelledby="resume-list-title">
      <PageHeader
        className="resume-page-heading"
        heading={
          <>
            <p className="eyebrow">Career documents</p>
            <h1 id="resume-list-title">Resume Studio</h1>
          </>
        }
        description={
          <p>
            Create, import, and open your private resume records. Only
            validated server data is shown.
          </p>
        }
      />

      <div className="resume-list-layout">
        <section className="resume-collection" aria-labelledby="your-resumes">
          <div className="resume-section-heading">
            <div>
              <p className="resume-kicker">Collection</p>
              <h2 id="your-resumes">Your resumes</h2>
            </div>
            {pagination ? (
              <span className="resume-status">
                {pagination.total} total
              </span>
            ) : null}
          </div>

          {loading ? (
            <div
              className="resume-loading-state"
              role="status"
              aria-label="Loading resumes"
            >
              <p>Loading resumes…</p>
              <div className="resume-skeleton-grid" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <span className="resume-skeleton-card" key={index}>
                    <span className="resume-skeleton-document" />
                    <span className="resume-skeleton-line resume-skeleton-line--title" />
                    <span className="resume-skeleton-line" />
                  </span>
                ))}
              </div>
            </div>
          ) : listError ? (
            <StateSurface
              mode="alert"
              className="resume-state resume-state--error"
              body={<p>{listError.message}</p>}
              requestId={listError.requestId}
              actions={
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Retry list
                </button>
              }
            />
          ) : resumes.length === 0 ? (
            <div className="resume-empty-state">
              <span className="resume-empty-state-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M8 4.5h11l5 5V27.5H8z" />
                  <path d="M19 4.5v5h5M12 15h8M12 19h8M12 23h5" />
                </svg>
              </span>
              <div>
                <strong>No resumes yet</strong>
                <p>
                  No resumes yet. Create a blank resume or import a private PDF.
                </p>
              </div>
              <button
                type="button"
                className="resume-secondary-button"
                onClick={() => createTitleRef.current?.focus()}
              >
                Start a blank resume
              </button>
            </div>
          ) : (
            <ul className="resume-record-list">
              {resumes.map((resume) => {
                const presentation = resolveResumePresentation(resume.design);
                return (
                  <li className="resume-record-card" key={resume.id}>
                    <div className="resume-record-card-preview">
                      <ResumeMiniDocument
                        templateId={presentation.template.option.id}
                        colorPaletteId={presentation.palette.option.id}
                        fontFamily={presentation.font.option.value}
                        context="card"
                      />
                      <span className="resume-record-status">
                        {titleCase(resume.status)}
                      </span>
                    </div>
                    <div className="resume-record-card-body">
                      <div className="resume-record-card-heading">
                        <strong>{resume.title}</strong>
                        <span>Version {resume.latestVersionNumber}</span>
                      </div>
                      <div className="resume-record-design">
                        <span>{presentation.template.option.label}</span>
                        <span>
                          {presentation.palette.option.label} palette
                        </span>
                      </div>
                      <div className="resume-record-card-footer">
                        <small>
                          Updated{" "}
                          {new Date(resume.updatedAt).toLocaleDateString()}
                        </small>
                        <Link
                          to={`/resumes/${resume.id}`}
                          aria-label={`Open ${resume.title}`}
                        >
                          Open resume
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Pager
            className="resume-pagination"
            label="Resume pages"
            currentPage={`Page ${page}`}
            previousLabel="Previous"
            nextLabel="Next"
            previousDisabled={loading || page <= 1}
            nextDisabled={
              loading ||
              !pagination ||
              pagination.pages === 0 ||
              page >= pagination.pages
            }
            busy={loading}
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
        </section>

        <div className="resume-entry-actions">
          <form
            className="resume-action-form"
            onSubmit={(event) => void submitCreate(event)}
            noValidate
          >
            <div>
              <p className="resume-kicker">Start clean</p>
              <h2>Create a blank resume</h2>
            </div>
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor={createTitleId}
              >
                New resume title
              </label>
              <input
                ref={createTitleRef}
                id={createTitleId}
                name="createResumeTitle"
                className="field-control"
                required
                value={createTitle}
                maxLength={120}
                aria-invalid={createTitleError}
                aria-describedby={
                  createTitleError
                    ? `${createTitleId}-error`
                    : undefined
                }
                onChange={(event) => setCreateTitle(event.target.value)}
              />
            </div>
            {createTitleError ? (
              <p
                className="field-error resume-field-error"
                id={`${createTitleId}-error`}
              >
                Enter a title with 1–120 characters.
              </p>
            ) : null}
            {createError ? (
              <p className="resume-field-error" role="alert">
                {createError.message}
                {createError.requestId
                  ? ` Request ID: ${createError.requestId}`
                  : ""}
              </p>
            ) : null}
            <button
              className="primary-button resume-primary-button"
              disabled={createBusy}
              aria-busy={createBusy}
              type="submit"
            >
              {createBusy ? "Creating…" : "Create blank resume"}
            </button>
          </form>

          <form
            className="resume-action-form"
            onSubmit={(event) => void submitImport(event)}
            noValidate
          >
            <div>
              <p className="resume-kicker">Private import</p>
              <h2>Import a PDF</h2>
            </div>
            {Object.keys(importFieldErrors).length > 1 ? (
              <div
                className="validation-summary"
                role="alert"
                tabIndex={-1}
                ref={importErrorSummaryRef}
              >
                <strong>Review the highlighted fields.</strong>
                <ul>
                  {importFieldErrors.title ? (
                    <li>
                      <a href={`#${importTitleId}`}>
                        Imported resume title
                      </a>
                    </li>
                  ) : null}
                  {importFieldErrors.file ? (
                    <li>
                      <a href={`#${importFileId}`}>Private PDF</a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor={importTitleId}
              >
                Imported resume title
              </label>
              <input
                ref={importTitleRef}
                id={importTitleId}
                name="importResumeTitle"
                className="field-control"
                required
                value={importTitle}
                maxLength={120}
                aria-invalid={Boolean(importFieldErrors.title)}
                aria-describedby={
                  importFieldErrors.title
                    ? `${importTitleId}-error`
                    : undefined
                }
                onChange={(event) => setImportTitle(event.target.value)}
              />
            </div>
            {importFieldErrors.title ? (
              <p
                className="field-error resume-field-error"
                id={`${importTitleId}-error`}
              >
                {importFieldErrors.title}
              </p>
            ) : null}
            <div
              className="resume-upload-dropzone"
              role="group"
              aria-label="Private PDF dropzone"
              aria-describedby={`${importFileId}-help${
                importFieldErrors.file ? ` ${importFileId}-error` : ""
              }`}
              data-drag-active={importDragDepth > 0 ? "true" : "false"}
              onDragEnter={(event) => {
                event.preventDefault();
                setImportDragDepth((depth) => depth + 1);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setImportDragDepth((depth) => Math.max(0, depth - 1));
              }}
              onDrop={(event) => {
                event.preventDefault();
                setImportDragDepth(0);
                setImportFile(event.dataTransfer.files[0] ?? null);
              }}
            >
              <input
                ref={importFileRef}
                className="resume-file-input"
                id={importFileId}
                name="importResumePdf"
                type="file"
                accept="application/pdf,.pdf"
                required
                aria-label="Private PDF"
                aria-invalid={Boolean(importFieldErrors.file)}
                aria-describedby={`${importFileId}-help${
                  importFieldErrors.file
                    ? ` ${importFileId}-error`
                    : ""
                }`}
                onChange={(event) =>
                  setImportFile(event.target.files?.[0] ?? null)
                }
              />
              {importFile ? (
                <div className="resume-selected-file">
                  <span
                    className="resume-selected-file-icon"
                    aria-hidden="true"
                  >
                    PDF
                  </span>
                  <span className="resume-selected-file-copy">
                    <strong>{importFile.name}</strong>
                    <small>{formatBytes(importFile.size)}</small>
                  </span>
                  <button
                    type="button"
                    disabled={importBusy}
                    onClick={() => {
                      setImportFile(null);
                      if (importFileRef.current) {
                        importFileRef.current.value = "";
                      }
                    }}
                  >
                    Clear selection
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="resume-dropzone-trigger"
                  aria-label="Choose a private PDF"
                  disabled={importBusy}
                  onClick={() => importFileRef.current?.click()}
                >
                  <span className="resume-dropzone-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32">
                      <path d="M16 21V8m0 0-5 5m5-5 5 5" />
                      <path d="M7 20v5h18v-5" />
                    </svg>
                  </span>
                  <strong>
                    {importDragDepth > 0
                      ? "Drop the PDF here"
                      : "Choose a private PDF"}
                  </strong>
                  <span>or drag and drop it here</span>
                </button>
              )}
              <p id={`${importFileId}-help`}>
                <strong>PDF only · maximum 15 MB</strong>
                <span>
                  Your document is processed privately. Scanned-image OCR is
                  not available.
                </span>
              </p>
            </div>
            {importFieldErrors.file ? (
              <p
                className="field-error resume-field-error"
                id={`${importFileId}-error`}
              >
                {importFieldErrors.file}
              </p>
            ) : null}
            {importError ? (
              <p className="resume-field-error" role="alert">
                {importError.message}
                {importError.requestId
                  ? ` Request ID: ${importError.requestId}`
                  : ""}
              </p>
            ) : null}
            {importJob ? (
              <div className="resume-job-state">
                <strong>Import {importJob.status}</strong>
                {"progress" in importJob ? (
                  <span>{importJob.progress}% checked</span>
                ) : (
                  <span>Waiting for the first status check.</span>
                )}
                {importJob.status === "failed" ? (
                  <small>
                    The import job failed without creating a resume.
                  </small>
                ) : null}
                {"progress" in importJob ? (
                  <JobResilienceActions
                    job={normalizeSafeJob(importJob)}
                    onCancel={cancelImport}
                    onRetry={retryImport}
                  />
                ) : null}
                {pollPaused ? (
                  <button
                    type="button"
                    onClick={() => {
                      const controller = new AbortController();
                      importController.current = controller;
                      setImportBusy(true);
                      void startPolling(importJob, controller).finally(() =>
                        setImportBusy(false),
                      );
                    }}
                  >
                    Check status
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              className="secondary-button resume-secondary-button"
              disabled={importBusy}
              aria-busy={importBusy}
              type="submit"
            >
              {importBusy ? "Checking import…" : "Import private PDF"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
