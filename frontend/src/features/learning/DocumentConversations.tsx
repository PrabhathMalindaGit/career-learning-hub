import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { LearningChildDeletion } from "./LearningChildDeletion";
import {
  createLearningConversation,
  listLearningConversations,
} from "./learningApi";
import type {
  LearningConversation,
  LearningDocument,
  LearningPagination,
} from "./types";
import "./learningPhase19c.css";

const CONVERSATION_LIMIT = 10;
const MAX_CONVERSATION_TITLE = 200;

type SafeError = {
  message: string;
  requestId?: string;
};

function safeError(error: unknown, fallback: string): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId === undefined ? {} : { requestId: error.requestId }),
    };
  }
  return { message: fallback };
}

function RequestId({ value }: { value?: string }) {
  return value ? <p className="request-id">Request ID: {value}</p> : null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DocumentConversations({
  accountId,
  document,
}: {
  accountId: string;
  document: LearningDocument;
}) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<LearningConversation[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<SafeError>();
  const [retryVersion, setRetryVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<SafeError>();
  const [creating, setCreating] = useState(false);
  const listSequence = useRef(0);
  const createController = useRef<AbortController | undefined>(undefined);
  const createInFlight = useRef(false);

  useEffect(() => {
    setPage(1);
    setConversations([]);
    setPagination(undefined);
    setLoadError(undefined);
    setTitle("");
    setCreateError(undefined);
    setCreating(false);
    createInFlight.current = false;
    createController.current?.abort();
    createController.current = undefined;
  }, [accountId, document.id]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++listSequence.current;
    setLoading(true);
    setLoadError(undefined);

    void listLearningConversations(
      document.id,
      { page, limit: CONVERSATION_LIMIT },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted || current !== listSequence.current) return;
        setConversations(result.conversations);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setConversations([]);
        setPagination(undefined);
        setLoadError(safeError(error, "Your conversations could not be loaded."));
      })
      .finally(() => {
        if (!controller.signal.aborted && current === listSequence.current) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
      listSequence.current += 1;
    };
  }, [accountId, document.id, page, retryVersion]);

  useEffect(
    () => () => {
      createController.current?.abort();
      createController.current = undefined;
      createInFlight.current = false;
    },
    [],
  );

  const retry = useCallback(() => {
    setRetryVersion((current) => current + 1);
  }, []);

  const handleDeleted = useCallback(() => {
    if (conversations.length === 1 && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setRetryVersion((current) => current + 1);
  }, [conversations.length, page]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (createInFlight.current) return;
    const normalized = title.trim();
    if (!normalized) {
      setCreateError({ message: "Enter a conversation title." });
      return;
    }
    if (normalized.length > MAX_CONVERSATION_TITLE) {
      setCreateError({ message: `Use ${MAX_CONVERSATION_TITLE} characters or fewer.` });
      return;
    }

    const controller = new AbortController();
    createController.current?.abort();
    createController.current = controller;
    createInFlight.current = true;
    setCreating(true);
    setCreateError(undefined);

    try {
      const result = await createLearningConversation(
        document.id,
        normalized,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        result.conversation.documentId !== document.id
      ) {
        return;
      }
      navigate(
        `/learning/documents/${document.id}/conversations/${result.conversation.id}`,
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        setCreateError(safeError(error, "Conversation could not be created."));
      }
    } finally {
      if (createController.current === controller) {
        createController.current = undefined;
        createInFlight.current = false;
        setCreating(false);
      }
    }
  };

  return (
    <section className="learning-conversations" aria-labelledby="learning-conversations-title">
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Grounded chat</p>
          <h2 id="learning-conversations-title">Conversations</h2>
          <p>Questions are answered from this document’s validated extracted content.</p>
        </div>
        <button
          type="button"
          className="learning-secondary-button"
          onClick={retry}
          disabled={loading}
        >
          Refresh conversations
        </button>
      </header>

      <form className="learning-conversation-form" onSubmit={submit}>
        <label htmlFor="learning-conversation-title-input">
          <span>Conversation title</span>
          <input
            id="learning-conversation-title-input"
            value={title}
            maxLength={MAX_CONVERSATION_TITLE}
            disabled={creating}
            onChange={(event) => {
              setTitle(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        {/* =========================================================
            FIND: CREATE CONVERSATION
            STYLE: learningWorkspace.css
            SELECTOR: .learning-primary-button
            ========================================================= */}
        <button type="submit" className="learning-primary-button" disabled={creating}>
          {/* Feature 5.7.1 UI — Create Grounded Chat conversation. */}
          {creating ? "Creating…" : "Create conversation"}
        </button>
      </form>
      {createError ? (
        <div className="learning-error" role="alert">
          <p>{createError.message}</p>
          <RequestId value={createError.requestId} />
        </div>
      ) : null}

      {loading ? (
        <div className="learning-state learning-state--compact" role="status">
          Loading conversations…
        </div>
      ) : loadError ? (
        <div className="learning-state learning-state--error learning-state--compact" role="alert">
          <p>{loadError.message}</p>
          <RequestId value={loadError.requestId} />
          <button type="button" className="learning-secondary-button" onClick={retry}>
            Try conversations again
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="learning-state learning-state--compact">
          <h3>No conversations yet.</h3>
          <p>Create one when you are ready to ask this document a question.</p>
        </div>
      ) : (
        <ul className="learning-conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <article aria-labelledby={`learning-conversation-title-${conversation.id}`}>
                <div>
                  <p className="learning-kicker">Document conversation</p>
                  <h3 id={`learning-conversation-title-${conversation.id}`}>
                    {conversation.title}
                  </h3>
                  <div className="learning-conversation-meta">
                    <span>
                      {conversation.messageCount === 1
                        ? "1 message"
                        : `${conversation.messageCount} messages`}
                    </span>
                    <span>
                      {conversation.lastMessageAt ? "Last message" : "Updated"}{" "}
                      <time dateTime={conversation.lastMessageAt ?? conversation.updatedAt}>
                        {formatDate(conversation.lastMessageAt ?? conversation.updatedAt)}
                      </time>
                    </span>
                  </div>
                </div>
                <div className="learning-conversation-card-actions">
                  <Link
                    className="learning-document-link"
                    to={`/learning/documents/${document.id}/conversations/${conversation.id}`}
                    aria-label={`Open ${conversation.title} conversation`}
                  >
                    Open conversation
                  </Link>
                  <LearningChildDeletion
                    kind="conversation"
                    id={conversation.id}
                    documentId={document.id}
                    title={conversation.title}
                    onDeleted={handleDeleted}
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 ? (
        <nav className="learning-pagination" aria-label="Conversation pages">
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Previous conversation page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>Conversation page {page} of {pagination.pages}</span>
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Next conversation page"
            disabled={page >= pagination.pages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
