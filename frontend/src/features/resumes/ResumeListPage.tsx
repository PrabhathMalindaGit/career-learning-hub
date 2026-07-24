import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
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
  const [importValidationError, setImportValidationError] =
    useState<string | null>(null);
  const [importJob, setImportJob] = useState<
    Pick<ResumeJob, "id" | "type" | "status"> | ResumeJob | null
  >(null);
  const [pollPaused, setPollPaused] = useState(false);
  const listSequence = useRef(0);
  const importController = useRef<AbortController | null>(null);

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
    if (!validTitle(importTitle)) {
      setImportValidationError(
        "Enter a title with 1–120 characters.",
      );
      return;
    }
    if (
      !importFile ||
      importFile.type !== "application/pdf" ||
      importFile.size <= 0 ||
      importFile.size > MAX_PDF_SIZE
    ) {
      setImportValidationError(
        "Choose one PDF no larger than 15 MB.",
      );
      return;
    }

    importController.current?.abort();
    const controller = new AbortController();
    importController.current = controller;
    setImportBusy(true);
    setImportError(null);
    setImportValidationError(null);
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
      <header className="resume-page-heading">
        <div>
          <p className="eyebrow">Career documents</p>
          <h1 id="resume-list-title">Resume Studio</h1>
          <p>
            Create, import, and open your private resume records. Only
            validated server data is shown.
          </p>
        </div>
      </header>

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
            <p className="resume-state" role="status">
              Loading resumes…
            </p>
          ) : listError ? (
            <div className="resume-state resume-state--error" role="alert">
              <p>{listError.message}</p>
              {listError.requestId ? (
                <small>Request ID: {listError.requestId}</small>
              ) : null}
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Retry list
              </button>
            </div>
          ) : resumes.length === 0 ? (
            <p className="resume-state">
              No resumes yet. Create a blank resume or import a private PDF.
            </p>
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

          <div className="resume-pagination" aria-label="Resume pages">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={
                loading ||
                !pagination ||
                pagination.pages === 0 ||
                page >= pagination.pages
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
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
            <label>
              New resume title
              <input
                value={createTitle}
                maxLength={120}
                aria-invalid={createTitleError}
                onChange={(event) => setCreateTitle(event.target.value)}
              />
            </label>
            {createTitleError ? (
              <p className="resume-field-error">
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
              className="resume-primary-button"
              disabled={createBusy}
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
            <label>
              Imported resume title
              <input
                value={importTitle}
                maxLength={120}
                onChange={(event) => setImportTitle(event.target.value)}
              />
            </label>
            <label>
              Private PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setImportFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {importFile ? (
              <p className="resume-file-name">{importFile.name}</p>
            ) : null}
            <p className="resume-privacy-note">
              The private PDF is processed to create canonical resume
              content. Scanned-image OCR is not available.
            </p>
            {importValidationError ? (
              <p className="resume-field-error">{importValidationError}</p>
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
              className="resume-secondary-button"
              disabled={importBusy}
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
