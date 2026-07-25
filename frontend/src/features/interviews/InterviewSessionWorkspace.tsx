import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import {
  addManualQuestion,
  fetchInterviewAttempt,
  fetchInterviewJob,
  fetchInterviewQuestion,
  fetchInterviewSession,
  generateInterviewQuestions,
  listAttemptHistory,
  listInterviewQuestions,
  recordInterviewAttempt,
  requestAttemptFeedback,
  requestQuestionExplanation,
  saveQuestionNotes,
  setQuestionPinned,
  updateInterviewSessionStatus,
} from "./interviewApi";
import { pollInterviewJob } from "./interviewPolling";
import type {
  InterviewAttempt,
  InterviewDifficulty,
  InterviewJob,
  InterviewJobType,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
  InterviewSessionDetail,
  Pagination,
} from "./types";
import "./interviewCoach.css";

const PAGE_SIZE = 20;
const ANSWER_MAX_LENGTH = 12_000;

type SafeError = { message: string; requestId?: string };
type ActiveJob = {
  scope: "generation" | "explanation" | "feedback";
  resourceId?: string;
  job: Pick<InterviewJob, "id" | "type" | "status"> | InterviewJob;
  paused?: boolean;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    };
  }
  return { message: "The request could not be completed. Try again." };
}

function parseList(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 50);
}

function feedbackPanel(attempt: InterviewAttempt) {
  const feedback = attempt.feedback;
  if (!feedback) return null;
  return (
    <section
      className="interview-feedback-panel"
      aria-labelledby={`feedback-title-${attempt.id}`}
    >
      <div className="interview-section-heading">
        <div>
          <p className="interview-kicker">Practice signal</p>
          <h3 id={`feedback-title-${attempt.id}`}>
            Model-generated practice guidance
          </h3>
        </div>
        <strong>{feedback.score}/100</strong>
      </div>
      <p className="interview-guidance-disclaimer">
        This is not a hiring prediction, an objective evaluation, or a
        guarantee. Model guidance may be imperfect.
      </p>
      <p>{feedback.summary}</p>
      {[
        ["Strengths", feedback.strengths],
        ["Improvements", feedback.improvements],
        ["Suggested answer outline", feedback.suggestedAnswerOutline],
      ].map(([label, values]) =>
        (values as string[]).length > 0 ? (
          <div key={label as string}>
            <h4>{label}</h4>
            <ul>
              {(values as string[]).map((value, index) => (
                <li key={`${label}-${index}`}>{value}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <small>
        Completed {new Date(feedback.completedAt).toLocaleString()}
      </small>
    </section>
  );
}

export function InterviewSessionWorkspace() {
  const { sessionId = "" } = useParams();
  const [session, setSession] = useState<InterviewSessionDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] =
    useState<SafeError | null>(null);
  const [sessionReloadKey, setSessionReloadKey] = useState(0);

  const [questions, setQuestions] = useState<
    InterviewQuestionSummary[]
  >([]);
  const [questionPagination, setQuestionPagination] =
    useState<Pagination | null>(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionReloadKey, setQuestionReloadKey] = useState(0);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] =
    useState<SafeError | null>(null);
  const [pinnedFilter, setPinnedFilter] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedQuestion, setSelectedQuestion] =
    useState<InterviewQuestionDetail | null>(null);
  const [questionDetailLoading, setQuestionDetailLoading] =
    useState(false);

  const [notesDraft, setNotesDraft] = useState("");
  const [notesState, setNotesState] = useState<
    "clean" | "dirty" | "saving" | "saved" | "error"
  >("clean");
  const [answerDraft, setAnswerDraft] = useState("");
  const [answerError, setAnswerError] = useState<SafeError | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [questionActionError, setQuestionActionError] =
    useState<SafeError | null>(null);

  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [attemptPagination, setAttemptPagination] =
    useState<Pagination | null>(null);
  const [attemptPage, setAttemptPage] = useState(1);
  const [attemptReloadKey, setAttemptReloadKey] = useState(0);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<SafeError | null>(
    null,
  );
  const [selectedAttemptId, setSelectedAttemptId] = useState("");
  const [selectedAttempt, setSelectedAttempt] =
    useState<InterviewAttempt | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState("");
  const [manualDifficulty, setManualDifficulty] =
    useState<InterviewDifficulty>("medium");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualModelAnswer, setManualModelAnswer] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<SafeError | null>(null);

  const [generationCount, setGenerationCount] = useState(10);
  const [generationCategories, setGenerationCategories] = useState("");
  const [providerBusy, setProviderBusy] = useState(false);
  const [providerError, setProviderError] = useState<SafeError | null>(
    null,
  );
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const routeSequence = useRef(0);
  const routeIdentity = useRef("");
  const questionSequence = useRef(0);
  const questionDetailSequence = useRef(0);
  const attemptSequence = useRef(0);
  const attemptDetailSequence = useRef(0);
  const generationIntentId = useRef<string | null>(null);
  const actionControllers = useRef(new Set<AbortController>());

  const makeController = useCallback(() => {
    const controller = new AbortController();
    actionControllers.current.add(controller);
    return controller;
  }, []);

  const releaseController = useCallback((controller: AbortController) => {
    actionControllers.current.delete(controller);
  }, []);

  function actionIsCurrent(controller: AbortController): boolean {
    return (
      !controller.signal.aborted &&
      routeIdentity.current === sessionId
    );
  }

  useEffect(() => {
    const identityChanged = routeIdentity.current !== sessionId;
    routeIdentity.current = sessionId;
    if (identityChanged) {
      for (const controller of actionControllers.current) {
        controller.abort();
      }
      actionControllers.current.clear();
    }
    const sequence = ++routeSequence.current;
    const controller = new AbortController();
    if (identityChanged) {
      setSession(null);
      setQuestions([]);
      setQuestionPagination(null);
      setSelectedQuestionId("");
      setSelectedQuestion(null);
      setAttempts([]);
      setAttemptPagination(null);
      setSelectedAttemptId("");
      setSelectedAttempt(null);
      setNotesDraft("");
      setAnswerDraft("");
      setAnswerError(null);
      setAnswerBusy(false);
      setNotesState("clean");
      setManualOpen(false);
      setManualCategory("");
      setManualDifficulty("medium");
      setManualQuestion("");
      setManualModelAnswer("");
      setManualBusy(false);
      setManualError(null);
      setGenerationCount(10);
      setGenerationCategories("");
      setProviderBusy(false);
      setActiveJob(null);
      setProviderError(null);
      setStatusMessage("");
      setStatusBusy(false);
      setQuestionPage(1);
      setAttemptPage(1);
      setPinnedFilter(false);
      setDifficultyFilter("");
      setCategoryFilter("");
      generationIntentId.current = null;
      setLoading(true);
    }
    setWorkspaceError(null);

    void fetchInterviewSession(sessionId, controller.signal)
      .then((result) => {
        if (sequence === routeSequence.current) setSession(result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === routeSequence.current) {
          setWorkspaceError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === routeSequence.current) setLoading(false);
      });
    return () => controller.abort();
  }, [sessionId, sessionReloadKey]);

  useEffect(
    () => () => {
      for (const controller of actionControllers.current) {
        controller.abort();
      }
      actionControllers.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!session) return;
    const sequence = ++questionSequence.current;
    const controller = new AbortController();
    setQuestionLoading(true);
    setQuestionError(null);
    void listInterviewQuestions(
      sessionId,
      {
        page: questionPage,
        limit: PAGE_SIZE,
        ...(pinnedFilter ? { pinned: true } : {}),
        ...(difficultyFilter
          ? { difficulty: difficultyFilter as InterviewDifficulty }
          : {}),
        ...(categoryFilter.trim()
          ? { category: categoryFilter.trim() }
          : {}),
      },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          sequence !== questionSequence.current ||
          routeIdentity.current !== sessionId
        ) {
          return;
        }
        setQuestions(result.questions);
        setQuestionPagination(result.pagination);
        setSelectedQuestionId((current) => {
          if (result.questions.some((item) => item.id === current)) {
            return current;
          }
          return result.questions[0]?.id ?? "";
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === questionSequence.current) {
          setQuestionError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === questionSequence.current) {
          setQuestionLoading(false);
        }
      });
    return () => controller.abort();
  }, [
    categoryFilter,
    difficultyFilter,
    pinnedFilter,
    questionPage,
    questionReloadKey,
    session,
    sessionId,
  ]);

  useEffect(() => {
    if (!selectedQuestionId) {
      questionDetailSequence.current += 1;
      setSelectedQuestion(null);
      setNotesDraft("");
      setAnswerDraft("");
      return;
    }
    const sequence = ++questionDetailSequence.current;
    const controller = new AbortController();
    setQuestionDetailLoading(true);
    setQuestionActionError(null);
    setSelectedAttemptId("");
    setSelectedAttempt(null);
    setAnswerDraft("");
    void fetchInterviewQuestion(
      sessionId,
      selectedQuestionId,
      controller.signal,
    )
      .then((question) => {
        if (
          controller.signal.aborted ||
          sequence !== questionDetailSequence.current ||
          routeIdentity.current !== sessionId
        ) {
          return;
        }
        setSelectedQuestion(question);
        setNotesDraft(question.userNotes ?? "");
        setNotesState("clean");
      })
      .catch((error: unknown) => {
        if (
          !controller.signal.aborted &&
          sequence === questionDetailSequence.current &&
          routeIdentity.current === sessionId
        ) {
          setQuestionActionError(safeError(error));
        }
      })
      .finally(() => {
        if (
          sequence === questionDetailSequence.current &&
          routeIdentity.current === sessionId
        ) {
          setQuestionDetailLoading(false);
        }
      });
    return () => controller.abort();
  }, [selectedQuestionId, sessionId]);

  useEffect(() => {
    if (!session) return;
    const sequence = ++attemptSequence.current;
    const controller = new AbortController();
    setAttemptLoading(true);
    setAttemptError(null);
    void listAttemptHistory(
      sessionId,
      {
        page: attemptPage,
        limit: PAGE_SIZE,
        ...(selectedQuestionId ? { questionId: selectedQuestionId } : {}),
      },
      controller.signal,
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          sequence !== attemptSequence.current ||
          routeIdentity.current !== sessionId
        ) {
          return;
        }
        setAttempts(result.attempts);
        setAttemptPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === attemptSequence.current) {
          setAttemptError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === attemptSequence.current) setAttemptLoading(false);
      });
    return () => controller.abort();
  }, [
    attemptPage,
    attemptReloadKey,
    selectedQuestionId,
    session,
    sessionId,
  ]);

  useEffect(() => {
    if (!selectedAttemptId) {
      attemptDetailSequence.current += 1;
      setSelectedAttempt(null);
      return;
    }
    const sequence = ++attemptDetailSequence.current;
    const controller = new AbortController();
    void fetchInterviewAttempt(
      sessionId,
      selectedAttemptId,
      controller.signal,
    )
      .then((attempt) => {
        if (
          !controller.signal.aborted &&
          sequence === attemptDetailSequence.current &&
          routeIdentity.current === sessionId
        ) {
          setSelectedAttempt(attempt);
        }
      })
      .catch((error: unknown) => {
        if (
          !controller.signal.aborted &&
          sequence === attemptDetailSequence.current &&
          routeIdentity.current === sessionId
        ) {
          setAttemptError(safeError(error));
        }
      });
    return () => controller.abort();
  }, [selectedAttemptId, sessionId]);

  const pollAcceptedJob = useCallback(
    async (
      scope: ActiveJob["scope"],
      accepted: Pick<InterviewJob, "id" | "type" | "status">,
      controller: AbortController,
      expectedResultId?: string,
    ) => {
      setActiveJob({ scope, resourceId: expectedResultId, job: accepted });
      const result = await pollInterviewJob({
        jobId: accepted.id,
        expectedType: accepted.type as InterviewJobType,
        ...(expectedResultId ? { expectedResultId } : {}),
        fetchJob: fetchInterviewJob,
        signal: controller.signal,
        onUpdate: (job) => {
          if (
            !controller.signal.aborted &&
            routeIdentity.current === sessionId
          ) {
            setActiveJob({
              scope,
              resourceId: expectedResultId,
              job,
            });
          }
        },
      });
      if (controller.signal.aborted) return;
      if (result.reason === "terminal") {
        setActiveJob({
          scope,
          resourceId: expectedResultId,
          job: result.job,
        });
        if (result.job.status === "completed") {
          setStatusMessage(
            scope === "generation"
              ? "Question generation completed."
              : scope === "explanation"
                ? "Explanation is ready."
                : "Practice feedback is ready.",
          );
          if (scope === "generation") {
            generationIntentId.current = null;
            setQuestionReloadKey((key) => key + 1);
            setSessionReloadKey((key) => key + 1);
          } else if (scope === "explanation" && expectedResultId) {
            const detail = await fetchInterviewQuestion(
              sessionId,
              expectedResultId,
              controller.signal,
            );
            if (
              !controller.signal.aborted &&
              routeIdentity.current === sessionId
            ) {
              setSelectedQuestion(detail);
            }
          } else if (scope === "feedback" && expectedResultId) {
            const detail = await fetchInterviewAttempt(
              sessionId,
              expectedResultId,
              controller.signal,
            );
            if (
              !controller.signal.aborted &&
              routeIdentity.current === sessionId
            ) {
              setSelectedAttempt(detail);
              setAttemptReloadKey((key) => key + 1);
            }
          }
        } else {
          if (scope === "generation") generationIntentId.current = null;
          setProviderError({
            message:
              "The AI request did not complete. Try again only when you want to start a new request.",
          });
        }
      } else if (
        result.reason === "timeout" ||
        result.reason === "transport-failure"
      ) {
        setActiveJob((current) =>
          current ? { ...current, paused: true } : current,
        );
        setProviderError(
          result.reason === "transport-failure"
            ? safeError(result.error)
            : {
                message:
                  "Automatic status checks paused after five minutes. The backend job may still be running.",
              },
        );
      }
    },
    [sessionId],
  );

  async function resumeStatusChecks() {
    if (
      !activeJob ||
      providerBusy ||
      (activeJob.job.status !== "queued" &&
        activeJob.job.status !== "processing")
    ) {
      return;
    }
    const controller = makeController();
    setProviderBusy(true);
    setProviderError(null);
    try {
      await pollAcceptedJob(
        activeJob.scope,
        activeJob.job,
        controller,
        activeJob.resourceId,
      );
    } catch (error) {
      if (actionIsCurrent(controller)) setProviderError(safeError(error));
    } finally {
      releaseController(controller);
      setProviderBusy(false);
    }
  }

  async function changeStatus(status: "completed" | "archived") {
    if (statusBusy) return;
    const controller = makeController();
    setStatusBusy(true);
    setWorkspaceError(null);
    try {
      const result = await updateInterviewSessionStatus(
        sessionId,
        status,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      setSession(result);
      setStatusMessage(`Session marked ${result.status}.`);
      setSessionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller)) setWorkspaceError(safeError(error));
    } finally {
      releaseController(controller);
      setStatusBusy(false);
    }
  }

  async function submitManualQuestion(event: FormEvent) {
    event.preventDefault();
    if (
      manualBusy ||
      !manualCategory.trim() ||
      manualQuestion.trim().length < 5
    ) {
      setManualError({
        message:
          "Enter a category and a question with at least 5 characters.",
      });
      return;
    }
    const controller = makeController();
    setManualBusy(true);
    setManualError(null);
    try {
      const created = await addManualQuestion(
        sessionId,
        {
          category: manualCategory.trim(),
          difficulty: manualDifficulty,
          question: manualQuestion.trim(),
          ...(manualModelAnswer.trim()
            ? { modelAnswer: manualModelAnswer.trim() }
            : {}),
        },
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      setManualCategory("");
      setManualQuestion("");
      setManualModelAnswer("");
      setManualOpen(false);
      setQuestionReloadKey((key) => key + 1);
      setSessionReloadKey((key) => key + 1);
      setSelectedQuestionId(created.id);
      setStatusMessage("Manual question added.");
    } catch (error) {
      if (actionIsCurrent(controller)) setManualError(safeError(error));
    } finally {
      releaseController(controller);
      setManualBusy(false);
    }
  }

  async function submitGeneration(event: FormEvent) {
    event.preventDefault();
    if (providerBusy) return;
    const controller = makeController();
    const requestId =
      generationIntentId.current ?? crypto.randomUUID();
    generationIntentId.current = requestId;
    setProviderBusy(true);
    setProviderError(null);
    try {
      const accepted = await generateInterviewQuestions(
        sessionId,
        {
          requestId,
          count: generationCount,
          categories: parseList(generationCategories),
        },
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      generationIntentId.current = null;
      await pollAcceptedJob("generation", accepted, controller);
    } catch (error) {
      if (!(error instanceof TypeError)) {
        generationIntentId.current = null;
      }
      if (actionIsCurrent(controller)) setProviderError(safeError(error));
    } finally {
      releaseController(controller);
      setProviderBusy(false);
    }
  }

  async function togglePinned() {
    if (!selectedQuestion) return;
    const controller = makeController();
    setQuestionActionError(null);
    try {
      const updated = await setQuestionPinned(
        sessionId,
        selectedQuestion.id,
        !selectedQuestion.isPinned,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      setSelectedQuestion(updated);
      setQuestionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller)) {
        setQuestionActionError(safeError(error));
      }
    } finally {
      releaseController(controller);
    }
  }

  async function persistNotes(value: string) {
    if (!selectedQuestion || notesState === "saving") return;
    const controller = makeController();
    setNotesState("saving");
    setQuestionActionError(null);
    try {
      const updated = await saveQuestionNotes(
        sessionId,
        selectedQuestion.id,
        value,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      setSelectedQuestion(updated);
      setNotesDraft(updated.userNotes ?? "");
      setNotesState("saved");
      setQuestionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller)) {
        setNotesState("error");
        setQuestionActionError(safeError(error));
      }
    } finally {
      releaseController(controller);
    }
  }

  async function requestExplanation() {
    if (!selectedQuestion || providerBusy) return;
    const controller = makeController();
    setProviderBusy(true);
    setProviderError(null);
    try {
      const result = await requestQuestionExplanation(
        sessionId,
        selectedQuestion.id,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      if (result.kind === "available") {
        setSelectedQuestion(result.question);
        setStatusMessage("Explanation is available.");
      } else {
        await pollAcceptedJob(
          "explanation",
          result.job,
          controller,
          selectedQuestion.id,
        );
      }
    } catch (error) {
      if (actionIsCurrent(controller)) setProviderError(safeError(error));
    } finally {
      releaseController(controller);
      setProviderBusy(false);
    }
  }

  async function submitAttempt() {
    if (!selectedQuestion || answerBusy) return;
    const answer = answerDraft.trim();
    if (answer.length < 1 || answer.length > ANSWER_MAX_LENGTH) {
      setAnswerError({
        message: `Enter an answer with 1–${ANSWER_MAX_LENGTH.toLocaleString()} characters.`,
      });
      return;
    }
    const controller = makeController();
    setAnswerBusy(true);
    setAnswerError(null);
    try {
      const created = await recordInterviewAttempt(
        sessionId,
        selectedQuestion.id,
        answer,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      setAnswerDraft("");
      setSelectedAttemptId(created.id);
      setSelectedAttempt(created);
      setAttemptReloadKey((key) => key + 1);
      setStatusMessage(
        "Immutable attempt recorded. Another try will create a new record.",
      );
    } catch (error) {
      if (actionIsCurrent(controller)) setAnswerError(safeError(error));
    } finally {
      releaseController(controller);
      setAnswerBusy(false);
    }
  }

  async function requestFeedback(attempt: InterviewAttempt) {
    if (providerBusy || attempt.feedback) return;
    const controller = makeController();
    setProviderBusy(true);
    setProviderError(null);
    try {
      const result = await requestAttemptFeedback(
        sessionId,
        attempt.id,
        controller.signal,
      );
      if (!actionIsCurrent(controller)) return;
      if (result.kind === "available") {
        setSelectedAttempt(result.attempt);
        setAttemptReloadKey((key) => key + 1);
      } else {
        await pollAcceptedJob(
          "feedback",
          result.job,
          controller,
          result.attemptId,
        );
      }
    } catch (error) {
      if (actionIsCurrent(controller)) setProviderError(safeError(error));
    } finally {
      releaseController(controller);
      setProviderBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="interview-state" role="status">
        Loading interview session…
      </p>
    );
  }

  if (workspaceError && !session) {
    return (
      <section className="interview-state interview-state--error">
        <h1>Interview session unavailable</h1>
        <p role="alert">{workspaceError.message}</p>
        {workspaceError.requestId ? (
          <small>Request ID: {workspaceError.requestId}</small>
        ) : null}
        <button
          type="button"
          onClick={() => setSessionReloadKey((key) => key + 1)}
        >
          Retry session
        </button>
        <Link to="/interviews">Back to Interview Coach</Link>
      </section>
    );
  }

  if (!session) return null;
  const editable = session.status === "active";
  const canWriteAttempt =
    editable && session.mode === "written-practice";
  const generationStatusPending =
    activeJob?.scope === "generation" &&
    (activeJob.job.status === "queued" ||
      activeJob.job.status === "processing");

  return (
    <section
      className="interview-workspace"
      aria-labelledby="interview-workspace-title"
    >
      <Link className="interview-back-link" to="/interviews">
        ← All interview sessions
      </Link>
      <header className="interview-workspace-heading">
        <div>
          <p className="eyebrow">Interview briefing</p>
          <h1 id="interview-workspace-title">{session.title}</h1>
          <p>
            {session.targetRole} · {session.experienceLevel}
          </p>
          <div className="interview-context-chips">
            <span className="interview-chip">{session.status}</span>
            <span>{session.mode.replace("-", " ")}</span>
            <span>
              {session.questionCount}{" "}
              {session.questionCount === 1 ? "question" : "questions"}
            </span>
          </div>
        </div>
        <div className="interview-lifecycle-actions">
          {session.status === "active" ? (
            <>
              <button
                type="button"
                disabled={statusBusy}
                onClick={() => void changeStatus("completed")}
              >
                Mark completed
              </button>
              <button
                type="button"
                disabled={statusBusy}
                onClick={() => void changeStatus("archived")}
              >
                Archive
              </button>
            </>
          ) : session.status === "completed" ? (
            <button
              type="button"
              disabled={statusBusy}
              onClick={() => void changeStatus("archived")}
            >
              Archive
            </button>
          ) : null}
        </div>
      </header>

      <section
        className="interview-brief interview-panel"
        aria-labelledby="session-context-title"
      >
        <h2 id="session-context-title">Session context</h2>
        <dl>
          <div>
            <dt>Focus topics</dt>
            <dd>
              {session.focusTopics.length
                ? session.focusTopics.join(", ")
                : "None recorded"}
            </dd>
          </div>
          <div>
            <dt>Skill gaps</dt>
            <dd>
              {session.skillGaps.length
                ? session.skillGaps.join(", ")
                : "None recorded"}
            </dd>
          </div>
          {session.jobDescription ? (
            <div>
              <dt>Job description</dt>
              <dd>{session.jobDescription}</dd>
            </div>
          ) : null}
          <div>
            <dt>Updated</dt>
            <dd>{new Date(session.updatedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      {!editable ? (
        <p className="interview-readonly-notice" role="status">
          {session.status === "completed"
            ? "Completed sessions are read-mostly."
            : "Archived sessions are read-only."}{" "}
          Existing questions, notes, attempts, and stored guidance remain
          available.
        </p>
      ) : null}

      {workspaceError ? (
        <p className="interview-field-error" role="alert">
          {workspaceError.message}
        </p>
      ) : null}
      <p className="interview-sr-status" aria-live="polite">
        {statusMessage}
      </p>

      {editable ? (
        <section
          className="interview-tools interview-panel"
          aria-labelledby="question-tools-title"
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Build the briefing</p>
              <h2 id="question-tools-title">Add questions</h2>
            </div>
            <button
              type="button"
              aria-expanded={manualOpen}
              aria-controls="manual-question-form"
              onClick={() => setManualOpen((open) => !open)}
            >
              {manualOpen ? "Close manual form" : "Add manually"}
            </button>
          </div>

          <form
            className="interview-generation-form"
            onSubmit={(event) => void submitGeneration(event)}
          >
            <label>
              Question count
              <select
                value={generationCount}
                onChange={(event) =>
                  setGenerationCount(Number(event.target.value))
                }
              >
                {Array.from({ length: 20 }, (_, index) => index + 1).map(
                  (count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Categories
              <input
                value={generationCategories}
                maxLength={6_000}
                placeholder="System design, behavioral"
                onChange={(event) =>
                  setGenerationCategories(event.target.value)
                }
              />
            </label>
            <button
              className="interview-primary-button"
              type="submit"
              disabled={providerBusy || generationStatusPending}
            >
              {providerBusy && activeJob?.scope === "generation"
                ? "Generating…"
                : "Generate questions"}
            </button>
          </form>
          <p className="interview-ai-note">
            AI requests are optional and may be unavailable in this
            environment. Manual questions, notes, and written attempts remain
            usable without them.
          </p>

          {manualOpen ? (
            <form
              id="manual-question-form"
              className="interview-manual-form"
              onSubmit={(event) => void submitManualQuestion(event)}
              noValidate
            >
              <label>
                Category
                <input
                  value={manualCategory}
                  maxLength={120}
                  onChange={(event) =>
                    setManualCategory(event.target.value)
                  }
                />
              </label>
              <label>
                Difficulty
                <select
                  value={manualDifficulty}
                  onChange={(event) =>
                    setManualDifficulty(
                      event.target.value as InterviewDifficulty,
                    )
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className="interview-span-two">
                Question
                <textarea
                  rows={4}
                  maxLength={2_000}
                  value={manualQuestion}
                  onChange={(event) =>
                    setManualQuestion(event.target.value)
                  }
                />
              </label>
              <label className="interview-span-two">
                Model answer <span>(optional)</span>
                <textarea
                  rows={5}
                  maxLength={12_000}
                  value={manualModelAnswer}
                  onChange={(event) =>
                    setManualModelAnswer(event.target.value)
                  }
                />
              </label>
              {manualError ? (
                <p className="interview-field-error" role="alert">
                  {manualError.message}
                </p>
              ) : null}
              <button
                className="interview-secondary-button"
                type="submit"
                disabled={manualBusy}
              >
                {manualBusy ? "Adding…" : "Add question"}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {activeJob ? (
        <section
          className="interview-job-status"
          aria-label="Provider job status"
          aria-live="polite"
        >
          <strong>
            {activeJob.scope === "generation"
              ? "Question generation"
              : activeJob.scope === "explanation"
                ? "Question explanation"
                : "Practice feedback"}
          </strong>
          <span>
            {activeJob.paused
              ? "status checks paused"
              : activeJob.job.status.replace("-", " ")}
          </span>
          {"progress" in activeJob.job ? (
            <progress
              max={100}
              value={activeJob.job.progress}
              aria-label={`${activeJob.job.progress}% complete`}
            />
          ) : null}
          {activeJob.paused ? (
            <button
              type="button"
              disabled={providerBusy}
              onClick={() => void resumeStatusChecks()}
            >
              Resume status checks
            </button>
          ) : null}
        </section>
      ) : null}
      {providerError ? (
        <p className="interview-field-error" role="alert">
          {providerError.message}
        </p>
      ) : null}

      <div className="interview-workspace-grid">
        <section
          className="interview-question-index interview-panel"
          aria-labelledby="question-index-title"
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Question index</p>
              <h2 id="question-index-title">Questions</h2>
            </div>
            {questionPagination ? (
              <span className="interview-chip">
                {questionPagination.total}
              </span>
            ) : null}
          </div>
          <div className="interview-question-filters">
            <label>
              <input
                type="checkbox"
                checked={pinnedFilter}
                onChange={(event) => {
                  setPinnedFilter(event.target.checked);
                  setQuestionPage(1);
                }}
              />
              Pinned only
            </label>
            <label>
              Difficulty
              <select
                value={difficultyFilter}
                onChange={(event) => {
                  setDifficultyFilter(event.target.value);
                  setQuestionPage(1);
                }}
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              Category
              <input
                value={categoryFilter}
                maxLength={120}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setQuestionPage(1);
                }}
              />
            </label>
          </div>
          {questionLoading ? (
            <p className="interview-state" role="status">
              Loading questions…
            </p>
          ) : questionError ? (
            <div className="interview-state interview-state--error">
              <p role="alert">{questionError.message}</p>
              <button
                type="button"
                onClick={() => setQuestionReloadKey((key) => key + 1)}
              >
                Retry questions
              </button>
            </div>
          ) : questions.length === 0 ? (
            <p className="interview-state">
              No questions match these filters.
            </p>
          ) : (
            <ol className="interview-question-list">
              {questions.map((question) => (
                <li key={question.id}>
                  <button
                    type="button"
                    className={
                      selectedQuestionId === question.id
                        ? "interview-question-select interview-question-select--active"
                        : "interview-question-select"
                    }
                    aria-pressed={selectedQuestionId === question.id}
                    aria-label={`${
                      question.isPinned ? "Pinned: " : ""
                    }${question.question}`}
                    onClick={() => setSelectedQuestionId(question.id)}
                  >
                    <span>
                      {question.category} · {question.difficulty}
                    </span>
                    <strong>{question.question}</strong>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="interview-pagination">
            <button
              type="button"
              disabled={questionLoading || questionPage <= 1}
              onClick={() =>
                setQuestionPage((current) => current - 1)
              }
            >
              Previous
            </button>
            <span>Page {questionPage}</span>
            <button
              type="button"
              disabled={
                questionLoading ||
                !questionPagination ||
                questionPagination.pages === 0 ||
                questionPage >= questionPagination.pages
              }
              onClick={() =>
                setQuestionPage((current) => current + 1)
              }
            >
              Next
            </button>
          </div>
        </section>

        <section
          className="interview-practice-desk interview-panel"
          aria-labelledby="practice-desk-title"
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Practice desk</p>
              <h2 id="practice-desk-title">
                {selectedQuestion?.category ?? "Select a question"}
              </h2>
            </div>
            {selectedQuestion ? (
              <span className="interview-chip">
                {selectedQuestion.difficulty}
              </span>
            ) : null}
          </div>
          {questionDetailLoading ? (
            <p className="interview-state" role="status">
              Loading question…
            </p>
          ) : !selectedQuestion ? (
            <p className="interview-state">
              Choose a question to review its private practice record.
            </p>
          ) : (
            <>
              <article className="interview-question-card">
                <p>{selectedQuestion.question}</p>
                {editable ? (
                  <button
                    type="button"
                    className="interview-secondary-button"
                    onClick={() => void togglePinned()}
                  >
                    {selectedQuestion.isPinned ? "Unpin" : "Pin question"}
                  </button>
                ) : null}
              </article>

              {selectedQuestion.modelAnswer ? (
                <section className="interview-record-block">
                  <h3>Model answer</h3>
                  <p>{selectedQuestion.modelAnswer}</p>
                </section>
              ) : null}
              {selectedQuestion.explanation ? (
                <section className="interview-record-block">
                  <h3>Explanation</h3>
                  <p>{selectedQuestion.explanation}</p>
                  {selectedQuestion.explanationKeyPoints.length > 0 ? (
                    <ul>
                      {selectedQuestion.explanationKeyPoints.map(
                        (point, index) => (
                          <li key={`${selectedQuestion.id}-${index}`}>
                            {point}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : null}
                </section>
              ) : editable ? (
                <button
                  type="button"
                  className="interview-secondary-button"
                  disabled={providerBusy}
                  onClick={() => void requestExplanation()}
                >
                  Request explanation
                </button>
              ) : null}

              <label className="interview-answer-field">
                Private notes
                <textarea
                  rows={4}
                  maxLength={8_000}
                  value={notesDraft}
                  readOnly={!editable}
                  onChange={(event) => {
                    setNotesDraft(event.target.value);
                    setNotesState("dirty");
                  }}
                />
              </label>
              {editable ? (
                <div className="interview-action-row">
                  <button
                    type="button"
                    className="interview-secondary-button"
                    disabled={
                      notesState === "saving" ||
                      notesDraft.length > 8_000 ||
                      (notesState !== "dirty" && notesState !== "error")
                    }
                    onClick={() => void persistNotes(notesDraft)}
                  >
                    {notesState === "saving" ? "Saving…" : "Save notes"}
                  </button>
                  <button
                    type="button"
                    className="interview-secondary-button"
                    disabled={notesState === "saving" || notesDraft === ""}
                    onClick={() => void persistNotes("")}
                  >
                    Clear notes
                  </button>
                  <span role="status">
                    {notesState === "saved"
                      ? notesDraft === ""
                        ? "Notes cleared."
                        : "Notes saved."
                      : notesState === "dirty"
                        ? "Unsaved notes."
                        : ""}
                  </span>
                </div>
              ) : null}

              {canWriteAttempt ? (
                <section
                  className="interview-attempt-composer"
                  aria-labelledby="attempt-composer-title"
                >
                  <h3 id="attempt-composer-title">
                    Record another written attempt
                  </h3>
                  <p>
                    Recording creates an immutable practice record. Another
                    try creates a separate attempt.
                  </p>
                  <label className="interview-answer-field">
                    Written answer
                    <textarea
                      rows={9}
                      maxLength={ANSWER_MAX_LENGTH}
                      value={answerDraft}
                      onChange={(event) =>
                        setAnswerDraft(event.target.value)
                      }
                    />
                  </label>
                  <small>
                    {answerDraft.length.toLocaleString()} /{" "}
                    {ANSWER_MAX_LENGTH.toLocaleString()}
                  </small>
                  {answerError ? (
                    <p className="interview-field-error" role="alert">
                      {answerError.message}
                      {answerError.requestId
                        ? ` Request ID: ${answerError.requestId}`
                        : ""}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="interview-primary-button"
                    disabled={answerBusy || answerDraft.trim() === ""}
                    onClick={() => void submitAttempt()}
                  >
                    {answerBusy
                      ? "Recording…"
                      : "Record immutable attempt"}
                  </button>
                </section>
              ) : null}

              {questionActionError ? (
                <p className="interview-field-error" role="alert">
                  {questionActionError.message}
                </p>
              ) : null}
            </>
          )}
        </section>

        <section
          className="interview-history interview-panel"
          aria-labelledby="attempt-history-title"
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Immutable record</p>
              <h2 id="attempt-history-title">Attempt history</h2>
            </div>
            {attemptPagination ? (
              <span className="interview-chip">
                {attemptPagination.total}
              </span>
            ) : null}
          </div>
          {attemptLoading ? (
            <p className="interview-state" role="status">
              Loading attempts…
            </p>
          ) : attemptError ? (
            <div className="interview-state interview-state--error">
              <p role="alert">{attemptError.message}</p>
              <button
                type="button"
                onClick={() => setAttemptReloadKey((key) => key + 1)}
              >
                Retry attempts
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <p className="interview-state">
              No written attempts have been recorded for this question.
            </p>
          ) : (
            <ol className="interview-attempt-list">
              {attempts.map((attempt, index) => (
                <li key={attempt.id}>
                  <button
                    type="button"
                    aria-pressed={selectedAttemptId === attempt.id}
                    aria-label={`Open attempt ${index + 1} from ${new Date(
                      attempt.createdAt,
                    ).toLocaleString()}`}
                    onClick={() => setSelectedAttemptId(attempt.id)}
                  >
                    <strong>Attempt {index + 1}</strong>
                    <span>{attempt.status.replaceAll("-", " ")}</span>
                    <small>
                      {new Date(attempt.createdAt).toLocaleString()}
                    </small>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="interview-pagination">
            <button
              type="button"
              disabled={attemptLoading || attemptPage <= 1}
              onClick={() => setAttemptPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>Page {attemptPage}</span>
            <button
              type="button"
              disabled={
                attemptLoading ||
                !attemptPagination ||
                attemptPagination.pages === 0 ||
                attemptPage >= attemptPagination.pages
              }
              onClick={() => setAttemptPage((current) => current + 1)}
            >
              Next
            </button>
          </div>

          {selectedAttempt ? (
            <article className="interview-attempt-detail">
              <div className="interview-section-heading">
                <h3>Recorded answer</h3>
                <span>{selectedAttempt.status.replaceAll("-", " ")}</span>
              </div>
              <p>{selectedAttempt.answerText}</p>
              <small>
                Recorded{" "}
                {new Date(selectedAttempt.createdAt).toLocaleString()}
              </small>
              {feedbackPanel(selectedAttempt)}
              {editable && !selectedAttempt.feedback ? (
                <button
                  type="button"
                  className="interview-secondary-button"
                  disabled={
                    providerBusy ||
                    selectedAttempt.status === "feedback-queued" ||
                    selectedAttempt.status === "feedback-processing"
                  }
                  onClick={() => void requestFeedback(selectedAttempt)}
                >
                  Request feedback
                </button>
              ) : null}
            </article>
          ) : null}
        </section>
      </div>
    </section>
  );
}
