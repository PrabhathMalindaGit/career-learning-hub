import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import {
  createResume,
  fetchJob,
  importResumePdf,
  listResumes,
} from "./resumeApi";
import { pollResumeJob } from "./resumePolling";
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

export function ResumeListPage() {
  const navigate = useNavigate();
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
            <StateSurface
              mode="status"
              className="resume-state"
              body="Loading resumes…"
            />
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
            <StateSurface
              mode="static"
              className="resume-state"
              body="No resumes yet. Create a blank resume or import a private PDF."
            />
          ) : (
            <ul className="resume-record-list">
              {resumes.map((resume) => (
                <li key={resume.id}>
                  <div>
                    <strong>{resume.title}</strong>
                    <span>
                      Version {resume.latestVersionNumber} · {resume.status}
                    </span>
                    <small>
                      Updated{" "}
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <Link
                    to={`/resumes/${resume.id}`}
                    aria-label={`Open ${resume.title}`}
                  >
                    Open
                  </Link>
                </li>
              ))}
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
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor={importFileId}
              >
                Private PDF
              </label>
              <input
                ref={importFileRef}
                id={importFileId}
                name="importResumePdf"
                type="file"
                accept="application/pdf,.pdf"
                required
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
            </div>
            {importFile ? (
              <p className="resume-file-name">{importFile.name}</p>
            ) : null}
            <p
              className="field-help resume-privacy-note"
              id={`${importFileId}-help`}
            >
              The private PDF is processed to create canonical resume
              content. Scanned-image OCR is not available.
            </p>
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
              <div className="resume-job-state" role="status">
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
