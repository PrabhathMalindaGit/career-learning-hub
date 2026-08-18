import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { PageHeader } from "../../components/PageHeader";
import { Pager } from "../../components/Pager";
import { StateSurface } from "../../components/StateSurface";
import { listResumes } from "./resumeApi";
import { ResumeDeleteDialog } from "./ResumeDeleteDialog";
import { ResumeMiniDocument } from "./ResumeMiniDocument";
import { ResumeCreateDialog } from "./ResumeCreateDialog";
import { resolveResumePresentation } from "./resumeTemplateRegistry";
import type { Pagination, ResumeRecord } from "./types";
import "./resumeWorkspace.css";

const PAGE_SIZE = 20;

type SafeError = {
  message: string;
  requestId?: string;
};

function safeError(error: unknown): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      requestId: error.requestId,
    };
  }
  return {
    message: "The request could not be completed. Try again.",
  };
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

// Features 3.1–3.2 — Resume collection and creation entry point.
// Lists owned resumes and opens the shared creation flow without duplicating
// editor, import, or assessment behavior in the collection page.
// Feature 3.1 — Resume collection: /resumes -> “Your resumes”, open/delete/paging.
// Feature 3.2 — Resume creation entry point: “Create Resume”.
// Feature 3.2.1 — Guided setup is implemented in ResumeCreateDialog.tsx / ResumeGuidedSetup.tsx.
// Feature 3.2.2 — Start blank / “Create blank resume” is implemented in ResumeCreateDialog.tsx.
// Feature 3.2.3 — Import PDF / private review flow is implemented in ResumeCreateDialog.tsx.
export function ResumeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<SafeError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [openActionsResumeId, setOpenActionsResumeId] = useState<string | null>(
    null,
  );
  const listSequence = useRef(0);
  const headingCreateRef = useRef<HTMLButtonElement>(null);
  const createReturnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
    createReturnFocusRef.current = headingCreateRef.current;
    setCreateOpen(true);
  }, [searchParams, setSearchParams]);

  function openCreateDialog(event: React.MouseEvent<HTMLButtonElement>) {
    createReturnFocusRef.current = event.currentTarget;
    setCreateOpen(true);
  }

  useEffect(() => {
    const sequence = ++listSequence.current;
    const controller = new AbortController();
    setLoading(true);
    setListError(null);

    void listResumes(
      { page, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((result) => {
        if (sequence !== listSequence.current) return;
        setResumes(result.resumes);
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
  }, [page, reloadKey]);

  function handleResumeDeleted(resumeId: string) {
    const deletingLastVisibleResume =
      resumes.length === 1 && resumes[0]?.id === resumeId;

    setOpenActionsResumeId(null);
    setResumes((current) =>
      current.filter((resume) => resume.id !== resumeId),
    );
    setPagination((current) =>
      current
        ? { ...current, total: Math.max(0, current.total - 1) }
        : current,
    );

    if (deletingLastVisibleResume && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setReloadKey((key) => key + 1);
  }

  return (
    <section className="resume-list-page" aria-labelledby="resume-list-title">
      <PageHeader
        className="resume-page-heading"
        heading={
          <>
            <p className="eyebrow">Career documents</p>
            <h1 id="resume-list-title">Resume Studio</h1>
          </>
        }
        description={
          <p>
            Create, import, and open your private resume records. Only
            validated server data is shown.
          </p>
        }
        actions={
          /* =========================================================
             FIND: CREATE RESUME
             TYPE: UI
             FILE: frontend/src/features/resumes/ResumeListPage.tsx
             STYLE FILE: frontend/src/styles.css
             STYLE SELECTOR: .primary-button
             ========================================================= */
          <button
            ref={headingCreateRef}
            type="button"
            className="primary-button"
            onClick={openCreateDialog}
          >
            {/* Feature 3.2 UI — Create Resume. */}
            Create Resume
          </button>
        }
      />

      <ResumeCreateDialog
        open={createOpen}
        returnFocusRef={createReturnFocusRef}
        onClose={() => setCreateOpen(false)}
        onCreated={(workspace) => {
          setCreateOpen(false);
          navigate(`/resumes/${workspace.resume.id}`);
        }}
      />

      <div className="resume-list-layout">
        <section className="resume-collection" aria-labelledby="your-resumes">
          <div className="resume-section-heading">
            <div>
              <p className="resume-kicker">Collection</p>
              {/* =========================================================
                  FIND: RESUME LIST
                  TYPE: UI
                  FILE: frontend/src/features/resumes/ResumeListPage.tsx
                  STYLE FILE: frontend/src/features/resumes/resumeWorkspace.css
                  STYLE SELECTOR: .resume-collection
                  ========================================================= */}
              {/* Feature 3.1 UI — Resume collection. */}
              <h2 id="your-resumes">Your resumes</h2>
            </div>
            {pagination ? (
              <span className="resume-status">
                {pagination.total} total
              </span>
            ) : null}
          </div>

          {loading ? (
            <div
              className="resume-loading-state"
              role="status"
              aria-label="Loading resumes"
            >
              <p>Loading resumes…</p>
              <div className="resume-skeleton-grid" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <span className="resume-skeleton-card" key={index}>
                    <span className="resume-skeleton-document" />
                    <span className="resume-skeleton-line resume-skeleton-line--title" />
                    <span className="resume-skeleton-line" />
                  </span>
                ))}
              </div>
            </div>
          ) : listError ? (
            <StateSurface
              mode="alert"
              className="resume-state resume-state--error"
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
          ) : resumes.length === 0 ? (
            <div className="resume-empty-state">
              <span className="resume-empty-state-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M8 4.5h11l5 5V27.5H8z" />
                  <path d="M19 4.5v5h5M12 15h8M12 19h8M12 23h5" />
                </svg>
              </span>
              <div>
                <strong>No resumes yet</strong>
                <p>
                  No resumes yet. Create a blank resume or import a private PDF.
                </p>
              </div>
              <button
                type="button"
                className="resume-secondary-button"
                onClick={openCreateDialog}
              >
                Create your first resume
              </button>
            </div>
          ) : (
            <ul className="resume-record-list resume-record-grid">
              {resumes.map((resume) => {
                const presentation = resolveResumePresentation(resume.design);
                return (
                  <li className="resume-record-card" key={resume.id}>
                    <div className="resume-record-card-preview" aria-hidden="true">
                      <ResumeMiniDocument
                        templateId={presentation.template.option.id}
                        colorPaletteId={presentation.palette.option.id}
                        fontFamily={presentation.font.option.value}
                        context="card"
                      />
                    </div>
                    <div className="resume-record-card-body">
                      <div className="resume-record-card-heading">
                        <strong>{resume.title}</strong>
                        <ResumeDeleteDialog
                          resume={resume}
                          onDeleted={handleResumeDeleted}
                          actionsOpen={openActionsResumeId === resume.id}
                          onActionsOpenChange={(open) =>
                            setOpenActionsResumeId(open ? resume.id : null)
                          }
                        />
                      </div>
                      <div className="resume-record-state">
                        <span className="resume-record-status">
                          {titleCase(resume.status)}
                        </span>
                        <span>Version {resume.latestVersionNumber}</span>
                      </div>
                      <div className="resume-record-design">
                        <span>{presentation.template.option.label}</span>
                        <span>
                          {presentation.palette.option.label} palette
                        </span>
                      </div>
                      <div className="resume-record-card-footer">
                        <small>
                          Updated{" "}
                          {new Date(resume.updatedAt).toLocaleDateString()}
                        </small>
                        <Link
                          to={`/resumes/${resume.id}`}
                          aria-label={`Open Resume: ${resume.title}`}
                        >
                          Open Resume
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pagination && pagination.pages > 1 ? (
            <Pager
              className="resume-pagination"
              label="Resume pages"
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
      </div>
    </section>
  );
}
