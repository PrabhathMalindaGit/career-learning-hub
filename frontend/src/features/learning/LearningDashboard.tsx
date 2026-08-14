import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import { useAuth } from "../auth/AuthProvider";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import { LearningDocumentDeletion } from "./LearningDocumentDeletion";
import {
  fetchLearningJob,
  listLearningDocuments,
  uploadLearningDocument,
} from "./learningApi";
import {
  pollLearningJob,
  type LearningPollResult,
} from "./learningPolling";
import type {
  AcceptedLearningJob,
  LearningDocument,
  LearningJob,
  LearningDocumentStatus,
  LearningPagination,
} from "./types";
import "./learningWorkspace.css";

const PAGE_LIMIT = 10;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const CANONICAL_REFRESH_MS = 8_000;
const CANONICAL_REFRESH_LIMIT_MS = 5 * 60 * 1_000;

const statusOptions: Array<{
  value: "" | LearningDocumentStatus;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "uploaded", label: "Uploaded" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "failed", label: "Processing failed" },
  { value: "deleting", label: "Deleting" },
];

function statusLabel(status: LearningDocumentStatus): string {
  return (
    statusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type SafeError = {
  message: string;
  requestId?: string;
};

type UploadFieldErrors = {
  title?: string;
  file?: string;
};

function safeError(error: unknown, fallback: string): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId === undefined
        ? {}
        : { requestId: error.requestId }),
    };
  }
  return { message: fallback };
}

type ProcessingCheck =
  | {
      state: "checking" | "paused";
      documentId: string;
      job: AcceptedLearningJob | LearningJob;
      cause?: "timeout" | "transport-failure";
    }
  | {
      state: "stopped";
      documentId: string;
      job: AcceptedLearningJob | LearningJob;
      error: SafeError;
    }
  | {
      state: "terminal";
      documentId: string;
      job: LearningJob;
    };

function isFullLearningJob(
  job: AcceptedLearningJob | LearningJob,
): job is LearningJob {
  return "progress" in job;
}

export function LearningDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountId = user?.id ?? "";
  const [documents, setDocuments] = useState<LearningDocument[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | LearningDocumentStatus>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<SafeError>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File>();
  const [uploadFieldErrors, setUploadFieldErrors] =
    useState<UploadFieldErrors>({});
  const [uploadError, setUploadError] = useState<SafeError>();
  const [uploading, setUploading] = useState(false);
  const [processingCheck, setProcessingCheck] =
    useState<ProcessingCheck>();
  const requestSequence = useRef(0);
  const uploadTriggerRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadErrorSummaryRef = useRef<HTMLDivElement>(null);
  const uploadControllerRef = useRef<AbortController | undefined>(
    undefined,
  );
  const pollControllerRef = useRef<AbortController | undefined>(
    undefined,
  );
  const canonicalRefreshStartedAt = useRef<number | undefined>(
    undefined,
  );

  const refresh = useCallback(() => {
    setRefreshVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError(undefined);

    void listLearningDocuments(
      {
        page,
        limit: PAGE_LIMIT,
        ...(status === "" ? {} : { status }),
      },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          sequence !== requestSequence.current
        ) {
          return;
        }
        setDocuments(result.documents);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDocuments([]);
        setPagination(undefined);
        setLoadError(
          safeError(error, "Your documents could not be loaded."),
        );
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          sequence === requestSequence.current
        ) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [accountId, page, refreshVersion, status]);

  const hasProcessingDocument = documents.some(
    (document) =>
      document.status === "uploaded" ||
      document.status === "processing",
  );

  useEffect(() => {
    if (!hasProcessingDocument) {
      canonicalRefreshStartedAt.current = undefined;
      return;
    }
    const startedAt =
      canonicalRefreshStartedAt.current ?? Date.now();
    canonicalRefreshStartedAt.current = startedAt;
    if (Date.now() - startedAt >= CANONICAL_REFRESH_LIMIT_MS) return;
    const timer = window.setTimeout(refresh, CANONICAL_REFRESH_MS);
    return () => window.clearTimeout(timer);
  }, [hasProcessingDocument, refresh, refreshVersion]);

  useEffect(() => {
    setDocuments([]);
    setPagination(undefined);
    setPage(1);
    setStatus("");
    setLoadError(undefined);
    setUploadOpen(false);
    setTitle("");
    setFile(undefined);
    setUploadFieldErrors({});
    setUploadError(undefined);
    setUploading(false);
    setProcessingCheck(undefined);
    canonicalRefreshStartedAt.current = undefined;
    if (fileInputRef.current) fileInputRef.current.value = "";

    return () => {
      requestSequence.current += 1;
      uploadControllerRef.current?.abort();
      pollControllerRef.current?.abort();
      uploadControllerRef.current = undefined;
      pollControllerRef.current = undefined;
      setFile(undefined);
    };
  }, [accountId]);

  useEffect(() => {
    if (searchParams.get("action") !== "upload") return;
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
    setUploadOpen(true);
    setUploadFieldErrors({});
    setUploadError(undefined);
    window.setTimeout(() => titleInputRef.current?.focus(), 100);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const errorFields = Object.keys(
      uploadFieldErrors,
    ) as (keyof UploadFieldErrors)[];
    if (errorFields.length > 1) {
      uploadErrorSummaryRef.current?.focus();
    } else if (errorFields[0] === "title") {
      titleInputRef.current?.focus();
    } else if (errorFields[0] === "file") {
      fileInputRef.current?.focus();
    }
  }, [uploadFieldErrors]);

  const runProcessingCheck = useCallback(
    (
      documentId: string,
      job: AcceptedLearningJob | LearningJob,
    ) => {
      pollControllerRef.current?.abort();
      const controller = new AbortController();
      pollControllerRef.current = controller;
      setProcessingCheck({ state: "checking", documentId, job });

      void pollLearningJob({
        jobId: job.id,
        documentId,
        fetchJob: fetchLearningJob,
        signal: controller.signal,
        onUpdate: (job) => {
          if (!controller.signal.aborted) {
            setProcessingCheck({ state: "checking", documentId, job });
          }
        },
      })
        .then((result: LearningPollResult) => {
          if (controller.signal.aborted) return;
          if (result.reason === "paused") {
            setProcessingCheck({
              state: "paused",
              cause: result.cause,
              documentId,
              job: result.job ?? job,
            });
            return;
          }
          if (result.reason === "terminal") {
            if (result.job.status === "completed") {
              setProcessingCheck(undefined);
            } else {
              setProcessingCheck({
                state: "terminal",
                documentId,
                job: result.job,
              });
            }
            refresh();
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setProcessingCheck({
            state: "stopped",
            documentId,
            job,
            error: safeError(
              error,
              "Document status checks could not continue.",
            ),
          });
        });
    },
    [refresh],
  );

  async function cancelProcessing(signal: AbortSignal): Promise<void> {
    if (!processingCheck || !isFullLearningJob(processingCheck.job)) return;
    const current = processingCheck;
    const currentJob = processingCheck.job;
    const cancelled = await cancelJob(currentJob.id, signal);
    if (signal.aborted) return;
    if (cancelled.id !== currentJob.id || cancelled.type !== "learning.document.process") {
      throw new ApiError(502, "INVALID_LEARNING_RESPONSE", "The server returned an invalid learning response.");
    }
    if (cancelled.status !== "cancelled") {
      setProcessingCheck({ ...current, job: { ...currentJob, status: "processing", phase: cancelled.phase, phaseSequence: cancelled.phaseSequence, canRetry: cancelled.canRetry, updatedAt: cancelled.updatedAt } });
      return;
    }
    pollControllerRef.current?.abort();
    setProcessingCheck({
      state: "terminal",
      documentId: current.documentId,
      job: {
        ...currentJob,
        status: "cancelled",
        phase: cancelled.phase,
        phaseSequence: cancelled.phaseSequence,
        canRetry: cancelled.canRetry,
        updatedAt: cancelled.updatedAt,
      },
    });
    refresh();
  }

  async function retryProcessing(signal: AbortSignal): Promise<void> {
    if (!processingCheck || !isFullLearningJob(processingCheck.job)) return;
    const retried = await retryJob(processingCheck.job.id, signal);
    if (signal.aborted) return;
    if (retried.type !== "learning.document.process") {
      throw new ApiError(502, "INVALID_LEARNING_RESPONSE", "The server returned an invalid learning response.");
    }
    runProcessingCheck(processingCheck.documentId, {
      id: retried.id,
      type: "learning.document.process",
      status: "queued",
    });
  }

  const closeUpload = useCallback(() => {
    if (uploading) return;
    setUploadOpen(false);
    setTitle("");
    setFile(undefined);
    setUploadFieldErrors({});
    setUploadError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.setTimeout(() => uploadTriggerRef.current?.focus(), 0);
  }, [uploading]);

  const submitUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (uploading) return;
    const normalizedTitle = title.trim();
    const nextFieldErrors: UploadFieldErrors = {};
    if (!normalizedTitle) {
      nextFieldErrors.title = "Enter a document title.";
    }
    if (!file) {
      nextFieldErrors.file = "Choose a PDF file.";
    } else if (
      file.type !== "application/pdf" ||
      !file.name.toLocaleLowerCase().endsWith(".pdf") ||
      file.size > MAX_PDF_BYTES
    ) {
      nextFieldErrors.file = "Choose a PDF file no larger than 15 MB.";
    }
    setUploadFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }
    if (!file) return;

    uploadControllerRef.current?.abort();
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    setUploading(true);
    setUploadFieldErrors({});
    setUploadError(undefined);

    try {
      const result = await uploadLearningDocument(
        normalizedTitle,
        file,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setTitle("");
      setFile(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOpen(false);
      setDocuments((current) => [
        result.document,
        ...current.filter(
          (document) => document.id !== result.document.id,
        ),
      ]);
      runProcessingCheck(result.document.id, result.job);
      refresh();
    } catch (error) {
      if (controller.signal.aborted) return;
      setUploadError(
        safeError(error, "The PDF could not be uploaded."),
      );
    } finally {
      if (!controller.signal.aborted) setUploading(false);
    }
  };

  return (
    <section className="workspace-section learning-library">
      <header className="learning-page-header">
        <div>
          <p className="eyebrow">Learning workspace</p>
          <h1>Learning</h1>
          <p className="section-intro">
            Upload private PDFs and return to their stored summaries,
            original files, and page-aware extracted text.
          </p>
        </div>
        <div className="learning-header-actions">
          <button
            ref={uploadTriggerRef}
            type="button"
            className="primary-button learning-primary-button"
            aria-expanded={uploadOpen}
            aria-controls="learning-upload-form"
            onClick={() => {
              setUploadOpen(true);
              setUploadFieldErrors({});
              setUploadError(undefined);
            }}
          >
            Upload PDF
          </button>
          <button
            type="button"
            className="secondary-button learning-secondary-button"
            disabled={loading}
            onClick={refresh}
          >
            Refresh documents
          </button>
        </div>
      </header>

      {uploadOpen ? (
        <section
          id="learning-upload-form"
          className="learning-upload-panel"
          aria-labelledby="learning-upload-title"
        >
          <div>
            <p className="learning-kicker">New document</p>
            <h2 id="learning-upload-title">Upload a private PDF</h2>
            <p id="learning-upload-guidance">
              PDF only, up to 15 MB. Scanned or image-only PDFs may fail
              because OCR is not supported. These checks are guidance;
              server validation remains authoritative.
            </p>
          </div>
          <form
            className="learning-upload-form"
            onSubmit={submitUpload}
            noValidate
          >
            {Object.keys(uploadFieldErrors).length > 1 ? (
              <div
                className="validation-summary"
                role="alert"
                tabIndex={-1}
                ref={uploadErrorSummaryRef}
              >
                <strong>Review the highlighted fields.</strong>
                <ul>
                  {uploadFieldErrors.title ? (
                    <li>
                      <a href="#learning-upload-title-input">
                        Document title
                      </a>
                    </li>
                  ) : null}
                  {uploadFieldErrors.file ? (
                    <li>
                      <a href="#learning-upload-file">PDF file</a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor="learning-upload-title-input"
              >
                Document title
              </label>
              <input
                ref={titleInputRef}
                id="learning-upload-title-input"
                name="learningDocumentTitle"
                className="field-control"
                type="text"
                required
                maxLength={200}
                value={title}
                disabled={uploading}
                aria-invalid={Boolean(uploadFieldErrors.title)}
                aria-describedby={
                  uploadFieldErrors.title
                    ? "learning-upload-title-error"
                    : undefined
                }
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            {uploadFieldErrors.title ? (
              <p
                className="field-error"
                id="learning-upload-title-error"
              >
                {uploadFieldErrors.title}
              </p>
            ) : null}
            <div className="field-shell">
              <label
                className="field-label required-label"
                htmlFor="learning-upload-file"
              >
                PDF file
              </label>
              <input
                ref={fileInputRef}
                id="learning-upload-file"
                name="learningDocumentPdf"
                type="file"
                accept="application/pdf,.pdf"
                required
                disabled={uploading}
                aria-invalid={Boolean(uploadFieldErrors.file)}
                aria-describedby={`learning-upload-guidance${
                  uploadFieldErrors.file
                    ? " learning-upload-file-error"
                    : ""
                }`}
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  setFile(selected);
                  if (
                    selected &&
                    (selected.type !== "application/pdf" ||
                      !selected.name
                        .toLocaleLowerCase()
                        .endsWith(".pdf") ||
                      selected.size > MAX_PDF_BYTES)
                  ) {
                    setUploadFieldErrors((current) => ({
                      ...current,
                      file: "Choose a PDF file no larger than 15 MB.",
                    }));
                  } else {
                    setUploadFieldErrors((current) => {
                      const next = { ...current };
                      delete next.file;
                      return next;
                    });
                  }
                }}
              />
              <p
                className={`learning-file-selection${
                  file ? " learning-file-selection--selected" : ""
                }`}
                aria-live="polite"
              >
                {file
                  ? `Selected: ${file.name}`
                  : "Choose a PDF from your device."}
              </p>
            </div>
            {uploadFieldErrors.file ? (
              <p
                className="field-error"
                id="learning-upload-file-error"
              >
                {uploadFieldErrors.file}
              </p>
            ) : null}
            {uploadError ? (
              <div className="learning-error" role="alert">
                <p>{uploadError.message}</p>
                {uploadError.requestId ? (
                  <p className="request-id">
                    Request ID: {uploadError.requestId}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="learning-form-actions">
              <button
                type="submit"
                className="primary-button learning-primary-button"
                disabled={uploading}
                aria-busy={uploading}
              >
                {uploading ? "Uploading…" : "Upload document"}
              </button>
              <button
                type="button"
                className="secondary-button learning-secondary-button"
                disabled={uploading}
                onClick={closeUpload}
              >
                Cancel upload
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {processingCheck ? (
        <div className="learning-processing-notice" aria-live="polite">
          {processingCheck.state === "checking" ? (
            isFullLearningJob(processingCheck.job) ? (
              <JobResilienceActions
                job={normalizeSafeJob(processingCheck.job)}
                onCancel={cancelProcessing}
                onRetry={retryProcessing}
              />
            ) : (
              <p>Upload accepted. Checking the canonical processing status.</p>
            )
          ) : null}
          {processingCheck.state === "paused" ? (
            <>
              <p>
                Status checks are paused. Processing may still be
                continuing on the server.
              </p>
              <button
                type="button"
                className="learning-secondary-button"
                onClick={() =>
                  runProcessingCheck(
                    processingCheck.documentId,
                    processingCheck.job,
                  )
                }
              >
                Resume status checks
              </button>
              {isFullLearningJob(processingCheck.job) ? (
                <JobResilienceActions
                  job={normalizeSafeJob(processingCheck.job)}
                  onCancel={cancelProcessing}
                  onRetry={retryProcessing}
                />
              ) : null}
            </>
          ) : null}
          {processingCheck.state === "stopped" ? (
            <>
              <p>{processingCheck.error.message}</p>
              {processingCheck.error.requestId ? (
                <p className="request-id">
                  Request ID: {processingCheck.error.requestId}
                </p>
              ) : null}
            </>
          ) : null}
          {processingCheck.state === "terminal" ? (
            <JobResilienceActions
              job={normalizeSafeJob(processingCheck.job)}
              onCancel={cancelProcessing}
              onRetry={retryProcessing}
            />
          ) : null}
        </div>
      ) : null}

      <div className="learning-library-toolbar">
        <label>
          <span>Document status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as "" | LearningDocumentStatus,
              );
              setPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {pagination ? (
          <p>
            {pagination.total}{" "}
            {pagination.total === 1 ? "document" : "documents"}
          </p>
        ) : null}
      </div>

      {loading ? (
        <StateSurface
          mode="status"
          className="learning-state"
          body="Loading your documents…"
        />
      ) : loadError ? (
        <StateSurface
          mode="alert"
          className="learning-state learning-state--error"
          heading={<h2>Documents unavailable</h2>}
          body={<p>{loadError.message}</p>}
          requestId={loadError.requestId}
          actions={
            <button
              type="button"
              className="learning-secondary-button"
              onClick={refresh}
            >
              Try loading again
            </button>
          }
        />
      ) : documents.length === 0 ? (
        <StateSurface
          mode="static"
          className="learning-state"
          heading={<h2>No documents yet</h2>}
          body={
            <p>
              No documents match this view. Upload a private PDF to begin.
            </p>
          }
        />
      ) : (
        <ol className="learning-document-list">
          {documents.map((document) => (
            <li key={document.id}>
              <article
                className="learning-document-row"
                aria-labelledby={`learning-document-title-${document.id}`}
              >
                <header className="learning-document-card-header">
                  <div className="learning-document-mark" aria-hidden="true">
                    PDF
                  </div>
                  <span
                    className={`learning-status learning-status--${document.status}`}
                  >
                    {statusLabel(document.status)}
                  </span>
                </header>
                <div className="learning-document-main">
                  <p className="learning-document-type">PDF document</p>
                  <h2 id={`learning-document-title-${document.id}`}>
                    {document.title}
                  </h2>
                  <p className="learning-filename">
                    {document.originalFilename}
                  </p>
                  <div className="learning-document-facts">
                    {document.pageCount > 0 ? (
                      <span>
                        {document.pageCount}{" "}
                        {document.pageCount === 1 ? "page" : "pages"}
                      </span>
                    ) : null}
                    {document.chunkCount > 0 ? (
                      <span>
                        {document.chunkCount} extracted{" "}
                        {document.chunkCount === 1 ? "section" : "sections"}
                      </span>
                    ) : null}
                  </div>
                  {document.status === "failed" &&
                  document.processingError ? (
                    <p className="learning-row-error">
                      {document.processingError.message}
                    </p>
                  ) : null}
                </div>
                <footer className="learning-document-card-footer">
                  <p>
                    Updated{" "}
                    <time dateTime={document.updatedAt}>
                      {formatDate(document.updatedAt)}
                    </time>
                  </p>
                  <Link
                    className="learning-document-link"
                    to={`/learning/documents/${document.id}`}
                  >
                    Open workspace
                  </Link>
                  {document.status !== "deleting" ? (
                    <LearningDocumentDeletion
                      accountId={accountId}
                      document={document}
                      onDeletionAccepted={() => {
                        setDocuments((current) =>
                          current.map((item) =>
                            item.id === document.id
                              ? { ...item, status: "deleting" }
                              : item,
                          ),
                        );
                        refresh();
                      }}
                    />
                  ) : null}
                </footer>
              </article>
            </li>
          ))}
        </ol>
      )}

      {pagination && pagination.pages > 1 ? (
        <Pager
          className="learning-pagination"
          buttonClassName="learning-secondary-button"
          label="Document pages"
          currentPage={`Page ${page} of ${pagination.pages}`}
          previousLabel="Previous"
          nextLabel="Next"
          previousAriaLabel="Previous page"
          nextAriaLabel="Next page"
          previousDisabled={loading || page <= 1}
          nextDisabled={loading || page >= pagination.pages}
          busy={loading}
          onPrevious={() => setPage((current) => current - 1)}
          onNext={() => setPage((current) => current + 1)}
        />
      ) : null}
    </section>
  );
}
