import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { FlashcardStudy } from "./FlashcardStudy";
import type { Flashcard } from "./types";

const documentId = "507f1f77bcf86cd799439011";
const setId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";
const learningWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/learning/learningWorkspace.css"),
  "utf8",
);
const phase19cCss = readFileSync(
  resolve(process.cwd(), "src/features/learning/learningPhase19c.css"),
  "utf8",
);

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
  it("reserves the saved answer area while keeping it inaccessible initially", () => {
    renderStudy();

    expect(
      screen.getByRole("article", { name: "Flashcard 1 question" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("progressbar", { name: "Flashcard study progress" }),
    ).toHaveProperty("value", 1);
    expect(screen.getByText("What does **bounded** mean?")).not.toBeNull();
    const answer = document.getElementById("learning-flashcard-answer");
    expect(answer?.getAttribute("aria-hidden")).toBe("true");
    expect(answer?.classList.contains("learning-study-answer--hidden")).toBe(true);
    expect(screen.queryByRole("region", { name: "Flashcard answer" })).toBeNull();
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
      screen
        .getByRole("button", { name: "Hide answer" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      screen.getByRole("region", { name: "Flashcard answer" }),
    ).not.toBeNull();
    expect(
      screen.getByText("<strong>It remains plain text.</strong>"),
    ).not.toBeNull();
    expect(document.querySelector("script")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hide answer" }));
    const answer = document.getElementById("learning-flashcard-answer");
    expect(answer?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("region", { name: "Flashcard answer" })).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Reveal answer" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("enforces card boundaries and hides the answer on navigation", async () => {
    const user = userEvent.setup();
    renderStudy();
    const previous = screen.getByRole("button", {
      name: "Previous flashcard",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    expect(screen.getByText("Beginning of set")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));
    await user.click(screen.getByRole("button", { name: "Next flashcard" }));

    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.getByText("What is the second question?")).not.toBeNull();
    expect(document.getElementById("learning-flashcard-answer")?.getAttribute("aria-hidden")).toBe("true");
    expect(
      (screen.getByRole("button", {
        name: "Next flashcard",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText("End of set")).not.toBeNull();
  });

  it("shows only verified source-page controls with actionable labels", async () => {
    const user = userEvent.setup();
    renderStudy();
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));

    expect(screen.getByRole("button", { name: "View Page 1" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "View Page 3" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "View Page 0" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "View Page 3" }));
    expect(
      screen.getByText(/Page 3 supports this saved flashcard/),
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
    expect(document.getElementById("learning-flashcard-answer")?.getAttribute("aria-hidden")).toBe("true");
    expect(storageWrite).not.toHaveBeenCalled();
    storageWrite.mockRestore();
  });

  it("defines stable reveal, responsive wrapping, and reduced-motion safeguards", () => {
    expect(phase19cCss).toContain(".learning-study-answer--reserved");
    expect(phase19cCss).toContain(".learning-study-answer--hidden");
    expect(phase19cCss).toContain("visibility: hidden");
    expect(learningWorkspaceCss).toMatch(
      /\.learning-flashcard-set-list[\s\S]*minmax\(min\(100%, 270px\), 1fr\)/,
    );
    expect(learningWorkspaceCss).toMatch(
      /\.learning-review-answers dd[\s\S]*overflow-wrap: anywhere/,
    );
    const reducedMotionRule = learningWorkspaceCss.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1];
    expect(reducedMotionRule).toContain(".learning-study-card");
    expect(reducedMotionRule).toContain(".learning-quiz-stage");
    expect(reducedMotionRule).toContain(".learning-collection-card");
  });
});
