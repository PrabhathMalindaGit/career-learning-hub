import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { FlashcardStudy } from "./FlashcardStudy";
import type { Flashcard } from "./types";

const documentId = "507f1f77bcf86cd799439011";
const setId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";

const cards: Flashcard[] = [
  {
    id: "507f1f77bcf86cd799439013",
    cardIndex: 0,
    front: "What does **bounded** mean?",
    back: "<strong>It remains plain text.</strong>",
    sourcePages: [1, 3],
    createdAt,
  },
  {
    id: "507f1f77bcf86cd799439014",
    cardIndex: 1,
    front: "What is the second question?",
    back: "The second answer.",
    sourcePages: [],
    createdAt,
  },
];

function renderStudy(activeCards = cards, activeSetId = setId) {
  return render(
    <MemoryRouter>
      <FlashcardStudy
        cards={activeCards}
        documentId={documentId}
        setId={activeSetId}
      />
    </MemoryRouter>,
  );
}

describe("Flashcard study", () => {
  it("shows the canonical question with the answer hidden initially", () => {
    renderStudy();

    expect(screen.getByText("What does **bounded** mean?")).not.toBeNull();
    expect(screen.queryByText("<strong>It remains plain text.</strong>")).toBeNull();
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(document.querySelector("strong strong")).toBeNull();
  });

  it("reveals and hides the answer with explicit keyboard-operable controls", async () => {
    const user = userEvent.setup();
    renderStudy();

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Reveal answer" }),
    );
    await user.keyboard("{Enter}");
    expect(
      screen.getByText("<strong>It remains plain text.</strong>"),
    ).not.toBeNull();
    expect(document.querySelector("script")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hide answer" }));
    expect(screen.queryByText("<strong>It remains plain text.</strong>")).toBeNull();
  });

  it("enforces card boundaries and hides the answer on navigation", async () => {
    const user = userEvent.setup();
    renderStudy();
    const previous = screen.getByRole("button", {
      name: "Previous flashcard",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));
    await user.click(screen.getByRole("button", { name: "Next flashcard" }));

    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.getByText("What is the second question?")).not.toBeNull();
    expect(screen.queryByText("The second answer.")).toBeNull();
    expect(
      (screen.getByRole("button", {
        name: "Next flashcard",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows only canonical source-page controls and a factual source note", async () => {
    const user = userEvent.setup();
    renderStudy();
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));

    expect(screen.getByRole("button", { name: "Page 1" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Page 3" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Page 0" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    expect(
      screen.getByText(/Page 3 is a validated reference for this stored flashcard/),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Open document workspace" })
        .getAttribute("href"),
    ).toBe(`/learning/documents/${documentId}`);
  });

  it("resets position and reveal state when the set changes without storage writes", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    const view = renderStudy();
    await user.click(screen.getByRole("button", { name: "Next flashcard" }));
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));

    view.rerender(
      <MemoryRouter>
        <FlashcardStudy
          cards={[cards[0]!]}
          documentId={documentId}
          setId="507f1f77bcf86cd799439099"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Card 1 of 1")).not.toBeNull();
    expect(screen.queryByText("<strong>It remains plain text.</strong>")).toBeNull();
    expect(storageWrite).not.toHaveBeenCalled();
    storageWrite.mockRestore();
  });
});
