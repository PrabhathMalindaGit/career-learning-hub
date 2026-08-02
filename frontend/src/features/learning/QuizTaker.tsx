import { useState } from "react";
import type {
  QuizAnswerSelection,
  QuizQuestionForTaking,
} from "./types";

interface QuizTakerProps {
  documentId: string;
  questions: QuizQuestionForTaking[];
  answers: ReadonlyMap<number, number>;
  submitting: boolean;
  locked?: boolean;
  onSelect(questionIndex: number, selectedChoiceIndex: number): void;
  onSubmit(answers: QuizAnswerSelection[]): void;
}

export function QuizTaker({
  questions,
  answers,
  submitting,
  locked = false,
  onSelect,
  onSubmit,
}: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const complete =
    questions.length > 0 && answers.size === questions.length;
  const question = questions[currentIndex];
  const selected =
    question === undefined
      ? undefined
      : answers.get(question.questionIndex);

  if (!question) {
    return (
      <section className="learning-panel learning-quiz">
        <div className="learning-state learning-state--compact">
          <h2>No quiz questions available</h2>
          <p>No question content is available in this quiz.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="learning-panel learning-quiz"
      aria-labelledby="learning-quiz-questions-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Focused assessment</p>
          <h2 id="learning-quiz-questions-title">Quiz session</h2>
          <p>
            Work through one question at a time. Selections stay in this
            browser tab until you submit or leave.
          </p>
        </div>
        <span className="learning-chip" aria-live="polite">
          {answers.size} of {questions.length} questions answered
        </span>
      </header>

      <div className="learning-quiz-progress-row">
        <div>
          <strong>Question {currentIndex + 1} of {questions.length}</strong>
          <span>{selected === undefined ? "Unanswered" : "Selected"}</span>
        </div>
        <progress
          aria-label="Quiz question progress"
          max={questions.length}
          value={currentIndex + 1}
        />
      </div>

      <div className="learning-quiz-stage">
        <fieldset
          className="learning-quiz-question"
          disabled={submitting || locked}
        >
          <legend>{question.prompt}</legend>

          <div className="learning-quiz-choices">
            {question.choices.map((choice, choiceIndex) => (
              <label key={choiceIndex}>
                <input
                  type="radio"
                  name={`question-${question.questionIndex}`}
                  disabled={submitting || locked}
                  checked={selected === choiceIndex}
                  onChange={() =>
                    onSelect(question.questionIndex, choiceIndex)
                  }
                />
                <span>{choice}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <nav className="learning-quiz-navigation" aria-label="Quiz questions">
        <button
          type="button"
          className="learning-secondary-button"
          disabled={currentIndex === 0 || submitting || locked}
          onClick={() => setCurrentIndex((current) => current - 1)}
        >
          Previous question
        </button>
        <span aria-hidden="true">
          {currentIndex + 1} / {questions.length}
        </span>
        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            className="learning-primary-button"
            disabled={submitting || locked}
            onClick={() => setCurrentIndex((current) => current + 1)}
          >
            Next question
          </button>
        ) : (
          <button
            type="button"
            className="primary-button learning-primary-button"
            disabled={!complete || submitting || locked}
            aria-busy={submitting}
            onClick={() =>
              onSubmit(
                [...answers.entries()]
                  .map(([questionIndex, selectedChoiceIndex]) => ({
                    questionIndex,
                    selectedChoiceIndex,
                  }))
                  .sort(
                    (left, right) =>
                      left.questionIndex - right.questionIndex,
                  ),
              )
            }
          >
            {submitting
              ? "Submitting quiz answers…"
              : "Submit quiz answers"}
          </button>
        )}
      </nav>
    </section>
  );
}
