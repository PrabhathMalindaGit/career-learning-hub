import { Link } from "react-router-dom";
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
  documentId,
  questions,
  answers,
  submitting,
  locked = false,
  onSelect,
  onSubmit,
}: QuizTakerProps) {
  const complete =
    questions.length > 0 && answers.size === questions.length;

  return (
    <section
      className="learning-panel learning-quiz"
      aria-labelledby="learning-quiz-questions-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Your answers</p>
          <h2 id="learning-quiz-questions-title">Quiz questions</h2>
          <p>
            Choose one answer for every question. Answers stay in this
            browser tab until you submit or leave.
          </p>
        </div>
        <span className="learning-chip" aria-live="polite">
          {answers.size} of {questions.length} questions answered
        </span>
      </header>

      <div className="learning-quiz-list">
        {questions.map((question) => (
          <fieldset
            className="learning-quiz-question"
            key={question.questionIndex}
            disabled={submitting || locked}
          >
            <legend>
              <span aria-hidden="true">
                {question.questionIndex + 1}.{" "}
              </span>
              <span>{question.prompt}</span>
            </legend>

            <div className="learning-quiz-choices">
              {question.choices.map((choice, choiceIndex) => (
                <label key={choiceIndex}>
                  <input
                    type="radio"
                    name={`question-${question.questionIndex}`}
                    disabled={submitting || locked}
                    checked={
                      answers.get(question.questionIndex) === choiceIndex
                    }
                    onChange={() =>
                      onSelect(question.questionIndex, choiceIndex)
                    }
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>

            {question.sourcePages.length > 0 ? (
              <div className="learning-source-pages">
                <span>Source pages:</span>
                {question.sourcePages.map((page) => (
                  <Link
                    key={page}
                    to={`/learning/documents/${documentId}`}
                    aria-label={`Review source page ${page}`}
                  >
                    Page {page}
                  </Link>
                ))}
                <span>Open Extracted Content in the document workspace.</span>
              </div>
            ) : null}
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        className="learning-primary-button"
        disabled={!complete || submitting || locked}
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
    </section>
  );
}
