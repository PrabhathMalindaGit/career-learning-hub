import type { InterviewQuestionDetail } from "./types";
import { QUESTION_TYPE_LABELS } from "./InterviewQuestionTypeControls";
import "./interviewQuestionTypes.css";

const ANSWER_MAX_LENGTH = 12_000;

type AnswerControlError = {
  message: string;
  requestId?: string;
};

export interface InterviewAnswerControlProps {
  question: InterviewQuestionDetail;
  textValue: string;
  selectedOptionId: string;
  disabled?: boolean;
  error?: AnswerControlError | null;
  onTextChange(value: string): void;
  onSelectedOptionChange(optionId: string): void;
  onSubmit(): void;
}

function textLabel(question: InterviewQuestionDetail): string {
  switch (question.questionType) {
    case "short-answer":
      return "Short answer";
    case "coding":
      return "Coding answer";
    case "behavioral":
      return "Behavioral answer";
    case "scenario-based":
      return "Scenario response";
    case "technical-explanation":
      return "Technical explanation";
    default:
      return "Written answer";
  }
}

function rowsFor(question: InterviewQuestionDetail): number {
  if (question.questionType === "short-answer") return 5;
  if (question.questionType === "coding") return 12;
  return 9;
}

export function InterviewAnswerControl({
  question,
  textValue,
  selectedOptionId,
  disabled = false,
  error,
  onTextChange,
  onSelectedOptionChange,
  onSubmit,
}: InterviewAnswerControlProps) {
  const isMultipleChoice = question.questionType === "multiple-choice";
  const trimmedLength = textValue.trim().length;
  const textInvalid = trimmedLength < 1 || trimmedLength > ANSWER_MAX_LENGTH;
  const submitDisabled = disabled ||
    (isMultipleChoice ? selectedOptionId === "" : textInvalid);
  const errorId = "interview-answer-control-error";

  return (
    <div className="interview-answer-control">
      <span className="interview-question-type-label">
        {QUESTION_TYPE_LABELS[question.questionType]}
      </span>

      {isMultipleChoice ? (
        <fieldset
          className="interview-answer-control__options"
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
        >
          <legend>Choose one answer</legend>
          {question.multipleChoice?.options.map((option) => (
            <label className="interview-answer-option" key={option.id}>
              <input
                type="radio"
                name={`interview-answer-${question.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onSelectedOptionChange(option.id)}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="field-label interview-answer-field">
          <span>
            {textLabel(question)}{" "}
            <span className="field-required" aria-hidden="true">
              (required)
            </span>
          </span>
          <textarea
            id="interview-written-answer"
            name="writtenAnswer"
            className={`field-control${
              question.questionType === "coding"
                ? " interview-answer-control__coding"
                : ""
            }`}
            required
            rows={rowsFor(question)}
            maxLength={ANSWER_MAX_LENGTH}
            value={textValue}
            disabled={disabled}
            aria-invalid={Boolean(error) || textInvalid && textValue.length > 0}
            aria-describedby={`interview-written-answer-count${
              error ? ` ${errorId}` : ""
            }`}
            onChange={(event) => onTextChange(event.target.value)}
          />
        </label>
      )}

      {!isMultipleChoice ? (
        <small className="field-help" id="interview-written-answer-count">
          {textValue.length.toLocaleString()} /{" "}
          {ANSWER_MAX_LENGTH.toLocaleString()}
        </small>
      ) : null}

      {error ? (
        <div className="interview-field-error" id={errorId} role="alert">
          <span>{error.message}</span>
          {error.requestId ? <small>Request ID: {error.requestId}</small> : null}
        </div>
      ) : null}

      <button
        type="button"
        className="primary-button interview-primary-button"
        disabled={submitDisabled}
        aria-busy={disabled}
        onClick={onSubmit}
      >
        {disabled ? "Saving…" : "Save attempt"}
      </button>
    </div>
  );
}
