import { useEffect, useState } from "react";
import type { InterviewQuestion } from "./types";

interface QuestionPracticeProps {
  question?: InterviewQuestion;
  onPin?(isPinned: boolean): void;
  onSaveNotes?(notes: string): void;
  onSubmitAnswer?(answerText: string): void;
  onRequestExplanation?(): void;
  busy?: boolean;
}

export function QuestionPractice({
  question,
  onPin,
  onSaveNotes,
  onSubmitAnswer,
  onRequestExplanation,
  busy = false,
}: QuestionPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [notes, setNotes] = useState(question?.userNotes ?? "");

  useEffect(() => {
    setAnswer("");
    setNotes(question?.userNotes ?? "");
  }, [question?._id, question?.userNotes]);

  return (
    <section
      className="interview-panel interview-practice"
      aria-labelledby="question-practice-title"
    >
      <header className="interview-panel-header">
        <div>
          <p className="interview-kicker">Practice</p>
          <h3 id="question-practice-title">
            {question?.category ?? "Select a question"}
          </h3>
        </div>
        {question && (
          <span className="interview-chip">
            {question.difficulty}
          </span>
        )}
      </header>

      {!question ? (
        <div className="interview-empty-state">
          Choose a generated or manual question to begin.
        </div>
      ) : (
        <>
          <div className="interview-question-card">
            <p>{question.question}</p>
            <button
              type="button"
              className="interview-secondary-button"
              onClick={() => onPin?.(!question.isPinned)}
            >
              {question.isPinned ? "Unpin" : "Pin question"}
            </button>
          </div>

          <label className="interview-answer-field">
            Your written answer
            <textarea
              rows={9}
              maxLength={12_000}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
          </label>

          <div className="interview-action-row">
            <button
              type="button"
              className="interview-primary-button"
              disabled={busy || answer.trim().length === 0}
              onClick={() => onSubmitAnswer?.(answer)}
            >
              Record attempt
            </button>
            <button
              type="button"
              className="interview-secondary-button"
              disabled={busy}
              onClick={onRequestExplanation}
            >
              Explain question
            </button>
          </div>

          <label className="interview-answer-field">
            Private notes
            <textarea
              rows={4}
              maxLength={8_000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => onSaveNotes?.(notes)}
            />
          </label>

          {question.explanation && (
            <div className="interview-explanation">
              <h4>Explanation</h4>
              <p>{question.explanation}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
