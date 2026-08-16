import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentFlashcards } from "./DocumentFlashcards";
import { DocumentQuizzes } from "./DocumentQuizzes";
import * as learningApi from "./learningApi";
import type { LearningDocument } from "./types";

vi.mock("./learningApi", () => ({
  createFlashcardSet: vi.fn(),
  fetchFlashcardSet: vi.fn(),
  fetchLearningFlashcardJob: vi.fn(),
  listFlashcardSets: vi.fn(),
  listLearningFlashcards: vi.fn(),
  createQuizGeneration: vi.fn(),
  fetchLearningQuizJob: vi.fn(),
  fetchQuizForTaking: vi.fn(),
  listQuizzes: vi.fn(),
}));

vi.mock("./LearningChildDeletion", () => ({
  LearningChildDeletion: ({
    kind,
    id,
    title,
    disabled,
    onDeleted,
  }: {
    kind: string;
    id: string;
    title: string;
    disabled?: boolean;
    onDeleted(id: string): void;
  }) => (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Delete control ${kind} ${title}`}
      onClick={() => onDeleted(id)}
    >
      Delete control
    </button>
  ),
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
});

describe("Learning collection child deletion placement", () => {
  it("keeps Study set primary, wires deletion, and disables deletion for generating sets", async () => {
    vi.mocked(learningApi.listFlashcardSets)
      .mockResolvedValueOnce({
        sets: [
          {
            id: "507f1f77bcf86cd799439012",
            documentId: document.id,
            title: "Ready cards",
            status: "ready",
            cardCount: 2,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
          {
            id: "507f1f77bcf86cd799439013",
            documentId: document.id,
            title: "Generating cards",
            status: "generating",
            cardCount: 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
        ],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      })
      .mockResolvedValueOnce({
        sets: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });

    render(
      <MemoryRouter>
        <DocumentFlashcards accountId="account-a" document={document} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /Study Ready cards/i })).toBeTruthy();
    const readyDelete = screen.getByRole("button", {
      name: "Delete control flashcard-set Ready cards",
    });
    const generatingDelete = screen.getByRole("button", {
      name: "Delete control flashcard-set Generating cards",
    }) as HTMLButtonElement;
    expect(generatingDelete.disabled).toBe(true);

    await userEvent.click(readyDelete);
    await waitFor(() => expect(learningApi.listFlashcardSets).toHaveBeenCalledTimes(2));
  });

  it("keeps Take quiz primary, wires deletion, and disables deletion for generating quizzes", async () => {
    vi.mocked(learningApi.listQuizzes)
      .mockResolvedValueOnce({
        quizzes: [
          {
            id: "507f1f77bcf86cd799439014",
            documentId: document.id,
            title: "Ready quiz",
            status: "ready",
            questionCount: 2,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
          {
            id: "507f1f77bcf86cd799439015",
            documentId: document.id,
            title: "Generating quiz",
            status: "generating",
            questionCount: 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
        ],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      })
      .mockResolvedValueOnce({
        quizzes: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });

    render(
      <MemoryRouter>
        <DocumentQuizzes accountId="account-a" document={document} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /Take Ready quiz/i })).toBeTruthy();
    const readyDelete = screen.getByRole("button", {
      name: "Delete control quiz Ready quiz",
    });
    const generatingDelete = screen.getByRole("button", {
      name: "Delete control quiz Generating quiz",
    }) as HTMLButtonElement;
    expect(generatingDelete.disabled).toBe(true);

    await userEvent.click(readyDelete);
    await waitFor(() => expect(learningApi.listQuizzes).toHaveBeenCalledTimes(2));
  });
});
