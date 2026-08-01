import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Flashcard } from "./types";

interface FlashcardStudyProps {
  cards: Flashcard[];
  documentId: string;
  setId: string;
}

export function FlashcardStudy({
  cards,
  documentId,
  setId,
}: FlashcardStudyProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedSourcePage, setSelectedSourcePage] = useState<number>();
  const card = cards[index];

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
    setSelectedSourcePage(undefined);
  }, [setId]);

  const move = (nextIndex: number) => {
    setIndex(nextIndex);
    setRevealed(false);
    setSelectedSourcePage(undefined);
  };

  if (!card) {
    return (
      <div className="learning-state learning-state--compact">
        <h2>No flashcards available</h2>
        <p>This set does not contain canonical stored flashcards.</p>
      </div>
    );
  }

  return (
    <section
      className="learning-flashcard-study"
      aria-labelledby="flashcard-study-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Current session</p>
          <h2 id="flashcard-study-title">Study flashcards</h2>
        </div>
        <p className="learning-card-position" aria-live="polite">
          Card {index + 1} of {cards.length}
        </p>
      </header>

      <progress
        className="learning-study-progress"
        aria-label="Flashcard study progress"
        max={cards.length}
        value={index + 1}
      />

      <article
        className="learning-study-card"
        aria-label={`Flashcard ${index + 1} question`}
      >
        <p className="learning-study-label">Front · Question</p>
        <p className="learning-study-content">{card.front}</p>

        <div className="learning-study-reveal">
          <button
            type="button"
            className="learning-primary-button"
            aria-controls="learning-flashcard-answer"
            aria-expanded={revealed}
            onClick={() => {
              setRevealed((current) => !current);
              setSelectedSourcePage(undefined);
            }}
          >
            {revealed ? "Hide answer" : "Reveal answer"}
          </button>
        </div>

        {revealed ? (
          <div
            id="learning-flashcard-answer"
            className="learning-study-answer"
            role="region"
            aria-label="Flashcard answer"
          >
            <p className="learning-study-label">Back · Answer</p>
            <p className="learning-study-content">{card.back}</p>
            {card.sourcePages.length > 0 ? (
              <div
                className="learning-source-pages"
                aria-label="Validated flashcard source pages"
              >
                {card.sourcePages.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setSelectedSourcePage(page)}
                  >
                    Page {page}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {selectedSourcePage !== undefined ? (
        <aside className="learning-source-note" aria-live="polite">
          <p>
            Page {selectedSourcePage} is a validated reference for this
            stored flashcard. Review the document’s Extracted Content view
            for the authoritative page-aware text.
          </p>
          <Link
            className="learning-back-link"
            to={`/learning/documents/${documentId}`}
          >
            Open document workspace
          </Link>
        </aside>
      ) : null}

      <nav
        className="learning-study-navigation"
        aria-label="Flashcard navigation"
      >
        <button
          type="button"
          className="learning-secondary-button"
          aria-label="Previous flashcard"
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          Previous
        </button>
        <div className="learning-study-boundary" aria-live="polite">
          <span aria-hidden="true">
            {index + 1} / {cards.length}
          </span>
          <small>
            {cards.length === 1
              ? "Only card in set"
              : index === 0
                ? "Beginning of set"
                : index === cards.length - 1
                  ? "End of set"
                  : "Continue studying"}
          </small>
        </div>
        <button
          type="button"
          className="learning-secondary-button"
          aria-label="Next flashcard"
          disabled={index >= cards.length - 1}
          onClick={() => move(index + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
