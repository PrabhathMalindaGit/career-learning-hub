import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import {
  createInterviewSession,
  listInterviewSessions,
} from "./interviewApi";
import { InterviewSessionCard } from "./InterviewSessionCard";
import { InterviewSessionSkeletonList } from "./InterviewSessionSkeleton";
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
type FieldErrorKey = keyof FieldErrors;

const fieldIdByError: Record<FieldErrorKey, string> = {
  title: "interview-title",
  targetRole: "interview-target-role",
  experienceLevel: "interview-experience",
  focusTopics: "interview-focus-topics",
  skillGaps: "interview-skill-gaps",
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
  const [searchParams, setSearchParams] = useSearchParams();
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
    if (searchParams.get("action") !== "create") return;
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
    window.setTimeout(
      () => document.getElementById("interview-title")?.focus(),
      100,
    );
  }, [searchParams, setSearchParams]);

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
    const errorFields = Object.keys(fieldErrors) as FieldErrorKey[];
    if (errorFields.length > 1) {
      errorSummary.current?.focus();
    } else if (errorFields[0]) {
      document.getElementById(fieldIdByError[errorFields[0]])?.focus();
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
            <InterviewSessionSkeletonList />
          ) : listError ? (
            <StateSurface
              mode="alert"
              className="interview-state interview-state--error"
              body={<p>{listError.message}</p>}
              requestId={listError.requestId}
              actions={
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Retry list
                </button>
              }
            />
          ) : sessions.length === 0 ? (
            <StateSurface
              mode="static"
              className="interview-state"
              body="No interview sessions match this view. Create a private session to begin."
            />
          ) : (
            <ul
              className="interview-session-list"
              aria-label="Interview sessions"
            >
              {sessions.map((session) => (
                <InterviewSessionCard
                  key={session.id}
                  session={session}
                />
              ))}
            </ul>
          )}

          <Pager
            className="interview-pagination"
            label="Interview session pages"
            currentPage={`Page ${page}`}
            previousLabel="Previous"
            nextLabel="Next"
            previousDisabled={loading || page <= 1}
            nextDisabled={
              loading ||
              !pagination ||
              pagination.pages === 0 ||
              page >= pagination.pages
            }
            busy={loading}
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
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

          {Object.keys(fieldErrors).length > 1 ? (
            <div
              className="validation-summary interview-error-summary"
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
            <label className="field-label" htmlFor="interview-title">
              Session title <span aria-hidden="true">(required)</span>
              <input
                className="field-control"
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
                className="field-error interview-field-error"
                id="interview-title-error"
              >
                {fieldErrors.title}
              </p>
            ) : null}

            <label
              className="field-label"
              htmlFor="interview-target-role"
            >
              Target role <span aria-hidden="true">(required)</span>
              <input
                className="field-control"
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
                className="field-error interview-field-error"
                id="interview-target-role-error"
              >
                {fieldErrors.targetRole}
              </p>
            ) : null}

            <div className="interview-form-row">
              <label
                className="field-label"
                htmlFor="interview-experience"
              >
                Experience level{" "}
                <span aria-hidden="true">(required)</span>
                <input
                  className="field-control"
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
                  <option value="written-practice">
                    Written practice
                  </option>
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

            <label
              className="field-label"
              htmlFor="interview-focus-topics"
            >
              Focus topics
              <input
                className="field-control"
                id="interview-focus-topics"
                value={focusTopics}
                maxLength={6_000}
                aria-invalid={Boolean(fieldErrors.focusTopics)}
                aria-describedby={`interview-focus-topics-help${
                  fieldErrors.focusTopics
                    ? " interview-focus-topics-error"
                    : ""
                }`}
                placeholder="API design, reliability, communication"
                onChange={(event) => setFocusTopics(event.target.value)}
              />
              <small
                className="field-help"
                id="interview-focus-topics-help"
              >
                Separate topics with commas.
              </small>
            </label>
            {fieldErrors.focusTopics ? (
              <p
                className="field-error interview-field-error"
                id="interview-focus-topics-error"
              >
                {fieldErrors.focusTopics}
              </p>
            ) : null}

            <label
              className="field-label"
              htmlFor="interview-skill-gaps"
            >
              Skill gaps
              <input
                className="field-control"
                id="interview-skill-gaps"
                value={skillGaps}
                maxLength={6_000}
                aria-invalid={Boolean(fieldErrors.skillGaps)}
                aria-describedby={`interview-skill-gaps-help${
                  fieldErrors.skillGaps
                    ? " interview-skill-gaps-error"
                    : ""
                }`}
                placeholder="Concurrency, testing strategy"
                onChange={(event) => setSkillGaps(event.target.value)}
              />
              <small
                className="field-help"
                id="interview-skill-gaps-help"
              >
                Separate gaps with commas.
              </small>
            </label>
            {fieldErrors.skillGaps ? (
              <p
                className="field-error interview-field-error"
                id="interview-skill-gaps-error"
              >
                {fieldErrors.skillGaps}
              </p>
            ) : null}

            <label
              className="field-label"
              htmlFor="interview-job-description"
            >
              Job description <span>(optional)</span>
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
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
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
            className="primary-button interview-primary-button"
            type="submit"
            disabled={createBusy}
            aria-busy={createBusy}
          >
            {createBusy ? "Creating…" : "Create session"}
          </button>
        </form>
      </div>
    </section>
  );
}
