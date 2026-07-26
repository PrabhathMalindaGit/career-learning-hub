import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import {
  createFlashcardSet,
  fetchFlashcardSet,
  fetchLearningFlashcardJob,
  listFlashcardSets,
  listLearningFlashcards,
} from "./learningApi";
import {
  pollLearningJob,
  type LearningPollResult,
} from "./learningPolling";
import type {
  AcceptedLearningFlashcardJob,
  FlashcardSet,
  LearningDocument,
  LearningFlashcardJob,
  LearningPagination,
} from "./types";

const SET_LIMIT = 10;
const MAX_SET_TITLE = 200;
const MAX_FOCUS_LENGTH = 500;
const MAX_FLASHCARDS = 100;

type SafeError = {
  message: string;
  requestId?: string;
};

type GenerationState =
  | { status: "idle" }
  | { status: "queued" | "processing" }
  | { status: "paused"; cause: "timeout" | "transport-failure" }
  | { status: "failed" | "unavailable"; error: SafeError }
  | { status: "cancelled" }
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

export function DocumentFlashcards({
  accountId,
  document,
}: {
  accountId: string;
  document: LearningDocument;
}) {
  const navigate = useNavigate();
  const identity = `${accountId}:${document.id}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<SafeError>();
  const [listVersion, setListVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState("10");
  const [focus, setFocus] = useState("");
  const [createError, setCreateError] = useState<SafeError>();
  const [creating, setCreating] = useState(false);
  const [pendingJob, setPendingJob] = useState<
    AcceptedLearningFlashcardJob | LearningFlashcardJob
  >();
  const [pendingSetId, setPendingSetId] = useState<string>();
  const [generationState, setGenerationState] =
    useState<GenerationState>({ status: "idle" });
  const [acceptedRequestId, setAcceptedRequestId] = useState<string>();
  const listSequence = useRef(0);
  const createController = useRef<AbortController | undefined>(
    undefined,
  );
  const pollController = useRef<AbortController | undefined>(
    undefined,
  );
  const completionController = useRef<AbortController | undefined>(
    undefined,
  );
  const createInFlight = useRef(false);
  const intent = useRef<
    | {
        requestId: string;
        title: string;
        count: number;
        focus?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    setPage(1);
    setSets([]);
    setPagination(undefined);
    setLoadError(undefined);
    setTitle("");
    setCount("10");
    setFocus("");
    setCreateError(undefined);
    setCreating(false);
    setPendingJob(undefined);
    setPendingSetId(undefined);
    setGenerationState({ status: "idle" });
    setAcceptedRequestId(undefined);
    createInFlight.current = false;
    intent.current = undefined;
    createController.current?.abort();
    pollController.current?.abort();
    completionController.current?.abort();

    return () => {
      createController.current?.abort();
      pollController.current?.abort();
      completionController.current?.abort();
      createInFlight.current = false;
      intent.current = undefined;
    };
  }, [accountId, document.id]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++listSequence.current;
    setLoading(true);
    setLoadError(undefined);

    void listFlashcardSets(
      document.id,
      { page, limit: SET_LIMIT },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          current !== listSequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        setSets(result.sets);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          current !== listSequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        setSets([]);
        setPagination(undefined);
        setLoadError(
          safeError(error, "Your flashcard sets could not be loaded."),
        );
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          current === listSequence.current &&
          identityRef.current === identity
        ) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
      listSequence.current += 1;
    };
  }, [document.id, identity, listVersion, page]);

  const refreshCanonicalCompletion = useCallback(
    async (
      job: LearningFlashcardJob,
      expectedIdentity: string,
    ): Promise<void> => {
      if (!job.result || job.result.setId === "") {
        throw new ApiError(
          502,
          "INVALID_LEARNING_RESPONSE",
          "The server returned an invalid learning response.",
        );
      }
      completionController.current?.abort();
      const controller = new AbortController();
      completionController.current = controller;
      try {
        const setResult = await fetchFlashcardSet(
          document.id,
          job.result.setId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        const cardResult = await listLearningFlashcards(
          job.result.setId,
          document.pageCount,
          { page: 1, limit: 100 },
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        const expectedCount = job.result.cardCount;
        if (
          setResult.set.status !== "ready" ||
          setResult.set.cardCount !== expectedCount ||
          cardResult.pagination.page !== 1 ||
          cardResult.pagination.pages > 1 ||
          cardResult.pagination.total !== expectedCount ||
          cardResult.cards.length !== expectedCount ||
          cardResult.cards.some(
            (card, index) => card.cardIndex !== index,
          )
        ) {
          throw new ApiError(
            502,
            "INVALID_LEARNING_RESPONSE",
            "The server returned an invalid learning response.",
          );
        }
        setPendingJob(undefined);
        setPendingSetId(undefined);
        setGenerationState({ status: "completed" });
        setListVersion((current) => current + 1);
        navigate(
          `/learning/documents/${document.id}/flashcards/${job.result.setId}`,
        );
      } finally {
        if (completionController.current === controller) {
          completionController.current = undefined;
        }
      }
    },
    [document.id, document.pageCount, navigate],
  );

  const runPolling = useCallback(
    (
      job: AcceptedLearningFlashcardJob | LearningFlashcardJob,
      setId: string,
      expectedIdentity: string,
    ) => {
      if (job.status !== "queued" && job.status !== "processing") return;
      pollController.current?.abort();
      const controller = new AbortController();
      pollController.current = controller;
      setPendingJob(job);
      setPendingSetId(setId);
      setGenerationState({ status: job.status });

      void pollLearningJob<LearningFlashcardJob>({
        jobId: job.id,
        documentId: document.id,
        fetchJob: (currentJobId, _documentId, signal) =>
          fetchLearningFlashcardJob(currentJobId, setId, signal),
        signal: controller.signal,
        onUpdate: (update) => {
          if (
            !controller.signal.aborted &&
            identityRef.current === expectedIdentity &&
            (update.status === "queued" ||
              update.status === "processing")
          ) {
            setPendingJob(update);
            setGenerationState({ status: update.status });
          }
        },
      })
        .then(
          async (
            result: LearningPollResult<LearningFlashcardJob>,
          ) => {
            if (
              controller.signal.aborted ||
              identityRef.current !== expectedIdentity
            ) {
              return;
            }
            if (result.reason === "paused") {
              setPendingJob(result.job ?? job);
              setGenerationState({
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
              setPendingJob(undefined);
              setPendingSetId(undefined);
              setGenerationState({
                status: "failed",
                error: {
                  message:
                    result.job.error?.message ??
                    "Flashcard generation failed.",
                },
              });
              setListVersion((current) => current + 1);
            } else {
              setPendingJob(undefined);
              setPendingSetId(undefined);
              setGenerationState({ status: "cancelled" });
              setListVersion((current) => current + 1);
            }
          },
        )
        .catch((error: unknown) => {
          if (
            controller.signal.aborted ||
            identityRef.current !== expectedIdentity
          ) {
            return;
          }
          setPendingJob(undefined);
          setPendingSetId(undefined);
          setGenerationState({
            status: "unavailable",
            error: safeError(
              error,
              "Generation checks could not continue safely.",
            ),
          });
        });
    },
    [document.id, refreshCanonicalCompletion],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (createInFlight.current || pendingJob) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setCreateError({ message: "Enter a flashcard-set title." });
      return;
    }
    if (normalizedTitle.length > MAX_SET_TITLE) {
      setCreateError({
        message: `Use ${MAX_SET_TITLE} characters or fewer for the title.`,
      });
      return;
    }
    const parsedCount = Number(count);
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > MAX_FLASHCARDS
    ) {
      setCreateError({ message: "Choose between 1 and 100 cards." });
      return;
    }
    const normalizedFocus = focus.trim();
    if (normalizedFocus.length > MAX_FOCUS_LENGTH) {
      setCreateError({
        message: `Use ${MAX_FOCUS_LENGTH} characters or fewer for the focus.`,
      });
      return;
    }

    const currentIntent =
      intent.current?.title === normalizedTitle &&
      intent.current.count === parsedCount &&
      intent.current.focus === (normalizedFocus || undefined)
        ? intent.current
        : {
            requestId: crypto.randomUUID(),
            title: normalizedTitle,
            count: parsedCount,
            ...(normalizedFocus ? { focus: normalizedFocus } : {}),
          };
    intent.current = currentIntent;
    const expectedIdentity = identity;
    const controller = new AbortController();
    createController.current?.abort();
    createController.current = controller;
    createInFlight.current = true;
    setCreating(true);
    setCreateError(undefined);
    setAcceptedRequestId(undefined);

    try {
      const result = await createFlashcardSet(
        document.id,
        currentIntent,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        identityRef.current !== expectedIdentity ||
        result.documentId !== document.id
      ) {
        return;
      }
      setTitle("");
      setCount("10");
      setFocus("");
      setAcceptedRequestId(result.requestId);
      intent.current = undefined;
      setListVersion((current) => current + 1);
      runPolling(result.job, result.setId, expectedIdentity);
    } catch (error) {
      if (!controller.signal.aborted) {
        setCreateError(
          safeError(error, "Flashcard generation could not be started."),
        );
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
    <section
      className="learning-flashcard-sets"
      aria-labelledby="learning-flashcard-sets-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Grounded recall</p>
          <h2 id="learning-flashcard-sets-title">Flashcard sets</h2>
          <p>
            Generate immutable study cards from this document’s validated
            extracted content.
          </p>
        </div>
        <button
          type="button"
          className="learning-secondary-button"
          disabled={loading}
          onClick={() => setListVersion((current) => current + 1)}
        >
          Refresh flashcard sets
        </button>
      </header>

      <form className="learning-flashcard-form" onSubmit={submit}>
        <label htmlFor="learning-flashcard-title">
          <span>Set title</span>
          <input
            id="learning-flashcard-title"
            value={title}
            maxLength={MAX_SET_TITLE}
            disabled={creating || pendingJob !== undefined}
            onChange={(event) => {
              setTitle(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        <label htmlFor="learning-flashcard-count">
          <span>Card count</span>
          <input
            id="learning-flashcard-count"
            type="number"
            min="1"
            max={MAX_FLASHCARDS}
            value={count}
            disabled={creating || pendingJob !== undefined}
            onChange={(event) => {
              setCount(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        <label
          className="learning-flashcard-focus"
          htmlFor="learning-flashcard-focus"
        >
          <span>Focus (optional)</span>
          <textarea
            id="learning-flashcard-focus"
            rows={3}
            maxLength={MAX_FOCUS_LENGTH}
            value={focus}
            disabled={creating || pendingJob !== undefined}
            onChange={(event) => {
              setFocus(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        {createError ? (
          <div className="learning-error learning-flashcard-form-error" role="alert">
            <p>{createError.message}</p>
            <RequestId value={createError.requestId} />
          </div>
        ) : null}
        <button
          type="submit"
          className="learning-primary-button"
          disabled={creating || pendingJob !== undefined}
        >
          {creating ? "Starting generation…" : "Generate flashcards"}
        </button>
      </form>

      <GenerationStatus
        state={generationState}
        requestId={acceptedRequestId}
        onResume={() => {
          if (pendingJob && pendingSetId) {
            runPolling(pendingJob, pendingSetId, identity);
          }
        }}
      />

      {loading ? (
        <div className="learning-state learning-state--compact" role="status">
          Loading flashcard sets…
        </div>
      ) : loadError ? (
        <div
          className="learning-state learning-state--error learning-state--compact"
          role="alert"
        >
          <p>{loadError.message}</p>
          <RequestId value={loadError.requestId} />
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() => setListVersion((current) => current + 1)}
          >
            Try flashcard sets again
          </button>
        </div>
      ) : sets.length === 0 ? (
        <div className="learning-state learning-state--compact">
          <h3>No flashcard sets yet.</h3>
          <p>Generate a set when you are ready to study this document.</p>
        </div>
      ) : (
        <ul className="learning-flashcard-set-list">
          {sets.map((set) => (
            <li key={set.id}>
              <article>
                <div>
                  <strong>{set.title}</strong>
                  <span
                    className={`learning-status learning-status--${set.status}`}
                  >
                    {set.status === "generating"
                      ? "Generating"
                      : set.status === "failed"
                        ? "Generation failed"
                        : "Ready"}
                  </span>
                </div>
                <p>
                  {set.cardCount === 1
                    ? "1 card"
                    : `${set.cardCount} cards`}
                </p>
                {set.generationError ? (
                  <p className="learning-row-error">
                    {set.generationError.message}
                  </p>
                ) : null}
                {set.status === "ready" ? (
                  <Link
                    className="learning-document-link"
                    to={`/learning/documents/${document.id}/flashcards/${set.id}`}
                    aria-label={`Study ${set.title}, ${set.cardCount} ${
                      set.cardCount === 1 ? "card" : "cards"
                    }`}
                  >
                    Study set
                  </Link>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 ? (
        <nav
          className="learning-pagination"
          aria-label="Flashcard-set pages"
        >
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Previous flashcard-set page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Flashcard-set page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Next flashcard-set page"
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

function GenerationStatus({
  state,
  requestId,
  onResume,
}: {
  state: GenerationState;
  requestId?: string;
  onResume(): void;
}) {
  if (state.status === "idle") return null;
  if (state.status === "queued" || state.status === "processing") {
    return (
      <div className="learning-response-status" role="status">
        <p>
          {state.status === "queued"
            ? "Flashcard generation is queued."
            : "Flashcard generation is processing."}
        </p>
        <RequestId value={requestId} />
      </div>
    );
  }
  if (state.status === "paused") {
    return (
      <div className="learning-response-status">
        <p>
          Generation checks are paused locally. This does not mean the
          backend job failed or was cancelled.
        </p>
        <RequestId value={requestId} />
        <button
          type="button"
          className="learning-secondary-button"
          onClick={onResume}
        >
          Resume generation checks
        </button>
      </div>
    );
  }
  if (state.status === "cancelled") {
    return (
      <div className="learning-response-status" role="status">
        Flashcard generation was cancelled. No completed set is claimed.
      </div>
    );
  }
  if (state.status === "completed") {
    return (
      <div className="learning-response-status" role="status">
        Canonical flashcards are ready.
      </div>
    );
  }
  if (state.status === "failed" || state.status === "unavailable") {
    return (
      <div
        className="learning-response-status learning-state--error"
        role="alert"
      >
        <p>{state.error.message}</p>
        <RequestId value={state.error.requestId} />
      </div>
    );
  }
  return null;
}
