import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestWithStatusMetadata } from "../../api/apiClient";
import {
  deleteFlashcardSet,
  deleteLearningConversation,
  deleteQuiz,
} from "./learningChildDeletionApi";

vi.mock("../../api/apiClient", async () => {
  const actual = await vi.importActual<typeof import("../../api/apiClient")>(
    "../../api/apiClient",
  );
  return {
    ...actual,
    requestWithStatusMetadata: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("learning child deletion API", () => {
  it.each([
    {
      label: "conversation",
      invoke: () => deleteLearningConversation("document-1", "conversation-1"),
      path: "/learning-documents/document-1/conversations/conversation-1",
      id: "conversation-1",
    },
    {
      label: "flashcard set",
      invoke: () => deleteFlashcardSet("set-1"),
      path: "/flashcard-sets/set-1",
      id: "set-1",
    },
    {
      label: "quiz",
      invoke: () => deleteQuiz("quiz-1"),
      path: "/quizzes/quiz-1",
      id: "quiz-1",
    },
  ])("deletes a $label through the authenticated DELETE contract", async ({ invoke, path, id }) => {
    vi.mocked(requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: { deleted: true, id },
    });

    await expect(invoke()).resolves.toEqual({ deleted: true, id });
    expect(requestWithStatusMetadata).toHaveBeenCalledWith(path, {
      method: "DELETE",
      authentication: "required",
      signal: undefined,
    });
  });

  it("rejects a malformed successful deletion response", async () => {
    vi.mocked(requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: { deleted: false, id: "quiz-1" },
    });

    await expect(deleteQuiz("quiz-1")).rejects.toEqual(
      expect.objectContaining({
        status: 502,
        code: "INVALID_LEARNING_RESPONSE",
      }),
    );
  });
});
