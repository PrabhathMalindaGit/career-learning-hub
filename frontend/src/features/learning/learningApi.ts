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
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
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

export function uploadLearningDocument(
  title: string,
  file: File,
  accessToken: string,
) {
  const form = new FormData();
  form.set("title", title);
  form.set("file", file);

  return request("/learning-documents/upload", accessToken, {
    method: "POST",
    body: form,
  });
}

export function listLearningDocuments(
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return request(
    `/learning-documents?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function fetchLearningDocument(
  documentId: string,
  accessToken: string,
) {
  return request(
    `/learning-documents/${documentId}`,
    accessToken,
  );
}

export function listDocumentChunks(
  documentId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return request(
    `/learning-documents/${documentId}/chunks?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function createLearningConversation(
  documentId: string,
  title: string,
  accessToken: string,
) {
  return request(
    `/learning-documents/${documentId}/conversations`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ title }),
    },
  );
}

export function sendLearningMessage(
  documentId: string,
  conversationId: string,
  content: string,
  accessToken: string,
  requestId = crypto.randomUUID(),
) {
  return request(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ requestId, content }),
    },
  );
}

export function listLearningMessages(
  documentId: string,
  conversationId: string,
  accessToken: string,
  page = 1,
  limit = 50,
) {
  return request(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function generateFlashcardSet(
  documentId: string,
  accessToken: string,
  payload: {
    title: string;
    count: number;
    focus?: string;
    requestId?: string;
  },
) {
  return request(
    `/learning-documents/${documentId}/flashcard-sets`,
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

export function listFlashcards(
  setId: string,
  accessToken: string,
  page = 1,
  limit = 50,
) {
  return request(
    `/flashcard-sets/${setId}/cards?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function generateQuiz(
  documentId: string,
  accessToken: string,
  payload: {
    title: string;
    questionCount: number;
    focus?: string;
    requestId?: string;
  },
) {
  return request(
    `/learning-documents/${documentId}/quizzes`,
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

export function fetchQuiz(
  quizId: string,
  accessToken: string,
) {
  return request(`/quizzes/${quizId}`, accessToken);
}

export function submitQuiz(
  quizId: string,
  accessToken: string,
  answers: Array<{
    questionIndex: number;
    selectedChoiceIndex: number;
  }>,
) {
  return request(`/quizzes/${quizId}/attempts`, accessToken, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function listQuizHistory(
  quizId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return request(
    `/quizzes/${quizId}/attempts?page=${page}&limit=${limit}`,
    accessToken,
  );
}

export function deleteLearningDocument(
  documentId: string,
  accessToken: string,
) {
  return request(
    `/learning-documents/${documentId}`,
    accessToken,
    { method: "DELETE" },
  );
}
