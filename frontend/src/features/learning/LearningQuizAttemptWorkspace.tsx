import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchLearningDocument,
  fetchQuizAttemptReview,
  fetchQuizForTaking,
} from "./learningApi";
import { quizScorePresentation } from "./quizScorePresentation";
import type {
  LearningDocument,
  QuizAttemptReview,
  QuizForTaking,
} from "./types";
import "./learningWorkspace.css";
import "./learningPhase19c.css";

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
      attempt: QuizAttemptReview;
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

// Feature 5.9.3 — Saved quiz-attempt review.
// Presents the canonical stored result, score, answers, and source evidence.
export function LearningQuizAttemptWorkspace() {
  const {
    documentId = "",
    quizId = "",
    attemptId = "",
  } = useParams<{
    documentId: string;
    quizId: string;
    attemptId: string;
  }>();
  const { user } = useAuth();
  const accountId = user?.id ?? "";
  const identity = `${accountId}:${documentId}:${quizId}:${attemptId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const sequence = useRef(0);
  const [loadState, setLoadState] =
    useState<LoadState>({ status: "loading" });
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    setLoadState({ status: "loading" });

    void (async () => {
      try {
        const documentResult = await fetchLearningDocument(
          documentId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const quiz = await fetchQuizForTaking(
          documentId,
          quizId,
          documentResult.document.pageCount,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const attempt = await fetchQuizAttemptReview(
          documentId,
          quizId,
          attemptId,
          documentResult.document.pageCount,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        if (
          attempt.attempt.questionCount !== quiz.questionCount ||
          attempt.review.length !== quiz.questions.length
        ) {
          throw new ApiError(
            502,
            "INVALID_LEARNING_RESPONSE",
            "The server returned an invalid learning response.",
          );
        }
        setLoadState({
          status: "ready",
          document: documentResult.document,
          quiz,
          attempt,
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const safe = safeError(
          error,
          "The completed attempt is currently unavailable.",
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
      sequence.current += 1;
    };
  }, [
    accountId,
    attemptId,
    documentId,
    identity,
    quizId,
    retryVersion,
  ]);

  if (loadState.status === "loading") {
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: "Loading attempt" },
          ]}
        />
        <div className="learning-state" role="status">
          Loading attempt review…
        </div>
      </section>
    );
  }

  if (loadState.status !== "ready") {
    const title =
      loadState.status === "not-found"
        ? "Quiz attempt not found"
        : loadState.status === "malformed"
          ? "Attempt response unavailable"
          : "Attempt review unavailable";
    return (
      <section className="workspace-section learning-workspace">
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            { label: title },
          ]}
        />
        <p className="eyebrow">Completed quiz attempt</p>
        <h1>{title}</h1>
        <p className="section-intro">{loadState.error.message}</p>
        <RequestId value={loadState.error.requestId} />
        {loadState.status !== "not-found" ? (
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() => setRetryVersion((current) => current + 1)}
          >
            Try attempt review again
          </button>
        ) : null}
        <Link className="learning-back-link" to="/learning">
          Return to document library
        </Link>
      </section>
    );
  }

  const { document, quiz, attempt } = loadState;
  const performance = quizScorePresentation(attempt.attempt.scorePercent);

  return (
    <section className="workspace-section learning-workspace learning-quiz-review">
      <Breadcrumbs
        items={[
          { label: "Learning", to: "/learning" },
          {
            label: document.title,
            to: `/learning/documents/${documentId}`,
          },
          {
            label: quiz.title,
            to: `/learning/documents/${documentId}/quizzes/${quizId}`,
          },
          { label: "Attempt" },
        ]}
      />
      <Link
        className="learning-back-link"
        to={`/learning/documents/${documentId}/quizzes/${quizId}`}
      >
        ← Quiz workspace
      </Link>
      <header className="learning-workspace-header">
        <div>
          <p className="eyebrow">Completed quiz attempt</p>
          <h1>{quiz.title}</h1>
          <p className="section-intro">
            {document.title} · Completed{" "}
            <time dateTime={attempt.attempt.completedAt}>
              {attemptDateFormatter.format(
                new Date(attempt.attempt.completedAt),
              )}
            </time>
          </p>
        </div>
        <Link
          className="learning-primary-button"
          to={`/learning/documents/${documentId}/quizzes/${quizId}`}
        >
          Take quiz again
        </Link>
      </header>

      <section
        className={`learning-score-card learning-score-card--${performance.level}`}
        aria-label={`Quiz result: ${performance.label}`}
      >
        <div>
          <p className="learning-kicker">Official results</p>
          <h2>Quiz result</h2>
          <p>
            {attempt.attempt.correctCount} of{" "}
            {attempt.attempt.questionCount} correct
          </p>
          <p className="learning-performance-label">{performance.label}</p>
        </div>
        <div className="learning-score-value">
          <span>Score</span>
          <strong>
            {scoreFormatter.format(attempt.attempt.scorePercent)}%
          </strong>
        </div>
      </section>

      <section aria-labelledby="learning-review-title">
        <header className="learning-panel-header">
          <div>
            <p className="learning-kicker">Answer review</p>
            <h2 id="learning-review-title">Review your answers</h2>
          </div>
        </header>
        <ol className="learning-review-list">
          {attempt.review.map((question) => (
            <li key={question.questionIndex}>
              <article
                className={
                  question.correct
                    ? "learning-review-question learning-review-question--correct"
                    : "learning-review-question learning-review-question--incorrect"
                }
              >
                <header>
                  <span className="learning-review-index">
                    Question {question.questionIndex + 1}
                  </span>
                  <strong>
                    {question.correct ? "Correct" : "Incorrect"}
                  </strong>
                </header>
                <h3>{question.prompt}</h3>
                <dl className="learning-review-answers">
                  <div>
                    <dt>Selected answer</dt>
                    <dd>{question.choices[question.selectedChoiceIndex]}</dd>
                  </div>
                  <div>
                    <dt>Correct answer</dt>
                    <dd>{question.choices[question.correctChoiceIndex]}</dd>
                  </div>
                </dl>
                {question.explanation.trim() !== "" ? (
                  <div className="learning-review-explanation">
                    <strong>Explanation</strong>
                    <p>{question.explanation}</p>
                  </div>
                ) : null}
                {question.sourcePages.length > 0 ? (
                  <div className="learning-source-pages">
                    <span>Verified sources:</span>
                    {question.sourcePages.map((page) => (
                      <Link
                        key={page}
                        to={`/learning/documents/${documentId}`}
                        aria-label={`View source page ${page} in the document workspace`}
                      >
                        View Page {page}
                      </Link>
                    ))}
                    <span>Open Extracted Content to review page-aware text.</span>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
