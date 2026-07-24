import type {
  CreateInterviewSessionInput,
  InterviewDifficulty,
} from "./types";
import { apiRequest } from "../../api/apiClient";

export function createInterviewSession(
  accessToken: string,
  payload: CreateInterviewSessionInput,
) {
  return apiRequest<unknown>("/interview-sessions", {
    method: "POST",
    body: payload,
    authentication: "required",
    accessToken,
  });
}

export function listInterviewSessions(
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return apiRequest<unknown>(
    `/interview-sessions?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchInterviewSession(
  sessionId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function listInterviewQuestions(
  sessionId: string,
  accessToken: string,
  options: {
    page?: number;
    limit?: number;
    pinned?: boolean;
    difficulty?: InterviewDifficulty;
    category?: string;
  } = {},
) {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });

  if (options.pinned !== undefined) {
    query.set("pinned", String(options.pinned));
  }
  if (options.difficulty) {
    query.set("difficulty", options.difficulty);
  }
  if (options.category) {
    query.set("category", options.category);
  }

  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions?${query}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function generateInterviewQuestions(
  sessionId: string,
  accessToken: string,
  payload: {
    requestId?: string;
    resumeVersionId?: string;
    count: number;
    categories: string[];
    difficultyMix?: {
      easy: number;
      medium: number;
      hard: number;
    };
  },
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions/generate`,
    {
      method: "POST",
      body: {
        ...payload,
        requestId: payload.requestId ?? crypto.randomUUID(),
      },
      authentication: "required",
      accessToken,
    },
  );
}

export function setQuestionPinned(
  sessionId: string,
  questionId: string,
  accessToken: string,
  isPinned: boolean,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions/${questionId}/pin`,
    {
      method: "PATCH",
      body: { isPinned },
      authentication: "required",
      accessToken,
    },
  );
}

export function saveQuestionNotes(
  sessionId: string,
  questionId: string,
  accessToken: string,
  notes: string,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions/${questionId}/notes`,
    {
      method: "PATCH",
      body: { notes },
      authentication: "required",
      accessToken,
    },
  );
}

export function requestQuestionExplanation(
  sessionId: string,
  questionId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions/${questionId}/explanation`,
    {
      method: "POST",
      authentication: "required",
      accessToken,
    },
  );
}

export function recordInterviewAttempt(
  sessionId: string,
  questionId: string,
  accessToken: string,
  answerText: string,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
    {
      method: "POST",
      body: { answerText },
      authentication: "required",
      accessToken,
    },
  );
}

export function requestAttemptFeedback(
  sessionId: string,
  attemptId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/attempts/${attemptId}/feedback`,
    {
      method: "POST",
      authentication: "required",
      accessToken,
    },
  );
}

export function listAttemptHistory(
  sessionId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return apiRequest<unknown>(
    `/interview-sessions/${sessionId}/attempts?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}
