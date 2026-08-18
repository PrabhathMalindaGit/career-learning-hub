import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import { LearningChildDeletion } from "./LearningChildDeletion";
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
import { LearningGenerationJobStatus } from "./LearningGenerationJobStatus";
import type {
  AcceptedLearningFlashcardJob,
  FlashcardSet,
  LearningDocument,
  LearningFlashcardJob,
  LearningPagination,
} from "./types";
import "./learningPhase19c.css";

const SET_LIMIT = 10;
const MAX_SET_TITLE = 200;
const MAX_FOCUS_LENGTH = 500;
const MAX_FLASHCARDS = 100;
const setDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

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
      ...(error.requestId === undefined ? {} : { requestId: error.requestId }),
    };
  }
  return { message: fallback };
}

function RequestId({ value }: { value?: string }) {
  return value ? <p className="request-id">Request ID: {value}</p> : null;
}

// Feature 5.8.1 — Document-based flashcard generation.
// Creates and tracks grounded flashcard sets, then opens ready sets for study.
// Feature 5.8 UI — Flashcards workspace.
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
  const [generationOpen, setGenerationOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState("10");
  const [focus, setFocus] = useState("");
  const [createError, setCreateError] = useState<SafeError>();
  const [creating, setCreating] = useState(false);
  const [pendingJob, setPendingJob] = useState<
    AcceptedLearningFlashcardJob | LearningFlashcardJob
  >();
  const [resilienceJob, setResilienceJob] = useState<LearningFlashcardJob>();
  const [pendingSetId, setPendingSetId] = useState<string>();
  const [generationState, setGenerationState] =
    useState<GenerationState>({ status: "idle" });
  const [acceptedRequestId, setAcceptedRequestId] = useState<string>();
  const listSequence = useRef(0);
  const createController = useRef<AbortController | undefined>(undefined);
  const pollController = useRef<AbortController | undefined>(undefined);
  const completionController = useRef<AbortController | undefined>(undefined);
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
    setGenerationOpen(false);
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
          cardResult.cards.some((card, index) => card.cardIndex !== index)
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
        setGenerationOpen(false);
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
            (update.status === "queued" || update.status === "processing")
          ) {
            setPendingJob(update);
            setResilienceJob(update);
            setGenerationState({ status: update.status });
          }
        },
      })
        .then(async (result: LearningPollResult<LearningFlashcardJob>) => {
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
          setResilienceJob(result.job);
          if (result.job.status === "completed") {
            await refreshCanonicalCompletion(result.job, expectedIdentity);
          } else if (result.job.status === "failed") {
            setPendingJob(undefined);
            setGenerationState({
              status: "failed",
              error: {
                message:
                  result.job.error?.message ?? "Flashcard generation failed.",
              },
            });
            setListVersion((current) => current + 1);
          } else {
            setPendingJob(undefined);
            setGenerationState({ status: "cancelled" });
            setListVersion((current) => current + 1);
          }
        })
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

  async function cancelGeneration(signal: AbortSignal): Promise<void> {
    if (!resilienceJob) return;
    const cancelled = await cancelJob(resilienceJob.id, signal);
    if (signal.aborted) return;
    if (
      cancelled.id !== resilienceJob.id ||
      cancelled.type !== "learning.flashcards.generate"
    ) {
      throw new ApiError(
        502,
        "INVALID_LEARNING_RESPONSE",
        "The server returned an invalid learning response.",
      );
    }
    if (cancelled.status !== "cancelled") {
      setResilienceJob({
        ...resilienceJob,
        status: "processing",
        phase: cancelled.phase,
        phaseSequence: cancelled.phaseSequence,
        canRetry: cancelled.canRetry,
        updatedAt: cancelled.updatedAt,
      });
      return;
    }
    pollController.current?.abort();
    setPendingJob(undefined);
    setResilienceJob({
      ...resilienceJob,
      status: "cancelled",
      phase: cancelled.phase,
      phaseSequence: cancelled.phaseSequence,
      canRetry: cancelled.canRetry,
      updatedAt: cancelled.updatedAt,
    });
    setGenerationState({ status: "cancelled" });
  }

  async function retryGeneration(signal: AbortSignal): Promise<void> {
    if (!resilienceJob || !pendingSetId) return;
    const retried = await retryJob(resilienceJob.id, signal);
    if (signal.aborted) return;
    if (retried.type !== "learning.flashcards.generate") {
      throw new ApiError(
        502,
        "INVALID_LEARNING_RESPONSE",
        "The server returned an invalid learning response.",
      );
    }
    runPolling(
      {
        id: retried.id,
        type: "learning.flashcards.generate",
        status: "queued",
      },
      pendingSetId,
      identity,
    );
  }

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

  const handleDeleted = useCallback(() => {
    if (sets.length === 1 && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setListVersion((current) => current + 1);
  }, [page, sets.length]);

  const showGenerationForm =
    generationOpen || (!loading && !loadError && sets.length === 0);

  return (
    /* =========================================================
       FIND: FLASHCARDS
       STYLE: learningWorkspace.css -> .learning-flashcard-set-list
       ========================================================= */
    <section
      className="learning-flashcard-sets"
      aria-labelledby="learning-flashcard-sets-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Document-based flashcards</p>
          <h2 id="learning-flashcard-sets-title">Flashcard sets</h2>
          <p>Create study cards from this document and return to saved sets.</p>
        </div>
        <div className="learning-panel-actions">
          <button
            type="button"
            className="learning-primary-button"
            aria-expanded={showGenerationForm}
            aria-controls="learning-flashcard-generation"
            disabled={pendingJob !== undefined}
            onClick={() => setGenerationOpen((current) => !current)}
          >
            {showGenerationForm ? "Close creator" : "Create flashcards"}
          </button>
          <button
            type="button"
            className="learning-secondary-button"
            disabled={loading}
            onClick={() => setListVersion((current) => current + 1)}
          >
            Refresh sets
          </button>
        </div>
      </header>

      <GenerationStatus
        state={generationState}
        job={resilienceJob}
        onCancel={cancelGeneration}
        onRetry={retryGeneration}
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
          <p>Create a set when you are ready to study this document.</p>
        </div>
      ) : (
        <ul
          className="learning-flashcard-set-list"
          aria-label={`Flashcard sets for ${document.title}`}
          role="list"
        >
          {sets.map((set, index) => (
            <li key={set.id}>
              <article
                className="learning-collection-card learning-collection-card--flashcards"
                aria-label={`Flashcard set ${set.title}`}
              >
                <div className="learning-collection-card-heading">
                  <span className="learning-collection-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="learning-collection-type">Flashcard set</p>
                    <h3>{set.title}</h3>
                  </div>
                  <span className={`learning-status learning-status--${set.status}`}>
                    {set.status === "generating"
                      ? "Generating"
                      : set.status === "failed"
                        ? "Generation failed"
                        : "Ready to study"}
                  </span>
                  <LearningChildDeletion
                    kind="flashcard-set"
                    id={set.id}
                    title={set.title}
                    disabled={set.status === "generating"}
                    onDeleted={handleDeleted}
                  />
                </div>
                <div className="learning-collection-meta">
                  <span>{set.cardCount === 1 ? "1 card" : `${set.cardCount} cards`}</span>
                  <span>
                    Created{" "}
                    <time dateTime={set.createdAt}>
                      {setDateFormatter.format(new Date(set.createdAt))}
                    </time>
                  </span>
                </div>
                {set.generationError ? (
                  <p className="learning-row-error">{set.generationError.message}</p>
                ) : null}
                {set.status === "ready" ? (
                  /* =========================================================
                     FIND: STUDY FLASHCARDS
                     STYLE: learningWorkspace.css
                     SELECTOR: .learning-document-link
                     ========================================================= */
                  <Link
                    className="learning-document-link"
                    to={`/learning/documents/${document.id}/flashcards/${set.id}`}
                    aria-label={`Study ${set.title}, ${set.cardCount} ${
                      set.cardCount === 1 ? "card" : "cards"
                    }`}
                  >
                    {/* Feature 5.8.2 UI — Open flashcard Study set. */}
                    Study set
                  </Link>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 ? (
        <nav className="learning-pagination" aria-label="Flashcard-set pages">
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Previous flashcard-set page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>Flashcard-set page {page} of {pagination.pages}</span>
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

      {showGenerationForm ? (
        <section
          id="learning-flashcard-generation"
          className="learning-generation-panel"
          aria-labelledby="learning-flashcard-generation-title"
        >
          <div className="learning-generation-heading">
            <p className="learning-kicker">New set</p>
            <h3 id="learning-flashcard-generation-title">Create flashcards</h3>
          </div>
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
                rows={2}
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
              <div
                className="learning-error learning-flashcard-form-error"
                role="alert"
              >
                <p>{createError.message}</p>
                <RequestId value={createError.requestId} />
              </div>
            ) : null}
            {/* =========================================================
                FIND: GENERATE FLASHCARDS
                STYLE: learningWorkspace.css
                SELECTOR: .learning-primary-button
                BACKEND: learning.jobs.ts -> FIND: GENERATE FLASHCARDS BACKEND
                ========================================================= */}
            <button
              type="submit"
              className="learning-primary-button"
              disabled={creating || pendingJob !== undefined}
            >
              {/* Feature 5.8.1 UI — Generate flashcards. */}
              {creating ? "Starting generation…" : "Generate flashcards"}
            </button>
          </form>
        </section>
      ) : null}
    </section>
  );
}

function GenerationStatus({
  state,
  job,
  onCancel,
  onRetry,
  requestId,
  onResume,
}: {
  state: GenerationState;
  job?: LearningFlashcardJob;
  onCancel(signal: AbortSignal): Promise<void>;
  onRetry(signal: AbortSignal): Promise<void>;
  requestId?: string;
  onResume(): void;
}) {
  if (state.status === "idle") return null;
  if (state.status === "queued" || state.status === "processing") {
    return (
      <LearningGenerationJobStatus
        status={state.status}
        message={
          <p>
            {state.status === "queued"
              ? "Flashcard generation is queued."
              : "Flashcard generation is processing."}
          </p>
        }
        requestId={requestId}
        actions={
          job ? (
            <JobResilienceActions
              job={normalizeSafeJob(job)}
              onCancel={onCancel}
              onRetry={onRetry}
            />
          ) : undefined
        }
      />
    );
  }
  if (state.status === "paused") {
    return (
      <LearningGenerationJobStatus
        status="paused"
        message={
          <p>
            Generation checks are paused locally. The generation may still be
            continuing.
          </p>
        }
        requestId={requestId}
        actions={
          <>
            <button
              type="button"
              className="learning-secondary-button"
              onClick={onResume}
            >
              Resume generation checks
            </button>
            {job ? (
              <JobResilienceActions
                job={normalizeSafeJob(job)}
                onCancel={onCancel}
                onRetry={onRetry}
              />
            ) : null}
          </>
        }
      />
    );
  }
  if (state.status === "cancelled") {
    return (
      <LearningGenerationJobStatus
        status="cancelled"
        message="Flashcard generation was cancelled."
        actions={
          job ? (
            <JobResilienceActions
              job={normalizeSafeJob(job)}
              onCancel={onCancel}
              onRetry={onRetry}
            />
          ) : undefined
        }
      />
    );
  }
  if (state.status === "completed") {
    return (
      <LearningGenerationJobStatus
        status="completed"
        message="Flashcards are ready."
      />
    );
  }
  if (state.status === "failed" || state.status === "unavailable") {
    return (
      <LearningGenerationJobStatus
        status={state.status}
        message={<p>{state.error.message}</p>}
        requestId={state.error.requestId}
        actions={
          job ? (
            <JobResilienceActions
              job={normalizeSafeJob(job)}
              onCancel={onCancel}
              onRetry={onRetry}
            />
          ) : undefined
        }
      />
    );
  }
  return null;
}
