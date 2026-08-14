import { useState } from "react";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  STRUCTURED_ANSWER_PRESENTATION,
  structuredAnswerLength,
  withStructuredAnswerEdit,
  type StructuredAnswerDraft,
  type StructuredInterviewQuestionType,
} from "./interviewStructuredAnswer";
import "./interviewAnswerExperience.css";

export interface InterviewStructuredAnswerFieldsProps {
  questionType: StructuredInterviewQuestionType;
  value: StructuredAnswerDraft;
  disabled?: boolean;
  onChange(next: StructuredAnswerDraft): void;
}

export function InterviewStructuredAnswerFields({
  questionType,
  value,
  disabled = false,
  onChange,
}: InterviewStructuredAnswerFieldsProps) {
  const [limitReached, setLimitReached] = useState(false);
  const presentation = STRUCTURED_ANSWER_PRESENTATION[questionType];
  const count = structuredAnswerLength(questionType, value);
  const guidanceId = `interview-structured-guidance-${questionType}`;
  const countId = `interview-structured-count-${questionType}`;
  const limitId = `interview-structured-limit-${questionType}`;
  const describedBy = [guidanceId, countId, limitReached ? limitId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`interview-structured-answer interview-structured-answer--${questionType}`}
      role="group"
      aria-label={presentation.groupLabel}
      aria-describedby={describedBy}
    >
      <p className="interview-structured-answer__guidance" id={guidanceId}>
        {presentation.guidance}
      </p>

      <div className="interview-structured-answer__fields">
        {presentation.fields.map((field) => (
          <label className="interview-structured-answer__field" key={field.key}>
            <span>{field.label}</span>
            <textarea
              rows={4}
              value={value[field.key] ?? ""}
              disabled={disabled}
              placeholder={field.placeholder}
              aria-describedby={describedBy}
              onChange={(event) => {
                const next = withStructuredAnswerEdit(
                  questionType,
                  value,
                  field.key,
                  event.target.value,
                );
                if (next === null) {
                  setLimitReached(true);
                  return;
                }
                setLimitReached(false);
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>

      <div className="interview-structured-answer__footer">
        <small id={countId}>
          {count.toLocaleString()} / {STRUCTURED_ANSWER_MAX_LENGTH.toLocaleString()}
        </small>
        {limitReached ? (
          <small id={limitId} role="status">
            Answer limit reached. Remove some text before adding more.
          </small>
        ) : null}
      </div>
    </div>
  );
}
