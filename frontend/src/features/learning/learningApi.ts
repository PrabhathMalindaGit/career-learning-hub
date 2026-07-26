import {
  ApiError,
  apiRequest,
  requestWithMetadata,
  requestWithStatusMetadata,
} from "../../api/apiClient";
import {
  parseDocumentChunks,
  parseFlashcardList,
  parseFlashcardSetAcceptance,
  parseFlashcardSetDetail,
  parseFlashcardSetList,
  parseLearningChatJob,
  parseLearningConversationCreate,
  parseLearningConversationList,
  parseLearningDocumentDetail,
  parseLearningDocumentList,
  parseLearningFlashcardJob,
  parseLearningJob,
  parseLearningMessageAcceptance,
  parseLearningMessageList,
  parseLearningSource,
  parseLearningUpload,
} from "./learningContracts";
import {
  parseLearningQuizJob,
  parseQuizAttemptDetail,
  parseQuizAttemptList,
  parseQuizGenerationAcceptance,
  parseQuizList,
  parseQuizSubmission,
  parseQuizTakingDetail,
} from "./learningQuizContracts";
import type {
  LearningDocumentStatus,
  QuizAnswerSelection,
  QuizQuestionForTaking,
} from "./types";

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

export async function createFlashcardSet(
  documentId: string,
  payload: {
    title: string;
    count: number;
    focus?: string;
    requestId: string;
  },
  signal?: AbortSignal,
) {
  const response = await requestWithStatusMetadata<unknown>(
    `/learning-documents/${documentId}/flashcard-sets`,
    {
      method: "POST",
      body: payload,
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
    ...parseFlashcardSetAcceptance(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listFlashcardSets(
  documentId: string,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 10, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/flashcard-sets?documentId=${documentId}&page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseFlashcardSetList(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchFlashcardSet(
  documentId: string,
  setId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(
    `/flashcard-sets/${setId}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseFlashcardSetDetail(response.data, { documentId, setId }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listLearningFlashcards(
  setId: string,
  pageCount: number,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 100, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/flashcard-sets/${setId}/cards?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseFlashcardList(response.data, { pageCount }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchLearningFlashcardJob(
  jobId: string,
  setId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    signal,
  });
  return parseLearningFlashcardJob(response.data, { jobId, setId });
}

export async function createQuizGeneration(
  documentId: string,
  payload: {
    title: string;
    questionCount: number;
    focus?: string;
    requestId: string;
  },
  signal?: AbortSignal,
) {
  const response = await requestWithStatusMetadata<unknown>(
    `/learning-documents/${documentId}/quizzes`,
    {
      method: "POST",
      body: payload,
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
    ...parseQuizGenerationAcceptance(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listQuizzes(
  documentId: string,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 10, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/quizzes?documentId=${documentId}&page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseQuizList(response.data, documentId),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchQuizForTaking(
  documentId: string,
  quizId: string,
  pageCount: number,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(
    `/quizzes/${quizId}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseQuizTakingDetail(response.data, {
      documentId,
      quizId,
      pageCount,
    }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchLearningQuizJob(
  jobId: string,
  quizId: string,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    signal,
  });
  return parseLearningQuizJob(response.data, { jobId, quizId });
}

export async function submitQuizAttempt(
  documentId: string,
  quizId: string,
  takingQuestions: QuizQuestionForTaking[],
  answers: QuizAnswerSelection[],
  pageCount: number,
  signal?: AbortSignal,
) {
  const canonicalAnswers = [...answers].sort(
    (left, right) => left.questionIndex - right.questionIndex,
  );
  const response = await requestWithStatusMetadata<unknown>(
    `/quizzes/${quizId}/attempts`,
    {
      method: "POST",
      body: { answers: canonicalAnswers },
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
    ...parseQuizSubmission(response.data, {
      documentId,
      quizId,
      takingQuestions,
      submittedAnswers: canonicalAnswers,
      pageCount,
    }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function listQuizAttempts(
  documentId: string,
  quizId: string,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const page = boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(input.limit, 10, 1, 100);
  const response = await requestWithMetadata<unknown>(
    `/quizzes/${quizId}/attempts?page=${page}&limit=${limit}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseQuizAttemptList(response.data, { documentId, quizId }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
}

export async function fetchQuizAttemptReview(
  documentId: string,
  quizId: string,
  attemptId: string,
  pageCount: number,
  signal?: AbortSignal,
) {
  const response = await requestWithMetadata<unknown>(
    `/quizzes/${quizId}/attempts/${attemptId}`,
    {
      authentication: "required",
      signal,
    },
  );
  return {
    ...parseQuizAttemptDetail(response.data, {
      documentId,
      quizId,
      attemptId,
      pageCount,
    }),
    ...(response.requestId === undefined
      ? {}
      : { requestId: response.requestId }),
  };
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
