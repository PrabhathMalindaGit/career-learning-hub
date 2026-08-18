import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { ApiError } from "../../api/apiClient";
import { createInterviewSession } from "./interviewApi";
import { InterviewRoleSelector } from "./InterviewRoleSelector";
import {
  INTERVIEW_CAREER_AREAS,
  INTERVIEW_EXPERIENCE_LEVELS,
  OTHER_CUSTOM_CAREER_AREA,
  getInterviewCareerGuidance,
  suggestInterviewTitle,
  type InterviewCareerAreaSelection,
} from "./interviewRoleGuidance";
import { InterviewSuggestedTagInput } from "./InterviewSuggestedTagInput";
import { mergeInterviewTags } from "./InterviewTagInput";
import type { CreateInterviewMode } from "./types";
import "./interviewCreateGuidance.css";

type SafeError = { message: string; requestId?: string };
type FieldErrors = Partial<
  Record<
    | "title"
    | "careerArea"
    | "targetRole"
    | "experienceLevel"
    | "focusTopics"
    | "skillGaps"
    | "jobDescription",
    string
  >
>;
type FieldErrorKey = keyof FieldErrors;

const fieldIdByError: Record<FieldErrorKey, string> = {
  title: "interview-title",
  careerArea: "interview-career-area",
  targetRole: "interview-target-role",
  experienceLevel: "interview-experience",
  focusTopics: "interview-focus-topics-custom",
  skillGaps: "interview-skill-gaps-custom",
  jobDescription: "interview-job-description",
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    };
  }

  return {
    message: "The request could not be completed. Try again.",
  };
}

function validate(input: {
  title: string;
  careerArea: InterviewCareerAreaSelection;
  targetRole: string;
  experienceLevel: string;
  jobDescription: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const titleLength = input.title.trim().length;
  const roleLength = input.targetRole.trim().length;
  const experienceLength = input.experienceLevel.trim().length;

  if (titleLength < 1 || titleLength > 160) {
    errors.title = "Enter a session title with 1–160 characters.";
  }
  if (!input.careerArea) {
    errors.careerArea = "Choose a career area.";
  }
  if (roleLength < 2 || roleLength > 200) {
    errors.targetRole = "Enter a target role with 2–200 characters.";
  }
  if (experienceLength < 1 || experienceLength > 100) {
    errors.experienceLevel =
      "Enter an experience level with 1–100 characters.";
  }
  if (input.jobDescription.trim().length > 30_000) {
    errors.jobDescription =
      "Keep the job description within 30,000 characters.";
  }

  return errors;
}

export interface InterviewCreateDialogProps {
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onRequestClose(): void;
  onCreated(sessionId: string): void;
}

// Features 4.2–4.3 — Interview session authoring.
// Captures career area, target role, experience level, practice mode, and
// optional focus context used to create an owned practice session.
export function InterviewCreateDialog({
  open,
  returnFocusRef,
  onRequestClose,
  onCreated,
}: InterviewCreateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const createController = useRef<AbortController | null>(null);
  const createBusyRef = useRef(false);

  const [title, setTitle] = useState("");
  const [titleIsUserOwned, setTitleIsUserOwned] = useState(false);
  const [careerArea, setCareerArea] =
    useState<InterviewCareerAreaSelection>("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-level");
  const [mode, setMode] =
    useState<CreateInterviewMode>("written-practice");
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [focusDraft, setFocusDraft] = useState("");
  const [focusError, setFocusError] = useState<string>();
  const [skillGaps, setSkillGaps] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [skillError, setSkillError] = useState<string>();
  const [jobDescription, setJobDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createError, setCreateError] = useState<SafeError | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const careerGuidance = getInterviewCareerGuidance(careerArea);

  function resetForm() {
    setTitle("");
    setTitleIsUserOwned(false);
    setCareerArea("");
    setTargetRole("");
    setExperienceLevel("Mid-level");
    setMode("written-practice");
    setFocusTopics([]);
    setFocusDraft("");
    setFocusError(undefined);
    setSkillGaps([]);
    setSkillDraft("");
    setSkillError(undefined);
    setJobDescription("");
    setFieldErrors({});
    setCreateError(null);
  }

  function adoptCareerArea(nextArea: InterviewCareerAreaSelection) {
    setCareerArea(nextArea);
    setTargetRole("");
    if (!titleIsUserOwned) setTitle("");
    setFieldErrors((current) => {
      const {
        careerArea: _careerArea,
        targetRole: _targetRole,
        ...rest
      } = current;
      return rest;
    });
  }

  function adoptRole(nextRole: string) {
    setTargetRole(nextRole);
    setFieldErrors((current) => {
      const { targetRole: _targetRole, ...rest } = current;
      return rest;
    });
    if (!titleIsUserOwned) {
      setTitle(suggestInterviewTitle(nextRole, experienceLevel));
    }
  }

  function adoptExperienceLevel(nextLevel: string) {
    setExperienceLevel(nextLevel);
    setFieldErrors((current) => {
      const { experienceLevel: _experienceLevel, ...rest } = current;
      return rest;
    });
    if (!titleIsUserOwned) {
      setTitle(suggestInterviewTitle(targetRole, nextLevel));
    }
  }

  function requestClose() {
    if (createBusyRef.current) return;
    resetForm();
    dialogRef.current?.close();
    onRequestClose();
    returnFocusRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    queueMicrotask(() => titleRef.current?.focus());
  }, [open]);

  useEffect(
    () => () => {
      createController.current?.abort();
      createBusyRef.current = false;
    },
    [],
  );

  useEffect(() => {
    const errorFields = Object.keys(fieldErrors) as FieldErrorKey[];
    if (errorFields.length > 1) {
      errorSummaryRef.current?.focus();
    } else if (errorFields[0]) {
      document.getElementById(fieldIdByError[errorFields[0]])?.focus();
    }
  }, [fieldErrors]);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createBusyRef.current) return;

    const errors = validate({
      title,
      careerArea,
      targetRole,
      experienceLevel,
      jobDescription,
    });

    const nextFocusTopics = mergeInterviewTags(focusTopics, focusDraft);
    const nextSkillGaps = mergeInterviewTags(skillGaps, skillDraft);

    if (nextFocusTopics.error) {
      errors.focusTopics = nextFocusTopics.error;
      setFocusError(nextFocusTopics.error);
    }
    if (nextSkillGaps.error) {
      errors.skillGaps = nextSkillGaps.error;
      setSkillError(nextSkillGaps.error);
    }

    setFieldErrors(errors);
    setCreateError(null);
    if (Object.keys(errors).length > 0) return;

    setFocusTopics(nextFocusTopics.values);
    setFocusDraft("");
    setFocusError(undefined);
    setSkillGaps(nextSkillGaps.values);
    setSkillDraft("");
    setSkillError(undefined);

    const controller = new AbortController();
    createController.current?.abort();
    createController.current = controller;
    createBusyRef.current = true;
    setCreateBusy(true);

    try {
      const result = await createInterviewSession(
        {
          title: title.trim(),
          targetRole: targetRole.trim(),
          experienceLevel: experienceLevel.trim(),
          focusTopics: nextFocusTopics.values,
          skillGaps: nextSkillGaps.values,
          ...(jobDescription.trim()
            ? { jobDescription: jobDescription.trim() }
            : {}),
          mode,
        },
        controller.signal,
      );
      onCreated(result.session.id);
    } catch (error) {
      if (!controller.signal.aborted) setCreateError(safeError(error));
    } finally {
      if (createController.current === controller) {
        createBusyRef.current = false;
        setCreateBusy(false);
      }
    }
  }

  if (!open) return null;
  const errorFields = Object.keys(fieldErrors) as FieldErrorKey[];

  return (
    <dialog
      ref={dialogRef}
      className="interview-create-dialog"
      aria-labelledby="interview-create-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!createBusyRef.current) requestClose();
      }}
    >
      <form
        className="interview-create-dialog__form"
        onSubmit={(event) => void submitCreate(event)}
        noValidate
      >
        <header className="interview-create-dialog__header">
          <div>
            <p className="interview-kicker">New interview</p>
            <h2 id="interview-create-dialog-title">Create interview</h2>
          </div>
        </header>

        {errorFields.length > 1 ? (
          <div
            className="validation-summary interview-error-summary"
            role="alert"
            tabIndex={-1}
            ref={errorSummaryRef}
          >
            <strong>Review the highlighted fields.</strong>
            <ul>
              {fieldErrors.title ? (
                <li><a href="#interview-title">Session title</a></li>
              ) : null}
              {fieldErrors.careerArea ? (
                <li><a href="#interview-career-area">Career area</a></li>
              ) : null}
              {fieldErrors.targetRole ? (
                <li><a href="#interview-target-role">Target role</a></li>
              ) : null}
              {fieldErrors.experienceLevel ? (
                <li><a href="#interview-experience">Experience level</a></li>
              ) : null}
              {fieldErrors.focusTopics ? (
                <li><a href="#interview-focus-topics-custom">Focus topics</a></li>
              ) : null}
              {fieldErrors.skillGaps ? (
                <li><a href="#interview-skill-gaps-custom">Skill gaps</a></li>
              ) : null}
              {fieldErrors.jobDescription ? (
                <li><a href="#interview-job-description">Job description</a></li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="interview-create-dialog__body interview-form">
          <p className="interview-create-required-note">
            {/* Feature 4.3 UI — Interview role/context setup. */}
            Required: Session title, Career area, Target role, Experience level
            and Practice mode.
          </p>

          <label className="field-label" htmlFor="interview-title">
            Session title
            <input
              ref={titleRef}
              className="field-control"
              id="interview-title"
              required
              value={title}
              maxLength={160}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "interview-title-error" : undefined}
              onChange={(event) => {
                setTitleIsUserOwned(true);
                setTitle(event.target.value);
              }}
            />
          </label>
          {fieldErrors.title ? (
            <p className="field-error interview-field-error" id="interview-title-error">
              {fieldErrors.title}
            </p>
          ) : null}

          <label className="field-label" htmlFor="interview-career-area">
            Career area
            <select
              className="field-control"
              id="interview-career-area"
              required
              value={careerArea}
              aria-invalid={Boolean(fieldErrors.careerArea)}
              aria-describedby={
                fieldErrors.careerArea ? "interview-career-area-error" : undefined
              }
              onChange={(event) =>
                adoptCareerArea(event.target.value as InterviewCareerAreaSelection)
              }
            >
              <option value="">Choose a career area</option>
              {INTERVIEW_CAREER_AREAS.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
              <option value={OTHER_CUSTOM_CAREER_AREA}>Other / Custom</option>
            </select>
          </label>
          {fieldErrors.careerArea ? (
            <p
              className="field-error interview-field-error"
              id="interview-career-area-error"
            >
              {fieldErrors.careerArea}
            </p>
          ) : null}

          <InterviewRoleSelector
            roleOptions={careerGuidance.roles}
            value={targetRole}
            disabled={!careerArea}
            error={fieldErrors.targetRole}
            onChange={adoptRole}
          />

          <div className="interview-form-row">
            <label className="field-label" htmlFor="interview-experience">
              Experience level
              <select
                className="field-control"
                id="interview-experience"
                required
                value={experienceLevel}
                aria-invalid={Boolean(fieldErrors.experienceLevel)}
                aria-describedby={
                  fieldErrors.experienceLevel
                    ? "interview-experience-error"
                    : undefined
                }
                onChange={(event) => adoptExperienceLevel(event.target.value)}
              >
                {INTERVIEW_EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>

            <label className="field-label" htmlFor="interview-mode">
              Practice mode
              <select
                id="interview-mode"
                className="field-control"
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as CreateInterviewMode)
                }
              >
                <option value="written-practice">Written practice</option>
                <option value="study">Study</option>
              </select>
            </label>
          </div>
          {fieldErrors.experienceLevel ? (
            <p
              className="field-error interview-field-error"
              id="interview-experience-error"
            >
              {fieldErrors.experienceLevel}
            </p>
          ) : null}

          <InterviewSuggestedTagInput
            id="interview-focus-topics"
            label="Focus topics · Optional"
            suggestions={careerGuidance.focusTopics}
            values={focusTopics}
            draft={focusDraft}
            error={focusError ?? fieldErrors.focusTopics}
            placeholder="Add custom topic…"
            helpText="Choose useful topics for this interview, or add your own."
            onValuesChange={setFocusTopics}
            onDraftChange={setFocusDraft}
            onError={(next) => {
              setFocusError(next);
              if (!next && fieldErrors.focusTopics) {
                setFieldErrors((current) => {
                  const { focusTopics: _removed, ...rest } = current;
                  return rest;
                });
              }
            }}
          />

          <InterviewSuggestedTagInput
            id="interview-skill-gaps"
            label="Skill gaps · Optional"
            suggestions={careerGuidance.skillGaps}
            values={skillGaps}
            draft={skillDraft}
            error={skillError ?? fieldErrors.skillGaps}
            placeholder="Add custom skill gap…"
            helpText="Choose areas you want the interview to challenge, or add your own."
            onValuesChange={setSkillGaps}
            onDraftChange={setSkillDraft}
            onError={(next) => {
              setSkillError(next);
              if (!next && fieldErrors.skillGaps) {
                setFieldErrors((current) => {
                  const { skillGaps: _removed, ...rest } = current;
                  return rest;
                });
              }
            }}
          />

          <details className="interview-create-dialog__context">
            <summary>Additional context · Optional</summary>
            <label className="field-label" htmlFor="interview-job-description">
              Job description · Optional
              <textarea
                className="field-control"
                id="interview-job-description"
                rows={6}
                maxLength={30_000}
                aria-invalid={Boolean(fieldErrors.jobDescription)}
                aria-describedby={
                  fieldErrors.jobDescription
                    ? "interview-job-description-error"
                    : undefined
                }
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />
            </label>
            {fieldErrors.jobDescription ? (
              <p
                className="field-error interview-field-error"
                id="interview-job-description-error"
              >
                {fieldErrors.jobDescription}
              </p>
            ) : null}
          </details>
        </div>

        {createError ? (
          <p className="interview-field-error" role="alert">
            {createError.message}
            {createError.requestId ? ` Request ID: ${createError.requestId}` : ""}
          </p>
        ) : null}

        <footer className="interview-create-dialog__footer">
          <button
            className="interview-secondary-button"
            type="button"
            disabled={createBusy}
            onClick={requestClose}
          >
            Cancel
          </button>
          <button
            className="primary-button interview-primary-button"
            type="submit"
            disabled={createBusy}
            aria-busy={createBusy}
          >
            {createBusy ? "Creating…" : "Create interview"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
