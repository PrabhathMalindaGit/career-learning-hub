import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { LearningChildDeletion } from "./LearningChildDeletion";
import * as deletionApi from "./learningChildDeletionApi";

vi.mock("./learningChildDeletionApi", () => ({
  deleteLearningConversation: vi.fn(),
  deleteFlashcardSet: vi.fn(),
  deleteQuiz: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(deletionApi.deleteLearningConversation).mockResolvedValue({
    deleted: true,
    id: "conversation-1",
  });
  vi.mocked(deletionApi.deleteFlashcardSet).mockResolvedValue({
    deleted: true,
    id: "set-1",
  });
  vi.mocked(deletionApi.deleteQuiz).mockResolvedValue({
    deleted: true,
    id: "quiz-1",
  });
});

async function openDelete(label: string) {
  const trigger = screen.getByRole("button", {
    name: `More actions for ${label}`,
  });
  await userEvent.click(trigger);
  return trigger;
}

describe("LearningChildDeletion", () => {
  it("confirms conversation deletion, describes its cascade, and returns the deleted id", async () => {
    const onDeleted = vi.fn();
    render(
      <LearningChildDeletion
        kind="conversation"
        id="conversation-1"
        documentId="document-1"
        title="REST questions"
        onDeleted={onDeleted}
      />,
    );

    await openDelete("REST questions");
    await userEvent.click(
      screen.getByRole("button", { name: "Delete conversation" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Delete “REST questions”?",
    });
    expect(dialog.textContent).toMatch(/conversation and all messages/i);
    expect(dialog.textContent).toMatch(/cannot be undone/i);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    await waitFor(() =>
      expect(deletionApi.deleteLearningConversation).toHaveBeenCalledWith(
        "document-1",
        "conversation-1",
        expect.any(AbortSignal),
      ),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("conversation-1"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels without deleting and returns focus to the More actions trigger", async () => {
    render(
      <LearningChildDeletion
        kind="flashcard-set"
        id="set-1"
        title="REST cards"
        onDeleted={vi.fn()}
      />,
    );

    const trigger = await openDelete("REST cards");
    await userEvent.click(
      screen.getByRole("button", { name: "Delete flashcard set" }),
    );
    expect(screen.getByRole("dialog").textContent).toMatch(/set and all cards/i);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deletionApi.deleteFlashcardSet).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("deletes a quiz through the quiz endpoint and explains that attempts are removed", async () => {
    const onDeleted = vi.fn();
    render(
      <LearningChildDeletion
        kind="quiz"
        id="quiz-1"
        title="REST quiz"
        onDeleted={onDeleted}
      />,
    );

    await openDelete("REST quiz");
    await userEvent.click(screen.getByRole("button", { name: "Delete quiz" }));
    expect(screen.getByRole("dialog").textContent).toMatch(
      /quiz, its questions, and saved attempts/i,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    await waitFor(() =>
      expect(deletionApi.deleteQuiz).toHaveBeenCalledWith(
        "quiz-1",
        expect.any(AbortSignal),
      ),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("quiz-1"));
  });

  it("keeps a failed resource visible and exposes the safe Request ID", async () => {
    vi.mocked(deletionApi.deleteFlashcardSet).mockRejectedValue(
      new ApiError(
        409,
        "FLASHCARD_SET_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current flashcard generation before deleting this set.",
        "request-delete-1234",
      ),
    );
    const onDeleted = vi.fn();
    render(
      <LearningChildDeletion
        kind="flashcard-set"
        id="set-1"
        title="Busy cards"
        onDeleted={onDeleted}
      />,
    );

    await openDelete("Busy cards");
    await userEvent.click(
      screen.getByRole("button", { name: "Delete flashcard set" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Finish or cancel the current flashcard generation before deleting this set.",
    );
    expect(alert.textContent).toContain("Request ID: request-delete-1234");
    expect(onDeleted).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("disables destructive selection while a generated resource is still busy", async () => {
    render(
      <LearningChildDeletion
        kind="quiz"
        id="quiz-1"
        title="Generating quiz"
        disabled
        onDeleted={vi.fn()}
      />,
    );

    await openDelete("Generating quiz");
    expect(
      (screen.getByRole("button", { name: "Delete quiz" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
