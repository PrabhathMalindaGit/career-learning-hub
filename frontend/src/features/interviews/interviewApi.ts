import type {
  CreateInterviewSessionInput,
  InterviewDifficulty,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ??
        `Request failed with HTTP ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function createInterviewSession(
  accessToken: string,
  payload: CreateInterviewSessionInput,
) {
  return request("/interview-sessions", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listInterviewSessions(
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return request(
    `/interview-sessions?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function fetchInterviewSession(
  sessionId: string,
  accessToken: string,
) {
  return request(
    `/interview-sessions/${sessionId}`,
    accessToken,
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

  return request(
    `/interview-sessions/${sessionId}/questions?${query}`,
    accessToken,
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
  return request(
    `/interview-sessions/${sessionId}/questions/generate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        requestId: payload.requestId ?? crypto.randomUUID(),
      }),
    },
  );
}

export function setQuestionPinned(
  sessionId: string,
  questionId: string,
  accessToken: string,
  isPinned: boolean,
) {
  return request(
    `/interview-sessions/${sessionId}/questions/${questionId}/pin`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ isPinned }),
    },
  );
}

export function saveQuestionNotes(
  sessionId: string,
  questionId: string,
  accessToken: string,
  notes: string,
) {
  return request(
    `/interview-sessions/${sessionId}/questions/${questionId}/notes`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    },
  );
}

export function requestQuestionExplanation(
  sessionId: string,
  questionId: string,
  accessToken: string,
) {
  return request(
    `/interview-sessions/${sessionId}/questions/${questionId}/explanation`,
    accessToken,
    { method: "POST" },
  );
}

export function recordInterviewAttempt(
  sessionId: string,
  questionId: string,
  accessToken: string,
  answerText: string,
) {
  return request(
    `/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ answerText }),
    },
  );
}

export function requestAttemptFeedback(
  sessionId: string,
  attemptId: string,
  accessToken: string,
) {
  return request(
    `/interview-sessions/${sessionId}/attempts/${attemptId}/feedback`,
    accessToken,
    { method: "POST" },
  );
}

export function listAttemptHistory(
  sessionId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return request(
    `/interview-sessions/${sessionId}/attempts?page=${page}&limit=${limit}`,
    accessToken,
  );
}
