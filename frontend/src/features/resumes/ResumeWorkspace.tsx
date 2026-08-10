import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBlocker, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { Dialog } from "../../components/Dialog";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import { AiRecommendations } from "./AiRecommendations";
import {
  ResumeDesignControls,
  type ResumeDesignStatus,
} from "./ResumeDesignControls";
import {
  ResumeEditor,
  type ResumeEditorFocusRequest,
} from "./ResumeEditor";
import { ResumePrintControls } from "./ResumePrintControls";
import { ResumePreview } from "./ResumePreview";
import {
  ResumeVersionSourceBadge,
  ResumeVersionTimeline,
} from "./ResumeVersionTimeline";
import {
  applyResumeSuggestions,
  fetchJob,
  fetchResume,
  fetchResumeAnalysis,
  fetchResumeVersion,
  listResumeVersions,
  queueResumeAnalysis,
  saveResumeVersion,
  updateResumeDesign,
} from "./resumeApi";
import {
  draftFingerprint,
  draftToInput,
  parseResumeValidationDetails,
  resumeFieldId,
  resumeContentToDraft,
  type ResumeDraftValidationError,
  validateResumeDraft,
} from "./resumeDraft";
import { pollResumeJob } from "./resumePolling";
import {
  createResumePrintTitle,
  openResumePrint,
} from "./resumePrint";
import type { ResumePresentationSelection } from "./resumeTemplateRegistry";
import type {
  ResumeAnalysis,
  ResumeDesign,
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

function saveFailure(error: unknown): Notice {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        tone: "warning",
        message:
          "A newer version exists. Reload and review before saving again.",
        requestId: error.requestId,
        action: "reload",
      };
    }
    if (error.status === 400 || error.status === 422) {
      return {
        tone: "error",
        message: "The server rejected one or more resume fields.",
        requestId: error.requestId,
      };
    }
    if (error.status === 401 || error.status === 403) {
      return {
        tone: "error",
        message: "You are not authorized to save this resume.",
        requestId: error.requestId,
      };
    }
    if (error.status === 404) {
      return {
        tone: "error",
        message: "The resume is no longer available.",
        requestId: error.requestId,
      };
    }
    if (error.status === 429) {
      return {
        tone: "warning",
        message: "Too many save attempts. Wait a moment and try again.",
        requestId: error.requestId,
      };
    }
    if (error.status >= 500) {
      return {
        tone: "error",
        message: "The server could not save a new resume version.",
        requestId: error.requestId,
      };
    }
    return {
      tone: "error",
      message: "The resume could not be saved.",
      requestId: error.requestId,
    };
  }
  if (error instanceof TypeError) {
    return {
      tone: "error",
      message: "A network error prevented the resume from being saved.",
    };
  }
  return {
    tone: "error",
    message: "An unexpected error prevented the resume from being saved.",
  };
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
  const [snapshotLoadingId, setSnapshotLoadingId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<Notice>();
  const [reloadSequence, setReloadSequence] = useState(0);
  const [notice, setNotice] = useState<Notice>();
  const [validationErrors, setValidationErrors] = useState<
    ResumeDraftValidationError[]
  >([]);
  const [editorFocusRequest, setEditorFocusRequest] =
    useState<ResumeEditorFocusRequest>();
  const [saving, setSaving] = useState(false);
  const [designMutationSaving, setDesignMutationSaving] = useState(false);
  const [designStatus, setDesignStatus] =
    useState<ResumeDesignStatus>();
  const [previewDesign, setPreviewDesign] = useState<ResumeDesign>();
  const [pageSizeFailure, setPageSizeFailure] = useState<Notice>();
  const [printPreparing, setPrintPreparing] = useState(false);
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
  const snapshotControllerRef = useRef<AbortController | undefined>(
    undefined,
  );
  const analysisControllerRef = useRef<AbortController | undefined>(
    undefined,
  );
  const designMutationRef = useRef(false);
  const saveMutationRef = useRef(false);
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);
  const editorFocusRequestIdRef = useRef(0);

  const dirty =
    draft !== undefined &&
    draftFingerprint(draft) !== baselineFingerprint;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  function beginOperation(): AbortController {
    const controller = new AbortController();
    activeControllers.current.add(controller);
    return controller;
  }

  function finishOperation(controller: AbortController) {
    activeControllers.current.delete(controller);
  }

  function focusResumeField(path: string) {
    editorFocusRequestIdRef.current += 1;
    setEditorFocusRequest({
      id: editorFocusRequestIdRef.current,
      path,
    });
  }

  function adoptCanonical(next: ResumeWorkspaceData) {
    const nextDraft = resumeContentToDraft(next.version.content);
    setWorkspace(next);
    setDraft(nextDraft);
    setBaselineFingerprint(draftFingerprint(nextDraft));
    setSnapshot(undefined);
    setValidationErrors([]);
    setPreviewDesign(next.resume.design);
  }

  useEffect(() => {
    snapshotControllerRef.current?.abort();
    analysisControllerRef.current?.abort();
    snapshotControllerRef.current = undefined;
    setSaving(false);
    saveMutationRef.current = false;
    setAnalysisBusy(false);
    setApplying(false);
    designMutationRef.current = false;
    setDesignMutationSaving(false);
    setDesignStatus(undefined);
    setPreviewDesign(undefined);
    setPageSizeFailure(undefined);
    setPrintPreparing(false);
    setSnapshot(undefined);
    setSnapshotLoadingId(undefined);
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
    if (!resumeId || !workspace || !draft || saveMutationRef.current) return;
    const errors = validateResumeDraft(draft);
    setValidationErrors(errors);
    setNotice(undefined);
    if (errors.length > 0) {
      focusResumeField(errors[0]!.path);
      return;
    }

    saveMutationRef.current = true;
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
        setNotice(saveFailure(error));
        if (
          error instanceof ApiError &&
          (error.status === 400 || error.status === 422)
        ) {
          const serverErrors = parseResumeValidationDetails(error.details);
          if (serverErrors.length > 0) {
            setValidationErrors(serverErrors);
            focusResumeField(serverErrors[0]!.path);
          }
        }
      }
    } finally {
      finishOperation(controller);
      saveMutationRef.current = false;
      setSaving(false);
    }
  }

  async function cancelAnalysis(signal: AbortSignal): Promise<void> {
    if (!analysisJob) return;
    const cancelled = await cancelJob(analysisJob.id, signal);
    if (signal.aborted) return;
    if (cancelled.id !== analysisJob.id || cancelled.type !== "resume.analyze") {
      throw new ApiError(502, "INVALID_RESUME_JOB", "The server returned a mismatched resume job.");
    }
    if (cancelled.status !== "cancelled") {
      setAnalysisJob({ ...analysisJob, status: "processing", phase: cancelled.phase, phaseSequence: cancelled.phaseSequence, canRetry: cancelled.canRetry, updatedAt: cancelled.updatedAt });
      return;
    }
    analysisControllerRef.current?.abort();
    setAnalysisBusy(false);
    setAnalysisJob({
      ...analysisJob,
      status: "cancelled",
      phase: cancelled.phase,
      phaseSequence: cancelled.phaseSequence,
      canRetry: cancelled.canRetry,
      updatedAt: cancelled.updatedAt,
    });
    setNotice({ tone: "warning", message: "The assessment job was cancelled." });
  }

  async function retryAnalysis(signal: AbortSignal): Promise<void> {
    if (!analysisJob) return;
    const retried = await retryJob(analysisJob.id, signal);
    if (signal.aborted) return;
    if (retried.type !== "resume.analyze") {
      throw new ApiError(502, "INVALID_RESUME_JOB", "The server returned a mismatched resume job.");
    }
    setAnalysisJobId(retried.id);
    await completeAnalysisPolling(retried.id);
  }

  async function handleViewVersion(version: ResumeVersionMetadata) {
    if (!resumeId) return;
    snapshotControllerRef.current?.abort();
    const controller = beginOperation();
    snapshotControllerRef.current = controller;
    setNotice(undefined);
    setSnapshot(undefined);
    setSnapshotLoadingId(version.id);
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
      if (snapshotControllerRef.current === controller) {
        snapshotControllerRef.current = undefined;
      }
      setSnapshotLoadingId((current) =>
        current === version.id ? undefined : current,
      );
    }
  }

  async function handlePageSizeChange(
    pageSize: ResumeDesign["pageSize"],
  ) {
    if (
      !resumeId ||
      !workspace ||
      designMutationRef.current ||
      pageSize === workspace.resume.design.pageSize
    ) {
      return;
    }
    designMutationRef.current = true;
    const controller = beginOperation();
    setDesignMutationSaving(true);
    setDesignStatus(undefined);
    setPageSizeFailure(undefined);
    setNotice(undefined);
    try {
      const resume = await updateResumeDesign(
        resumeId,
        { ...workspace.resume.design, pageSize },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setWorkspace((current) =>
        current ? { ...current, resume } : current,
      );
      setPreviewDesign((current) => ({
        ...(current ?? resume.design),
        pageSize: resume.design.pageSize,
        showProfilePhoto: false,
      }));
      setNotice({
        tone: "success",
        message: `Paper size saved as ${
          resume.design.pageSize === "LETTER" ? "Letter" : "A4"
        }.`,
      });
    } catch (error) {
      if (!isAbort(error)) {
        setPageSizeFailure(
          safeFailure(error, "The paper size could not be saved."),
        );
      }
    } finally {
      finishOperation(controller);
      designMutationRef.current = false;
      setDesignMutationSaving(false);
    }
  }

  async function handleDesignSave(
    selection: ResumePresentationSelection,
  ) {
    if (!resumeId || !workspace || designMutationRef.current) return;

    designMutationRef.current = true;
    const controller = beginOperation();
    setDesignMutationSaving(true);
    setDesignStatus(undefined);
    setPageSizeFailure(undefined);
    try {
      const resume = await updateResumeDesign(
        resumeId,
        {
          ...workspace.resume.design,
          ...selection,
          showProfilePhoto: false,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setWorkspace((current) =>
        current ? { ...current, resume } : current,
      );
      setPreviewDesign(resume.design);
      setDesignStatus({
        tone: "success",
        message: "Resume design saved.",
      });
    } catch (error) {
      if (!isAbort(error)) {
        const failure = safeFailure(
          error,
          "The resume design could not be saved.",
        );
        setDesignStatus({
          tone: "error",
          message: failure.message,
          requestId: failure.requestId,
        });
      }
    } finally {
      finishOperation(controller);
      designMutationRef.current = false;
      setDesignMutationSaving(false);
    }
  }

  function handlePrint() {
    const version = snapshot ?? workspace?.version;
    if (!workspace || !version || dirty || printPreparing) return;
    setNotice(undefined);
    void openResumePrint({
      title: createResumePrintTitle({
        resumeTitle: workspace.resume.title,
        versionNumber: version.versionNumber,
        pageSize: workspace.resume.design.pageSize,
      }),
      onPrintStateChange: setPrintPreparing,
    }).catch((error: unknown) => {
      setPrintPreparing(false);
      setNotice(
        safeFailure(error, "We could not open the browser print dialog."),
      );
    });
  }

  async function completeAnalysisPolling(jobIdentifier: string) {
    if (!resumeId || !workspace) return;
    const expectedVersionId = workspace.version.id;
    const controller = beginOperation();
    analysisControllerRef.current?.abort();
    analysisControllerRef.current = controller;
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
      if (analysisControllerRef.current === controller) {
        analysisControllerRef.current = undefined;
      }
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
        <Breadcrumbs
          items={[
            { label: "Resumes", to: "/resumes" },
            { label: "Loading resume" },
          ]}
        />
        Loading Resume Studio…
      </section>
    );
  }

  if (loadFailure || !workspace || !draft) {
    return (
      <section className="resume-route-state" role="alert">
        <Breadcrumbs
          items={[
            { label: "Resumes", to: "/resumes" },
            { label: "Resume unavailable" },
          ]}
        />
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
      <Breadcrumbs
        items={[
          { label: "Resumes", to: "/resumes" },
          { label: workspace.resume.title },
        ]}
      />
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
              <li key={`${error.path}:${error.message}`}>
                <a
                  href={`#${resumeFieldId(error.path)}`}
                  onClick={() => focusResumeField(error.path)}
                >
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ResumeDesignControls
        design={workspace.resume.design}
        saving={designMutationSaving}
        status={designStatus}
        onPreviewChange={(selection) => {
          setDesignStatus(undefined);
          setPreviewDesign({
            ...workspace.resume.design,
            ...selection,
            showProfilePhoto: false,
          });
        }}
        onSave={(selection) => void handleDesignSave(selection)}
      />

      <ResumePrintControls
        sourceKind={snapshot ? "historical" : "current"}
        versionNumber={
          (snapshot ?? workspace.version).versionNumber
        }
        pageSize={workspace.resume.design.pageSize}
        dirty={dirty}
        pageSizeSaving={designMutationSaving}
        printPreparing={printPreparing}
        sourceLoading={snapshotLoadingId !== undefined}
        error={
          pageSizeFailure
            ? {
                message: pageSizeFailure.message,
                requestId: pageSizeFailure.requestId,
              }
            : undefined
        }
        onPageSizeChange={(pageSize) =>
          void handlePageSizeChange(pageSize)
        }
        onPrint={handlePrint}
      />

      <div className="resume-workspace-grid">
        <div className="resume-editor-preview-grid">
          <ResumeEditor
            draft={draft}
            disabled={saving || applying}
            validationErrors={validationErrors}
            focusRequest={editorFocusRequest}
            onChange={(nextDraft) => {
              setDraft(nextDraft);
              if (validationErrors.length > 0) {
                setValidationErrors(validateResumeDraft(nextDraft));
              }
            }}
          />
          <ResumePreview
            draft={draft}
            pageSize={workspace.resume.design.pageSize}
            design={previewDesign ?? workspace.resume.design}
          />
        </div>

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
            <div className="resume-job-status">
              <span>{analysisJob.progress}% checked</span>
              <JobResilienceActions
                job={normalizeSafeJob(analysisJob)}
                onCancel={cancelAnalysis}
                onRetry={retryAnalysis}
              />
            </div>
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
          loading={analysisBusy}
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

      <ResumeVersionTimeline
        versions={versions}
        currentVersionId={workspace.version.id}
        selectedVersionId={snapshot?.id}
        loadingVersionId={snapshotLoadingId}
        loading={historyLoading}
        failure={historyFailure}
        pagination={historyPagination}
        page={historyPage}
        onView={(version) => void handleViewVersion(version)}
        onRetry={() =>
          setHistoryReloadSequence((current) => current + 1)
        }
        onPreviousPage={() =>
          setHistoryPage((current) => current - 1)
        }
        onNextPage={() =>
          setHistoryPage((current) => current + 1)
        }
      />

      {snapshotLoadingId ? (
        <section
          className="resume-snapshot resume-snapshot--loading"
          aria-labelledby="resume-snapshot-loading-title"
          role="status"
        >
          <header className="resume-snapshot-header">
            <div>
              <p className="resume-kicker">Historical snapshot</p>
              <h2 id="resume-snapshot-loading-title">
                Loading selected saved version
              </h2>
            </div>
          </header>
          <div
            className="resume-snapshot-preview-skeleton"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : snapshot ? (
        <section
          className="resume-snapshot resume-snapshot--visible"
          aria-labelledby="resume-snapshot-title"
        >
          <header className="resume-snapshot-header">
            <div className="resume-snapshot-heading">
              <p className="resume-kicker">Historical snapshot</p>
              <h2 id="resume-snapshot-title">
                Read-only version {snapshot.versionNumber}
              </h2>
              <div className="resume-snapshot-metadata">
                <ResumeVersionSourceBadge source={snapshot.source} />
                <span className="resume-snapshot-read-only">
                  <svg viewBox="0 0 18 18" aria-hidden="true">
                    <rect x="4" y="8" width="10" height="7" rx="1.5" />
                    <path d="M6.5 8V6a2.5 2.5 0 0 1 5 0v2" />
                  </svg>
                  Read-only
                </span>
                <time dateTime={snapshot.createdAt}>
                  Saved{" "}
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(snapshot.createdAt))}
                </time>
              </div>
            </div>
            <button
              type="button"
              className="resume-snapshot-return"
              onClick={() => setSnapshot(undefined)}
            >
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path d="m10.5 4-5 5 5 5M6 9h7" />
              </svg>
              Return to current draft
            </button>
          </header>
          <p className="resume-snapshot-design-note">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 9v5M10 6h.01" />
            </svg>
            Design choices are not saved with each version, so this
            snapshot uses the current resume design.
          </p>
          <ResumePreview
            draft={resumeContentToDraft(snapshot.content)}
            label={`Version ${snapshot.versionNumber} preview`}
            headingId="resume-snapshot-preview-title"
            ariaLabel={`Resume version ${snapshot.versionNumber} preview`}
            pageSize={workspace.resume.design.pageSize}
            design={workspace.resume.design}
          />
        </section>
      ) : null}

      <ResumePreview
        draft={resumeContentToDraft(
          (snapshot ?? workspace.version).content,
        )}
        label={`Printable ${
          snapshot ? "historical" : "current"
        } saved version ${(snapshot ?? workspace.version).versionNumber}`}
        ariaLabel="Printable saved resume"
        pageSize={workspace.resume.design.pageSize}
        design={workspace.resume.design}
        printOnly
      />

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
