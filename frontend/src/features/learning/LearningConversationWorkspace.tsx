import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchLearningChatJob,
  fetchLearningDocument,
  listLearningMessages,
  sendLearningMessage,
} from "./learningApi";
import {
  pollLearningJob,
  type LearningPollResult,
} from "./learningPolling";
import type {
  AcceptedLearningChatJob,
  LearningChatJob,
  LearningDocument,
  LearningMessage,
  LearningPagination,
} from "./types";
import "./learningWorkspace.css";

const MESSAGE_LIMIT = 20;
const MAX_QUESTION_LENGTH = 12_000;

type SafeError = {
  message: string;
  requestId?: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; document: LearningDocument }
  | {
      status: "not-found" | "malformed" | "unavailable";
      error: SafeError;
    };

type ResponseState =
  | { status: "idle" }
  | { status: "queued" | "processing" }
  | { status: "paused"; cause: "timeout" | "transport-failure" }
  | { status: "failed"; error: SafeError }
  | { status: "cancelled" }
  | { status: "unavailable"; error: SafeError }
  | { status: "completed" };

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

function RequestId({ value }: { value?: string }) {
  return value ? (
    <p className="request-id">Request ID: {value}</p>
  ) : null;
}

function unavailableMessage(document: LearningDocument): string {
  if (
    document.status === "uploaded" ||
    document.status === "processing"
  ) {
    return "Document processing must finish before grounded chat can be used.";
  }
  if (document.status === "failed") {
    return "This document could not be processed and cannot be used for grounded chat.";
  }
  return "This document is unavailable while deletion completes.";
}

export function LearningConversationWorkspace() {
  const { documentId = "", conversationId = "" } = useParams<{
    documentId: string;
    conversationId: string;
  }>();
  const { user } = useAuth();
  const accountId = user?.id ?? "";
  const identity = `${accountId}:${documentId}:${conversationId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;

  const [loadState, setLoadState] =
    useState<LoadState>({ status: "loading" });
  const [messages, setMessages] = useState<LearningMessage[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [messagePage, setMessagePage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<SafeError>();
  const [historyVersion, setHistoryVersion] = useState(0);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<SafeError>();
  const [sending, setSending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [pendingJob, setPendingJob] =
    useState<AcceptedLearningChatJob | LearningChatJob>();
  const [responseState, setResponseState] =
    useState<ResponseState>({ status: "idle" });
  const [selectedSourcePage, setSelectedSourcePage] = useState<number>();
  const documentSequence = useRef(0);
  const historySequence = useRef(0);
  const sendController = useRef<AbortController | undefined>(undefined);
  const pollController = useRef<AbortController | undefined>(undefined);
  const completionController = useRef<AbortController | undefined>(
    undefined,
  );
  const sendInFlight = useRef(false);
  const intent = useRef<{ id: string; content: string } | undefined>(
    undefined,
  );
  const questionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++documentSequence.current;
    setLoadState({ status: "loading" });
    setMessages([]);
    setPagination(undefined);
    setMessagePage(1);
    setHistoryError(undefined);
    setDraft("");
    setSendError(undefined);
    setSending(false);
    setUncertain(false);
    setPendingJob(undefined);
    setResponseState({ status: "idle" });
    setSelectedSourcePage(undefined);
    sendInFlight.current = false;
    intent.current = undefined;
    sendController.current?.abort();
    pollController.current?.abort();
    completionController.current?.abort();

    void fetchLearningDocument(documentId, controller.signal)
      .then((result) => {
        if (
          controller.signal.aborted ||
          current !== documentSequence.current ||
          identityRef.current !== identity ||
          result.document.id !== documentId
        ) {
          return;
        }
        setLoadState({ status: "ready", document: result.document });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const safe = safeError(
          error,
          "The grounded conversation is currently unavailable.",
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
      documentSequence.current += 1;
      historySequence.current += 1;
      sendController.current?.abort();
      pollController.current?.abort();
      completionController.current?.abort();
      sendInFlight.current = false;
      intent.current = undefined;
    };
  }, [accountId, conversationId, documentId, identity]);

  const document =
    loadState.status === "ready" ? loadState.document : undefined;

  useEffect(() => {
    if (!document || document.status !== "ready") {
      setHistoryLoading(false);
      return;
    }
    const controller = new AbortController();
    const current = ++historySequence.current;
    setHistoryLoading(true);
    setHistoryError(undefined);

    void listLearningMessages(
      documentId,
      conversationId,
      document.pageCount,
      { page: messagePage, limit: MESSAGE_LIMIT },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          current !== historySequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        setMessages(result.messages);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          current !== historySequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const safe = safeError(
          error,
          "Conversation history could not be loaded.",
        );
        if (error instanceof ApiError && error.status === 404) {
          setMessages([]);
          setPagination(undefined);
          setDraft("");
          setSendError(undefined);
          setSending(false);
          setUncertain(false);
          setPendingJob(undefined);
          setResponseState({ status: "idle" });
          setSelectedSourcePage(undefined);
          sendInFlight.current = false;
          intent.current = undefined;
          sendController.current?.abort();
          pollController.current?.abort();
          completionController.current?.abort();
          setLoadState({ status: "not-found", error: safe });
          return;
        }
        setMessages([]);
        setPagination(undefined);
        setHistoryError(safe);
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          current === historySequence.current &&
          identityRef.current === identity
        ) {
          setHistoryLoading(false);
        }
      });

    return () => {
      controller.abort();
      historySequence.current += 1;
    };
  }, [
    conversationId,
    document,
    documentId,
    historyVersion,
    identity,
    messagePage,
  ]);

  const refreshCanonicalCompletion = useCallback(
    async (job: LearningChatJob, expectedIdentity: string) => {
      if (!document || !job.result) {
        throw new ApiError(
          502,
          "INVALID_LEARNING_RESPONSE",
          "The server returned an invalid learning response.",
        );
      }
      const predictedTotal =
        (pagination?.total ?? messages.length) + 2;
      completionController.current?.abort();
      const page = Math.max(1, Math.ceil(predictedTotal / MESSAGE_LIMIT));
      const controller = new AbortController();
      completionController.current = controller;
      const current = ++historySequence.current;
      try {
        const result = await listLearningMessages(
          documentId,
          conversationId,
          document.pageCount,
          { page, limit: MESSAGE_LIMIT },
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== historySequence.current ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        const assistant = result.messages.find(
          (message) =>
            message.id === job.result?.messageId &&
            message.role === "assistant",
        );
        if (
          !assistant ||
          assistant.sourcePages.length !==
            job.result.sourcePages.length ||
          assistant.sourcePages.some(
            (pageNumber, index) =>
              pageNumber !== job.result?.sourcePages[index],
          )
        ) {
          throw new ApiError(
            502,
            "INVALID_LEARNING_RESPONSE",
            "The server returned an invalid learning response.",
          );
        }
        setMessagePage(result.pagination.page);
        setMessages(result.messages);
        setPagination(result.pagination);
        setHistoryError(undefined);
        setResponseState({ status: "completed" });
      } finally {
        if (completionController.current === controller) {
          completionController.current = undefined;
        }
      }
    },
    [
      conversationId,
      document,
      documentId,
      messages.length,
      pagination?.total,
    ],
  );

  const runPolling = useCallback(
    (
      job: AcceptedLearningChatJob | LearningChatJob,
      expectedIdentity: string,
    ) => {
      if (
        !document ||
        (job.status !== "queued" && job.status !== "processing")
      ) {
        return;
      }
      pollController.current?.abort();
      const controller = new AbortController();
      pollController.current = controller;
      setPendingJob(job);
      setResponseState({ status: job.status });

      void pollLearningJob<LearningChatJob>({
        jobId: job.id,
        documentId,
        fetchJob: (
          currentJobId,
          _currentDocumentId,
          signal,
        ) =>
          fetchLearningChatJob(
            currentJobId,
            document.pageCount,
            signal,
          ),
        signal: controller.signal,
        onUpdate: (update) => {
          if (
            !controller.signal.aborted &&
            identityRef.current === expectedIdentity &&
            (update.status === "queued" ||
              update.status === "processing")
          ) {
            setPendingJob(update);
            setResponseState({ status: update.status });
          }
        },
      })
        .then(async (result: LearningPollResult<LearningChatJob>) => {
          if (
            controller.signal.aborted ||
            identityRef.current !== expectedIdentity
          ) {
            return;
          }
          if (result.reason === "paused") {
            setPendingJob(result.job ?? job);
            setResponseState({
              status: "paused",
              cause: result.cause,
            });
            return;
          }
          if (result.reason !== "terminal") return;
          if (result.job.status === "completed") {
            await refreshCanonicalCompletion(
              result.job,
              expectedIdentity,
            );
          } else if (result.job.status === "failed") {
            setResponseState({
              status: "failed",
              error: {
                message:
                  result.job.error?.message ??
                  "The grounded response could not be generated.",
              },
            });
          } else {
            setResponseState({ status: "cancelled" });
          }
          setPendingJob(undefined);
          intent.current = undefined;
        })
        .catch((error: unknown) => {
          if (
            controller.signal.aborted ||
            identityRef.current !== expectedIdentity
          ) {
            return;
          }
          setPendingJob(undefined);
          intent.current = undefined;
          setResponseState({
            status: "unavailable",
            error: safeError(
              error,
              "Response checks could not continue safely.",
            ),
          });
        });
    },
    [document, documentId, refreshCanonicalCompletion],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !document ||
      document.status !== "ready" ||
      sendInFlight.current ||
      pendingJob
    ) {
      return;
    }
    const normalized = draft.trim();
    if (!normalized) {
      setSendError({
        message: "Enter a question about this document.",
      });
      return;
    }
    if (normalized.length > MAX_QUESTION_LENGTH) {
      setSendError({
        message: `Use ${MAX_QUESTION_LENGTH.toLocaleString()} characters or fewer.`,
      });
      return;
    }

    const activeIntent =
      intent.current?.content === normalized
        ? intent.current
        : { id: crypto.randomUUID(), content: normalized };
    intent.current = activeIntent;
    const expectedIdentity = identity;
    const controller = new AbortController();
    sendController.current?.abort();
    sendController.current = controller;
    sendInFlight.current = true;
    setSending(true);
    setUncertain(false);
    setSendError(undefined);

    try {
      const result = await sendLearningMessage(
        documentId,
        conversationId,
        normalized,
        activeIntent.id,
        document.pageCount,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        identityRef.current !== expectedIdentity
      ) {
        return;
      }
      setMessages((current) => {
        if (
          current.some(
            (message) => message.id === result.userMessage.id,
          )
        ) {
          return current;
        }
        return [...current, result.userMessage];
      });
      setDraft("");
      setUncertain(false);
      window.setTimeout(() => questionRef.current?.focus(), 0);
      runPolling(result.job, expectedIdentity);
    } catch (error) {
      if (controller.signal.aborted) return;
      const outcomeUncertain =
        !(error instanceof ApiError) ||
        error.code === "INVALID_LEARNING_RESPONSE";
      setUncertain(outcomeUncertain);
      if (!outcomeUncertain) intent.current = undefined;
      setSendError(
        safeError(
          error,
          outcomeUncertain
            ? "The send outcome is uncertain. Retry the same question to reuse its request identity."
            : "The question could not be sent.",
        ),
      );
    } finally {
      if (sendController.current === controller) {
        sendController.current = undefined;
        sendInFlight.current = false;
        setSending(false);
      }
    }
  };

  if (loadState.status === "loading") {
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: "Loading conversation" },
          ]}
        />
        <div className="learning-state" role="status">
          Loading grounded conversation…
        </div>
      </section>
    );
  }

  if (loadState.status !== "ready") {
    const title =
      loadState.status === "not-found"
        ? "Conversation not found"
        : loadState.status === "malformed"
          ? "Conversation response unavailable"
          : "Conversation unavailable";
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: title },
          ]}
        />
        <p className="eyebrow">Grounded document chat</p>
        <h1>{title}</h1>
        <p className="section-intro">{loadState.error.message}</p>
        <RequestId value={loadState.error.requestId} />
        <Link className="learning-back-link" to="/learning">
          Return to document library
        </Link>
      </section>
    );
  }

  if (loadState.document.status !== "ready") {
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            {
              label: loadState.document.title,
              to: `/learning/documents/${documentId}`,
            },
            { label: "Conversation" },
          ]}
        />
        <Link
          className="learning-back-link"
          to={`/learning/documents/${documentId}`}
        >
          ← Document workspace
        </Link>
        <p className="eyebrow">Grounded document chat</p>
        <h1>Chat unavailable</h1>
        <div className="learning-state learning-state--compact">
          <p>{unavailableMessage(loadState.document)}</p>
        </div>
      </section>
    );
  }

  const responseBusy = pendingJob !== undefined || sending;

  return (
    <section className="workspace-section learning-workspace learning-chat-workspace">
      <Breadcrumbs
        items={[
          { label: "Learning", to: "/learning" },
          {
            label: loadState.document.title,
            to: `/learning/documents/${documentId}`,
          },
          { label: "Conversation" },
        ]}
      />
      <Link
        className="learning-back-link"
        to={`/learning/documents/${documentId}`}
      >
        ← {loadState.document.title}
      </Link>
      <header className="learning-workspace-header">
        <div>
          <p className="eyebrow">Grounded document chat</p>
          <h1>Ask the document</h1>
          <p className="section-intro">
            Answers use canonical stored messages and validated page
            references from {loadState.document.title}.
          </p>
        </div>
      </header>

      <div className="learning-message-panel">
        {historyLoading ? (
          <div className="learning-state learning-state--compact" role="status">
            Loading message history…
          </div>
        ) : historyError ? (
          <div
            className="learning-state learning-state--error learning-state--compact"
            role="alert"
          >
            <p>{historyError.message}</p>
            <RequestId value={historyError.requestId} />
            <button
              type="button"
              className="learning-secondary-button"
              onClick={() =>
                setHistoryVersion((current) => current + 1)
              }
            >
              Try message history again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="learning-state learning-state--compact">
            <h2>No messages yet.</h2>
            <p>Ask a question when you are ready.</p>
          </div>
        ) : (
          <ol className="learning-message-list">
            {messages.map((message) => (
              <li key={message.id}>
                <article
                  className={`learning-message learning-message--${message.role}`}
                >
                  <p className="learning-message-role">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="learning-message-content">
                    {message.content}
                  </p>
                  {message.role === "assistant" &&
                  message.sourcePages.length > 0 ? (
                    <div
                      className="learning-source-pages"
                      aria-label="Validated source pages"
                    >
                      {message.sourcePages.map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setSelectedSourcePage(page)}
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
        )}

        {pagination && pagination.pages > 1 ? (
          <nav
            className="learning-pagination"
            aria-label="Message history pages"
          >
            <button
              type="button"
              className="learning-secondary-button"
              aria-label="Previous message page"
              disabled={messagePage <= 1 || historyLoading}
              onClick={() =>
                setMessagePage((current) => current - 1)
              }
            >
              Previous
            </button>
            <span>
              Message page {messagePage} of {pagination.pages}
            </span>
            <button
              type="button"
              className="learning-secondary-button"
              aria-label="Next message page"
              disabled={
                messagePage >= pagination.pages || historyLoading
              }
              onClick={() =>
                setMessagePage((current) => current + 1)
              }
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>

      {selectedSourcePage !== undefined ? (
        <aside className="learning-source-note" aria-live="polite">
          <p>
            Page {selectedSourcePage} is a validated reference for this
            stored answer. Review the document’s Extracted Content view for
            the authoritative page-aware text.
          </p>
          <Link
            className="learning-back-link"
            to={`/learning/documents/${documentId}`}
          >
            Open document workspace
          </Link>
        </aside>
      ) : null}

      <ResponseStatus
        state={responseState}
        onResume={() => {
          if (pendingJob) runPolling(pendingJob, identity);
        }}
      />

      <form className="learning-chat-form" onSubmit={submit}>
        <label htmlFor="learning-question">
          <span>Question</span>
          <textarea
            ref={questionRef}
            id="learning-question"
            rows={5}
            maxLength={MAX_QUESTION_LENGTH}
            value={draft}
            disabled={pendingJob !== undefined || sending || uncertain}
            onChange={(event) => {
              setDraft(event.target.value);
              setSendError(undefined);
            }}
          />
        </label>
        {sendError ? (
          <div className="learning-error" role="alert">
            <p>{sendError.message}</p>
            <RequestId value={sendError.requestId} />
          </div>
        ) : null}
        <div className="learning-form-actions">
          <button
            type="submit"
            className="learning-primary-button"
            disabled={responseBusy}
          >
            {sending
              ? "Sending…"
              : uncertain
                ? "Retry same question"
                : "Send question"}
          </button>
          {uncertain ? (
            <button
              type="button"
              className="learning-secondary-button"
              onClick={() => {
                intent.current = undefined;
                setUncertain(false);
                setSendError(undefined);
              }}
            >
              Start a different question
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function ResponseStatus({
  state,
  onResume,
}: {
  state: ResponseState;
  onResume(): void;
}) {
  if (state.status === "idle") return null;
  if (state.status === "completed") {
    return (
      <div className="learning-response-status" role="status">
        New grounded response available.
      </div>
    );
  }
  if (state.status === "queued" || state.status === "processing") {
    return (
      <div className="learning-response-status" role="status">
        {state.status === "queued"
          ? "Response queued. Waiting for grounded processing."
          : "Grounded response processing is in progress."}
      </div>
    );
  }
  if (state.status === "paused") {
    return (
      <div className="learning-response-status">
        <p>
          Response checks are paused locally. This does not mean the backend
          job failed or was cancelled.
        </p>
        <button
          type="button"
          className="learning-secondary-button"
          onClick={onResume}
        >
          Resume response checks
        </button>
      </div>
    );
  }
  if (state.status === "cancelled") {
    return (
      <div className="learning-response-status" role="status">
        Grounded response was cancelled. No assistant answer was created.
      </div>
    );
  }
  const error =
    state.status === "failed" || state.status === "unavailable"
      ? state.error
      : undefined;
  return (
    <div className="learning-response-status learning-state--error" role="alert">
      <p>
        {state.status === "failed"
          ? `Grounded response failed. ${error?.message ?? ""}`
          : error?.message}
      </p>
      <RequestId value={error?.requestId} />
    </div>
  );
}
