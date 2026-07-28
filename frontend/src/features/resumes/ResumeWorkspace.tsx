import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBlocker, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Dialog } from "../../components/Dialog";
import { AiRecommendations } from "./AiRecommendations";
import { ResumeEditor } from "./ResumeEditor";
import { ResumePreview } from "./ResumePreview";
import {
  applyResumeSuggestions,
  fetchJob,
  fetchResume,
  fetchResumeAnalysis,
  fetchResumeVersion,
  listResumeVersions,
  queueResumeAnalysis,
  saveResumeVersion,
} from "./resumeApi";
import {
  draftFingerprint,
  draftToInput,
  resumeContentToDraft,
  validateResumeDraft,
} from "./resumeDraft";
import { pollResumeJob } from "./resumePolling";
import type {
  ResumeAnalysis,
  ResumeDraft,
  ResumeJob,
  Pagination,
  ResumeVersion,
  ResumeVersionMetadata,
  ResumeWorkspaceData,
} from "./types";
import "./resumeWorkspace.css";

type Notice = {
  tone: "success" | "error" | "warning" | "info";
  message: string;
  requestId?: string;
  action?: "reload";
};

function safeFailure(
  error: unknown,
  fallback: string,
  conflictMessage?: string,
): Notice {
  if (error instanceof ApiError) {
    return {
      tone: error.status === 409 ? "warning" : "error",
      message:
        error.status === 409 && conflictMessage
          ? conflictMessage
          : fallback,
      requestId: error.requestId,
      ...(error.status === 409 && conflictMessage
        ? { action: "reload" as const }
        : {}),
    };
  }
  return { tone: "error", message: fallback };
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function ResumeWorkspace() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [workspace, setWorkspace] = useState<ResumeWorkspaceData>();
  const [draft, setDraft] = useState<ResumeDraft>();
  const [baselineFingerprint, setBaselineFingerprint] = useState("");
  const [versions, setVersions] = useState<ResumeVersionMetadata[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] =
    useState<Pagination>();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyFailure, setHistoryFailure] = useState<Notice>();
  const [historyReloadSequence, setHistoryReloadSequence] = useState(0);
  const [snapshot, setSnapshot] = useState<ResumeVersion>();
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<Notice>();
  const [reloadSequence, setReloadSequence] = useState(0);
  const [notice, setNotice] = useState<Notice>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis>();
  const [analysisStale, setAnalysisStale] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisJob, setAnalysisJob] = useState<ResumeJob>();
  const [analysisJobId, setAnalysisJobId] = useState<string>();
  const [targetRole, setTargetRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<
    Set<string>
  >(new Set());
  const [applying, setApplying] = useState(false);
  const activeControllers = useRef(new Set<AbortController>());
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);

  const dirty =
    draft !== undefined &&
    draftFingerprint(draft) !== baselineFingerprint;
  const blocker = useBlocker(dirty);

  function beginOperation(): AbortController {
    const controller = new AbortController();
    activeControllers.current.add(controller);
    return controller;
  }

  function finishOperation(controller: AbortController) {
    activeControllers.current.delete(controller);
  }

  function adoptCanonical(next: ResumeWorkspaceData) {
    const nextDraft = resumeContentToDraft(next.version.content);
    setWorkspace(next);
    setDraft(nextDraft);
    setBaselineFingerprint(draftFingerprint(nextDraft));
    setSnapshot(undefined);
    setValidationErrors([]);
  }

  useEffect(() => {
    setSaving(false);
    setAnalysisBusy(false);
    setApplying(false);
    setSnapshot(undefined);
    setAnalysis(undefined);
    setAnalysisJob(undefined);
    setAnalysisJobId(undefined);
    setAnalysisStale(false);
    setSelectedSuggestionIds(new Set());
    setTargetRole("");
    setCompany("");
    setJobDescription("");
    return () => {
      activeControllers.current.forEach((controller) =>
        controller.abort(),
      );
      activeControllers.current.clear();
    };
  }, [resumeId]);

  useEffect(() => {
    if (!dirty) return;
    const preventDeparture = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventDeparture);
    return () =>
      window.removeEventListener("beforeunload", preventDeparture);
  }, [dirty]);

  useEffect(() => {
    if (!resumeId) {
      setLoadFailure({
        tone: "error",
        message: "This resume route is invalid.",
      });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadFailure(undefined);
    setNotice(undefined);
    setAnalysis(undefined);
    setAnalysisStale(false);
    setSelectedSuggestionIds(new Set());

    void fetchResume(resumeId, controller.signal)
      .then((nextWorkspace) => {
        if (!active) return;
        adoptCanonical(nextWorkspace);
      })
      .catch((error: unknown) => {
        if (!active || isAbort(error)) return;
        setLoadFailure(
          safeFailure(error, "We could not load this resume."),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [resumeId, reloadSequence]);

  useEffect(() => {
    if (!resumeId) return;
    const controller = new AbortController();
    let active = true;
    setHistoryLoading(true);
    setHistoryFailure(undefined);

    void listResumeVersions(
      resumeId,
      { page: historyPage, limit: 20 },
      controller.signal,
    )
      .then((versionPage) => {
        if (!active) return;
        setVersions(versionPage.versions);
        setHistoryPagination(versionPage.pagination);
      })
      .catch((error: unknown) => {
        if (!active || isAbort(error)) return;
        setHistoryFailure(
          safeFailure(error, "We could not load version history."),
        );
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [resumeId, historyPage, historyReloadSequence]);

  const selectedIds = useMemo(
    () => new Set(selectedSuggestionIds),
    [selectedSuggestionIds],
  );

  async function handleSave() {
    if (!resumeId || !workspace || !draft || saving) return;
    const errors = validateResumeDraft(draft);
    setValidationErrors(errors);
    setNotice(undefined);
    if (errors.length > 0) return;

    const controller = beginOperation();
    setSaving(true);
    try {
      const next = await saveResumeVersion(
        resumeId,
        {
          content: draftToInput(draft),
          expectedCurrentVersionId: workspace.version.id,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      adoptCanonical(next);
      setHistoryPage(1);
      setHistoryReloadSequence((current) => current + 1);
      if (analysis) setAnalysisStale(true);
      setNotice({
        tone: "success",
        message: `Version ${next.version.versionNumber} saved.`,
      });
    } catch (error) {
      if (!isAbort(error)) {
        setNotice(
          safeFailure(
            error,
            "We could not save a new resume version.",
            "A newer version exists. Reload and review before saving again.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      setSaving(false);
    }
  }

  async function handleViewVersion(version: ResumeVersionMetadata) {
    if (!resumeId) return;
    const controller = beginOperation();
    setNotice(undefined);
    try {
      const loaded = await fetchResumeVersion(
        resumeId,
        version.id,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setSnapshot(loaded);
    } catch (error) {
      if (!isAbort(error)) {
        setNotice(
          safeFailure(error, "We could not load that resume version."),
        );
      }
    } finally {
      finishOperation(controller);
    }
  }

  async function completeAnalysisPolling(jobIdentifier: string) {
    if (!resumeId || !workspace) return;
    const expectedVersionId = workspace.version.id;
    const controller = beginOperation();
    setAnalysisBusy(true);
    setNotice({
      tone: "info",
      message: "Assessment queued. Waiting for the saved-version result.",
    });
    try {
      const pollResult = await pollResumeJob({
        jobId: jobIdentifier,
        expectedType: "resume.analyze",
        fetchJob,
        signal: controller.signal,
        onUpdate: setAnalysisJob,
      });

      if (controller.signal.aborted) return;
      if (pollResult.reason === "cancelled") return;
      if (
        pollResult.reason === "timeout" ||
        pollResult.reason === "transport-failure"
      ) {
        setNotice({
          tone: "warning",
          message:
            "Assessment status checking paused. You can check this job again.",
        });
        return;
      }

      const completedJob = pollResult.job;
      setAnalysisJob(completedJob);
      if (completedJob.status === "failed") {
        setNotice({
          tone: "error",
          message: "The assessment job failed without changing your resume.",
        });
        return;
      }
      if (completedJob.status === "cancelled") {
        setNotice({
          tone: "warning",
          message: "The assessment job was cancelled.",
        });
        return;
      }
      const result = completedJob.result;
      if (
        completedJob.status !== "completed" ||
        result?.kind !== "analysis" ||
        result.resumeId !== resumeId ||
        result.resumeVersionId !== expectedVersionId
      ) {
        setNotice({
          tone: "error",
          message: "The assessment result did not match this saved version.",
        });
        return;
      }

      const loadedAnalysis = await fetchResumeAnalysis(
        result.analysisId,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (
        loadedAnalysis.id !== result.analysisId ||
        loadedAnalysis.resumeId !== resumeId ||
        loadedAnalysis.resumeVersionId !== expectedVersionId ||
        loadedAnalysis.totalScore !== result.totalScore
      ) {
        setNotice({
          tone: "error",
          message: "The assessment details did not match the completed job.",
        });
        return;
      }
      setAnalysis(loadedAnalysis);
      setAnalysisStale(false);
      setSelectedSuggestionIds(new Set());
      setNotice({
        tone: "success",
        message: "Assessment completed for the current saved version.",
      });
    } catch (error) {
      if (!isAbort(error)) {
        setNotice(
          safeFailure(
            error,
            "We could not check this assessment securely.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      setAnalysisBusy(false);
    }
  }

  async function handleRunAnalysis() {
    if (
      !resumeId ||
      !workspace ||
      dirty ||
      analysisBusy ||
      targetRole.trim().length < 2
    ) {
      return;
    }
    const controller = beginOperation();
    setAnalysisBusy(true);
    setNotice(undefined);
    try {
      const accepted = await queueResumeAnalysis(
        resumeId,
        {
          versionId: workspace.version.id,
          targetRole: targetRole.trim(),
          ...(company.trim() ? { company: company.trim() } : {}),
          ...(jobDescription.trim()
            ? { jobDescription: jobDescription.trim() }
            : {}),
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setAnalysisJobId(accepted.id);
      finishOperation(controller);
      setAnalysisBusy(false);
      await completeAnalysisPolling(accepted.id);
    } catch (error) {
      if (!isAbort(error)) {
        setNotice(
          safeFailure(
            error,
            "We could not start an assessment for this resume.",
          ),
        );
      }
      finishOperation(controller);
      setAnalysisBusy(false);
    }
  }

  async function handleApplySuggestions() {
    if (
      !resumeId ||
      !analysis ||
      analysisStale ||
      selectedSuggestionIds.size === 0 ||
      applying
    ) {
      return;
    }
    const controller = beginOperation();
    setApplying(true);
    setNotice(undefined);
    try {
      const result = await applyResumeSuggestions(
        resumeId,
        {
          analysisId: analysis.id,
          suggestionIds: [...selectedSuggestionIds],
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      adoptCanonical({ resume: result.resume, version: result.version });
      setHistoryPage(1);
      setHistoryReloadSequence((current) => current + 1);
      setSelectedSuggestionIds(new Set());
      setAnalysisStale(true);
      setNotice({
        tone: "success",
        message: `${result.appliedCount} ${
          result.appliedCount === 1 ? "suggestion" : "suggestions"
        } applied in version ${result.version.versionNumber}.`,
      });
    } catch (error) {
      if (!isAbort(error)) {
        setNotice(
          safeFailure(
            error,
            "We could not apply the selected suggestions.",
            "This resume or assessment changed. Reload and review before applying suggestions.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <section className="resume-route-state" role="status">
        Loading Resume Studio…
      </section>
    );
  }

  if (loadFailure || !workspace || !draft) {
    return (
      <section className="resume-route-state" role="alert">
        <h1>Resume unavailable</h1>
        <p>{loadFailure?.message ?? "We could not load this resume."}</p>
        {loadFailure?.requestId ? (
          <small>Request ID: {loadFailure.requestId}</small>
        ) : null}
        <button
          type="button"
          onClick={() => setReloadSequence((current) => current + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="resume-workspace" aria-label="Resume Studio workspace">
      <header className="resume-workspace-heading">
        <div>
          <p className="eyebrow">Resume Studio</p>
          <h1>{workspace.resume.title}</h1>
          <p>
            Build a canonical resume, preview it live, and preserve every
            saved change as an immutable version.
          </p>
        </div>
        <div className="resume-workspace-actions">
          {dirty ? (
            <span className="resume-dirty-state">Unsaved changes</span>
          ) : (
            <span className="resume-saved-state">
              Version {workspace.version.versionNumber} saved
            </span>
          )}
          <button
            type="button"
            className="quiet-button"
            disabled={!dirty || saving || applying}
            onClick={() => {
              const next = resumeContentToDraft(workspace.version.content);
              setDraft(next);
              setValidationErrors([]);
              setNotice(undefined);
            }}
          >
            Discard draft changes
          </button>
          <button
            type="button"
            className="primary-button resume-primary-button"
            disabled={!dirty || saving || applying}
            aria-busy={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save new version"}
          </button>
        </div>
      </header>

      {notice ? (
        <div
          className={`resume-notice resume-notice-${notice.tone}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          <span>{notice.message}</span>
          {notice.requestId ? (
            <small>Request ID: {notice.requestId}</small>
          ) : null}
          {notice.action === "reload" ? (
            <button
              type="button"
              onClick={() => {
                setReloadSequence((current) => current + 1);
                setHistoryPage(1);
                setHistoryReloadSequence((current) => current + 1);
              }}
            >
              Reload and review
            </button>
          ) : null}
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="resume-validation-summary" role="alert">
          <h2>Review the highlighted resume content</h2>
          <ul>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="resume-workspace-grid">
        <ResumeEditor
          draft={draft}
          disabled={saving || applying}
          onChange={setDraft}
        />
        <ResumePreview draft={draft} />

        <aside
          className="resume-panel resume-analysis-runner"
          aria-labelledby="resume-analysis-runner-title"
        >
          <header className="resume-panel-header">
            <div>
              <p className="resume-kicker">Current saved version</p>
              <h2 id="resume-analysis-runner-title">
                Role-aware assessment
              </h2>
            </div>
          </header>
          <p className="resume-muted-copy">
            The target details are sent only when you run the assessment.
            They are not stored in browser storage.
          </p>
          <div className="resume-form-grid">
            <label className="resume-field-wide">
              Target role
              <input
                type="text"
                value={targetRole}
                minLength={2}
                maxLength={200}
                disabled={analysisBusy}
                onChange={(event) => setTargetRole(event.target.value)}
              />
            </label>
            <label className="resume-field-wide">
              Company (optional)
              <input
                type="text"
                value={company}
                maxLength={200}
                disabled={analysisBusy}
                onChange={(event) => setCompany(event.target.value)}
              />
            </label>
            <label className="resume-field-wide">
              Job description (optional)
              <textarea
                value={jobDescription}
                maxLength={30_000}
                rows={7}
                disabled={analysisBusy}
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
              />
            </label>
          </div>
          {dirty ? (
            <p className="resume-inline-guidance">
              Save or discard draft changes before assessing this resume.
            </p>
          ) : null}
          {analysisJob ? (
            <p className="resume-job-status" aria-live="polite">
              Job status: {analysisJob.status} · {analysisJob.progress}%
            </p>
          ) : null}
          <div className="resume-button-row">
            <button
              type="button"
              className="primary-button resume-primary-button"
              disabled={
                dirty ||
                analysisBusy ||
                targetRole.trim().length < 2
              }
              aria-busy={analysisBusy}
              onClick={() => void handleRunAnalysis()}
            >
              {analysisBusy
                ? "Checking assessment…"
                : "Run AI-assisted assessment"}
            </button>
            {analysisJobId &&
            notice?.message.includes("status checking paused") ? (
              <button
                type="button"
                disabled={analysisBusy}
                onClick={() =>
                  void completeAnalysisPolling(analysisJobId)
                }
              >
                Check status
              </button>
            ) : null}
          </div>
        </aside>

        <AiRecommendations
          analysis={analysis}
          selectedSuggestionIds={selectedIds}
          stale={analysisStale}
          busy={applying}
          onToggleSuggestion={(suggestionId) => {
            setSelectedSuggestionIds((current) => {
              const next = new Set(current);
              if (next.has(suggestionId)) next.delete(suggestionId);
              else next.add(suggestionId);
              return next;
            });
          }}
          onConfirmApply={() => void handleApplySuggestions()}
        />
      </div>

      <section className="resume-version-history" aria-labelledby="resume-version-history-title">
        <header>
          <div>
            <p className="resume-kicker">Immutable timeline</p>
            <h2 id="resume-version-history-title">Version history</h2>
          </div>
        </header>
        {historyLoading ? (
          <p className="resume-state" role="status">
            Loading version history…
          </p>
        ) : historyFailure ? (
          <div className="resume-state resume-state--error" role="alert">
            <p>{historyFailure.message}</p>
            {historyFailure.requestId ? (
              <small>Request ID: {historyFailure.requestId}</small>
            ) : null}
            <button
              type="button"
              onClick={() =>
                setHistoryReloadSequence((current) => current + 1)
              }
            >
              Retry history
            </button>
          </div>
        ) : versions.length === 0 ? (
          <p>No saved version history is available.</p>
        ) : (
          <ol>
            {versions.map((version) => (
              <li key={version.id}>
                <div>
                  <strong>Version {version.versionNumber}</strong>
                  <span>
                    {version.id === workspace.version.id
                      ? "Current version"
                      : version.changeSummary ?? "Saved version"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={version.id === snapshot?.id}
                  onClick={() => void handleViewVersion(version)}
                >
                  View version {version.versionNumber}
                </button>
              </li>
            ))}
          </ol>
        )}
        {historyPagination && historyPagination.pages > 1 ? (
          <div className="resume-pagination" aria-label="Version pages">
            <button
              type="button"
              disabled={historyLoading || historyPage <= 1}
              onClick={() =>
                setHistoryPage((current) => current - 1)
              }
            >
              Previous versions
            </button>
            <span>
              Version page {historyPage} of {historyPagination.pages}
            </span>
            <button
              type="button"
              disabled={
                historyLoading ||
                historyPage >= historyPagination.pages
              }
              onClick={() =>
                setHistoryPage((current) => current + 1)
              }
            >
              Next versions
            </button>
          </div>
        ) : null}
      </section>

      {snapshot ? (
        <section className="resume-snapshot" aria-labelledby="resume-snapshot-title">
          <header>
            <div>
              <p className="resume-kicker">Historical snapshot</p>
              <h2 id="resume-snapshot-title">
                Read-only version {snapshot.versionNumber}
              </h2>
            </div>
            <button type="button" onClick={() => setSnapshot(undefined)}>
              Return to current draft
            </button>
          </header>
          <ResumePreview
            draft={resumeContentToDraft(snapshot.content)}
            label={`Version ${snapshot.versionNumber} preview`}
            headingId="resume-snapshot-preview-title"
            ariaLabel={`Resume version ${snapshot.versionNumber} preview`}
          />
        </section>
      ) : null}

      {blocker.state === "blocked" ? (
        <Dialog
          open
          className="resume-dialog"
          labelledBy="resume-navigation-dialog-title"
          describedBy="resume-navigation-dialog-description"
          initialFocusRef={keepEditingButtonRef}
          onCancel={() => blocker.reset()}
        >
          <h2 id="resume-navigation-dialog-title">Unsaved changes</h2>
          <p id="resume-navigation-dialog-description">
            Leaving now will discard changes that have not been saved as
            a new version.
          </p>
          <div className="resume-dialog-actions">
            <button
              ref={keepEditingButtonRef}
              type="button"
              onClick={() => blocker.reset()}
            >
              Keep editing
            </button>
            <button
              type="button"
              className="destructive-button resume-danger-button"
              onClick={() => blocker.proceed()}
            >
              Leave without saving
            </button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
