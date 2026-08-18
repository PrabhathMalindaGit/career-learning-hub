import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchLearningDocument,
  fetchQuizForTaking,
  listQuizAttempts,
  submitQuizAttempt,
} from "./learningApi";
import { QuizTaker } from "./QuizTaker";
import { quizScorePresentation } from "./quizScorePresentation";
import type {
  LearningDocument,
  LearningPagination,
  QuizAnswerSelection,
  QuizAttemptSummary,
  QuizForTaking,
} from "./types";
import "./learningWorkspace.css";
import "./learningPhase19c.css";

const ATTEMPT_LIMIT = 10;
const attemptDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const scoreFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

type SafeError = {
  message: string;
  requestId?: string;
};

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      document: LearningDocument;
      quiz: QuizForTaking;
    }
  | {
      status: "not-found" | "malformed" | "unavailable";
      error: SafeError;
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

function RequestId({ value }: { value?: string }) {
  return value ? (
    <p className="request-id">Request ID: {value}</p>
  ) : null;
}

// Feature 5.9.2 — Quiz-taking workspace.
// Presents the saved quiz questions and records an explicit server-scored attempt.
export function LearningQuizWorkspace() {
  const { documentId = "", quizId = "" } = useParams<{
    documentId: string;
    quizId: string;
  }>();
  const { user } = useAuth();
  const accountId = user?.id ?? "";
  const navigate = useNavigate();
  const identity = `${accountId}:${documentId}:${quizId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const loadSequence = useRef(0);
  const historySequence = useRef(0);
  const submissionController = useRef<AbortController | undefined>(
    undefined,
  );
  const submittingRef = useRef(false);
  const submissionHistoryIds = useRef<Set<string>>(new Set());
  const [loadState, setLoadState] =
    useState<LoadState>({ status: "loading" });
  const [loadVersion, setLoadVersion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SafeError>();
  const [uncertain, setUncertain] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [attemptPagination, setAttemptPagination] =
    useState<LearningPagination>();
  const [attemptPage, setAttemptPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<SafeError>();
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    setAnswers(new Map());
    setSubmitting(false);
    setSubmitError(undefined);
    setUncertain(false);
    setReconciling(false);
    setAttempts([]);
    setAttemptPagination(undefined);
    setAttemptPage(1);
    setHistoryError(undefined);
    submissionHistoryIds.current = new Set();
    submittingRef.current = false;
    submissionController.current?.abort();

    return () => {
      submissionController.current?.abort();
      submittingRef.current = false;
      submissionHistoryIds.current = new Set();
    };
  }, [identity]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++loadSequence.current;
    setLoadState({ status: "loading" });

    void (async () => {
      try {
        const documentResult = await fetchLearningDocument(
          documentId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== loadSequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        if (documentResult.document.status !== "ready") {
          throw new ApiError(
            409,
            "LEARNING_DOCUMENT_NOT_READY",
            "Document processing must finish before this quiz can be taken.",
            documentResult.requestId,
          );
        }
        const quiz = await fetchQuizForTaking(
          documentId,
          quizId,
          documentResult.document.pageCount,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== loadSequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        setLoadState({
          status: "ready",
          document: documentResult.document,
          quiz,
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          current !== loadSequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const safe = safeError(
          error,
          "The quiz workspace is currently unavailable.",
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
      }
    })();

    return () => {
      controller.abort();
      loadSequence.current += 1;
    };
  }, [documentId, identity, loadVersion, quizId]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++historySequence.current;
    setHistoryLoading(true);
    setHistoryError(undefined);

    void listQuizAttempts(
      documentId,
      quizId,
      { page: attemptPage, limit: ATTEMPT_LIMIT },
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
        setAttempts(result.attempts);
        setAttemptPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          current !== historySequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        setAttempts([]);
        setAttemptPagination(undefined);
        setHistoryError(
          safeError(error, "Attempt history could not be loaded."),
        );
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
  }, [attemptPage, documentId, historyVersion, identity, quizId]);

  const submitAnswers = useCallback(
    async (selections: QuizAnswerSelection[]) => {
      if (
        loadState.status !== "ready" ||
        submittingRef.current ||
        uncertain ||
        selections.length !== loadState.quiz.questionCount
      ) {
        return;
      }
      const expectedIdentity = identity;
      submissionHistoryIds.current = new Set(
        attempts.map((attempt) => attempt.id),
      );
      const controller = new AbortController();
      submissionController.current?.abort();
      submissionController.current = controller;
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError(undefined);

      try {
        const result = await submitQuizAttempt(
          documentId,
          quizId,
          loadState.quiz.questions,
          selections,
          loadState.document.pageCount,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        setAnswers(new Map());
        setUncertain(false);
        navigate(
          `/learning/documents/${documentId}/quizzes/${quizId}/attempts/${result.attempt.id}`,
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          identityRef.current !== expectedIdentity
        ) {
          return;
        }
        if (error instanceof ApiError) {
          setSubmitError(
            safeError(error, "Quiz answers could not be submitted."),
          );
        } else {
          setUncertain(true);
          setSubmitError({
            message:
              "The submission outcome is uncertain. Reconcile attempt history before submitting again.",
          });
        }
      } finally {
        if (submissionController.current === controller) {
          submissionController.current = undefined;
          submittingRef.current = false;
          setSubmitting(false);
        }
      }
    },
    [attempts, documentId, identity, loadState, navigate, quizId, uncertain],
  );

  const reconcile = async () => {
    if (!uncertain || reconciling) return;
    const expectedIdentity = identity;
    const controller = new AbortController();
    setReconciling(true);
    setSubmitError(undefined);
    try {
      const result = await listQuizAttempts(
        documentId,
        quizId,
        { page: 1, limit: 100 },
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        identityRef.current !== expectedIdentity
      ) {
        return;
      }
      const newAttempts = result.attempts.filter(
        (attempt) => !submissionHistoryIds.current.has(attempt.id),
      );
      if (result.pagination.pages === 1 && newAttempts.length === 1) {
        setAnswers(new Map());
        setUncertain(false);
        navigate(
          `/learning/documents/${documentId}/quizzes/${quizId}/attempts/${newAttempts[0]!.id}`,
        );
        return;
      }
      setSubmitError({
        message:
          "No single new attempt could be confirmed. Refresh history and reconcile again before submitting.",
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setSubmitError(
          safeError(error, "Attempt history could not be reconciled."),
        );
      }
    } finally {
      setReconciling(false);
    }
  };

  if (loadState.status === "loading") {
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: "Loading quiz" },
          ]}
        />
        <div className="learning-state" role="status">
          Loading quiz workspace…
        </div>
      </section>
    );
  }

  if (loadState.status !== "ready") {
    const title =
      loadState.status === "not-found"
        ? "Quiz not found"
        : loadState.status === "malformed"
          ? "Quiz response unavailable"
          : "Quiz unavailable";
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: title },
          ]}
        />
        <p className="eyebrow">Quiz workspace</p>
        <h1>{title}</h1>
        <p className="section-intro">{loadState.error.message}</p>
        <RequestId value={loadState.error.requestId} />
        {loadState.status !== "not-found" ? (
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() => setLoadVersion((current) => current + 1)}
          >
            Try quiz workspace again
          </button>
        ) : null}
        <Link className="learning-back-link" to="/learning">
          Return to document library
        </Link>
      </section>
    );
  }

  const { document, quiz } = loadState;
  const quizActive = answers.size > 0 || submitting || uncertain;

  return (
    <section className="workspace-section learning-workspace learning-quiz-workspace">
      <Breadcrumbs
        items={[
          { label: "Learning", to: "/learning" },
          {
            label: document.title,
            to: `/learning/documents/${documentId}`,
          },
          { label: quiz.title },
        ]}
      />
      <Link
        className="learning-back-link"
        to={`/learning/documents/${documentId}`}
      >
        ← {document.title}
      </Link>
      <header className="learning-workspace-header">
        <div>
          <p className="eyebrow">Quiz taking</p>
          <h1>{quiz.title}</h1>
          <p className="section-intro">
            {document.title} · {quiz.questionCount}{" "}
            {quiz.questionCount === 1 ? "question" : "questions"}
          </p>
        </div>
        <span className="learning-status learning-status--ready">Ready</span>
      </header>

      {quiz.questions.length === 0 ? (
        <div className="learning-state">
          <h2>No quiz questions available</h2>
          <p>This saved quiz does not contain any questions.</p>
        </div>
      ) : (
        <>
          {submitError ? (
            <div
              className="learning-state learning-state--error learning-state--compact"
              role="alert"
            >
              <p>{submitError.message}</p>
              <RequestId value={submitError.requestId} />
              {uncertain ? (
                <button
                  type="button"
                  className="learning-secondary-button"
                  disabled={reconciling}
                  onClick={() => void reconcile()}
                >
                  {reconciling
                    ? "Reconciling submission…"
                    : "Reconcile submission"}
                </button>
              ) : null}
            </div>
          ) : null}
          <QuizTaker
            documentId={documentId}
            questions={quiz.questions}
            answers={answers}
            submitting={submitting}
            locked={uncertain}
            onSelect={(questionIndex, selectedChoiceIndex) => {
              setAnswers((current) => {
                const next = new Map(current);
                next.set(questionIndex, selectedChoiceIndex);
                return next;
              });
              setSubmitError(undefined);
            }}
            onSubmit={(selections) => void submitAnswers(selections)}
          />
        </>
      )}

      {quizActive ? (
        <div className="learning-quiz-focus-note" role="status">
          Attempt history is hidden while you complete this quiz so the
          questions stay in focus.
        </div>
      ) : (
        <section
          className="learning-attempt-history"
          aria-labelledby="learning-attempt-history-title"
        >
          <header className="learning-panel-header">
            <div>
              <p className="learning-kicker">Saved attempts</p>
              <h2 id="learning-attempt-history-title">Attempt history</h2>
            </div>
            <button
              type="button"
              className="learning-secondary-button"
              disabled={historyLoading}
              onClick={() => setHistoryVersion((current) => current + 1)}
            >
              Refresh attempts
            </button>
          </header>
          {historyLoading ? (
            <div className="learning-state learning-state--compact" role="status">
              Loading attempt history…
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
                onClick={() => setHistoryVersion((current) => current + 1)}
              >
                Try attempt history again
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="learning-state learning-state--compact">
              <h3>No completed attempts yet.</h3>
              <p>Submit this quiz to save your first attempt.</p>
            </div>
          ) : (
            <ol className="learning-attempt-list">
              {attempts.map((attempt) => {
                const performance = quizScorePresentation(attempt.scorePercent);
                return (
                  <li key={attempt.id}>
                    <article
                      className={`learning-attempt-card learning-attempt-card--${performance.level}`}
                      aria-label={`Completed quiz attempt ${attemptDateFormatter.format(
                        new Date(attempt.completedAt),
                      )}`}
                    >
                      <div className="learning-attempt-result">
                        <span className="learning-collection-type">Score</span>
                        <strong>
                          {scoreFormatter.format(attempt.scorePercent)}%
                        </strong>
                        <span className="learning-performance-label">
                          {performance.label}
                        </span>
                        <span>
                          {attempt.correctCount} of {attempt.questionCount} correct
                        </span>
                      </div>
                      <time dateTime={attempt.completedAt}>
                        {attemptDateFormatter.format(new Date(attempt.completedAt))}
                      </time>
                      {/* =========================================================
                          FIND: REVIEW QUIZ
                          STYLE: learningWorkspace.css
                          SELECTOR: .learning-document-link
                          ========================================================= */}
                      <Link
                        className="learning-document-link"
                        to={`/learning/documents/${documentId}/quizzes/${quizId}/attempts/${attempt.id}`}
                        aria-label={`Review attempt completed ${attemptDateFormatter.format(
                          new Date(attempt.completedAt),
                        )}`}
                      >
                        {/* Feature 5.9.3 UI — Review saved quiz attempt. */}
                        Review attempt
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
          {attemptPagination && attemptPagination.pages > 1 ? (
            <nav
              className="learning-pagination"
              aria-label="Quiz attempt pages"
            >
              <button
                type="button"
                className="learning-secondary-button"
                aria-label="Previous attempt page"
                disabled={attemptPage <= 1 || historyLoading}
                onClick={() => setAttemptPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>
                Attempt page {attemptPage} of {attemptPagination.pages}
              </span>
              <button
                type="button"
                className="learning-secondary-button"
                aria-label="Next attempt page"
                disabled={
                  attemptPage >= attemptPagination.pages || historyLoading
                }
                onClick={() => setAttemptPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      )}
    </section>
  );
}
