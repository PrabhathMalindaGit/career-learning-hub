import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchLearningDocument,
  fetchLearningDocumentSource,
  listDocumentChunks,
} from "./learningApi";
import { DocumentConversations } from "./DocumentConversations";
import type {
  DocumentChunk,
  LearningDocument,
  LearningDocumentSource,
  LearningPagination,
} from "./types";
import "./learningWorkspace.css";

const CANONICAL_REFRESH_MS = 8_000;
const CANONICAL_REFRESH_LIMIT_MS = 5 * 60 * 1_000;
const MAX_PDF_VIEWER_BYTES = 15 * 1024 * 1024;

type SafeError = {
  message: string;
  requestId?: string;
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RequestId({ value }: { value?: string }) {
  return value ? (
    <p className="request-id">Request ID: {value}</p>
  ) : null;
}

function SecurePdfViewer({
  accountId,
  document,
}: {
  accountId: string;
  document: LearningDocument;
}) {
  const [source, setSource] = useState<LearningDocumentSource>();
  const [state, setState] = useState<
    "loading" | "ready" | "error" | "expired"
  >("loading");
  const [error, setError] = useState<SafeError>();
  const [requestVersion, setRequestVersion] = useState(0);
  const [viewerUrl, setViewerUrl] = useState<string>();
  const sequence = useRef(0);
  const viewerUrlRef = useRef<string | undefined>(undefined);

  const revokeViewerTarget = useCallback((clearState = true) => {
    if (viewerUrlRef.current) {
      URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = undefined;
    }
    if (clearState) setViewerUrl(undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    revokeViewerTarget();
    setSource(undefined);
    setState("loading");
    setError(undefined);

    void fetchLearningDocumentSource(document.id, controller.signal)
      .then(async (result) => {
        if (Date.parse(result.source.expiresAt) <= Date.now()) {
          if (current === sequence.current) setState("expired");
          return;
        }

        const response = await fetch(result.source.url, {
          method: "GET",
          headers: { Accept: "application/pdf" },
          credentials: "omit",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
        });
        const contentType = response.headers
          .get("Content-Type")
          ?.split(";", 1)[0]
          ?.trim()
          .toLowerCase();
        if (!response.ok || contentType !== "application/pdf") {
          throw new Error("The private PDF response was invalid.");
        }

        const blob = await response.blob();
        if (
          blob.size < 1 ||
          blob.size > MAX_PDF_VIEWER_BYTES ||
          (blob.type !== "" &&
            blob.type.toLowerCase() !== "application/pdf")
        ) {
          throw new Error("The private PDF response was invalid.");
        }

        const nextViewerUrl = URL.createObjectURL(blob);
        if (
          controller.signal.aborted ||
          current !== sequence.current
        ) {
          URL.revokeObjectURL(nextViewerUrl);
          return;
        }
        if (Date.parse(result.source.expiresAt) <= Date.now()) {
          URL.revokeObjectURL(nextViewerUrl);
          setState("expired");
          return;
        }
        viewerUrlRef.current = nextViewerUrl;
        setViewerUrl(nextViewerUrl);
        setSource(result.source);
        setState("ready");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setSource(undefined);
        setState("error");
        setError(
          safeError(
            reason,
            "Secure PDF access is currently unavailable.",
          ),
        );
      });

    return () => {
      controller.abort();
      sequence.current += 1;
      revokeViewerTarget(false);
      setSource(undefined);
    };
  }, [
    accountId,
    document.id,
    requestVersion,
    revokeViewerTarget,
  ]);

  useEffect(() => {
    if (!source) return;
    const remaining = Date.parse(source.expiresAt) - Date.now();
    if (remaining <= 0) {
      revokeViewerTarget();
      setSource(undefined);
      setState("expired");
      return;
    }
    const timer = window.setTimeout(() => {
      revokeViewerTarget();
      setSource(undefined);
      setState("expired");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [revokeViewerTarget, source]);

  const refresh = () => {
    revokeViewerTarget();
    setSource(undefined);
    setRequestVersion((current) => current + 1);
  };

  if (state === "loading") {
    return (
      <div className="learning-state" role="status">
        Requesting secure PDF access…
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="learning-state learning-state--compact">
        <h2>Secure PDF access has expired.</h2>
        <p>Request a new short-lived target to continue reading.</p>
        <button
          type="button"
          className="learning-secondary-button"
          onClick={refresh}
        >
          Refresh secure PDF access
        </button>
      </div>
    );
  }

  if (state === "error" || !source || !viewerUrl) {
    return (
      <div
        className="learning-state learning-state--error learning-state--compact"
        role="alert"
      >
        <h2>Original PDF unavailable</h2>
        <p>
          {error?.message ??
            "Secure PDF access is currently unavailable."}
        </p>
        <RequestId value={error?.requestId} />
        <button
          type="button"
          className="learning-secondary-button"
          onClick={refresh}
        >
          Refresh secure PDF access
        </button>
      </div>
    );
  }

  return (
    <div className="learning-pdf-viewer">
      <iframe
        src={viewerUrl}
        title={`Original PDF: ${document.title}`}
        referrerPolicy="no-referrer"
      />
      <p>
        This private viewer uses short-lived access and closes when you
        leave this view.
      </p>
    </div>
  );
}

function ExtractedContentReader({
  document,
}: {
  document: LearningDocument;
}) {
  const [page, setPage] = useState(1);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SafeError>();
  const [retryVersion, setRetryVersion] = useState(0);
  const sequence = useRef(0);

  useEffect(() => {
    setPage(1);
    setChunks([]);
    setPagination(undefined);
    setError(undefined);
  }, [document.id]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);

    void listDocumentChunks(
      document.id,
      document.pageCount,
      { page, limit: 20 },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          current !== sequence.current
        ) {
          return;
        }
        setChunks(result.chunks);
        setPagination(result.pagination);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setChunks([]);
        setPagination(undefined);
        setError(
          safeError(
            reason,
            "Extracted content could not be loaded.",
          ),
        );
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          current === sequence.current
        ) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
      sequence.current += 1;
      setChunks([]);
    };
  }, [document.id, document.pageCount, page, retryVersion]);

  if (loading) {
    return (
      <div className="learning-state" role="status">
        Loading extracted content…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="learning-state learning-state--error learning-state--compact"
        role="alert"
      >
        <h2>Extracted content unavailable</h2>
        <p>{error.message}</p>
        <RequestId value={error.requestId} />
        <button
          type="button"
          className="learning-secondary-button"
          onClick={() => setRetryVersion((current) => current + 1)}
        >
          Try extracted content again
        </button>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="learning-state learning-state--compact">
        <h2>No extracted content available</h2>
        <p>No validated text chunks were returned for this page.</p>
      </div>
    );
  }

  return (
    <>
      <ol className="learning-chunk-reader">
        {chunks.map((chunk) => (
          <li key={chunk.id}>
            <article>
              <header>
                <span>Section {chunk.chunkIndex + 1}</span>
                <strong>
                  {chunk.pageStart === chunk.pageEnd
                    ? `Page ${chunk.pageStart}`
                    : `Pages ${chunk.pageStart}–${chunk.pageEnd}`}
                </strong>
              </header>
              <p>{chunk.text}</p>
            </article>
          </li>
        ))}
      </ol>
      {pagination && pagination.pages > 1 ? (
        <nav
          className="learning-pagination"
          aria-label="Extracted-content pages"
        >
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Previous extracted-content page"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Extracted-content page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Next extracted-content page"
            disabled={page >= pagination.pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </>
  );
}

type WorkspaceLoadState =
  | { status: "loading" }
  | { status: "ready"; document: LearningDocument; requestId?: string }
  | {
      status: "not-found" | "unavailable" | "malformed";
      error: SafeError;
    };

type WorkspaceView = "overview" | "original" | "extracted" | "chat";

const workspaceViews: Array<{
  id: WorkspaceView;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "original", label: "Original PDF" },
  { id: "extracted", label: "Extracted Content" },
  { id: "chat", label: "Grounded Chat" },
];

export function LearningDocumentWorkspace() {
  const { documentId = "" } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const accountId = user?.id ?? "";
  const [loadState, setLoadState] =
    useState<WorkspaceLoadState>({ status: "loading" });
  const [view, setView] = useState<WorkspaceView>("overview");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const sequence = useRef(0);
  const refreshStartedAt = useRef<number | undefined>(undefined);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    setLoadState({ status: "loading" });
    setView("overview");

    void fetchLearningDocument(documentId, controller.signal)
      .then((result) => {
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          result.document.id !== documentId
        ) {
          return;
        }
        setLoadState({
          status: "ready",
          document: result.document,
          ...(result.requestId === undefined
            ? {}
            : { requestId: result.requestId }),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const safe = safeError(
          error,
          "The document workspace is currently unavailable.",
        );
        if (error instanceof ApiError && error.status === 404) {
          setLoadState({ status: "not-found", error: safe });
        } else if (
          error instanceof ApiError &&
          error.code === "INVALID_LEARNING_RESPONSE"
        ) {
          setLoadState({ status: "malformed", error: safe });
        } else {
          setLoadState({ status: "unavailable", error: safe });
        }
      });

    return () => {
      controller.abort();
      sequence.current += 1;
    };
  }, [accountId, documentId, refreshVersion]);

  const loadedDocument =
    loadState.status === "ready" ? loadState.document : undefined;
  const needsCanonicalRefresh =
    loadedDocument?.status === "uploaded" ||
    loadedDocument?.status === "processing";

  useEffect(() => {
    if (!needsCanonicalRefresh) {
      refreshStartedAt.current = undefined;
      return;
    }
    const startedAt = refreshStartedAt.current ?? Date.now();
    refreshStartedAt.current = startedAt;
    if (Date.now() - startedAt >= CANONICAL_REFRESH_LIMIT_MS) return;
    const timer = window.setTimeout(
      () => setRefreshVersion((current) => current + 1),
      CANONICAL_REFRESH_MS,
    );
    return () => window.clearTimeout(timer);
  }, [needsCanonicalRefresh, refreshVersion]);

  const chooseView = useCallback((next: WorkspaceView) => {
    setView(next);
  }, []);

  const handleTabKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % workspaceViews.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (index - 1 + workspaceViews.length) % workspaceViews.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = workspaceViews.length - 1;
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = workspaceViews[nextIndex]!;
    chooseView(next.id);
    tabRefs.current[nextIndex]?.focus();
  };

  if (loadState.status === "loading") {
    return (
      <section className="workspace-section learning-workspace">
        <div className="learning-state" role="status">
          Loading document workspace…
        </div>
      </section>
    );
  }

  if (loadState.status !== "ready") {
    const title =
      loadState.status === "not-found"
        ? "Document not found"
        : loadState.status === "malformed"
          ? "Document response unavailable"
          : "Document unavailable";
    return (
      <section className="workspace-section learning-workspace">
        <p className="eyebrow">Learning workspace</p>
        <h1>{title}</h1>
        <p className="section-intro">{loadState.error.message}</p>
        <RequestId value={loadState.error.requestId} />
        <Link className="learning-back-link" to="/learning">
          Return to document library
        </Link>
      </section>
    );
  }

  const document = loadState.document;

  return (
    <section className="workspace-section learning-workspace">
      <Link className="learning-back-link" to="/learning">
        ← Document library
      </Link>
      <header className="learning-workspace-header">
        <div>
          <p className="eyebrow">Learning document</p>
          <h1>{document.title}</h1>
          <p className="learning-filename">
            {document.originalFilename}
          </p>
        </div>
        <span
          className={`learning-status learning-status--${document.status}`}
        >
          {document.status === "failed"
            ? "Processing failed"
            : document.status}
        </span>
      </header>

      {document.status === "uploaded" ||
      document.status === "processing" ? (
        <div className="learning-state learning-state--compact">
          <h2>
            {document.status === "uploaded"
              ? "Upload accepted"
              : "Document processing"}
          </h2>
          <p>Processing is continuing in the background.</p>
          <p>Processing must finish before grounded chat is available.</p>
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() =>
              setRefreshVersion((current) => current + 1)
            }
          >
            Refresh document status
          </button>
        </div>
      ) : null}

      {document.status === "failed" ? (
        <div
          className="learning-state learning-state--error learning-state--compact"
          role="alert"
        >
          <h2>Document processing failed</h2>
          <p>
            {document.processingError?.message ??
              "The PDF could not be processed. Scanned files may fail because OCR is not supported."}
          </p>
          <p>Failed documents cannot be used for grounded chat.</p>
          <RequestId value={loadState.requestId} />
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() =>
              setRefreshVersion((current) => current + 1)
            }
          >
            Refresh document status
          </button>
        </div>
      ) : null}

      {document.status === "deleting" ? (
        <div className="learning-state learning-state--compact">
          <h2>Document is being deleted</h2>
          <p>This workspace is unavailable while deletion completes.</p>
          <p>Grounded chat is unavailable while deletion completes.</p>
        </div>
      ) : null}

      {document.status === "ready" ? (
        <>
          <div
            className="learning-tabs"
            role="tablist"
            aria-label="Document workspace views"
          >
            {workspaceViews.map((item, index) => (
              <button
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                key={item.id}
                id={`learning-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                aria-controls={`learning-panel-${item.id}`}
                tabIndex={view === item.id ? 0 : -1}
                onClick={() => chooseView(item.id)}
                onKeyDown={(event) => handleTabKey(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="learning-view-announcement" aria-live="polite">
            Current view:{" "}
            {workspaceViews.find((item) => item.id === view)?.label}
          </p>
          <div
            id={`learning-panel-${view}`}
            role="tabpanel"
            aria-labelledby={`learning-tab-${view}`}
            className="learning-tab-panel"
          >
            {view === "overview" ? (
              <div className="learning-overview">
                <dl className="learning-overview-meta">
                  <div>
                    <dt>Pages</dt>
                    <dd>{document.pageCount}</dd>
                  </div>
                  <div>
                    <dt>Extracted sections</dt>
                    <dd>{document.chunkCount}</dd>
                  </div>
                  {document.processedAt ? (
                    <div>
                      <dt>Processed</dt>
                      <dd>
                        <time dateTime={document.processedAt}>
                          {formatDate(document.processedAt)}
                        </time>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <section aria-labelledby="learning-summary-title">
                  <p className="learning-kicker">Stored overview</p>
                  <h2 id="learning-summary-title">Summary</h2>
                  <p className="learning-prose">
                    {document.summary ??
                      "No stored summary is available for this document."}
                  </p>
                </section>
                <section aria-labelledby="learning-key-points-title">
                  <p className="learning-kicker">Stored overview</p>
                  <h2 id="learning-key-points-title">Key points</h2>
                  {document.summaryKeyPoints.length === 0 ? (
                    <p className="learning-prose">
                      No stored key points are available.
                    </p>
                  ) : (
                    <ul className="learning-key-points">
                      {document.summaryKeyPoints.map((point, index) => (
                        <li key={`${index}-${point}`}>{point}</li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : null}
            {view === "original" ? (
              <SecurePdfViewer
                key={`${accountId}:${document.id}`}
                accountId={accountId}
                document={document}
              />
            ) : null}
            {view === "extracted" ? (
              <ExtractedContentReader
                key={document.id}
                document={document}
              />
            ) : null}
            {view === "chat" ? (
              <DocumentConversations
                key={`${accountId}:${document.id}`}
                accountId={accountId}
                document={document}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
