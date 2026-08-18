import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import { InterviewCreateDialog } from "./InterviewCreateDialog";
import { listInterviewSessions } from "./interviewApi";
import { InterviewSessionCard } from "./InterviewSessionCard";
import { InterviewSessionSkeletonList } from "./InterviewSessionSkeleton";
import type {
  InterviewSessionStatus,
  InterviewSessionSummary,
  Pagination,
} from "./types";
import "./interviewCoach.css";

const PAGE_SIZE = 20;

type SessionFilter = "all" | InterviewSessionStatus;
type SafeError = { message: string; requestId?: string };

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

const filters: { label: string; value: SessionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

function emptyStateCopy(filter: SessionFilter): string {
  if (filter === "all") {
    return "No interview sessions yet. Create a practice session to begin.";
  }

  return `No ${filter} sessions yet.`;
}

// Features 4.1–4.2 — Interview Coach collection and creation entry point.
// Lists/filter sessions and opens the guided session-creation dialog before
// navigating into the selected session workspace.
// Feature 4.1 — Interview session collection: /interviews -> “Your sessions”, filters/cards/paging.
// Feature 4.2 — “Create interview” entry point.
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
  const [createOpen, setCreateOpen] = useState(false);
  const [openActionsSessionId, setOpenActionsSessionId] = useState<
    string | null
  >(null);
  const listSequence = useRef(0);
  const createButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;

    setCreateOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
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

  function selectFilter(next: SessionFilter) {
    setFilter(next);
    setPage(1);
    setOpenActionsSessionId(null);
  }

  function handleSessionDeleted(sessionId: string) {
    const deletingLastVisibleSession =
      sessions.length === 1 && sessions[0]?.id === sessionId;

    setOpenActionsSessionId(null);
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
    setPagination((current) =>
      current
        ? { ...current, total: Math.max(0, current.total - 1) }
        : current,
    );

    if (deletingLastVisibleSession && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setReloadKey((key) => key + 1);
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
        actions={
          <button
            ref={createButtonRef}
            className="primary-button interview-primary-button interview-create-action"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <span aria-hidden="true">+</span>
            {/* Feature 4.2 UI — Create interview. */}
            Create interview
          </button>
        }
      />

      <section
        className="interview-collection interview-panel"
        aria-labelledby="interview-collection-title"
      >
        <div className="interview-section-heading">
          <div>
            <p className="interview-kicker">Briefing desk</p>
            {/* Feature 4.1 UI — Interview session collection. */}
            <h2 id="interview-collection-title">Your sessions</h2>
          </div>
          {pagination ? (
            <span className="interview-chip">
              {pagination.total} total
            </span>
          ) : null}
        </div>

        <div className="interview-filter-row" aria-label="Session status">
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
            body={emptyStateCopy(filter)}
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
                actionsOpen={openActionsSessionId === session.id}
                onActionsOpenChange={(open) =>
                  setOpenActionsSessionId(open ? session.id : null)
                }
                onDeleted={handleSessionDeleted}
              />
            ))}
          </ul>
        )}

        {pagination && pagination.pages >= 2 ? (
          <Pager
            className="interview-pagination"
            label="Interview session pages"
            currentPage={`Page ${page}`}
            previousLabel="Previous"
            nextLabel="Next"
            previousDisabled={loading || page <= 1}
            nextDisabled={loading || page >= pagination.pages}
            busy={loading}
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
        ) : null}
      </section>

      <InterviewCreateDialog
        open={createOpen}
        returnFocusRef={createButtonRef}
        onRequestClose={() => setCreateOpen(false)}
        onCreated={(sessionId) => navigate(`/interviews/${sessionId}`)}
      />
    </section>
  );
}
