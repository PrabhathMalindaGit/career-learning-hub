import { useEffect, useRef, useState } from "react";
import type { InterviewQuestionDetail } from "./types";
import { CopyInterviewTextButton } from "./CopyInterviewTextButton";
import { InterviewStructuredAnswerFields } from "./InterviewStructuredAnswerFields";
import { QUESTION_TYPE_LABELS } from "./InterviewQuestionTypeControls";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  isStructuredInterviewQuestionType,
  serializeStructuredAnswer,
  type StructuredAnswerDraft,
} from "./interviewStructuredAnswer";
import "./interviewQuestionTypes.css";
import "./interviewAnswerExperience.css";

const ANSWER_MAX_LENGTH = 12_000;

const SHORT_ANSWER_PRESENTATION = {
  placeholder: "Give a concise, directly relevant answer…",
  guidance: ["Answer directly.", "Aim for 2–4 focused sentences."],
} as const;

const CODING_ANSWER_PLACEHOLDER =
  "Write or paste the code you would submit in an interview…";

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
      return "Your short answer";
    case "coding":
      return "Your code";
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
  const [structuredDraft, setStructuredDraft] =
    useState<StructuredAnswerDraft>({});
  const previousTextValue = useRef(textValue);
  const isMultipleChoice = question.questionType === "multiple-choice";
  const isCoding = question.questionType === "coding";
  const isShortAnswer = question.questionType === "short-answer";
  const structuredQuestionType = isStructuredInterviewQuestionType(
    question.questionType,
  )
    ? question.questionType
    : null;
  const structuredText = structuredQuestionType
    ? serializeStructuredAnswer(structuredQuestionType, structuredDraft)
    : "";
  const trimmedLength = textValue.trim().length;
  const textInvalid = trimmedLength < 1 || trimmedLength > ANSWER_MAX_LENGTH;
  const structuredInvalid =
    structuredQuestionType !== null &&
    (structuredText.length < 1 ||
      structuredText.length > STRUCTURED_ANSWER_MAX_LENGTH);
  const submitDisabled =
    disabled ||
    (isMultipleChoice
      ? selectedOptionId === ""
      : structuredQuestionType
        ? structuredInvalid
        : textInvalid);
  const errorId = "interview-answer-control-error";
  const countId = "interview-written-answer-count";
  const shortGuidanceId = "interview-short-answer-guidance";
  const codingHelpId = "interview-coding-answer-help";
  const codingExecutionId = "interview-coding-answer-execution";
  const describedBy = [
    ...(isShortAnswer ? [shortGuidanceId] : []),
    ...(isCoding ? [codingHelpId, codingExecutionId] : []),
    countId,
    ...(error ? [errorId] : []),
  ].join(" ");
  const starterCode = isCoding ? question.starterCode : undefined;
  const insertStarterDisabled = disabled || trimmedLength > 0;

  useEffect(() => {
    setStructuredDraft({});
  }, [question.id, question.questionType]);

  useEffect(() => {
    const previous = previousTextValue.current;
    previousTextValue.current = textValue;
    if (structuredQuestionType && previous !== "" && textValue === "") {
      setStructuredDraft({});
    }
  }, [structuredQuestionType, textValue]);

  return (
    <div
      className={`interview-answer-control interview-answer-control--${question.questionType}`}
    >
      <span className="interview-question-type-label">
        {QUESTION_TYPE_LABELS[question.questionType]}
      </span>

      {isMultipleChoice ? (
        <fieldset
          className="interview-answer-control__options"
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
        >
          <legend>Choose the best answer</legend>
          {question.multipleChoice?.options.map((option, index) => (
            <label className="interview-answer-option" key={option.id}>
              <input
                type="radio"
                name={`interview-answer-${question.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onSelectedOptionChange(option.id)}
              />
              <span
                className="interview-answer-option__letter"
                aria-hidden="true"
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="interview-answer-option__text">
                {option.text}
              </span>
            </label>
          ))}
        </fieldset>
      ) : structuredQuestionType ? (
        <InterviewStructuredAnswerFields
          questionType={structuredQuestionType}
          value={structuredDraft}
          disabled={disabled}
          onChange={(next) => {
            setStructuredDraft(next);
            onTextChange(serializeStructuredAnswer(structuredQuestionType, next));
          }}
        />
      ) : (
        <>
          {isShortAnswer ? (
            <div className="interview-answer-guidance" id={shortGuidanceId}>
              <div className="interview-answer-guidance__copy">
                {SHORT_ANSWER_PRESENTATION.guidance.map((line) => (
                  <small key={line}>{line}</small>
                ))}
              </div>
            </div>
          ) : null}

          {starterCode ? (
            <section
              className="interview-starter-code"
              aria-labelledby="interview-starter-code-title"
            >
              <div className="interview-starter-code__heading">
                <div>
                  <strong id="interview-starter-code-title">
                    Starter code
                  </strong>
                  <small>Optional question scaffold</small>
                </div>
                <CopyInterviewTextButton
                  label="Starter code"
                  text={starterCode}
                />
              </div>
              <pre className="interview-starter-code__code">
                <code>{starterCode}</code>
              </pre>
              <div className="interview-starter-code__actions">
                <button
                  type="button"
                  className="interview-secondary-button"
                  disabled={insertStarterDisabled}
                  onClick={() => onTextChange(starterCode)}
                >
                  Insert into answer
                </button>
                {trimmedLength > 0 ? (
                  <small>
                    Clear your current draft before inserting starter code.
                  </small>
                ) : null}
              </div>
            </section>
          ) : null}

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
                isCoding ? " interview-answer-control__coding" : ""
              }`}
              required
              rows={rowsFor(question)}
              maxLength={ANSWER_MAX_LENGTH}
              value={textValue}
              disabled={disabled}
              placeholder={
                isCoding
                  ? CODING_ANSWER_PLACEHOLDER
                  : isShortAnswer
                    ? SHORT_ANSWER_PRESENTATION.placeholder
                    : undefined
              }
              spellCheck={isCoding ? false : undefined}
              aria-invalid={Boolean(error) || (textInvalid && textValue.length > 0)}
              aria-describedby={describedBy}
              onChange={(event) => onTextChange(event.target.value)}
            />
          </label>
          {isCoding ? (
            <div className="interview-answer-control__coding-guidance">
              <small id={codingHelpId}>
                Complete only the function or solution requested by the question.
                You do not need unrelated application boilerplate.
              </small>
              <small id={codingExecutionId}>
                Your submission is reviewed as text and is not executed.
              </small>
            </div>
          ) : null}

          <small className="field-help" id={countId}>
            {textValue.length.toLocaleString()} /{" "}
            {ANSWER_MAX_LENGTH.toLocaleString()}
          </small>
        </>
      )}

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
