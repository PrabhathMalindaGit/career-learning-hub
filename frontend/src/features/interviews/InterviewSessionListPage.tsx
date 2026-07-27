import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import {
  createInterviewSession,
  listInterviewSessions,
} from "./interviewApi";
import type {
  CreateInterviewMode,
  InterviewSessionStatus,
  InterviewSessionSummary,
  Pagination,
} from "./types";
import "./interviewCoach.css";

const PAGE_SIZE = 20;

type SessionFilter = "all" | InterviewSessionStatus;
type SafeError = { message: string; requestId?: string };
type FieldErrors = Partial<
  Record<
    | "title"
    | "targetRole"
    | "experienceLevel"
    | "focusTopics"
    | "skillGaps"
    | "jobDescription",
    string
  >
>;

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

function parseList(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value.split(",")) {
    const canonical = item.trim();
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(canonical);
  }
  return result;
}

function validate(input: {
  title: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string;
  skillGaps: string;
  jobDescription: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const titleLength = input.title.trim().length;
  const roleLength = input.targetRole.trim().length;
  const experienceLength = input.experienceLevel.trim().length;
  if (titleLength < 1 || titleLength > 160) {
    errors.title = "Enter a session title with 1–160 characters.";
  }
  if (roleLength < 2 || roleLength > 200) {
    errors.targetRole = "Enter a target role with 2–200 characters.";
  }
  if (experienceLength < 1 || experienceLength > 100) {
    errors.experienceLevel =
      "Enter an experience level with 1–100 characters.";
  }
  const focusItems = parseList(input.focusTopics);
  if (
    focusItems.length > 50 ||
    focusItems.some((item) => item.length > 120)
  ) {
    errors.focusTopics =
      "Use at most 50 focus topics, each no longer than 120 characters.";
  }
  const gapItems = parseList(input.skillGaps);
  if (
    gapItems.length > 50 ||
    gapItems.some((item) => item.length > 120)
  ) {
    errors.skillGaps =
      "Use at most 50 skill gaps, each no longer than 120 characters.";
  }
  if (input.jobDescription.trim().length > 30_000) {
    errors.jobDescription =
      "Keep the job description within 30,000 characters.";
  }
  return errors;
}

const filters: { label: string; value: SessionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export function InterviewSessionListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<SafeError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-level");
  const [focusTopics, setFocusTopics] = useState("");
  const [skillGaps, setSkillGaps] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] =
    useState<CreateInterviewMode>("written-practice");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createError, setCreateError] = useState<SafeError | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const listSequence = useRef(0);
  const createController = useRef<AbortController | null>(null);
  const errorSummary = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sequence = ++listSequence.current;
    const controller = new AbortController();
    setLoading(true);
    setListError(null);
    void listInterviewSessions(
      {
        page,
        limit: PAGE_SIZE,
        ...(filter === "all" ? {} : { status: filter }),
      },
      controller.signal,
    )
      .then((result) => {
        if (sequence !== listSequence.current) return;
        setSessions(result.sessions);
        setPagination(result.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (sequence === listSequence.current) {
          setListError(safeError(error));
        }
      })
      .finally(() => {
        if (sequence === listSequence.current) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reloadKey]);

  useEffect(
    () => () => {
      createController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      errorSummary.current?.focus();
    }
  }, [fieldErrors]);

  function selectFilter(next: SessionFilter) {
    setFilter(next);
    setPage(1);
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    if (createBusy) return;
    const errors = validate({
      title,
      targetRole,
      experienceLevel,
      focusTopics,
      skillGaps,
      jobDescription,
    });
    setFieldErrors(errors);
    setCreateError(null);
    if (Object.keys(errors).length > 0) return;

    const controller = new AbortController();
    createController.current?.abort();
    createController.current = controller;
    setCreateBusy(true);
    try {
      const result = await createInterviewSession(
        {
          title: title.trim(),
          targetRole: targetRole.trim(),
          experienceLevel: experienceLevel.trim(),
          focusTopics: parseList(focusTopics),
          skillGaps: parseList(skillGaps),
          ...(jobDescription.trim()
            ? { jobDescription: jobDescription.trim() }
            : {}),
          mode,
        },
        controller.signal,
      );
      navigate(`/interviews/${result.session.id}`);
    } catch (error) {
      if (!controller.signal.aborted) setCreateError(safeError(error));
    } finally {
      if (createController.current === controller) {
        setCreateBusy(false);
      }
    }
  }

  return (
    <section
      className="interview-list-page"
      aria-labelledby="interview-list-title"
    >
      <PageHeader
        className="interview-page-heading"
        heading={
          <>
            <p className="eyebrow">Interview preparation</p>
            <h1 id="interview-list-title">Interview Coach</h1>
          </>
        }
        description={
          <p>
            Organize role-specific questions, written practice, and
            model-generated guidance in private session records.
          </p>
        }
      />

      <div className="interview-list-layout">
        <section
          className="interview-collection interview-panel"
          aria-labelledby="interview-collection-title"
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Briefing desk</p>
              <h2 id="interview-collection-title">Your sessions</h2>
            </div>
            {pagination ? (
              <span className="interview-chip">
                {pagination.total} total
              </span>
            ) : null}
          </div>

          <div
            className="interview-filter-row"
            aria-label="Session status"
          >
            {filters.map((item) => (
              <button
                type="button"
                key={item.value}
                aria-pressed={filter === item.value}
                onClick={() => selectFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="interview-state" role="status">
              Loading interview sessions…
            </p>
          ) : listError ? (
            <div
              className="interview-state interview-state--error"
              role="alert"
            >
              <p>{listError.message}</p>
              {listError.requestId ? (
                <small>Request ID: {listError.requestId}</small>
              ) : null}
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Retry list
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="interview-state">
              No interview sessions match this view. Create a private
              session to begin.
            </p>
          ) : (
            <ul className="interview-session-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  <div className="interview-session-copy">
                    <div>
                      <span
                        className={`interview-lifecycle interview-lifecycle--${session.status}`}
                      >
                        {session.status}
                      </span>
                      <span>{session.mode.replace("-", " ")}</span>
                    </div>
                    <strong>{session.title}</strong>
                    <p>
                      {session.targetRole} · {session.experienceLevel}
                    </p>
                    <small>
                      {session.questionCount}{" "}
                      {session.questionCount === 1
                        ? "question"
                        : "questions"}
                      {" · "}Updated{" "}
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <Link
                    to={`/interviews/${session.id}`}
                    aria-label={`Open ${session.title}`}
                  >
                    Open session
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div
            className="interview-pagination"
            aria-label="Interview session pages"
          >
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={
                loading ||
                !pagination ||
                pagination.pages === 0 ||
                page >= pagination.pages
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </section>

        <form
          className="interview-create-panel interview-panel"
          onSubmit={(event) => void submitCreate(event)}
          noValidate
        >
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">New briefing</p>
              <h2>Create a session</h2>
            </div>
          </div>

          {Object.keys(fieldErrors).length > 0 ? (
            <div
              className="interview-error-summary"
              role="alert"
              tabIndex={-1}
              ref={errorSummary}
            >
              <strong>Review the highlighted fields.</strong>
              <ul>
                {fieldErrors.title ? (
                  <li>
                    <a href="#interview-title">Session title</a>
                  </li>
                ) : null}
                {fieldErrors.targetRole ? (
                  <li>
                    <a href="#interview-target-role">Target role</a>
                  </li>
                ) : null}
                {fieldErrors.experienceLevel ? (
                  <li>
                    <a href="#interview-experience">
                      Experience level
                    </a>
                  </li>
                ) : null}
                {fieldErrors.focusTopics ? (
                  <li>
                    <a href="#interview-focus-topics">Focus topics</a>
                  </li>
                ) : null}
                {fieldErrors.skillGaps ? (
                  <li>
                    <a href="#interview-skill-gaps">Skill gaps</a>
                  </li>
                ) : null}
                {fieldErrors.jobDescription ? (
                  <li>
                    <a href="#interview-job-description">
                      Job description
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="interview-form">
            <label htmlFor="interview-title">
              Session title <span aria-hidden="true">(required)</span>
              <input
                id="interview-title"
                required
                value={title}
                maxLength={160}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={
                  fieldErrors.title ? "interview-title-error" : undefined
                }
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            {fieldErrors.title ? (
              <p
                className="interview-field-error"
                id="interview-title-error"
              >
                {fieldErrors.title}
              </p>
            ) : null}

            <label htmlFor="interview-target-role">
              Target role <span aria-hidden="true">(required)</span>
              <input
                id="interview-target-role"
                required
                value={targetRole}
                maxLength={200}
                aria-invalid={Boolean(fieldErrors.targetRole)}
                aria-describedby={
                  fieldErrors.targetRole
                    ? "interview-target-role-error"
                    : undefined
                }
                onChange={(event) => setTargetRole(event.target.value)}
              />
            </label>
            {fieldErrors.targetRole ? (
              <p
                className="interview-field-error"
                id="interview-target-role-error"
              >
                {fieldErrors.targetRole}
              </p>
            ) : null}

            <div className="interview-form-row">
              <label htmlFor="interview-experience">
                Experience level{" "}
                <span aria-hidden="true">(required)</span>
                <input
                  id="interview-experience"
                  required
                  value={experienceLevel}
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.experienceLevel)}
                  aria-describedby={
                    fieldErrors.experienceLevel
                      ? "interview-experience-error"
                      : undefined
                  }
                  onChange={(event) =>
                    setExperienceLevel(event.target.value)
                  }
                />
              </label>
              <label>
                Practice mode
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as CreateInterviewMode)
                  }
                >
                  <option value="written-practice">
                    Written practice
                  </option>
                  <option value="study">Study</option>
                </select>
              </label>
            </div>
            {fieldErrors.experienceLevel ? (
              <p
                className="interview-field-error"
                id="interview-experience-error"
              >
                {fieldErrors.experienceLevel}
              </p>
            ) : null}

            <label htmlFor="interview-focus-topics">
              Focus topics
              <input
                id="interview-focus-topics"
                value={focusTopics}
                maxLength={6_000}
                aria-invalid={Boolean(fieldErrors.focusTopics)}
                aria-describedby={
                  fieldErrors.focusTopics
                    ? "interview-focus-topics-error"
                    : undefined
                }
                placeholder="API design, reliability, communication"
                onChange={(event) => setFocusTopics(event.target.value)}
              />
              <small>Separate topics with commas.</small>
            </label>
            {fieldErrors.focusTopics ? (
              <p
                className="interview-field-error"
                id="interview-focus-topics-error"
              >
                {fieldErrors.focusTopics}
              </p>
            ) : null}

            <label htmlFor="interview-skill-gaps">
              Skill gaps
              <input
                id="interview-skill-gaps"
                value={skillGaps}
                maxLength={6_000}
                aria-invalid={Boolean(fieldErrors.skillGaps)}
                aria-describedby={
                  fieldErrors.skillGaps
                    ? "interview-skill-gaps-error"
                    : undefined
                }
                placeholder="Concurrency, testing strategy"
                onChange={(event) => setSkillGaps(event.target.value)}
              />
              <small>Separate gaps with commas.</small>
            </label>
            {fieldErrors.skillGaps ? (
              <p
                className="interview-field-error"
                id="interview-skill-gaps-error"
              >
                {fieldErrors.skillGaps}
              </p>
            ) : null}

            <label htmlFor="interview-job-description">
              Job description <span>(optional)</span>
              <textarea
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
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
              />
            </label>
            {fieldErrors.jobDescription ? (
              <p
                className="interview-field-error"
                id="interview-job-description-error"
              >
                {fieldErrors.jobDescription}
              </p>
            ) : null}
          </div>

          {createError ? (
            <p className="interview-field-error" role="alert">
              {createError.message}
              {createError.requestId
                ? ` Request ID: ${createError.requestId}`
                : ""}
            </p>
          ) : null}

          <button
            className="interview-primary-button"
            type="submit"
            disabled={createBusy}
          >
            {createBusy ? "Creating…" : "Create session"}
          </button>
        </form>
      </div>
    </section>
  );
}
