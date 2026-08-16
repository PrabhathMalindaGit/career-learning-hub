import {
  ApiError,
  requestWithStatusMetadata,
} from "../../api/apiClient";

export type LearningChildDeletionResult = {
  deleted: true;
  id: string;
};

function isDeletionResult(
  value: unknown,
  expectedId: string,
): value is LearningChildDeletionResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "deleted" in value &&
    value.deleted === true &&
    "id" in value &&
    value.id === expectedId
  );
}

async function requestDeletion(
  path: string,
  expectedId: string,
  signal?: AbortSignal,
): Promise<LearningChildDeletionResult> {
  const response = await requestWithStatusMetadata<unknown>(path, {
    method: "DELETE",
    authentication: "required",
    signal,
  });

  if (response.status !== 200 || !isDeletionResult(response.data, expectedId)) {
    throw new ApiError(
      502,
      "INVALID_LEARNING_RESPONSE",
      "The server returned an invalid learning response.",
      response.requestId,
    );
  }

  return response.data;
}

export function deleteLearningConversation(
  documentId: string,
  conversationId: string,
  signal?: AbortSignal,
) {
  return requestDeletion(
    `/learning-documents/${documentId}/conversations/${conversationId}`,
    conversationId,
    signal,
  );
}

export function deleteFlashcardSet(
  setId: string,
  signal?: AbortSignal,
) {
  return requestDeletion(`/flashcard-sets/${setId}`, setId, signal);
}

export function deleteQuiz(
  quizId: string,
  signal?: AbortSignal,
) {
  return requestDeletion(`/quizzes/${quizId}`, quizId, signal);
}
