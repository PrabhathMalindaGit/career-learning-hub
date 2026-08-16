import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentConversations } from "./DocumentConversations";
import * as deletionApi from "./learningChildDeletionApi";
import * as learningApi from "./learningApi";
import type { LearningDocument } from "./types";

vi.mock("./learningApi", () => ({
  createLearningConversation: vi.fn(),
  listLearningConversations: vi.fn(),
}));
vi.mock("./learningChildDeletionApi", () => ({
  deleteLearningConversation: vi.fn(),
  deleteFlashcardSet: vi.fn(),
  deleteQuiz: vi.fn(),
}));

const document: LearningDocument = {
  id: "507f1f77bcf86cd799439011",
  title: "REST notes",
  originalFilename: "rest.pdf",
  mimeType: "application/pdf",
  status: "ready",
  pageCount: 2,
  chunkCount: 1,
  summaryKeyPoints: [],
  createdAt: "2026-08-16T01:00:00.000Z",
  updatedAt: "2026-08-16T01:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(deletionApi.deleteLearningConversation).mockResolvedValue({
    deleted: true,
    id: "507f1f77bcf86cd799439012",
  });
});

describe("DocumentConversations child deletion", () => {
  it("keeps Open conversation primary and refreshes the list after confirmed deletion", async () => {
    vi.mocked(learningApi.listLearningConversations)
      .mockResolvedValueOnce({
        conversations: [
          {
            id: "507f1f77bcf86cd799439012",
            documentId: document.id,
            title: "REST questions",
            messageCount: 2,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      })
      .mockResolvedValueOnce({
        conversations: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });

    render(
      <MemoryRouter>
        <DocumentConversations accountId="account-a" document={document} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: /Open REST questions conversation/i }),
    ).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "More actions for REST questions" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete conversation" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    await waitFor(() =>
      expect(deletionApi.deleteLearningConversation).toHaveBeenCalledWith(
        document.id,
        "507f1f77bcf86cd799439012",
        expect.any(AbortSignal),
      ),
    );
    await waitFor(() =>
      expect(learningApi.listLearningConversations).toHaveBeenCalledTimes(2),
    );
    expect(await screen.findByText("No conversations yet.")).toBeTruthy();
  });
});
