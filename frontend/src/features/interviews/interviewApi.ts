import { apiRequest } from "../../api/apiClient";
import {
  parseAcceptedInterviewJob,
  parseAttemptDetail,
  parseAttemptList,
  parseCreatedSession,
  parseCreatedQuestion,
  parseExplanationResponse,
  parseFeedbackResponse,
  parseInterviewJob,
  parseQuestionDetail,
  parseQuestionList,
  parseRecordedAttempt,
  parseSessionDetail,
  parseSessionList,
} from "./interviewContracts";
import type {
  CreateInterviewSessionInput,
  InterviewAttemptStatus,
  InterviewDifficulty,
  InterviewJob,
  InterviewSessionStatus,
  ManualInterviewQuestionInput,
} from "./types";

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function canonicalList(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function paginationQuery(input: {
  page?: number;
  limit?: number;
}): URLSearchParams {
  return new URLSearchParams({
    page: String(
      boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER),
    ),
    limit: String(boundedInteger(input.limit, 20, 1, 100)),
  });
}

function routeId(value: string): string {
  return encodeURIComponent(value);
}

export async function listInterviewSessions(
  input: {
    page?: number;
    limit?: number;
    status?: InterviewSessionStatus;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.status) query.set("status", input.status);
  const data = await apiRequest<unknown>(
    `/interview-sessions?${query}`,
    { authentication: "required", signal },
  );
  return parseSessionList(data);
}

export async function createInterviewSession(
  input: CreateInterviewSessionInput,
  signal?: AbortSignal,
) {
  const jobDescription = input.jobDescription?.trim();
  const data = await apiRequest<unknown>("/interview-sessions", {
    method: "POST",
    authentication: "required",
    signal,
    body: {
      title: input.title.trim(),
      targetRole: input.targetRole.trim(),
      experienceLevel: input.experienceLevel.trim(),
      focusTopics: canonicalList(input.focusTopics),
      skillGaps: canonicalList(input.skillGaps),
      ...(jobDescription ? { jobDescription } : {}),
      mode: input.mode,
      manualQuestions: [],
    },
  });
  return parseCreatedSession(data);
}

export async function fetchInterviewSession(
  sessionId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}`,
    { authentication: "required", signal },
  );
  return parseSessionDetail(data, sessionId);
}

export async function updateInterviewSessionStatus(
  sessionId: string,
  status: InterviewSessionStatus,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/status`,
    {
      method: "PATCH",
      body: { status },
      authentication: "required",
      signal,
    },
  );
  return parseSessionDetail(data, sessionId);
}

export async function listInterviewQuestions(
  sessionId: string,
  input: {
    page?: number;
    limit?: number;
    pinned?: boolean;
    difficulty?: InterviewDifficulty;
    category?: string;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.pinned !== undefined) {
    query.set("pinned", String(input.pinned));
  }
  if (input.difficulty) query.set("difficulty", input.difficulty);
  if (input.category?.trim()) {
    query.set("category", input.category.trim());
  }
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions?${query}`,
    { authentication: "required", signal },
  );
  return parseQuestionList(data, sessionId);
}

export async function addManualQuestion(
  sessionId: string,
  input: ManualInterviewQuestionInput,
  signal?: AbortSignal,
) {
  const modelAnswer = input.modelAnswer?.trim();
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions`,
    {
      method: "POST",
      authentication: "required",
      signal,
      body: {
        category: input.category.trim(),
        difficulty: input.difficulty,
        question: input.question.trim(),
        ...(modelAnswer ? { modelAnswer } : {}),
      },
    },
  );
  return parseCreatedQuestion(data, sessionId);
}

export async function generateInterviewQuestions(
  sessionId: string,
  input: {
    requestId: string;
    count: number;
    categories: string[];
  },
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/generate`,
    {
      method: "POST",
      authentication: "required",
      signal,
      body: {
        requestId: input.requestId,
        count: boundedInteger(input.count, 10, 1, 20),
        categories: canonicalList(input.categories),
      },
    },
  );
  return parseAcceptedInterviewJob(
    data,
    "interview.questions.generate",
  );
}

export async function fetchInterviewQuestion(
  sessionId: string,
  questionId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}`,
    { authentication: "required", signal },
  );
  return parseQuestionDetail(data, sessionId, questionId);
}

export async function setQuestionPinned(
  sessionId: string,
  questionId: string,
  isPinned: boolean,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/pin`,
    {
      method: "PATCH",
      body: { isPinned },
      authentication: "required",
      signal,
    },
  );
  return parseQuestionDetail(data, sessionId, questionId);
}

export async function saveQuestionNotes(
  sessionId: string,
  questionId: string,
  notes: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/notes`,
    {
      method: "PATCH",
      body: { notes: notes.trim() },
      authentication: "required",
      signal,
    },
  );
  return parseQuestionDetail(data, sessionId, questionId);
}

export async function requestQuestionExplanation(
  sessionId: string,
  questionId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/explanation`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
  );
  return parseExplanationResponse(data, sessionId, questionId);
}

export async function recordInterviewAttempt(
  sessionId: string,
  questionId: string,
  answerText: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/attempts`,
    {
      method: "POST",
      body: { answerText: answerText.trim() },
      authentication: "required",
      signal,
    },
  );
  return parseRecordedAttempt(data, sessionId);
}

export async function listAttemptHistory(
  sessionId: string,
  input: {
    page?: number;
    limit?: number;
    questionId?: string;
    status?: InterviewAttemptStatus;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.questionId) query.set("questionId", input.questionId);
  if (input.status) query.set("status", input.status);
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/attempts?${query}`,
    { authentication: "required", signal },
  );
  return parseAttemptList(data, sessionId);
}

export async function fetchInterviewAttempt(
  sessionId: string,
  attemptId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/attempts/${routeId(
      attemptId,
    )}`,
    { authentication: "required", signal },
  );
  return parseAttemptDetail(data, sessionId, attemptId);
}

export async function requestAttemptFeedback(
  sessionId: string,
  attemptId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/interview-sessions/${routeId(sessionId)}/attempts/${routeId(
      attemptId,
    )}/feedback`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
  );
  return parseFeedbackResponse(data, sessionId, attemptId);
}

export async function fetchInterviewJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<InterviewJob> {
  const data = await apiRequest<unknown>(`/jobs/${routeId(jobId)}`, {
    authentication: "required",
    signal,
  });
  return parseInterviewJob(data);
}

export * from "./interviewContracts";
export * from "./interviewPolling";
