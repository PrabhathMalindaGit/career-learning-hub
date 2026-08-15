import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LearningDocumentDeletion } from "./LearningDocumentDeletion";
import type { LearningDocument } from "./types";

vi.mock("./learningApi", () => ({
  fetchLearningDocument: vi.fn(),
  fetchLearningDocumentDeletionJob: vi.fn(),
  requestLearningDocumentDeletion: vi.fn(),
}));

vi.mock("./learningPolling", () => ({
  pollLearningJob: vi.fn(),
}));

const createdAt = "2026-08-14T00:00:00.000Z";

function documentFixture(id: string, title: string): LearningDocument {
  return {
    id,
    title,
    originalFilename: `${title}.pdf`,
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 1,
    chunkCount: 1,
    summaryKeyPoints: [],
    createdAt,
    updatedAt: createdAt,
  };
}

describe("LearningDocumentDeletion library embedding", () => {
  it("uses unique accessible dialog heading identities for multiple documents", () => {
    render(
      <MemoryRouter>
        <LearningDocumentDeletion
          accountId="account-a"
          document={documentFixture(
            "507f1f77bcf86cd799439011",
            "Document one",
          )}
          onDeletionAccepted={vi.fn()}
        />
        <LearningDocumentDeletion
          accountId="account-a"
          document={documentFixture(
            "507f1f77bcf86cd799439012",
            "Document two",
          )}
          onDeletionAccepted={vi.fn()}
        />
      </MemoryRouter>,
    );

    const dialogs = Array.from(document.querySelectorAll("dialog"));
    expect(dialogs).toHaveLength(2);

    const labelledBy = dialogs.map((dialog) =>
      dialog.getAttribute("aria-labelledby"),
    );
    expect(new Set(labelledBy).size).toBe(2);
    expect(labelledBy).toEqual([
      "learning-deletion-title-507f1f77bcf86cd799439011",
      "learning-deletion-title-507f1f77bcf86cd799439012",
    ]);

    for (const id of labelledBy) {
      expect(id).not.toBeNull();
      expect(document.getElementById(id!)).not.toBeNull();
    }
  });

  it("closes the first document overflow when another record is activated", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LearningDocumentDeletion
          accountId="account-a"
          document={documentFixture(
            "507f1f77bcf86cd799439011",
            "Document one",
          )}
          onDeletionAccepted={vi.fn()}
        />
        <LearningDocumentDeletion
          accountId="account-a"
          document={documentFixture(
            "507f1f77bcf86cd799439012",
            "Document two",
          )}
          onDeletionAccepted={vi.fn()}
        />
      </MemoryRouter>,
    );

    const first = screen.getByRole("button", {
      name: "More actions for Document one",
    });
    const second = screen.getByRole("button", {
      name: "More actions for Document two",
    });

    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    await user.click(second);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("button", { name: "Delete document" })).toHaveLength(1);
  });
});
