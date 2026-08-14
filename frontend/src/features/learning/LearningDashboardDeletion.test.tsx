import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LearningDashboard } from "./LearningDashboard";
import * as learningApi from "./learningApi";
import type { LearningDocument } from "./types";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: "library-user-id",
      email: "library@example.test",
      profile: { displayName: "Library User" },
    },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchLearningJob: vi.fn(),
  listLearningDocuments: vi.fn(),
  uploadLearningDocument: vi.fn(),
}));

vi.mock("./learningPolling", () => ({
  pollLearningJob: vi.fn(),
}));

vi.mock("./LearningDocumentDeletion", () => ({
  LearningDocumentDeletion: ({
    document,
    onDeletionAccepted,
  }: {
    document: LearningDocument;
    onDeletionAccepted(): void;
  }) => (
    <button type="button" onClick={onDeletionAccepted}>
      Delete {document.title}
    </button>
  ),
}));

const createdAt = "2026-08-14T00:00:00.000Z";
const readyDocument: LearningDocument = {
  id: "507f1f77bcf86cd799439011",
  title: "Library deletion document",
  originalFilename: "library-deletion.pdf",
  mimeType: "application/pdf",
  status: "ready",
  pageCount: 3,
  chunkCount: 4,
  summaryKeyPoints: [],
  createdAt,
  updatedAt: createdAt,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(learningApi.listLearningDocuments)
    .mockResolvedValueOnce({
      documents: [readyDocument],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    })
    .mockResolvedValue({
      documents: [{ ...readyDocument, status: "deleting" }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });
});

describe("LearningDashboard deletion discoverability", () => {
  it("keeps Open workspace, accepts library deletion once, suppresses a duplicate trigger, and refreshes canonical state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LearningDashboard />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: "Open workspace" }),
    ).not.toBeNull();

    const deleteAction = screen.getByRole("button", {
      name: "Delete Library deletion document",
    });
    await user.click(deleteAction);

    expect(
      screen.queryByRole("button", {
        name: "Delete Library deletion document",
      }),
    ).toBeNull();

    await waitFor(() => {
      expect(learningApi.listLearningDocuments).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Deleting")).not.toBeNull();
  });
});
