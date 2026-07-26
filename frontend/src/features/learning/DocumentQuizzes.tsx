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
  createQuizGeneration,
  fetchLearningQuizJob,
  fetchQuizForTaking,
  listQuizzes,
} from "./learningApi";
import {
  pollLearningJob,
  type LearningPollResult,
} from "./learningPolling";
import type {
  AcceptedLearningQuizJob,
  LearningDocument,
  LearningPagination,
  LearningQuizJob,
  QuizSummary,
} from "./types";

const QUIZ_LIMIT = 10;
const MAX_TITLE = 200;
const MAX_FOCUS = 500;
const MAX_QUESTIONS = 100;

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

export function DocumentQuizzes({
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
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [pagination, setPagination] = useState<LearningPagination>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<SafeError>();
  const [listVersion, setListVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [focus, setFocus] = useState("");
  const [createError, setCreateError] = useState<SafeError>();
  const [creating, setCreating] = useState(false);
  const [pendingJob, setPendingJob] = useState<
    AcceptedLearningQuizJob | LearningQuizJob
  >();
  const [pendingQuizId, setPendingQuizId] = useState<string>();
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
        questionCount: number;
        focus?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    setPage(1);
    setQuizzes([]);
    setPagination(undefined);
    setLoadError(undefined);
    setTitle("");
    setQuestionCount("5");
    setFocus("");
    setCreateError(undefined);
    setCreating(false);
    setPendingJob(undefined);
    setPendingQuizId(undefined);
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

    void listQuizzes(
      document.id,
      { page, limit: QUIZ_LIMIT },
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
        setQuizzes(result.quizzes);
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
        setQuizzes([]);
        setPagination(undefined);
        setLoadError(safeError(error, "Your quizzes could not be loaded."));
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
    async (job: LearningQuizJob, expectedIdentity: string) => {
      if (!job.result) {
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
        const quiz = await fetchQuizForTaking(
          document.id,
          job.result.quizId,
          document.pageCount,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        if (
          quiz.status !== "ready" ||
          quiz.questionCount !== job.result.questionCount ||
          quiz.questions.length !== job.result.questionCount
        ) {
          throw new ApiError(
            502,
            "INVALID_LEARNING_RESPONSE",
            "The server returned an invalid learning response.",
          );
        }
        setPendingJob(undefined);
        setPendingQuizId(undefined);
        setGenerationState({ status: "completed" });
        setListVersion((current) => current + 1);
        navigate(
          `/learning/documents/${document.id}/quizzes/${job.result.quizId}`,
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
      job: AcceptedLearningQuizJob | LearningQuizJob,
      quizId: string,
      expectedIdentity: string,
    ) => {
      if (job.status !== "queued" && job.status !== "processing") return;
      pollController.current?.abort();
      const controller = new AbortController();
      pollController.current = controller;
      setPendingJob(job);
      setPendingQuizId(quizId);
      setGenerationState({ status: job.status });

      void pollLearningJob<LearningQuizJob>({
        jobId: job.id,
        documentId: document.id,
        fetchJob: (currentJobId, _documentId, signal) =>
          fetchLearningQuizJob(currentJobId, quizId, signal),
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
        .then(async (result: LearningPollResult<LearningQuizJob>) => {
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
            await refreshCanonicalCompletion(result.job, expectedIdentity);
          } else if (result.job.status === "failed") {
            setPendingJob(undefined);
            setPendingQuizId(undefined);
            setGenerationState({
              status: "failed",
              error: {
                message:
                  result.job.error?.message ?? "Quiz generation failed.",
              },
            });
            setListVersion((current) => current + 1);
          } else {
            setPendingJob(undefined);
            setPendingQuizId(undefined);
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
          setPendingQuizId(undefined);
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
    if (
      document.status !== "ready" ||
      createInFlight.current ||
      pendingJob
    ) {
      return;
    }
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setCreateError({ message: "Enter a quiz title." });
      return;
    }
    if (normalizedTitle.length > MAX_TITLE) {
      setCreateError({
        message: `Use ${MAX_TITLE} characters or fewer for the title.`,
      });
      return;
    }
    const parsedCount = Number(questionCount);
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > MAX_QUESTIONS
    ) {
      setCreateError({
        message: "Choose between 1 and 100 questions.",
      });
      return;
    }
    const normalizedFocus = focus.trim();
    if (normalizedFocus.length > MAX_FOCUS) {
      setCreateError({
        message: `Use ${MAX_FOCUS} characters or fewer for the focus.`,
      });
      return;
    }

    const currentIntent =
      intent.current?.title === normalizedTitle &&
      intent.current.questionCount === parsedCount &&
      intent.current.focus === (normalizedFocus || undefined)
        ? intent.current
        : {
            requestId: crypto.randomUUID(),
            title: normalizedTitle,
            questionCount: parsedCount,
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
      const result = await createQuizGeneration(
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
      setQuestionCount("5");
      setFocus("");
      setAcceptedRequestId(result.requestId);
      intent.current = undefined;
      setListVersion((current) => current + 1);
      runPolling(result.job, result.quizId, expectedIdentity);
    } catch (error) {
      if (!controller.signal.aborted) {
        setCreateError(
          safeError(error, "Quiz generation could not be started."),
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

  const generationDisabled =
    document.status !== "ready" || creating || pendingJob !== undefined;

  return (
    <section
      className="learning-quizzes"
      aria-labelledby="learning-quizzes-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Grounded assessment</p>
          <h2 id="learning-quizzes-title">Quizzes</h2>
          <p>
            Generate multiple-choice quizzes from this document, then
            submit answers for server-authoritative scoring.
          </p>
        </div>
        <button
          type="button"
          className="learning-secondary-button"
          disabled={loading}
          onClick={() => setListVersion((current) => current + 1)}
        >
          Refresh quizzes
        </button>
      </header>

      {document.status !== "ready" ? (
        <div className="learning-state learning-state--compact">
          Document processing must finish before quizzes can be generated.
        </div>
      ) : null}

      <form className="learning-quiz-form" onSubmit={submit}>
        <label htmlFor="learning-quiz-title-input">
          <span>Quiz title</span>
          <input
            id="learning-quiz-title-input"
            name="quizTitle"
            autoComplete="off"
            value={title}
            maxLength={MAX_TITLE}
            disabled={generationDisabled}
            onChange={(event) => {
              setTitle(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        <label htmlFor="learning-quiz-count">
          <span>Question count</span>
          <input
            id="learning-quiz-count"
            name="questionCount"
            autoComplete="off"
            type="number"
            min="1"
            max={MAX_QUESTIONS}
            value={questionCount}
            disabled={generationDisabled}
            onChange={(event) => {
              setQuestionCount(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        <label className="learning-quiz-focus" htmlFor="learning-quiz-focus">
          <span>Focus (optional)</span>
          <textarea
            id="learning-quiz-focus"
            name="quizFocus"
            autoComplete="off"
            rows={3}
            maxLength={MAX_FOCUS}
            value={focus}
            disabled={generationDisabled}
            onChange={(event) => {
              setFocus(event.target.value);
              setCreateError(undefined);
            }}
          />
        </label>
        {createError ? (
          <div className="learning-error learning-quiz-form-error" role="alert">
            <p>{createError.message}</p>
            <RequestId value={createError.requestId} />
          </div>
        ) : null}
        <button
          type="submit"
          className="learning-primary-button"
          disabled={generationDisabled}
        >
          {creating ? "Starting generation…" : "Generate quiz"}
        </button>
      </form>

      <QuizGenerationStatus
        state={generationState}
        requestId={acceptedRequestId}
        onResume={() => {
          if (pendingJob && pendingQuizId) {
            runPolling(pendingJob, pendingQuizId, identity);
          }
        }}
      />

      {loading ? (
        <div className="learning-state learning-state--compact" role="status">
          Loading quizzes…
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
            Try quiz list again
          </button>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="learning-state learning-state--compact">
          <h3>No quizzes yet.</h3>
          <p>Generate a quiz when you are ready to test your recall.</p>
        </div>
      ) : (
        <ul className="learning-quiz-set-list">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <article>
                <div>
                  <strong>{quiz.title}</strong>
                  <span
                    className={`learning-status learning-status--${quiz.status}`}
                  >
                    {quiz.status === "generating"
                      ? "Generating"
                      : quiz.status === "failed"
                        ? "Generation failed"
                        : "Ready"}
                  </span>
                </div>
                <p>
                  {quiz.questionCount === 1
                    ? "1 question"
                    : `${quiz.questionCount} questions`}
                </p>
                {quiz.generationError ? (
                  <p className="learning-row-error">
                    {quiz.generationError.message}
                  </p>
                ) : null}
                {quiz.status === "ready" ? (
                  <Link
                    className="learning-document-link"
                    to={`/learning/documents/${document.id}/quizzes/${quiz.id}`}
                    aria-label={`Take ${quiz.title}, ${quiz.questionCount} ${
                      quiz.questionCount === 1 ? "question" : "questions"
                    }`}
                  >
                    Take quiz
                  </Link>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 ? (
        <nav className="learning-pagination" aria-label="Quiz pages">
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Previous quiz page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Quiz page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="learning-secondary-button"
            aria-label="Next quiz page"
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

function QuizGenerationStatus({
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
            ? "Quiz generation is queued."
            : "Quiz generation is processing."}
        </p>
        <RequestId value={requestId} />
      </div>
    );
  }
  if (state.status === "paused") {
    return (
      <div className="learning-response-status">
        <p>
          Generation checks are paused locally. The backend job is not
          claimed as failed or cancelled.
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
        Quiz generation was cancelled. No completed quiz is claimed.
      </div>
    );
  }
  if (state.status === "completed") {
    return (
      <div className="learning-response-status" role="status">
        Canonical quiz questions are ready.
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
