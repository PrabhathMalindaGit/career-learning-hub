import { useState } from "react";
import type { Flashcard } from "./types";

interface FlashcardStudyProps {
  cards: Flashcard[];
}

export function FlashcardStudy({
  cards,
}: FlashcardStudyProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];

  const move = (nextIndex: number) => {
    setIndex(nextIndex);
    setRevealed(false);
  };

  return (
    <section
      className="learning-panel"
      aria-labelledby="flashcard-study-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Recall</p>
          <h3 id="flashcard-study-title">Flashcard study</h3>
        </div>
        <span className="learning-chip">
          {cards.length === 0 ? "0" : `${index + 1}/${cards.length}`}
        </span>
      </header>

      {!card ? (
        <div className="learning-empty-state">
          Generate a flashcard set from a ready document.
        </div>
      ) : (
        <>
          <button
            type="button"
            className="learning-flashcard"
            onClick={() => setRevealed((current) => !current)}
          >
            <span>{revealed ? "Answer" : "Question"}</span>
            <strong>{revealed ? card.back : card.front}</strong>
            <small>
              {revealed
                ? `Source pages: ${card.sourcePages.join(", ") || "not cited"}`
                : "Select to reveal"}
            </small>
          </button>

          <div className="learning-action-row">
            <button
              type="button"
              className="learning-secondary-button"
              disabled={index === 0}
              onClick={() => move(index - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="learning-secondary-button"
              disabled={index >= cards.length - 1}
              onClick={() => move(index + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
