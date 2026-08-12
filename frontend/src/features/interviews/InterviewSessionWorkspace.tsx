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
import { Pager } from "../../components/Pager";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
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
  InterviewAttemptStatus,
  InterviewDifficulty,
  InterviewJob,
  InterviewJobType,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
  InterviewQuestionType,
  InterviewSessionDetail,
  Pagination,
  TypedInterviewAnswer,
} from "./types";
import { CopyInterviewTextButton } from "./CopyInterviewTextButton";
import { InterviewAnswerControl } from "./InterviewAnswerControl";
import {
  InterviewQuestionTypeControls,
  QUESTION_TYPE_LABELS,
  interviewTypeCountsAreValid,
} from "./InterviewQuestionTypeControls";
import "./interviewCoach.css";

const PAGE_SIZE = 20;
const ANSWER_MAX_LENGTH = 12_000;
const CANONICAL_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{16,128}$/;
const FEEDBACK_READY_MESSAGE = "Practice feedback is ready.";

const attemptStatusLabels: Record<InterviewAttemptStatus, string> = {
  recorded: "Saved",
  "feedback-queued": "Feedback queued",
  "feedback-processing": "Feedback processing",
  "feedback-completed": "Feedback ready",
  "feedback-failed": "Feedback unavailable",
};

type SafeError = { message: string; requestId?: string };
type ProviderOperation = {
  token: number;
  scope: "generation" | "explanation" | "feedback";
  controller: AbortController;
  sessionId: string;
  routeEpoch: number;
  generationRequestId?: string;
};
type PinOperation = {
  token: number;
  questionId: string;
  controller: AbortController;
};
type ActiveJob = {
  scope: "generation" | "explanation" | "feedback";
  resourceId?: string;
  questionId?: string;
  job: Pick<InterviewJob, "id" | "type" | "status"> | InterviewJob;
  paused?: boolean;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    const requestId = error.requestId?.trim();
    return {
      message: error.message,
      ...(requestId && CANONICAL_REQUEST_ID_PATTERN.test(requestId)
        ? { requestId }
        : {}),
    };
  }
  return { message: "The request could not be completed. Try again." };
}

function generationSubmissionMayHaveSucceeded(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof ApiError &&
      (error.code === "INVALID_API_RESPONSE" ||
        error.code === "INVALID_INTERVIEW_RESPONSE"))
  );
}

function SafeErrorMessage({
  error,
  className = "interview-field-error",
  id,
}: {
  error: SafeError;
  className?: string;
  id?: string;
}) {
  return (
    <div className={className} id={id} role="alert">
      <span>{error.message}</span>
      {error.requestId ? <small>Request ID: {error.requestId}</small> : null}
    </div>
  );
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

function optionText(
  question: InterviewQuestionDetail | null,
  optionId: string,
): string {
  return (
    question?.multipleChoice?.options.find((option) => option.id === optionId)
      ?.text ?? "Option unavailable"
  );
}

function attemptAnswerText(
  attempt: InterviewAttempt,
  question: InterviewQuestionDetail | null,
): string {
  if ("answerText" in attempt && typeof attempt.answerText === "string") {
    return attempt.answerText;
  }
  if (!attempt.answer) return "Answer unavailable";
  if (attempt.answer.type === "multiple-choice") {
    return optionText(question, attempt.answer.selectedOptionId);
  }
  return attempt.answer.text;
}

export function InterviewSessionWorkspace() {
  const { sessionId = "" } = useParams();
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<SafeError | null>(null);
  const [sessionReloadKey, setSessionReloadKey] = useState(0);

  const [questions, setQuestions] = useState<InterviewQuestionSummary[]>([]);
  const [questionPagination, setQuestionPagination] = useState<Pagination | null>(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionReloadKey, setQuestionReloadKey] = useState(0);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<SafeError | null>(null);
  const [pinnedFilter, setPinnedFilter] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestionDetail | null>(null);
  const [questionDetailLoading, setQuestionDetailLoading] = useState(false);

  const [notesDraft, setNotesDraft] = useState("");
  const [notesState, setNotesState] = useState<"clean" | "dirty" | "saving" | "saved" | "error">("clean");
  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [answerError, setAnswerError] = useState<SafeError | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [questionActionError, setQuestionActionError] = useState<SafeError | null>(null);
  const [pinPendingQuestionId, setPinPendingQuestionId] = useState("");

  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [attemptPagination, setAttemptPagination] = useState<Pagination | null>(null);
  const [attemptPage, setAttemptPage] = useState(1);
  const [attemptReloadKey, setAttemptReloadKey] = useState(0);
  const [attemptStatusFilter, setAttemptStatusFilter] = useState<InterviewAttemptStatus | "">("");
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<SafeError | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState<InterviewAttempt | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuestionType, setManualQuestionType] = useState<InterviewQuestionType>("short-answer");
  const [manualCategory, setManualCategory] = useState("");
  const [manualDifficulty, setManualDifficulty] = useState<InterviewDifficulty>("medium");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualModelAnswer, setManualModelAnswer] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>(["", ""]);
  const [manualCorrectOptionIndex, setManualCorrectOptionIndex] = useState<number | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<SafeError | null>(null);

  const [generationCount, setGenerationCount] = useState(10);
  const [generationCategories, setGenerationCategories] = useState("");
  const [generationQuestionTypes, setGenerationQuestionTypes] = useState<InterviewQuestionType[]>(["short-answer"]);
  const [generationTypeCounts, setGenerationTypeCounts] = useState<Partial<Record<InterviewQuestionType, number>> | undefined>();
  const [providerBusy, setProviderBusy] = useState(false);
  const [providerError, setProviderError] = useState<SafeError | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const routeSequence = useRef(0);
  const routeEpoch = useRef(0);
  const routeIdentity = useRef("");
  const questionSequence = useRef(0);
  const questionDetailSequence = useRef(0);
  const attemptSequence = useRef(0);
  const attemptDetailSequence = useRef(0);
  const questionSelectionSequence = useRef(0);
  const attemptSelectionSequence = useRef(0);
  const selectedQuestionIdentity = useRef("");
  const selectedAttemptIdentity = useRef("");
  const pinOperationSequence = useRef(0);
  const pinOperation = useRef<PinOperation | null>(null);
  const generationIntentId = useRef<string | null>(null);
  const actionControllers = useRef(new Set<AbortController>());
  const questionControllers = useRef(new Set<AbortController>());
  const attemptControllers = useRef(new Set<AbortController>());
  const attemptListController = useRef<AbortController | null>(null);
  const providerOperationSequence = useRef(0);
  const providerOperation = useRef<ProviderOperation | null>(null);
  const providerErrorScope = useRef<ActiveJob["scope"] | null>(null);

  const makeController = useCallback((scope: "route" | "question" | "attempt" = "route") => {
    const controller = new AbortController();
    actionControllers.current.add(controller);
    if (scope === "question") questionControllers.current.add(controller);
    else if (scope === "attempt") attemptControllers.current.add(controller);
    return controller;
  }, []);

  const releaseController = useCallback((controller: AbortController) => {
    actionControllers.current.delete(controller);
    questionControllers.current.delete(controller);
    attemptControllers.current.delete(controller);
  }, []);

  function actionIsCurrent(controller: AbortController): boolean {
    return !controller.signal.aborted && routeIdentity.current === sessionId;
  }

  function beginProviderOperation(
    scope: ProviderOperation["scope"],
    controller: AbortController,
    generationRequestId?: string,
  ): ProviderOperation {
    const operation: ProviderOperation = {
      token: ++providerOperationSequence.current,
      scope,
      controller,
      sessionId,
      routeEpoch: routeEpoch.current,
      ...(generationRequestId ? { generationRequestId } : {}),
    };
    providerOperation.current = operation;
    return operation;
  }

  function providerOperationIsCurrent(operation: ProviderOperation): boolean {
    return (
      providerOperation.current === operation &&
      !operation.controller.signal.aborted &&
      routeIdentity.current === operation.sessionId &&
      routeEpoch.current === operation.routeEpoch
    );
  }

  const invalidateAttemptScope = useCallback(() => {
    attemptSelectionSequence.current += 1;
    for (const controller of attemptControllers.current) {
      controller.abort();
      actionControllers.current.delete(controller);
    }
    attemptControllers.current.clear();
    selectedAttemptIdentity.current = "";
    setSelectedAttemptId("");
    setSelectedAttempt(null);
    setAttemptError(null);
    if (providerOperation.current?.scope === "feedback" || providerErrorScope.current === "feedback") {
      if (providerOperation.current?.scope === "feedback") {
        providerOperation.current.controller.abort();
        providerOperation.current = null;
      }
      providerErrorScope.current = null;
      setProviderBusy(false);
      setProviderError(null);
      setActiveJob((current) => current?.scope === "feedback" ? null : current);
      setStatusMessage("");
    }
    setActiveJob((current) => current?.scope === "feedback" ? null : current);
    setStatusMessage((current) => current === FEEDBACK_READY_MESSAGE ? "" : current);
  }, []);

  const invalidateQuestionScope = useCallback(() => {
    questionSelectionSequence.current += 1;
    for (const controller of questionControllers.current) {
      controller.abort();
      actionControllers.current.delete(controller);
    }
    questionControllers.current.clear();
    pinOperation.current = null;
    setPinPendingQuestionId("");
    setQuestionActionError(null);
    setAnswerError(null);
    setAnswerBusy(false);
    setNotesState("clean");
    if (providerOperation.current?.scope === "explanation" || providerErrorScope.current === "explanation") {
      if (providerOperation.current?.scope === "explanation") {
        providerOperation.current.controller.abort();
        providerOperation.current = null;
      }
      providerErrorScope.current = null;
      setProviderBusy(false);
      setProviderError(null);
      setActiveJob((current) => current?.scope === "explanation" ? null : current);
      setStatusMessage("");
    }
    setActiveJob((current) => current?.scope === "explanation" ? null : current);
    attemptListController.current?.abort();
    attemptListController.current = null;
    attemptSequence.current += 1;
    setStatusMessage("");
    invalidateAttemptScope();
  }, [invalidateAttemptScope]);

  const selectQuestion = useCallback((questionId: string) => {
    if (selectedQuestionIdentity.current === questionId) return;
    invalidateQuestionScope();
    selectedQuestionIdentity.current = questionId;
    setSelectedQuestionId(questionId);
    setSelectedQuestion(null);
    setNotesDraft("");
    setAnswerDraft("");
    setSelectedOptionId("");
  }, [invalidateQuestionScope]);

  const selectAttempt = useCallback((attemptId: string) => {
    if (selectedAttemptIdentity.current === attemptId) return;
    invalidateAttemptScope();
    selectedAttemptIdentity.current = attemptId;
    setSelectedAttemptId(attemptId);
  }, [invalidateAttemptScope]);

  useEffect(() => {
    const identityChanged = routeIdentity.current !== sessionId;
    routeIdentity.current = sessionId;
    if (identityChanged) {
      routeEpoch.current += 1;
      for (const controller of actionControllers.current) controller.abort();
      actionControllers.current.clear();
      questionControllers.current.clear();
      attemptControllers.current.clear();
      attemptListController.current?.abort();
      attemptListController.current = null;
      questionSelectionSequence.current += 1;
      attemptSelectionSequence.current += 1;
      selectedQuestionIdentity.current = "";
      selectedAttemptIdentity.current = "";
      pinOperation.current = null;
      providerOperation.current = null;
      providerErrorScope.current = null;
    }
    const sequence = ++routeSequence.current;
    const controller = new AbortController();
    if (identityChanged) {
      setSession(null);
      setQuestions([]);
      setQuestionPagination(null);
      setSelectedQuestionId("");
      setSelectedQuestion(null);
      setQuestionDetailLoading(false);
      setAttempts([]);
      setAttemptPagination(null);
      setSelectedAttemptId("");
      setSelectedAttempt(null);
      setNotesDraft("");
      setAnswerDraft("");
      setSelectedOptionId("");
      setAnswerError(null);
      setAnswerBusy(false);
      setNotesState("clean");
      setQuestionActionError(null);
      setPinPendingQuestionId("");
      setManualOpen(false);
      setManualQuestionType("short-answer");
      setManualCategory("");
      setManualDifficulty("medium");
      setManualQuestion("");
      setManualModelAnswer("");
      setManualOptions(["", ""]);
      setManualCorrectOptionIndex(null);
      setManualBusy(false);
      setManualError(null);
      setGenerationCount(10);
      setGenerationCategories("");
      setGenerationQuestionTypes(["short-answer"]);
      setGenerationTypeCounts(undefined);
      setProviderBusy(false);
      setActiveJob(null);
      setProviderError(null);
      setStatusMessage("");
      setStatusBusy(false);
      setQuestionPage(1);
      setAttemptPage(1);
      setAttemptStatusFilter("");
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
        if (!controller.signal.aborted && sequence === routeSequence.current) setWorkspaceError(safeError(error));
      })
      .finally(() => {
        if (sequence === routeSequence.current) setLoading(false);
      });
    return () => controller.abort();
  }, [sessionId, sessionReloadKey]);

  useEffect(() => () => {
    for (const controller of actionControllers.current) controller.abort();
    actionControllers.current.clear();
    questionControllers.current.clear();
    attemptControllers.current.clear();
    attemptListController.current?.abort();
    attemptListController.current = null;
  }, []);

  useEffect(() => {
    if (!session) return;
    const sequence = ++questionSequence.current;
    const controller = new AbortController();
    setQuestionLoading(true);
    setQuestionError(null);
    void listInterviewQuestions(sessionId, {
      page: questionPage,
      limit: PAGE_SIZE,
      ...(pinnedFilter ? { pinned: true } : {}),
      ...(difficultyFilter ? { difficulty: difficultyFilter as InterviewDifficulty } : {}),
      ...(categoryFilter.trim() ? { category: categoryFilter.trim() } : {}),
    }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || sequence !== questionSequence.current || routeIdentity.current !== sessionId) return;
        setQuestions(result.questions);
        setQuestionPagination(result.pagination);
        const current = selectedQuestionIdentity.current;
        const next = result.questions.some((item) => item.id === current) ? current : (result.questions[0]?.id ?? "");
        if (next !== current) selectQuestion(next);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === questionSequence.current) setQuestionError(safeError(error));
      })
      .finally(() => {
        if (sequence === questionSequence.current) setQuestionLoading(false);
      });
    return () => controller.abort();
  }, [categoryFilter, difficultyFilter, pinnedFilter, questionPage, questionReloadKey, session, sessionId, selectQuestion]);

  useEffect(() => {
    if (!selectedQuestionId) {
      questionDetailSequence.current += 1;
      setSelectedQuestion(null);
      setQuestionDetailLoading(false);
      setNotesDraft("");
      setAnswerDraft("");
      setSelectedOptionId("");
      return;
    }
    const sequence = ++questionDetailSequence.current;
    const selection = questionSelectionSequence.current;
    const expectedQuestionId = selectedQuestionId;
    const controller = new AbortController();
    setQuestionDetailLoading(true);
    setQuestionActionError(null);
    setSelectedAttemptId("");
    setSelectedAttempt(null);
    setAnswerDraft("");
    setSelectedOptionId("");
    void fetchInterviewQuestion(sessionId, selectedQuestionId, controller.signal)
      .then((question) => {
        if (
          controller.signal.aborted ||
          sequence !== questionDetailSequence.current ||
          selection !== questionSelectionSequence.current ||
          selectedQuestionIdentity.current !== expectedQuestionId ||
          routeIdentity.current !== sessionId
        ) return;
        setSelectedQuestion(question);
        setNotesDraft(question.userNotes ?? "");
        setNotesState("clean");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === questionDetailSequence.current && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) {
          setQuestionActionError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === questionDetailSequence.current && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) {
          setQuestionDetailLoading(false);
        }
      });
    return () => controller.abort();
  }, [selectedQuestionId, sessionId]);

  useEffect(() => {
    if (!session) return;
    const sequence = ++attemptSequence.current;
    const questionSelection = questionSelectionSequence.current;
    const expectedQuestionId = selectedQuestionId;
    const controller = new AbortController();
    attemptListController.current = controller;
    setAttemptLoading(true);
    setAttemptError(null);
    void listAttemptHistory(sessionId, {
      page: attemptPage,
      limit: PAGE_SIZE,
      ...(selectedQuestionId ? { questionId: selectedQuestionId } : {}),
      ...(attemptStatusFilter ? { status: attemptStatusFilter } : {}),
    }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || sequence !== attemptSequence.current || questionSelection !== questionSelectionSequence.current || selectedQuestionIdentity.current !== expectedQuestionId || routeIdentity.current !== sessionId) return;
        setAttempts(result.attempts);
        setAttemptPagination(result.pagination);
        const currentAttemptId = selectedAttemptIdentity.current;
        if (currentAttemptId && !result.attempts.some((attempt) => attempt.id === currentAttemptId)) invalidateAttemptScope();
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === attemptSequence.current && questionSelection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) setAttemptError(safeError(error));
      })
      .finally(() => {
        if (sequence === attemptSequence.current && questionSelection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) setAttemptLoading(false);
      });
    return () => {
      controller.abort();
      if (attemptListController.current === controller) attemptListController.current = null;
    };
  }, [attemptPage, attemptReloadKey, attemptStatusFilter, invalidateAttemptScope, selectedQuestionId, session, sessionId]);

  useEffect(() => {
    if (!selectedAttemptId) {
      attemptDetailSequence.current += 1;
      setSelectedAttempt(null);
      return;
    }
    const sequence = ++attemptDetailSequence.current;
    const selection = attemptSelectionSequence.current;
    const expectedAttemptId = selectedAttemptId;
    const expectedQuestionId = selectedQuestionId;
    const expectedQuestionType = selectedQuestion?.id === expectedQuestionId ? selectedQuestion.questionType : undefined;
    const controller = new AbortController();
    void fetchInterviewAttempt(sessionId, selectedAttemptId, controller.signal, expectedQuestionId, expectedQuestionType)
      .then((attempt) => {
        if (!controller.signal.aborted && sequence === attemptDetailSequence.current && selection === attemptSelectionSequence.current && selectedAttemptIdentity.current === expectedAttemptId && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) setSelectedAttempt(attempt);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && sequence === attemptDetailSequence.current && selection === attemptSelectionSequence.current && selectedAttemptIdentity.current === expectedAttemptId && selectedQuestionIdentity.current === expectedQuestionId && routeIdentity.current === sessionId) setAttemptError(safeError(error));
      });
    return () => controller.abort();
  }, [selectedAttemptId, selectedQuestion, selectedQuestionId, sessionId]);

  const pollAcceptedJob = useCallback(async (
    scope: ActiveJob["scope"],
    accepted: Pick<InterviewJob, "id" | "type" | "status">,
    controller: AbortController,
    operation: ProviderOperation,
    expectedResultId?: string,
    expectedQuestionId?: string,
  ) => {
    const questionSelection = questionSelectionSequence.current;
    const attemptSelection = attemptSelectionSequence.current;
    const scopeIsCurrent = () =>
      providerOperation.current === operation &&
      !controller.signal.aborted &&
      routeIdentity.current === operation.sessionId &&
      routeEpoch.current === operation.routeEpoch &&
      (scope !== "explanation" || (expectedResultId === selectedQuestionIdentity.current && questionSelection === questionSelectionSequence.current)) &&
      (scope !== "feedback" || (expectedResultId === selectedAttemptIdentity.current && expectedQuestionId === selectedQuestionIdentity.current && attemptSelection === attemptSelectionSequence.current));
    if (!scopeIsCurrent()) return;
    setActiveJob({ scope, resourceId: expectedResultId, questionId: expectedQuestionId, job: accepted });
    const result = await pollInterviewJob({
      jobId: accepted.id,
      expectedType: accepted.type as InterviewJobType,
      ...(expectedResultId ? { expectedResultId } : {}),
      fetchJob: (jobId, signal) => fetchInterviewJob(jobId, signal, {
        expectedType: accepted.type as InterviewJobType,
        ...(expectedResultId ? { expectedResultId } : {}),
      }),
      signal: controller.signal,
      onUpdate: (job) => {
        if (scopeIsCurrent()) setActiveJob({ scope, resourceId: expectedResultId, questionId: expectedQuestionId, job });
      },
    });
    if (!scopeIsCurrent()) return;
    if (result.reason === "terminal") {
      setActiveJob({ scope, resourceId: expectedResultId, questionId: expectedQuestionId, job: result.job });
      if (result.job.status === "completed") {
        setStatusMessage(scope === "generation" ? "Question generation completed." : scope === "explanation" ? "Explanation is ready." : FEEDBACK_READY_MESSAGE);
        if (scope === "generation") {
          setQuestionReloadKey((key) => key + 1);
          setSessionReloadKey((key) => key + 1);
        } else if (scope === "explanation" && expectedResultId) {
          const detail = await fetchInterviewQuestion(sessionId, expectedResultId, controller.signal);
          if (scopeIsCurrent()) setSelectedQuestion(detail);
        } else if (scope === "feedback" && expectedResultId && expectedQuestionId) {
          const detail = await fetchInterviewAttempt(sessionId, expectedResultId, controller.signal, expectedQuestionId);
          if (scopeIsCurrent()) {
            setSelectedAttempt(detail);
            setAttemptReloadKey((key) => key + 1);
          }
        }
      } else {
        setProviderError({ message: "The AI request did not complete. Try again only when you want to start a new request." });
        providerErrorScope.current = scope;
      }
    } else if (result.reason === "timeout" || result.reason === "transport-failure") {
      setActiveJob((current) => current ? { ...current, paused: true } : current);
      setProviderError(result.reason === "transport-failure" ? safeError(result.error) : { message: "Automatic status checks paused after five minutes. The backend job may still be running." });
      providerErrorScope.current = scope;
    }
  }, [sessionId]);

  async function resumeStatusChecks() {
    if (!activeJob || providerBusy || (activeJob.job.status !== "queued" && activeJob.job.status !== "processing")) return;
    const controller = makeController(activeJob.scope === "generation" ? "route" : activeJob.scope === "explanation" ? "question" : "attempt");
    const operation = beginProviderOperation(activeJob.scope, controller);
    providerErrorScope.current = null;
    setProviderBusy(true);
    setProviderError(null);
    try {
      await pollAcceptedJob(activeJob.scope, activeJob.job, controller, operation, activeJob.resourceId, activeJob.questionId);
    } catch (error) {
      if (providerOperationIsCurrent(operation)) {
        providerErrorScope.current = activeJob.scope;
        setProviderError(safeError(error));
      }
    } finally {
      releaseController(controller);
      if (providerOperation.current === operation) {
        providerOperation.current = null;
        setProviderBusy(false);
      }
    }
  }

  async function cancelActiveJob(signal: AbortSignal): Promise<void> {
    if (!activeJob || !("progress" in activeJob.job)) return;
    const current = activeJob;
    const cancelled = await cancelJob(current.job.id, signal);
    if (signal.aborted) return;
    if (cancelled.id !== current.job.id || cancelled.type !== current.job.type) throw new ApiError(502, "INVALID_INTERVIEW_JOB", "The server returned a mismatched interview job.");
    if (cancelled.status !== "cancelled") {
      setActiveJob({ ...current, job: { ...current.job, status: "processing", phase: cancelled.phase, phaseSequence: cancelled.phaseSequence, canRetry: cancelled.canRetry, updatedAt: cancelled.updatedAt } });
      return;
    }
    providerOperation.current?.controller.abort();
    providerOperation.current = null;
    setProviderBusy(false);
    setActiveJob({ ...current, paused: false, job: { ...current.job, status: "cancelled", phase: cancelled.phase, phaseSequence: cancelled.phaseSequence, canRetry: cancelled.canRetry, updatedAt: cancelled.updatedAt } });
  }

  async function retryActiveJob(signal: AbortSignal): Promise<void> {
    if (!activeJob || !("progress" in activeJob.job)) return;
    const current = activeJob;
    const retried = await retryJob(current.job.id, signal);
    if (signal.aborted) return;
    if (retried.type !== current.job.type) throw new ApiError(502, "INVALID_INTERVIEW_JOB", "The server returned a mismatched interview job.");
    const controller = makeController(current.scope === "generation" ? "route" : current.scope === "explanation" ? "question" : "attempt");
    const operation = beginProviderOperation(current.scope, controller);
    const accepted = { id: retried.id, type: current.job.type, status: "queued" as const };
    setActiveJob({ ...current, paused: false, job: accepted });
    setProviderBusy(true);
    try {
      await pollAcceptedJob(current.scope, accepted, controller, operation, current.resourceId, current.questionId);
    } finally {
      releaseController(controller);
      if (providerOperation.current === operation) {
        providerOperation.current = null;
        setProviderBusy(false);
      }
    }
  }

  async function changeStatus(status: "completed" | "archived") {
    if (statusBusy) return;
    const controller = makeController();
    setStatusBusy(true);
    setWorkspaceError(null);
    try {
      const result = await updateInterviewSessionStatus(sessionId, status, controller.signal);
      if (!actionIsCurrent(controller)) return;
      setSession(result);
      setStatusMessage(`Session marked ${result.status}.`);
      setSessionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller)) setWorkspaceError(safeError(error));
    } finally {
      releaseController(controller);
      if (actionIsCurrent(controller)) setStatusBusy(false);
    }
  }

  function resetManualMcqDraft() {
    setManualOptions(["", ""]);
    setManualCorrectOptionIndex(null);
  }

  async function submitManualQuestion(event: FormEvent) {
    event.preventDefault();
    if (manualBusy || !manualCategory.trim() || manualQuestion.trim().length < 5) {
      setManualError({ message: "Enter a category and a question with at least 5 characters." });
      return;
    }
    const trimmedOptions = manualOptions.map((option) => option.trim());
    if (manualQuestionType === "multiple-choice") {
      if (trimmedOptions.length < 2 || trimmedOptions.length > 8 || trimmedOptions.some((option) => !option)) {
        setManualError({ message: "Multiple Choice requires 2–8 non-blank options." });
        return;
      }
      if (new Set(trimmedOptions).size !== trimmedOptions.length) {
        setManualError({ message: "Multiple Choice options must be distinct." });
        return;
      }
      if (manualCorrectOptionIndex === null || manualCorrectOptionIndex < 0 || manualCorrectOptionIndex >= trimmedOptions.length) {
        setManualError({ message: "Select the correct answer before adding the question." });
        return;
      }
    }
    const controller = makeController();
    setManualBusy(true);
    setManualError(null);
    try {
      const created = await addManualQuestion(sessionId, manualQuestionType === "multiple-choice" ? {
        questionType: "multiple-choice",
        category: manualCategory.trim(),
        difficulty: manualDifficulty,
        question: manualQuestion.trim(),
        multipleChoice: {
          options: trimmedOptions,
          correctOptionIndex: manualCorrectOptionIndex!,
        },
      } : {
        questionType: manualQuestionType,
        category: manualCategory.trim(),
        difficulty: manualDifficulty,
        question: manualQuestion.trim(),
        ...(manualModelAnswer.trim() ? { modelAnswer: manualModelAnswer.trim() } : {}),
      }, controller.signal);
      if (!actionIsCurrent(controller)) return;
      setManualQuestionType("short-answer");
      setManualCategory("");
      setManualQuestion("");
      setManualModelAnswer("");
      resetManualMcqDraft();
      setManualOpen(false);
      setQuestionReloadKey((key) => key + 1);
      setSessionReloadKey((key) => key + 1);
      selectQuestion(created.id);
      setStatusMessage("Manual question added.");
    } catch (error) {
      if (actionIsCurrent(controller)) setManualError(safeError(error));
    } finally {
      releaseController(controller);
      if (actionIsCurrent(controller)) setManualBusy(false);
    }
  }

  async function submitGeneration(event: FormEvent) {
    event.preventDefault();
    if (providerBusy) return;
    if (!interviewTypeCountsAreValid(generationCount, generationQuestionTypes, generationTypeCounts)) {
      setProviderError({ message: "Select at least one question type and make exact counts equal the Question count." });
      return;
    }
    const controller = makeController();
    const requestId = generationIntentId.current ?? crypto.randomUUID();
    generationIntentId.current = requestId;
    const operation = beginProviderOperation("generation", controller, requestId);
    providerErrorScope.current = null;
    setProviderBusy(true);
    setProviderError(null);
    try {
      const accepted = await generateInterviewQuestions(sessionId, {
        requestId,
        count: generationCount,
        categories: parseList(generationCategories),
        questionTypes: generationQuestionTypes,
        ...(generationTypeCounts === undefined ? {} : { typeCounts: generationTypeCounts }),
      }, controller.signal);
      if (!providerOperationIsCurrent(operation)) return;
      if (generationIntentId.current === requestId) generationIntentId.current = null;
      await pollAcceptedJob("generation", accepted, controller, operation);
    } catch (error) {
      if (providerOperationIsCurrent(operation)) {
        if (!generationSubmissionMayHaveSucceeded(error) && generationIntentId.current === requestId) generationIntentId.current = null;
        providerErrorScope.current = "generation";
        setProviderError(safeError(error));
      }
    } finally {
      releaseController(controller);
      if (providerOperation.current === operation) {
        providerOperation.current = null;
        setProviderBusy(false);
      }
    }
  }

  async function togglePinned() {
    if (!selectedQuestion || (pinOperation.current?.questionId === selectedQuestion.id && !pinOperation.current.controller.signal.aborted)) return;
    const expectedQuestionId = selectedQuestion.id;
    const selection = questionSelectionSequence.current;
    const controller = makeController("question");
    const operation: PinOperation = { token: ++pinOperationSequence.current, questionId: expectedQuestionId, controller };
    pinOperation.current = operation;
    setPinPendingQuestionId(expectedQuestionId);
    setQuestionActionError(null);
    try {
      const updated = await setQuestionPinned(sessionId, expectedQuestionId, !selectedQuestion.isPinned, controller.signal);
      if (!actionIsCurrent(controller) || pinOperation.current !== operation || selection !== questionSelectionSequence.current || selectedQuestionIdentity.current !== expectedQuestionId) return;
      setSelectedQuestion(updated);
      setQuestionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller) && pinOperation.current === operation && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId) setQuestionActionError(safeError(error));
    } finally {
      releaseController(controller);
      if (pinOperation.current === operation) {
        pinOperation.current = null;
        setPinPendingQuestionId("");
      }
    }
  }

  async function persistNotes(value: string) {
    if (!selectedQuestion || notesState === "saving") return;
    const expectedQuestionId = selectedQuestion.id;
    const selection = questionSelectionSequence.current;
    const controller = makeController("question");
    setNotesState("saving");
    setQuestionActionError(null);
    try {
      const updated = await saveQuestionNotes(sessionId, expectedQuestionId, value, controller.signal);
      if (!actionIsCurrent(controller) || selection !== questionSelectionSequence.current || selectedQuestionIdentity.current !== expectedQuestionId) return;
      setSelectedQuestion(updated);
      setNotesDraft(updated.userNotes ?? "");
      setNotesState("saved");
      setQuestionReloadKey((key) => key + 1);
    } catch (error) {
      if (actionIsCurrent(controller) && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId) {
        setNotesState("error");
        setQuestionActionError(safeError(error));
      }
    } finally {
      releaseController(controller);
    }
  }

  async function requestExplanation() {
    if (!selectedQuestion || providerBusy) return;
    const expectedQuestionId = selectedQuestion.id;
    const selection = questionSelectionSequence.current;
    const controller = makeController("question");
    const operation = beginProviderOperation("explanation", controller);
    providerErrorScope.current = null;
    setProviderBusy(true);
    setProviderError(null);
    try {
      const result = await requestQuestionExplanation(sessionId, expectedQuestionId, controller.signal);
      if (!actionIsCurrent(controller) || !providerOperationIsCurrent(operation) || selection !== questionSelectionSequence.current || selectedQuestionIdentity.current !== expectedQuestionId) return;
      if (result.kind === "available") {
        setSelectedQuestion(result.question);
        setStatusMessage("Explanation is available.");
      } else {
        await pollAcceptedJob("explanation", result.job, controller, operation, expectedQuestionId, expectedQuestionId);
      }
    } catch (error) {
      if (providerOperationIsCurrent(operation) && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId) {
        providerErrorScope.current = "explanation";
        setProviderError(safeError(error));
      }
    } finally {
      releaseController(controller);
      if (providerOperation.current === operation) {
        providerOperation.current = null;
        setProviderBusy(false);
      }
    }
  }

  async function submitAttempt() {
    if (!selectedQuestion || answerBusy) return;
    const answer = answerDraft.trim();
    let submission: { answerText: string } | { answer: TypedInterviewAnswer };
    if (selectedQuestion.questionType === "legacy-open-response") {
      if (answer.length < 1 || answer.length > ANSWER_MAX_LENGTH) {
        setAnswerError({ message: `Enter an answer with 1–${ANSWER_MAX_LENGTH.toLocaleString()} characters.` });
        return;
      }
      submission = { answerText: answer };
    } else if (selectedQuestion.questionType === "multiple-choice") {
      if (!selectedOptionId) {
        setAnswerError({ message: "Select an answer before saving this attempt." });
        return;
      }
      submission = { answer: { type: "multiple-choice", selectedOptionId } };
    } else {
      if (answer.length < 1 || answer.length > ANSWER_MAX_LENGTH) {
        setAnswerError({ message: `Enter an answer with 1–${ANSWER_MAX_LENGTH.toLocaleString()} characters.` });
        return;
      }
      submission = { answer: { type: selectedQuestion.questionType, text: answer } };
    }
    const expectedQuestionId = selectedQuestion.id;
    const selection = questionSelectionSequence.current;
    const controller = makeController("question");
    setAnswerBusy(true);
    setAnswerError(null);
    try {
      const created = await recordInterviewAttempt(sessionId, expectedQuestionId, submission, controller.signal);
      if (!actionIsCurrent(controller) || selection !== questionSelectionSequence.current || selectedQuestionIdentity.current !== expectedQuestionId) return;
      setAnswerDraft("");
      setSelectedOptionId("");
      selectAttempt(created.id);
      setSelectedAttempt(created);
      setAttemptReloadKey((key) => key + 1);
      setStatusMessage("Attempt saved. Another submission will be saved separately.");
    } catch (error) {
      if (actionIsCurrent(controller) && selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId) setAnswerError(safeError(error));
    } finally {
      releaseController(controller);
      if (selection === questionSelectionSequence.current && selectedQuestionIdentity.current === expectedQuestionId) setAnswerBusy(false);
    }
  }

  async function requestFeedback(attempt: InterviewAttempt) {
    if (providerBusy || attempt.feedback || attempt.answer?.type === "multiple-choice") return;
    const expectedAttemptId = attempt.id;
    const expectedQuestionId = attempt.questionId;
    const selection = attemptSelectionSequence.current;
    const controller = makeController("attempt");
    const operation = beginProviderOperation("feedback", controller);
    providerErrorScope.current = null;
    setProviderBusy(true);
    setProviderError(null);
    try {
      const expectedQuestionType = selectedQuestion?.id === expectedQuestionId ? selectedQuestion.questionType : undefined;
      const result = await requestAttemptFeedback(sessionId, expectedAttemptId, controller.signal, expectedQuestionId, expectedQuestionType);
      if (!actionIsCurrent(controller) || !providerOperationIsCurrent(operation) || selection !== attemptSelectionSequence.current || selectedAttemptIdentity.current !== expectedAttemptId || selectedQuestionIdentity.current !== expectedQuestionId) return;
      if (result.kind === "available") {
        setSelectedAttempt(result.attempt);
        setAttemptReloadKey((key) => key + 1);
      } else {
        await pollAcceptedJob("feedback", result.job, controller, operation, result.attemptId, expectedQuestionId);
      }
    } catch (error) {
      if (providerOperationIsCurrent(operation) && selection === attemptSelectionSequence.current && selectedAttemptIdentity.current === expectedAttemptId && selectedQuestionIdentity.current === expectedQuestionId) {
        providerErrorScope.current = "feedback";
        setProviderError(safeError(error));
      }
    } finally {
      releaseController(controller);
      if (providerOperation.current === operation) {
        providerOperation.current = null;
        setProviderBusy(false);
      }
    }
  }

  if (loading) {
    return (
      <section className="interview-state" role="status">
        <Breadcrumbs items={[{ label: "Interviews", to: "/interviews" }, { label: "Loading session" }]} />
        Loading interview session…
      </section>
    );
  }

  if (workspaceError && !session) {
    return (
      <section className="interview-state interview-state--error">
        <Breadcrumbs items={[{ label: "Interviews", to: "/interviews" }, { label: "Session unavailable" }]} />
        <h1>Interview session unavailable</h1>
        <SafeErrorMessage error={workspaceError} />
        <button type="button" onClick={() => setSessionReloadKey((key) => key + 1)}>Retry session</button>
        <Link className="workspace-back-link interview-back-link" to="/interviews">Back to Interview Coach</Link>
      </section>
    );
  }

  if (!session) return null;
  const editable = session.status === "active";
  const canWriteAttempt = editable && session.mode === "written-practice";
  const generationStatusPending = activeJob?.scope === "generation" && (activeJob.job.status === "queued" || activeJob.job.status === "processing");
  const mcqExplanationLocked =
    selectedQuestion?.questionType === "multiple-choice" &&
    !selectedQuestion.explanation &&
    !selectedAttempt &&
    (attemptPagination?.total ?? attempts.length) === 0;

  return (
    <section className="interview-workspace" aria-labelledby="interview-workspace-title">
      <Breadcrumbs items={[{ label: "Interviews", to: "/interviews" }, { label: session.title }]} />
      <Link className="workspace-back-link interview-back-link" to="/interviews">← All interview sessions</Link>
      <header className="interview-workspace-heading">
        <div>
          <p className="eyebrow">Interview briefing</p>
          <h1 id="interview-workspace-title">{session.title}</h1>
          <p>{session.targetRole} · {session.experienceLevel}</p>
          <div className="interview-context-chips">
            <span className="interview-chip">{session.status}</span>
            <span>{session.mode.replace("-", " ")}</span>
            <span>{session.questionCount} {session.questionCount === 1 ? "question" : "questions"}</span>
          </div>
        </div>
        <div className="interview-lifecycle-actions">
          {session.status === "active" ? (
            <>
              <button type="button" disabled={statusBusy} onClick={() => void changeStatus("completed")}>Mark completed</button>
              <button type="button" disabled={statusBusy} onClick={() => void changeStatus("archived")}>Archive</button>
            </>
          ) : session.status === "completed" ? (
            <button type="button" disabled={statusBusy} onClick={() => void changeStatus("archived")}>Archive</button>
          ) : null}
        </div>
      </header>

      <section className="interview-brief interview-panel" aria-labelledby="session-context-title">
        <h2 id="session-context-title">Session context</h2>
        <dl className={`interview-context-grid interview-context-grid--${session.jobDescription ? "four" : "three"}`}>
          <div><dt>Focus topics</dt><dd>{session.focusTopics.length ? session.focusTopics.join(", ") : "None recorded"}</dd></div>
          <div><dt>Skill gaps</dt><dd>{session.skillGaps.length ? session.skillGaps.join(", ") : "None recorded"}</dd></div>
          {session.jobDescription ? <div><dt>Job description</dt><dd>{session.jobDescription}</dd></div> : null}
          <div className="interview-context-grid__updated"><dt>Updated</dt><dd>{new Date(session.updatedAt).toLocaleString()}</dd></div>
        </dl>
      </section>

      {!editable ? (
        <p className="interview-readonly-notice" role="status">
          {session.status === "completed" ? "Completed sessions are read-mostly." : "Archived sessions are read-only."}{" "}
          Existing questions, notes, attempts, and stored guidance remain available.
        </p>
      ) : null}
      {workspaceError ? <SafeErrorMessage error={workspaceError} /> : null}
      <p className="interview-sr-status" aria-live="polite">{statusMessage}</p>

      {editable ? (
        <section className="interview-tools interview-panel" aria-labelledby="question-tools-title">
          <div className="interview-section-heading">
            <div><p className="interview-kicker">Build the briefing</p><h2 id="question-tools-title">Add questions</h2></div>
            <button type="button" aria-expanded={manualOpen} aria-controls="manual-question-form" onClick={() => setManualOpen((open) => !open)}>
              {manualOpen ? "Close manual form" : "Add manually"}
            </button>
          </div>

          <form className="interview-generation-form" onSubmit={(event) => void submitGeneration(event)}>
            <label>
              Question count
              <select value={generationCount} onChange={(event) => setGenerationCount(Number(event.target.value))}>
                {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            <label>
              Categories
              <input value={generationCategories} maxLength={6_000} placeholder="System design, behavioral" onChange={(event) => setGenerationCategories(event.target.value)} />
            </label>
            <div className="interview-span-two">
              <InterviewQuestionTypeControls
                count={generationCount}
                selected={generationQuestionTypes}
                explicitCounts={generationTypeCounts}
                disabled={providerBusy || generationStatusPending}
                onSelectedChange={setGenerationQuestionTypes}
                onExplicitCountsChange={setGenerationTypeCounts}
              />
            </div>
            <button className="interview-primary-button" type="submit" disabled={providerBusy || generationStatusPending || !interviewTypeCountsAreValid(generationCount, generationQuestionTypes, generationTypeCounts)}>
              {providerBusy && activeJob?.scope === "generation" ? "Generating…" : "Generate questions"}
            </button>
          </form>
          <p className="interview-ai-note">AI requests are optional and may be unavailable in this environment. Manual questions, notes, and written attempts remain usable without them.</p>

          {manualOpen ? (
            <form id="manual-question-form" className="interview-manual-form" onSubmit={(event) => void submitManualQuestion(event)} noValidate>
              <label>
                Question type
                <select
                  value={manualQuestionType}
                  onChange={(event) => {
                    const next = event.target.value as InterviewQuestionType;
                    setManualQuestionType(next);
                    setManualError(null);
                    if (next !== "multiple-choice") resetManualMcqDraft();
                  }}
                >
                  {Object.entries(QUESTION_TYPE_LABELS)
                    .filter(([value]) => value !== "legacy-open-response")
                    .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Category
                <input value={manualCategory} maxLength={120} onChange={(event) => setManualCategory(event.target.value)} />
              </label>
              <label>
                Difficulty
                <select value={manualDifficulty} onChange={(event) => setManualDifficulty(event.target.value as InterviewDifficulty)}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </label>
              <label className="interview-span-two">
                Question
                <textarea rows={4} maxLength={2_000} value={manualQuestion} onChange={(event) => setManualQuestion(event.target.value)} />
              </label>

              {manualQuestionType === "multiple-choice" ? (
                <fieldset className="interview-mcq-editor">
                  <legend>Multiple Choice options</legend>
                  {manualOptions.map((option, index) => (
                    <div className="interview-mcq-editor__option" key={`manual-option-${index}`}>
                      <label className="interview-mcq-editor__correct">
                        <input
                          type="radio"
                          name="manual-correct-option"
                          checked={manualCorrectOptionIndex === index}
                          onChange={() => setManualCorrectOptionIndex(index)}
                        />
                        Correct
                      </label>
                      <label>
                        Option {index + 1}
                        <input
                          type="text"
                          maxLength={500}
                          value={option}
                          onChange={(event) => setManualOptions((current) => current.map((value, optionIndex) => optionIndex === index ? event.target.value : value))}
                        />
                      </label>
                      <button
                        type="button"
                        className="interview-secondary-button"
                        disabled={manualOptions.length <= 2}
                        onClick={() => {
                          setManualOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
                          setManualCorrectOptionIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                        }}
                      >
                        Remove option {index + 1}
                      </button>
                    </div>
                  ))}
                  <div className="interview-mcq-editor__actions">
                    <button type="button" className="interview-secondary-button" disabled={manualOptions.length >= 8} onClick={() => setManualOptions((current) => [...current, ""])}>Add option</button>
                  </div>
                </fieldset>
              ) : (
                <label className="interview-span-two">
                  Model answer <span>(optional)</span>
                  <textarea rows={5} maxLength={12_000} value={manualModelAnswer} onChange={(event) => setManualModelAnswer(event.target.value)} />
                </label>
              )}
              {manualError ? <SafeErrorMessage error={manualError} /> : null}
              <button className="interview-secondary-button" type="submit" disabled={manualBusy}>{manualBusy ? "Adding…" : "Add question"}</button>
            </form>
          ) : null}
        </section>
      ) : null}

      {activeJob ? (
        <section className="interview-job-status" aria-label="Provider job status" aria-live="polite">
          <strong>{activeJob.scope === "generation" ? "Question generation" : activeJob.scope === "explanation" ? "Question explanation" : "Practice feedback"}</strong>
          <span>{activeJob.paused ? "status checks paused" : activeJob.job.status.replace("-", " ")}</span>
          {"progress" in activeJob.job ? (
            <>
              <progress max={100} value={activeJob.job.progress} aria-label={`${activeJob.job.progress}% complete`} />
              <JobResilienceActions job={normalizeSafeJob(activeJob.job)} onCancel={cancelActiveJob} onRetry={retryActiveJob} />
            </>
          ) : null}
          {activeJob.paused ? <button type="button" disabled={providerBusy} onClick={() => void resumeStatusChecks()}>Resume status checks</button> : null}
        </section>
      ) : null}
      {providerError ? <SafeErrorMessage error={providerError} /> : null}

      <div className="interview-workspace-grid">
        <section className="interview-question-index interview-panel" aria-labelledby="question-index-title">
          <div className="interview-section-heading">
            <div><p className="interview-kicker">Question index</p><h2 id="question-index-title">Questions</h2></div>
            {questionPagination ? <span className="interview-chip">{questionPagination.total}</span> : null}
          </div>
          <div className="interview-question-filters">
            <label><input type="checkbox" checked={pinnedFilter} onChange={(event) => { setPinnedFilter(event.target.checked); setQuestionPage(1); }} />Pinned only</label>
            <label>Difficulty<select value={difficultyFilter} onChange={(event) => { setDifficultyFilter(event.target.value); setQuestionPage(1); }}><option value="">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            <label>Category<input value={categoryFilter} maxLength={120} onChange={(event) => { setCategoryFilter(event.target.value); setQuestionPage(1); }} /></label>
          </div>
          {questionLoading ? <p className="interview-state" role="status">Loading questions…</p> : questionError ? (
            <div className="interview-state interview-state--error"><SafeErrorMessage error={questionError} className="interview-field-error" /><button type="button" onClick={() => setQuestionReloadKey((key) => key + 1)}>Retry questions</button></div>
          ) : questions.length === 0 ? <p className="interview-state">No questions match these filters.</p> : (
            <ol className="interview-question-list">
              {questions.map((question) => (
                <li key={question.id}>
                  <button
                    type="button"
                    className={selectedQuestionId === question.id ? "interview-question-select interview-question-select--active" : "interview-question-select"}
                    aria-pressed={selectedQuestionId === question.id}
                    aria-label={`${question.isPinned ? "Pinned: " : ""}${question.question}`}
                    onClick={() => selectQuestion(question.id)}
                  >
                    <span className="interview-question-type-label">{QUESTION_TYPE_LABELS[question.questionType]}</span>
                    <span>{question.category} · {question.difficulty}</span>
                    <strong>{question.question}</strong>
                    {question.isPinned ? <span className="interview-pinned-label"><span aria-hidden="true">◆</span> Pinned</span> : null}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="interview-pagination">
            <button type="button" disabled={questionLoading || questionPage <= 1} onClick={() => setQuestionPage((current) => current - 1)}>Previous</button>
            <span>Page {questionPage}</span>
            <button type="button" disabled={questionLoading || !questionPagination || questionPagination.pages === 0 || questionPage >= questionPagination.pages} onClick={() => setQuestionPage((current) => current + 1)}>Next</button>
          </div>
        </section>

        <section className="interview-practice-desk interview-panel" aria-labelledby="practice-desk-title">
          <div className="interview-section-heading">
            <div><p className="interview-kicker">Practice desk</p><h2 id="practice-desk-title">{selectedQuestion?.category ?? "Select a question"}</h2></div>
            {selectedQuestion ? <div className="interview-context-chips"><span className="interview-question-type-label">{QUESTION_TYPE_LABELS[selectedQuestion.questionType]}</span><span className="interview-chip">{selectedQuestion.difficulty}</span></div> : null}
          </div>
          {questionDetailLoading ? <p className="interview-state" role="status">Loading question…</p> : !selectedQuestion ? <p className="interview-state">Choose a question to review its private practice record.</p> : (
            <>
              <article className="interview-question-card">
                <div className="interview-question-card__label">
                  <span>Question prompt</span>
                  {selectedQuestion.isPinned ? <span className="interview-pinned-label"><span aria-hidden="true">◆</span> Pinned</span> : null}
                </div>
                <p>{selectedQuestion.question}</p>
                {editable ? <button type="button" className="interview-secondary-button" disabled={pinPendingQuestionId === selectedQuestion.id} onClick={() => void togglePinned()}>{selectedQuestion.isPinned ? "Unpin" : "Pin question"}</button> : null}
              </article>

              {selectedQuestion.modelAnswer ? (
                <section className="interview-record-block">
                  <div className="interview-record-heading"><div><p className="interview-kicker">Reference</p><h3>Model answer</h3></div><CopyInterviewTextButton label="Model answer" text={selectedQuestion.modelAnswer} /></div>
                  <p>{selectedQuestion.modelAnswer}</p>
                </section>
              ) : null}
              {selectedQuestion.explanation ? (
                <section className="interview-record-block">
                  <div className="interview-record-heading"><div><p className="interview-kicker">Guidance</p><h3>Explanation</h3></div><CopyInterviewTextButton label="Explanation" text={selectedQuestion.explanation} /></div>
                  <p>{selectedQuestion.explanation}</p>
                  {selectedQuestion.explanationKeyPoints.length > 0 ? <ul>{selectedQuestion.explanationKeyPoints.map((point, index) => <li key={`${selectedQuestion.id}-${index}`}>{point}</li>)}</ul> : null}
                </section>
              ) : editable && mcqExplanationLocked ? (
                <p className="interview-explanation-lock">Submit an attempt to unlock the explanation.</p>
              ) : editable ? (
                <button type="button" className="interview-secondary-button" disabled={providerBusy} onClick={() => void requestExplanation()}>Request explanation</button>
              ) : null}

              <label className="interview-answer-field">
                Private notes
                <textarea rows={4} maxLength={8_000} value={notesDraft} readOnly={!editable} onChange={(event) => { setNotesDraft(event.target.value); setNotesState("dirty"); }} />
              </label>
              {editable ? (
                <div className="interview-action-row">
                  <button type="button" className="interview-secondary-button" disabled={notesState === "saving" || notesDraft.length > 8_000 || (notesState !== "dirty" && notesState !== "error")} onClick={() => void persistNotes(notesDraft)}>{notesState === "saving" ? "Saving…" : "Save notes"}</button>
                  <button type="button" className="interview-secondary-button" disabled={notesState === "saving" || notesDraft === ""} onClick={() => void persistNotes("")}>Clear notes</button>
                  <span role="status">{notesState === "saved" ? notesDraft === "" ? "Notes cleared." : "Notes saved." : notesState === "dirty" ? "Unsaved notes." : ""}</span>
                </div>
              ) : null}

              {canWriteAttempt ? (
                <section className="interview-attempt-composer" aria-labelledby="attempt-composer-title">
                  <h3 id="attempt-composer-title">Save another attempt</h3>
                  <p>Each submission is saved separately so you can review your practice over time.</p>
                  <InterviewAnswerControl
                    question={selectedQuestion}
                    textValue={answerDraft}
                    selectedOptionId={selectedOptionId}
                    disabled={answerBusy}
                    error={answerError}
                    onTextChange={(value) => { setAnswerDraft(value); if (answerError) setAnswerError(null); }}
                    onSelectedOptionChange={(optionId) => { setSelectedOptionId(optionId); if (answerError) setAnswerError(null); }}
                    onSubmit={() => void submitAttempt()}
                  />
                </section>
              ) : null}
            </>
          )}
          {questionActionError ? <SafeErrorMessage error={questionActionError} /> : null}
        </section>

        <section className="interview-history interview-panel" aria-labelledby="attempt-history-title">
          <div className="interview-section-heading">
            <div><h2 id="attempt-history-title">Saved attempts</h2><p className="interview-saved-attempts-copy">Review each saved submission and any available feedback.</p></div>
            {attemptPagination ? <span className="interview-chip">{attemptPagination.total}</span> : null}
          </div>
          <label className="interview-attempt-status-filter">
            Attempt status
            <select value={attemptStatusFilter} onChange={(event) => { attemptListController.current?.abort(); attemptSequence.current += 1; setAttemptStatusFilter(event.target.value as InterviewAttemptStatus | ""); setAttemptPage(1); }}>
              <option value="">All statuses</option><option value="recorded">Saved</option><option value="feedback-queued">Feedback queued</option><option value="feedback-processing">Feedback processing</option><option value="feedback-completed">Feedback ready</option><option value="feedback-failed">Feedback unavailable</option>
            </select>
          </label>
          {attemptLoading ? <p className="interview-state" role="status">Loading attempts…</p> : attemptError ? (
            <div className="interview-state interview-state--error"><SafeErrorMessage error={attemptError} className="interview-field-error" /><button type="button" onClick={() => setAttemptReloadKey((key) => key + 1)}>Retry attempts</button></div>
          ) : attempts.length === 0 ? <p className="interview-state">No saved attempts for this question yet.</p> : (
            <ol className="interview-attempt-list">
              {attempts.map((attempt, index) => (
                <li key={attempt.id}>
                  <button type="button" aria-pressed={selectedAttemptId === attempt.id} aria-label={`Review attempt ${index + 1} submitted ${new Date(attempt.createdAt).toLocaleString()}`} onClick={() => selectAttempt(attempt.id)}>
                    <strong>Attempt {index + 1}</strong>
                    <span>{attemptStatusLabels[attempt.status]}</span>
                    {attempt.evaluation ? <span>{attempt.evaluation.score}/100</span> : attempt.feedback ? <span>{attempt.feedback.score}/100</span> : null}
                    <small>Submitted {new Date(attempt.createdAt).toLocaleString()}</small>
                    <span className="interview-attempt-list__review">Review attempt</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {attemptPagination && attemptPagination.pages > 1 ? (
            <Pager className="interview-pagination" label="Saved attempt pages" currentPage={`Page ${attemptPage}`} previousLabel="Previous" nextLabel="Next" previousDisabled={attemptLoading || attemptPage <= 1} nextDisabled={attemptLoading || attemptPage >= attemptPagination.pages} busy={attemptLoading} onPrevious={() => setAttemptPage((current) => current - 1)} onNext={() => setAttemptPage((current) => current + 1)} />
          ) : null}

          {selectedAttempt ? (
            <article className="interview-attempt-detail">
              <div className="interview-section-heading"><h3>Saved answer</h3><span>{attemptStatusLabels[selectedAttempt.status]}</span></div>
              <p>{attemptAnswerText(selectedAttempt, selectedQuestion)}</p>
              {selectedAttempt.answer?.type === "multiple-choice" && selectedAttempt.evaluation ? (
                <div className="interview-attempt-result">
                  <span className={selectedAttempt.evaluation.correct ? "interview-attempt-result__badge" : "interview-attempt-result__badge interview-attempt-result__badge--review"}>
                    {selectedAttempt.evaluation.correct ? "Correct" : "Needs review"}
                  </span>
                  <strong>{selectedAttempt.evaluation.score}/100</strong>
                  <span>Correct answer: {optionText(selectedQuestion, selectedAttempt.evaluation.correctOptionId)}</span>
                </div>
              ) : null}
              <small>Submitted {new Date(selectedAttempt.createdAt).toLocaleString()}</small>
              {feedbackPanel(selectedAttempt)}
              {editable && !selectedAttempt.feedback && selectedAttempt.answer?.type !== "multiple-choice" ? (
                <button type="button" className="interview-secondary-button" disabled={providerBusy || selectedAttempt.status === "feedback-queued" || selectedAttempt.status === "feedback-processing"} onClick={() => void requestFeedback(selectedAttempt)}>Request feedback</button>
              ) : null}
            </article>
          ) : null}
        </section>
      </div>
    </section>
  );
}
