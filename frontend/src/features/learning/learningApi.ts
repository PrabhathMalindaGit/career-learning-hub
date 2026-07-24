import { apiRequest } from "../../api/apiClient";

export function uploadLearningDocument(
  title: string,
  file: File,
  accessToken: string,
) {
  const form = new FormData();
  form.set("title", title);
  form.set("file", file);

  return apiRequest<unknown>("/learning-documents/upload", {
    method: "POST",
    body: form,
    authentication: "required",
    accessToken,
  });
}

export function listLearningDocuments(
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return apiRequest<unknown>(
    `/learning-documents?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchLearningDocument(
  documentId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/learning-documents/${documentId}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function listDocumentChunks(
  documentId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/chunks?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function createLearningConversation(
  documentId: string,
  title: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/conversations`,
    {
      method: "POST",
      body: { title },
      authentication: "required",
      accessToken,
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
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: { requestId, content },
      authentication: "required",
      accessToken,
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
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
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
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/flashcard-sets`,
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

export function listFlashcards(
  setId: string,
  accessToken: string,
  page = 1,
  limit = 50,
) {
  return apiRequest<unknown>(
    `/flashcard-sets/${setId}/cards?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
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
  return apiRequest<unknown>(
    `/learning-documents/${documentId}/quizzes`,
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

export function fetchQuiz(
  quizId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(`/quizzes/${quizId}`, {
    authentication: "required",
    accessToken,
  });
}

export function submitQuiz(
  quizId: string,
  accessToken: string,
  answers: Array<{
    questionIndex: number;
    selectedChoiceIndex: number;
  }>,
) {
  return apiRequest<unknown>(`/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: { answers },
    authentication: "required",
    accessToken,
  });
}

export function listQuizHistory(
  quizId: string,
  accessToken: string,
  page = 1,
  limit = 20,
) {
  return apiRequest<unknown>(
    `/quizzes/${quizId}/attempts?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function deleteLearningDocument(
  documentId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/learning-documents/${documentId}`,
    {
      method: "DELETE",
      authentication: "required",
      accessToken,
    },
  );
}
