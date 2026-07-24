import { useMemo, useState } from "react";
import type {
  QuizAttemptReview,
  QuizQuestion,
} from "./types";

interface QuizTakerProps {
  questions: QuizQuestion[];
  review?: QuizAttemptReview[];
  onSubmit(
    answers: Array<{
      questionIndex: number;
      selectedChoiceIndex: number;
    }>,
  ): void;
}

export function QuizTaker({
  questions,
  review,
  onSubmit,
}: QuizTakerProps) {
  const [answers, setAnswers] = useState<Map<number, number>>(
    new Map(),
  );

  const complete = useMemo(
    () =>
      questions.length > 0 &&
      answers.size === questions.length,
    [answers, questions.length],
  );

  return (
    <section
      className="learning-panel learning-quiz"
      aria-labelledby="learning-quiz-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Assessment</p>
          <h3 id="learning-quiz-title">Quiz</h3>
        </div>
        <span className="learning-chip">
          {answers.size}/{questions.length}
        </span>
      </header>

      {questions.length === 0 ? (
        <div className="learning-empty-state">
          Generate a quiz from a ready document.
        </div>
      ) : (
        <>
          <div className="learning-quiz-list">
            {questions.map((question) => {
              const result = review?.find(
                (item) =>
                  item.questionIndex === question.questionIndex,
              );

              return (
                <fieldset
                  className="learning-quiz-question"
                  key={question.questionIndex}
                  disabled={Boolean(review)}
                >
                  <legend>
                    {question.questionIndex + 1}. {question.prompt}
                  </legend>

                  {question.choices.map((choice, choiceIndex) => (
                    <label key={choiceIndex}>
                      <input
                        type="radio"
                        name={`question-${question.questionIndex}`}
                        checked={
                          answers.get(question.questionIndex) ===
                          choiceIndex
                        }
                        onChange={() =>
                          setAnswers((current) => {
                            const next = new Map(current);
                            next.set(
                              question.questionIndex,
                              choiceIndex,
                            );
                            return next;
                          })
                        }
                      />
                      <span>{choice}</span>
                    </label>
                  ))}

                  {result && (
                    <div
                      className={
                        result.correct
                          ? "learning-quiz-result-correct"
                          : "learning-quiz-result-incorrect"
                      }
                    >
                      <strong>
                        {result.correct ? "Correct" : "Review"}
                      </strong>
                      <p>{result.explanation}</p>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          {!review && (
            <button
              type="button"
              className="learning-primary-button"
              disabled={!complete}
              onClick={() =>
                onSubmit(
                  [...answers.entries()]
                    .map(
                      ([
                        questionIndex,
                        selectedChoiceIndex,
                      ]) => ({
                        questionIndex,
                        selectedChoiceIndex,
                      }),
                    )
                    .sort(
                      (left, right) =>
                        left.questionIndex -
                        right.questionIndex,
                    ),
                )
              }
            >
              Submit all answers
            </button>
          )}
        </>
      )}
    </section>
  );
}
