import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Flashcard } from "./types";
import "./learningPhase19c.css";

interface FlashcardStudyProps {
  cards: Flashcard[];
  documentId: string;
  setId: string;
}

// Features 5.8.2–5.8.3 — Flashcard study experience.
// Keeps answer reveal explicit and provides bounded previous/next navigation
// plus source-page references for each stored card.
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
        <p>This set does not contain saved flashcards.</p>
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
            {/* Feature 5.8.3 UI — Reveal/hide flashcard answer. */}
            {revealed ? "Hide answer" : "Reveal answer"}
          </button>
        </div>

        <div
          id="learning-flashcard-answer"
          className={`learning-study-answer learning-study-answer--reserved${
            revealed ? "" : " learning-study-answer--hidden"
          }`}
          role={revealed ? "region" : undefined}
          aria-label={revealed ? "Flashcard answer" : undefined}
          aria-hidden={!revealed}
        >
          <p className="learning-study-label">Back · Answer</p>
          <p className="learning-study-content">{card.back}</p>
          {revealed && card.sourcePages.length > 0 ? (
            <div
              className="learning-source-pages"
              aria-label="Verified flashcard sources"
            >
              {card.sourcePages.map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setSelectedSourcePage(page)}
                >
                  View Page {page}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      {selectedSourcePage !== undefined ? (
        <aside className="learning-source-note" aria-live="polite">
          <p>
            Page {selectedSourcePage} supports this saved flashcard. Open the
            document workspace and choose Extracted Content to review the
            page-aware text.
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
