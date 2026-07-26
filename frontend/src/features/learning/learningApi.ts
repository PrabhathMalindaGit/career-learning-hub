import {
  ApiError,
  apiRequest,
  requestWithMetadata,
  requestWithStatusMetadata,
} from "../../api/apiClient";
import {
  parseDocumentChunks,
  parseLearningChatJob,
  parseLearningConversationCreate,
  parseLearningConversationList,
  parseLearningDocumentDetail,
  parseLearningDocumentList,
  parseLearningJob,
  parseLearningMessageAcceptance,
  parseLearningMessageList,
  parseLearningSource,
  parseLearningUpload,
} from "./learningContracts";
import type { LearningDocumentStatus } from "./types";

export async function uploadLearningDocument(
  title: string,
  file: File,
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.set("title", title);
  form.set("file", file);

  const response = await requestWithStatusMetadata<unknown>(
    "/learning-documents/upload",
    {
    method: "POST",
    body: form,
    authentication: "required",
      signal,
    },
  );
  if (response.status !== 202) {
    throw new ApiError(
      502,
      "INVALID_LEARNING_RESPONSE",
      "The server returned an invalid learning response.",
      response.requestId,
    );
  }
  return {
    ...parseLearningUpload(response.data),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

export async function listLearningDocuments(
  input: {
    page?: number;
    limit?: number;
    status?: LearningDocumentStatus;
  } = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER)),
    limit: String(boundedInteger(input.limit, 20, 1, 100)),
  });
  if (input.status) query.set("status", input.status);
  const response = await requestWithMetadata<unknown>(
    `/learning-documents?${query.toString()}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseLearningDocumentList(response.data),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchLearningDocument(
  documentId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(
    `/learning-documents/${documentId}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseLearningDocumentDetail(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listDocumentChunks(
  documentId: string,
  pageCount: number,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 20, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/learning-documents/${documentId}/chunks?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseDocumentChunks(response.data, { pageCount }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchLearningJob(
  jobId: string,
  documentId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    signal,
  });
  return parseLearningJob(response.data, {
    expectedJobId: jobId,
    expectedDocumentId: documentId,
  });
}

export async function fetchLearningDocumentSource(
  documentId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(
    `/learning-documents/${documentId}/source`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseLearningSource(response.data),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function createLearningConversation(
  documentId: string,
  title: string,
  signal?: AbortSignal,
) {
  const response = await requestWithStatusMetadata<unknown>(
    `/learning-documents/${documentId}/conversations`,
    {
      method: "POST",
      body: { title },
      authentication: "required",
      signal,
    },
  );
  if (response.status !== 201) {
    throw new ApiError(
      502,
      "INVALID_LEARNING_RESPONSE",
      "The server returned an invalid learning response.",
      response.requestId,
    );
  }
  return {
    ...parseLearningConversationCreate(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listLearningConversations(
  documentId: string,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 10, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/learning-documents/${documentId}/conversations?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseLearningConversationList(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function sendLearningMessage(
  documentId: string,
  conversationId: string,
  content: string,
  requestId: string,
  pageCount: number,
  signal?: AbortSignal,
) {
  const response = await requestWithStatusMetadata<unknown>(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: { requestId, content },
      authentication: "required",
      signal,
    },
  );
  if (response.status !== 202) {
    throw new ApiError(
      502,
      "INVALID_LEARNING_RESPONSE",
      "The server returned an invalid learning response.",
      response.requestId,
    );
  }
  return {
    ...parseLearningMessageAcceptance(response.data, {
      documentId,
      conversationId,
      pageCount,
    }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listLearningMessages(
  documentId: string,
  conversationId: string,
  pageCount: number,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 20, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/learning-documents/${documentId}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseLearningMessageList(response.data, {
      documentId,
      conversationId,
      pageCount,
    }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchLearningChatJob(
  jobId: string,
  pageCount: number,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    signal,
  });
  return parseLearningChatJob(response.data, { jobId, pageCount });
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
