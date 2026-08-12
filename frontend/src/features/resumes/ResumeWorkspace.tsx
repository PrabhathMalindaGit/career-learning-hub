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
import { useAuth } from "../auth/AuthProvider";
import { JobResilienceActions } from "../jobs/JobResilienceActions";
import {
  cancelJob,
  normalizeSafeJob,
  retryJob,
} from "../jobs/jobResilience";
import { AiRecommendations } from "./AiRecommendations";
import { ResumeCandidatePhotoControls } from "./ResumeCandidatePhotoControls";
import {
  ResumeDesignControls,
  type ResumeDesignStatus,
} from "./ResumeDesignControls";
import {
  ResumeEditor,
  RESUME_JOB_TITLE_DATALIST_ID,
  type ResumeEditorFocusRequest,
} from "./ResumeEditor";
import {
  ResumePrintControls,
  type ResumeExportReadiness,
} from "./ResumePrintControls";
import { ResumePreview } from "./ResumePreview";
import { ResumeRecoveryReview } from "./ResumeRecoveryReview";
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
  fetchResumeCandidatePhotoSource,
  removeResumeCandidatePhoto,
  uploadResumeCandidatePhoto,
} from "./resumeCandidatePhotoGateway";
import {
  CandidatePhotoError,
  loadCanonicalCandidatePhoto,
  preflightCandidatePhoto,
} from "./resumeCandidatePhoto";
import {
  draftFingerprint,
  draftToInput,
  parseResumeValidationDetails,
  resumeFieldId,
  resumeContentInputToDraft,
  resumeContentToDraft,
  type ResumeDraftValidationError,
  validateResumeDraft,
} from "./resumeDraft";
import { pollResumeJob } from "./resumePolling";
import {
  createResumeSuggestedFilename,
  createResumePrintTitle,
  openResumePrint,
} from "./resumePrint";
import {
  classifyResumeRecovery,
  createResumeRecoveryKey,
  readResumeRecovery,
  removeObsoleteResumeRecovery,
  removeResumeRecoveryExact,
  type ResumeRecoveryEnvelope,
} from "./resumeRecovery";
import {
  createResumeRecoveryWriter,
  type ResumeRecoveryWriter,
} from "./resumeRecoveryWriter";
import { parseResumeRecoveryContent } from "./resumeContracts";
import type { ResumePresentationSelection } from "./resumeTemplateRegistry";
import type {
  ResumeAnalysis,
  ResumeDesign,
  ResumeDraft,
  ResumeJob,
  ResumeRecord,
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
  action?: "reload" | "retry-cleanup";
};

type CanonicalSaveState = "SAVED" | "DIRTY" | "SAVING" | "SAVE_FAILED";

type FailedSaveAttempt = {
  fingerprint: string;
  conflict: boolean;
};

type RecoveryCleanupDebt = {
  key: string;
  obsoleteBaselineVersionId: string;
};

type RecoveryGate =
  | { kind: "RECOVERY_AVAILABLE"; payload: ResumeRecoveryEnvelope }
  | { kind: "STALE_CONFLICTED_RECOVERY"; payload: ResumeRecoveryEnvelope }
  | { kind: "STALE_RECOVERY_REVIEW"; payload: ResumeRecoveryEnvelope };

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

function candidatePhotoFailure(
  error: unknown,
  fallback: string,
): Notice {
  if (error instanceof CandidatePhotoError) {
    return { tone: "error", message: error.message };
  }
  return safeFailure(
    error,
    fallback,
    "The candidate photo changed after this Resume was loaded. Reload and review before trying again.",
  );
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
  const { user } = useAuth();
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
  const [failedSave, setFailedSave] = useState<FailedSaveAttempt>();
  const [recoveryCleanupDebt, setRecoveryCleanupDebt] =
    useState<RecoveryCleanupDebt>();
  const [recoveryWriteUnavailable, setRecoveryWriteUnavailable] =
    useState(false);
  const [recoveryGate, setRecoveryGate] = useState<RecoveryGate>();
  const [recoveryDiscardError, setRecoveryDiscardError] = useState(false);
  const [navigationDiscardError, setNavigationDiscardError] = useState(false);
  const [workspaceOwnerUserId, setWorkspaceOwnerUserId] = useState<string>();
  const [designMutationSaving, setDesignMutationSaving] = useState(false);
  const [designStatus, setDesignStatus] =
    useState<ResumeDesignStatus>();
  const [previewDesign, setPreviewDesign] = useState<ResumeDesign>();
  const [pageSizeFailure, setPageSizeFailure] = useState<Notice>();
  const [printPreparing, setPrintPreparing] = useState(false);
  const [candidatePhotoSourceUrl, setCandidatePhotoSourceUrl] =
    useState<string>();
  const [candidatePhotoSourceLoading, setCandidatePhotoSourceLoading] =
    useState(false);
  const [candidatePhotoSourceFailure, setCandidatePhotoSourceFailure] =
    useState<Notice>();
  const [candidatePhotoMutationFailure, setCandidatePhotoMutationFailure] =
    useState<Notice>();
  const [candidatePhotoMutationSaving, setCandidatePhotoMutationSaving] =
    useState(false);
  const [candidatePhotoSourceReloadSequence, setCandidatePhotoSourceReloadSequence] =
    useState(0);
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
  const candidatePhotoSourceControllerRef = useRef<AbortController | undefined>(
    undefined,
  );
  const candidatePhotoObjectUrlRef = useRef<string | undefined>(undefined);
  const candidatePhotoSelectionGenerationRef = useRef(0);
  const designMutationRef = useRef(false);
  const saveMutationRef = useRef(false);
  const saveOperationRef = useRef<() => void>(() => undefined);
  const recoveryWriterRef = useRef<ResumeRecoveryWriter | undefined>(undefined);
  const recoveryHadDirtyDraftRef = useRef(false);
  const restoreRecoveryButtonRef = useRef<HTMLButtonElement>(null);
  const reviewRecoveryButtonRef = useRef<HTMLButtonElement>(null);
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);
  const editorFocusRequestIdRef = useRef(0);

  const currentFingerprint = draft ? draftFingerprint(draft) : "";
  const dirty = draft !== undefined && currentFingerprint !== baselineFingerprint;
  const saveState: CanonicalSaveState = saving
    ? "SAVING"
    : dirty && failedSave?.fingerprint === currentFingerprint
      ? "SAVE_FAILED"
      : dirty
        ? "DIRTY"
        : "SAVED";
  const selectedExportVersion = snapshot ?? workspace?.version;
  const selectedSourceIsHistorical =
    snapshot !== undefined &&
    workspace !== undefined &&
    snapshot.id !== workspace.version.id;
  const loadingSourceIsHistorical =
    snapshotLoadingId !== undefined &&
    workspace !== undefined &&
    snapshotLoadingId !== workspace.version.id;
  const hasCandidatePhoto = workspace?.resume.candidatePhotoAssetId !== undefined;
  const candidatePhotoVisible =
    hasCandidatePhoto && workspace?.resume.design.showProfilePhoto === true;
  const exportReadiness: ResumeExportReadiness = recoveryGate
    ? {
        eligible: false,
        reasonId: "resume-export-recovery-blocker",
        message: "Resolve recovered work before printing or saving as PDF.",
      }
    : snapshotLoadingId
      ? {
          eligible: false,
          reasonId: "resume-export-source-loading",
          message: "Loading the selected saved version before printing…",
        }
      : designMutationSaving || candidatePhotoMutationSaving
        ? {
            eligible: false,
            reasonId: "resume-export-design-saving",
            message: "Wait for Resume presentation changes to finish saving.",
          }
        : candidatePhotoVisible && candidatePhotoSourceLoading
          ? {
              eligible: false,
              reasonId: "resume-export-photo-loading",
              message: "Loading the saved candidate photo before printing…",
            }
          : candidatePhotoVisible &&
              (candidatePhotoSourceFailure || !candidatePhotoSourceUrl)
            ? {
                eligible: false,
                reasonId: "resume-export-photo-unavailable",
                message: "Retry the saved candidate photo before printing.",
              }
            : printPreparing
              ? {
                  eligible: false,
                  reasonId: "resume-export-preparing",
                  message: "Preparing the saved Resume for browser printing…",
                }
              : !selectedExportVersion
                ? {
                    eligible: false,
                    reasonId: "resume-export-no-version",
                    message: "Save a Resume version before printing or saving as PDF.",
                  }
                : !selectedSourceIsHistorical && saving
                  ? {
                      eligible: false,
                      reasonId: "resume-export-saving",
                      message: "Saving is in progress. Wait for the new version to finish.",
                    }
                  : !selectedSourceIsHistorical && dirty
                    ? {
                        eligible: false,
                        reasonId: "resume-export-unsaved",
                        message: "Save your changes before printing or saving as PDF.",
                      }
                    : {
                        eligible: true,
                        message: "Ready to print / save as PDF",
                      };
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || recoveryGate !== undefined) &&
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

  function replaceCandidatePhotoObjectUrl(next?: string) {
    const current = candidatePhotoObjectUrlRef.current;
    if (current && current !== next) {
      URL.revokeObjectURL(current);
    }
    candidatePhotoObjectUrlRef.current = next;
    setCandidatePhotoSourceUrl(next);
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

  function adoptPhotoResume(resume: ResumeRecord) {
    setWorkspace((current) =>
      current ? { ...current, resume } : current,
    );
    setPreviewDesign((current) =>
      current
        ? {
            ...current,
            pageSize: resume.design.pageSize,
            showProfilePhoto: resume.design.showProfilePhoto,
          }
        : resume.design,
    );
  }

  useEffect(() => {
    snapshotControllerRef.current?.abort();
    analysisControllerRef.current?.abort();
    candidatePhotoSourceControllerRef.current?.abort();
    snapshotControllerRef.current = undefined;
    candidatePhotoSourceControllerRef.current = undefined;
    candidatePhotoSelectionGenerationRef.current += 1;
    replaceCandidatePhotoObjectUrl(undefined);
    setSaving(false);
    saveMutationRef.current = false;
    setFailedSave(undefined);
    setRecoveryCleanupDebt(undefined);
    setRecoveryGate(undefined);
    setRecoveryDiscardError(false);
    setNavigationDiscardError(false);
    setWorkspaceOwnerUserId(undefined);
    setAnalysisBusy(false);
    setApplying(false);
    designMutationRef.current = false;
    setDesignMutationSaving(false);
    setDesignStatus(undefined);
    setPreviewDesign(undefined);
    setPageSizeFailure(undefined);
    setPrintPreparing(false);
    setCandidatePhotoSourceLoading(false);
    setCandidatePhotoSourceFailure(undefined);
    setCandidatePhotoMutationFailure(undefined);
    setCandidatePhotoMutationSaving(false);
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
      candidatePhotoSourceControllerRef.current?.abort();
      const objectUrl = candidatePhotoObjectUrlRef.current;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      candidatePhotoObjectUrlRef.current = undefined;
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
    if (!resumeId || !user) {
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
    setRecoveryGate(undefined);
    setRecoveryDiscardError(false);
    setAnalysis(undefined);
    setAnalysisStale(false);
    setSelectedSuggestionIds(new Set());

    void fetchResume(resumeId, controller.signal)
      .then((nextWorkspace) => {
        if (!active) return;
        adoptCanonical(nextWorkspace);
        setWorkspaceOwnerUserId(user.id);
        const recovery = readResumeRecovery({
          storage: sessionStorage,
          userId: user.id,
          resumeId: nextWorkspace.resume.id,
          now: Date.now(),
        });
        if (recovery.kind !== "VALID") return;
        const canonicalDraft = resumeContentToDraft(
          nextWorkspace.version.content,
        );
        const classification = classifyResumeRecovery({
          payload: recovery.payload,
          canonicalVersionId: nextWorkspace.version.id,
          canonicalFingerprint: draftFingerprint(canonicalDraft),
        });
        if (classification.kind === "CLEAN_OBSOLETE") {
          removeResumeRecoveryExact(
            sessionStorage,
            createResumeRecoveryKey(user.id, nextWorkspace.resume.id),
          );
          return;
        }
        setRecoveryGate(classification);
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
  }, [resumeId, reloadSequence, user?.id]);

  useEffect(() => {
    candidatePhotoSourceControllerRef.current?.abort();
    replaceCandidatePhotoObjectUrl(undefined);
    setCandidatePhotoSourceFailure(undefined);

    const assetId = workspace?.resume.candidatePhotoAssetId;
    if (!resumeId || !user || !assetId) {
      setCandidatePhotoSourceLoading(false);
      return;
    }

    const controller = new AbortController();
    candidatePhotoSourceControllerRef.current = controller;
    let active = true;
    setCandidatePhotoSourceLoading(true);

    void fetchResumeCandidatePhotoSource(resumeId, controller.signal)
      .then((source) => loadCanonicalCandidatePhoto(source, controller.signal))
      .then((objectUrl) => {
        if (
          !active ||
          controller.signal.aborted ||
          candidatePhotoSourceControllerRef.current !== controller
        ) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        replaceCandidatePhotoObjectUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!active || isAbort(error)) return;
        setCandidatePhotoSourceFailure(
          candidatePhotoFailure(
            error,
            "The saved candidate photo could not be loaded. Try again.",
          ),
        );
      })
      .finally(() => {
        if (
          active &&
          candidatePhotoSourceControllerRef.current === controller
        ) {
          setCandidatePhotoSourceLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (candidatePhotoSourceControllerRef.current === controller) {
        candidatePhotoSourceControllerRef.current = undefined;
      }
    };
  }, [
    resumeId,
    user?.id,
    workspace?.resume.candidatePhotoAssetId,
    candidatePhotoSourceReloadSequence,
  ]);

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

  useEffect(() => {
    const handleWorkspaceSaveShortcut = (event: KeyboardEvent) => {
      const recognized =
        event.key.toLowerCase() === "s" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      if (!recognized || event.isComposing) return;
      event.preventDefault();
      if (event.repeat) return;
      saveOperationRef.current();
    };
    document.addEventListener("keydown", handleWorkspaceSaveShortcut);
    return () =>
      document.removeEventListener("keydown", handleWorkspaceSaveShortcut);
  }, []);

  useEffect(() => {
    if (!user || !resumeId) return;
    let active = true;
    recoveryHadDirtyDraftRef.current = false;
    setRecoveryWriteUnavailable(false);
    const writer = createResumeRecoveryWriter({
      storage: sessionStorage,
      userId: user.id,
      resumeId,
      onWriteResult: (result) => {
        if (!active) return;
        if (result === "failure") {
          setRecoveryWriteUnavailable(true);
          return;
        }
        setRecoveryWriteUnavailable(false);
        setRecoveryCleanupDebt(undefined);
        setNotice((current) =>
          current?.action === "retry-cleanup" ? undefined : current,
        );
      },
    });
    recoveryWriterRef.current = writer;
    return () => {
      active = false;
      writer.dispose();
      if (recoveryWriterRef.current === writer) {
        recoveryWriterRef.current = undefined;
      }
    };
  }, [resumeId, user?.id]);

  useEffect(() => {
    const flushPendingRecovery = () => {
      recoveryWriterRef.current?.flush({ reportFailure: false });
    };
    window.addEventListener("pagehide", flushPendingRecovery);
    return () => window.removeEventListener("pagehide", flushPendingRecovery);
  }, [resumeId, user?.id]);

  useEffect(() => {
    const writer = recoveryWriterRef.current;
    if (!writer || !user || !workspace || !draft || recoveryGate) return;
    if (
      workspace.resume.id !== resumeId ||
      workspace.resume.id !== workspace.version.resumeId
    ) {
      return;
    }

    if (dirty) {
      const content = draftToInput(draft);
      try {
        parseResumeRecoveryContent(content);
      } catch {
        return;
      }
      recoveryHadDirtyDraftRef.current = true;
      writer.schedule({
        fingerprint: currentFingerprint,
        payload: {
          schemaVersion: 1,
          userId: user.id,
          resumeId: workspace.resume.id,
          baselineVersionId: workspace.version.id,
          baselineVersionNumber: workspace.version.versionNumber,
          content,
        },
      });
      return;
    }

    if (!recoveryHadDirtyDraftRef.current) return;
    writer.cancelPending();
    removeResumeRecoveryExact(
      sessionStorage,
      createResumeRecoveryKey(user.id, workspace.resume.id),
    );
    recoveryHadDirtyDraftRef.current = false;
    setRecoveryWriteUnavailable(false);
  }, [
    currentFingerprint,
    dirty,
    draft,
    resumeId,
    recoveryGate,
    user,
    workspace,
  ]);

  async function handleSave() {
    if (
      !resumeId ||
      !user ||
      !workspace ||
      !draft ||
      saveMutationRef.current ||
      !dirty ||
      snapshot ||
      printPreparing ||
      applying ||
      failedSave?.conflict ||
      recoveryGate
    ) {
      return;
    }
    const errors = validateResumeDraft(draft);
    setValidationErrors(errors);
    setNotice(undefined);
    if (errors.length > 0) {
      focusResumeField(errors[0]!.path);
      return;
    }

    saveMutationRef.current = true;
    const submittedFingerprint = currentFingerprint;
    const obsoleteBaselineVersionId = workspace.version.id;
    const recoveryKey = createResumeRecoveryKey(user.id, workspace.resume.id);
    const controller = beginOperation();
    setFailedSave(undefined);
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
      recoveryWriterRef.current?.cancelPending();
      adoptCanonical(next);
      setHistoryPage(1);
      setHistoryReloadSequence((current) => current + 1);
      if (analysis) setAnalysisStale(true);
      const cleanupConfirmed = removeObsoleteResumeRecovery({
        storage: sessionStorage,
        key: recoveryKey,
        obsoleteBaselineVersionId,
      });
      if (cleanupConfirmed) {
        setRecoveryCleanupDebt(undefined);
        setNotice({
          tone: "success",
          message: `Version ${next.version.versionNumber} saved.`,
        });
      } else {
        setRecoveryCleanupDebt({ key: recoveryKey, obsoleteBaselineVersionId });
        setNotice({
          tone: "warning",
          message:
            "Your new version was saved, but local recovery data could not be cleared. Please retry cleanup.",
          action: "retry-cleanup",
        });
      }
    } catch (error) {
      if (!isAbort(error)) {
        setFailedSave({
          fingerprint: submittedFingerprint,
          conflict: error instanceof ApiError && error.status === 409,
        });
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

  saveOperationRef.current = () => {
    void handleSave();
  };

  function restoreRecoveredDraft() {
    if (recoveryGate?.kind !== "RECOVERY_AVAILABLE") return;
    setDraft(resumeContentInputToDraft(recoveryGate.payload.content));
    setRecoveryDiscardError(false);
    setRecoveryGate(undefined);
  }

  function reviewStaleRecovery() {
    if (
      !user ||
      !workspace ||
      recoveryGate?.kind !== "STALE_CONFLICTED_RECOVERY"
    ) {
      return;
    }
    const recovery = readResumeRecovery({
      storage: sessionStorage,
      userId: user.id,
      resumeId: workspace.resume.id,
      now: Date.now(),
    });
    if (recovery.kind !== "VALID") {
      setRecoveryGate(undefined);
      return;
    }
    setRecoveryDiscardError(false);
    setRecoveryGate({
      kind: "STALE_RECOVERY_REVIEW",
      payload: recovery.payload,
    });
  }

  function discardRecovery() {
    if (!user || !workspace || !recoveryGate) return;
    recoveryWriterRef.current?.cancelPending();
    const removed = removeResumeRecoveryExact(
      sessionStorage,
      createResumeRecoveryKey(user.id, workspace.resume.id),
    );
    if (!removed) {
      setRecoveryDiscardError(true);
      return;
    }
    setRecoveryDiscardError(false);
    if (blocker.state === "blocked") blocker.reset();
    setRecoveryGate(undefined);
  }

  function handleDiscardDraft() {
    if (!user || !workspace || !dirty) return;
    recoveryWriterRef.current?.cancelPending();
    const removed = removeResumeRecoveryExact(
      sessionStorage,
      createResumeRecoveryKey(user.id, workspace.resume.id),
    );
    if (!removed) {
      setNotice({
        tone: "error",
        message: "Local recovery could not be discarded. Please try again.",
      });
      return;
    }
    setDraft(resumeContentToDraft(workspace.version.content));
    setValidationErrors([]);
    setFailedSave(undefined);
    setNotice(undefined);
    setRecoveryWriteUnavailable(false);
    recoveryHadDirtyDraftRef.current = false;
  }

  function handleKeepEditing() {
    setNavigationDiscardError(false);
    if (blocker.state === "blocked") blocker.reset();
  }

  function handleLeaveWithoutSaving() {
    if (!user || !workspace || blocker.state !== "blocked") return;
    recoveryWriterRef.current?.cancelPending();
    const removed = removeResumeRecoveryExact(
      sessionStorage,
      createResumeRecoveryKey(user.id, workspace.resume.id),
    );
    if (!removed) {
      setNavigationDiscardError(true);
      return;
    }
    setNavigationDiscardError(false);
    recoveryHadDirtyDraftRef.current = false;
    blocker.proceed();
  }

  function retryRecoveryCleanup() {
    if (!recoveryCleanupDebt) return;
    const cleaned = removeObsoleteResumeRecovery({
      storage: sessionStorage,
      key: recoveryCleanupDebt.key,
      obsoleteBaselineVersionId:
        recoveryCleanupDebt.obsoleteBaselineVersionId,
    });
    if (!cleaned) return;
    setRecoveryCleanupDebt(undefined);
    setNotice(undefined);
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
    if (!resumeId || recoveryGate) return;
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
      recoveryGate ||
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
        { pageSize },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setWorkspace((current) =>
        current ? { ...current, resume } : current,
      );
      setPreviewDesign(resume.design);
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
    if (!resumeId || !workspace || recoveryGate || designMutationRef.current) return;

    designMutationRef.current = true;
    const controller = beginOperation();
    setDesignMutationSaving(true);
    setDesignStatus(undefined);
    setPageSizeFailure(undefined);
    try {
      const resume = await updateResumeDesign(
        resumeId,
        selection,
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

  async function handleCandidatePhotoFile(file: File) {
    if (
      !resumeId ||
      !workspace ||
      recoveryGate ||
      designMutationRef.current
    ) {
      return;
    }

    designMutationRef.current = true;
    candidatePhotoSelectionGenerationRef.current += 1;
    const generation = candidatePhotoSelectionGenerationRef.current;
    const controller = beginOperation();
    setCandidatePhotoMutationSaving(true);
    setCandidatePhotoMutationFailure(undefined);
    try {
      await preflightCandidatePhoto(
        file,
        () =>
          generation === candidatePhotoSelectionGenerationRef.current &&
          !controller.signal.aborted,
      );
      if (controller.signal.aborted) return;

      const resume = await uploadResumeCandidatePhoto(
        resumeId,
        file,
        workspace.resume.candidatePhotoAssetId,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      replaceCandidatePhotoObjectUrl(undefined);
      adoptPhotoResume(resume);
      setCandidatePhotoSourceFailure(undefined);
      setCandidatePhotoSourceReloadSequence((current) => current + 1);
      setNotice({
        tone: "success",
        message: workspace.resume.candidatePhotoAssetId
          ? "Candidate photo replaced."
          : "Candidate photo added.",
      });
    } catch (error) {
      if (!isAbort(error)) {
        setCandidatePhotoMutationFailure(
          candidatePhotoFailure(
            error,
            "The candidate photo could not be saved. Try again.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      designMutationRef.current = false;
      setCandidatePhotoMutationSaving(false);
    }
  }

  async function handleCandidatePhotoVisibility(show: boolean) {
    if (
      !resumeId ||
      !workspace ||
      recoveryGate ||
      designMutationRef.current ||
      !workspace.resume.candidatePhotoAssetId
    ) {
      return;
    }

    designMutationRef.current = true;
    const controller = beginOperation();
    setCandidatePhotoMutationSaving(true);
    setCandidatePhotoMutationFailure(undefined);
    try {
      const resume = await updateResumeDesign(
        resumeId,
        { showProfilePhoto: show },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      adoptPhotoResume(resume);
    } catch (error) {
      if (!isAbort(error)) {
        setCandidatePhotoMutationFailure(
          candidatePhotoFailure(
            error,
            show
              ? "The candidate photo could not be shown."
              : "The candidate photo could not be hidden.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      designMutationRef.current = false;
      setCandidatePhotoMutationSaving(false);
    }
  }

  async function handleCandidatePhotoRemove() {
    const candidatePhotoAssetId = workspace?.resume.candidatePhotoAssetId;
    if (
      !resumeId ||
      !workspace ||
      !candidatePhotoAssetId ||
      recoveryGate ||
      designMutationRef.current
    ) {
      return;
    }

    designMutationRef.current = true;
    candidatePhotoSelectionGenerationRef.current += 1;
    const controller = beginOperation();
    setCandidatePhotoMutationSaving(true);
    setCandidatePhotoMutationFailure(undefined);
    try {
      const resume = await removeResumeCandidatePhoto(
        resumeId,
        candidatePhotoAssetId,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      replaceCandidatePhotoObjectUrl(undefined);
      setCandidatePhotoSourceFailure(undefined);
      adoptPhotoResume(resume);
      setNotice({ tone: "success", message: "Candidate photo removed." });
    } catch (error) {
      if (!isAbort(error)) {
        setCandidatePhotoMutationFailure(
          candidatePhotoFailure(
            error,
            "The candidate photo could not be removed. Try again.",
          ),
        );
      }
    } finally {
      finishOperation(controller);
      designMutationRef.current = false;
      setCandidatePhotoMutationSaving(false);
    }
  }

  function handlePrint() {
    const version = snapshot ?? workspace?.version;
    if (!workspace || !version || !exportReadiness.eligible) return;
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
      recoveryGate ||
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
      recoveryGate ||
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

  if (loading || (user && workspaceOwnerUserId !== user.id)) {
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

  if (recoveryGate?.kind === "STALE_RECOVERY_REVIEW") {
    return (
      <section className="resume-workspace" aria-label="Stale recovery review">
        <Breadcrumbs
          items={[
            { label: "Resumes", to: "/resumes" },
            { label: workspace.resume.title },
            { label: "Recovered draft review" },
          ]}
        />
        <ResumeRecoveryReview
          content={recoveryGate.payload.content}
          baselineVersionNumber={recoveryGate.payload.baselineVersionNumber}
          currentVersionNumber={workspace.version.versionNumber}
          design={workspace.resume.design}
          candidatePhotoUrl={candidatePhotoSourceUrl}
          discardError={recoveryDiscardError}
          onDiscard={discardRecovery}
        />
      </section>
    );
  }

  const candidatePhotoError =
    candidatePhotoMutationFailure ?? candidatePhotoSourceFailure;

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
          <span
            className={
              saveState === "SAVED"
                ? "resume-saved-state"
                : "resume-dirty-state"
            }
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {recoveryGate
              ? "Recovery decision required"
              : saveState === "SAVED"
              ? `Version ${workspace.version.versionNumber} saved`
              : saveState === "SAVING"
                ? "Saving…"
                : saveState === "SAVE_FAILED"
                  ? "Save failed"
                  : "Unsaved changes"}
          </span>
          {dirty &&
          !saving &&
          snapshot === undefined &&
          recoveryGate === undefined ? (
            <button
              type="button"
              className="quiet-button"
              disabled={applying}
              onClick={handleDiscardDraft}
            >
              Discard changes
            </button>
          ) : null}
          <button
            type="button"
            className="primary-button resume-primary-button"
            disabled={
              !dirty ||
              saving ||
              applying ||
              snapshot !== undefined ||
              printPreparing ||
              recoveryGate !== undefined ||
              failedSave?.conflict === true
            }
            aria-busy={saving}
            aria-keyshortcuts="Meta+S Control+S"
            onClick={() => void handleSave()}
          >
            {saving ? (
              "Saving…"
            ) : (
              <>
                Save new version
                <kbd className="resume-save-shortcut" aria-hidden="true">
                  {navigator.platform.toLowerCase().includes("mac")
                    ? "⌘S"
                    : "Ctrl+S"}
                </kbd>
              </>
            )}
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
          {notice.action === "retry-cleanup" ? (
            <button type="button" onClick={retryRecoveryCleanup}>
              Retry local cleanup
            </button>
          ) : null}
        </div>
      ) : null}

      {recoveryWriteUnavailable ? (
        <div className="resume-notice resume-notice-warning" role="status">
          Local recovery is unavailable. Save a new version to protect your
          changes.
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
        saving={
          designMutationSaving ||
          candidatePhotoMutationSaving ||
          recoveryGate !== undefined
        }
        status={designStatus}
        onPreviewChange={(selection) => {
          setDesignStatus(undefined);
          setPreviewDesign({
            ...workspace.resume.design,
            ...selection,
          });
        }}
        onSave={(selection) => void handleDesignSave(selection)}
      />

      <ResumeCandidatePhotoControls
        hasPhoto={hasCandidatePhoto}
        visible={workspace.resume.design.showProfilePhoto}
        sourceUrl={candidatePhotoSourceUrl}
        sourceLoading={candidatePhotoSourceLoading}
        busy={
          candidatePhotoMutationSaving ||
          designMutationSaving ||
          recoveryGate !== undefined
        }
        error={candidatePhotoError?.message}
        requestId={candidatePhotoError?.requestId}
        onSelectFile={(file) => void handleCandidatePhotoFile(file)}
        onShow={() => void handleCandidatePhotoVisibility(true)}
        onHide={() => void handleCandidatePhotoVisibility(false)}
        onRemove={() => void handleCandidatePhotoRemove()}
        onRetrySource={() => {
          setCandidatePhotoSourceFailure(undefined);
          setCandidatePhotoSourceReloadSequence((current) => current + 1);
        }}
      />

      <ResumePrintControls
        sourceKind={selectedSourceIsHistorical ? "historical" : "current"}
        versionNumber={
          (snapshot ?? workspace.version).versionNumber
        }
        pageSize={workspace.resume.design.pageSize}
        readiness={exportReadiness}
        suggestedFilename={createResumeSuggestedFilename({
          resumeTitle: workspace.resume.title,
          versionNumber: (snapshot ?? workspace.version).versionNumber,
          pageSize: workspace.resume.design.pageSize,
        })}
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
            disabled={saving || applying || recoveryGate !== undefined}
            validationErrors={validationErrors}
            focusRequest={editorFocusRequest}
            onChange={(nextDraft) => {
              if (snapshot !== undefined) {
                setSnapshot(undefined);
              }
              const nextFingerprint = draftFingerprint(nextDraft);
              if (
                failedSave &&
                nextFingerprint !== failedSave.fingerprint &&
                !failedSave.conflict
              ) {
                setFailedSave(undefined);
                setNotice(undefined);
              }
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
            candidatePhotoUrl={candidatePhotoSourceUrl}
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
                list={RESUME_JOB_TITLE_DATALIST_ID}
                value={targetRole}
                minLength={2}
                maxLength={200}
                disabled={analysisBusy || recoveryGate !== undefined}
                onChange={(event) => setTargetRole(event.target.value)}
              />
            </label>
            <label className="resume-field-wide">
              Company (optional)
              <input
                type="text"
                value={company}
                maxLength={200}
                disabled={analysisBusy || recoveryGate !== undefined}
                onChange={(event) => setCompany(event.target.value)}
              />
            </label>
            <label className="resume-field-wide">
              Job description (optional)
              <textarea
                value={jobDescription}
                maxLength={30_000}
                rows={7}
                disabled={analysisBusy || recoveryGate !== undefined}
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
          {analysisJob &&
          (analysisJob.status !== "completed" || analysis === undefined) ? (
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
                recoveryGate !== undefined ||
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
              <p className="resume-kicker">
                {loadingSourceIsHistorical
                  ? "Historical snapshot"
                  : "Current saved snapshot"}
              </p>
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
              <p className="resume-kicker">
                {selectedSourceIsHistorical
                  ? "Historical snapshot"
                  : "Current saved snapshot"}
              </p>
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
            candidatePhotoUrl={candidatePhotoSourceUrl}
          />
        </section>
      ) : null}

      <ResumePreview
        draft={resumeContentToDraft(
          (snapshot ?? workspace.version).content,
        )}
        label={`Printable ${
          selectedSourceIsHistorical ? "historical" : "current"
        } saved version ${(snapshot ?? workspace.version).versionNumber}`}
        ariaLabel="Printable saved resume"
        pageSize={workspace.resume.design.pageSize}
        design={workspace.resume.design}
        candidatePhotoUrl={candidatePhotoSourceUrl}
        printOnly
      />

      {recoveryGate?.kind === "RECOVERY_AVAILABLE" ? (
        <Dialog
          open
          className="resume-dialog"
          labelledBy="resume-recovery-dialog-title"
          describedBy="resume-recovery-dialog-description"
          initialFocusRef={restoreRecoveryButtonRef}
          onCancel={() => undefined}
          canDismissOnEscape={false}
          canDismissOnBackdrop={false}
        >
          <h2 id="resume-recovery-dialog-title">Unsaved Resume work found</h2>
          <p id="resume-recovery-dialog-description">
            Unsaved Resume work from this browser session was found. The saved
            server version has already been loaded, and this recovered draft
            was based on that same saved version. Choose whether to restore or
            discard it.
          </p>
          {recoveryDiscardError ? (
            <p className="resume-dialog-error" role="alert">
              Local recovery could not be discarded. Please try again.
            </p>
          ) : null}
          <div className="resume-dialog-actions">
            <button
              ref={restoreRecoveryButtonRef}
              type="button"
              className="primary-button resume-primary-button"
              onClick={restoreRecoveredDraft}
            >
              Restore recovered draft
            </button>
            <button
              type="button"
              className="destructive-button resume-danger-button"
              onClick={discardRecovery}
            >
              Discard recovery
            </button>
          </div>
        </Dialog>
      ) : null}

      {recoveryGate?.kind === "STALE_CONFLICTED_RECOVERY" ? (
        <Dialog
          open
          className="resume-dialog"
          labelledBy="resume-stale-recovery-dialog-title"
          describedBy="resume-stale-recovery-dialog-description"
          initialFocusRef={reviewRecoveryButtonRef}
          onCancel={() => undefined}
          canDismissOnEscape={false}
          canDismissOnBackdrop={false}
        >
          <h2 id="resume-stale-recovery-dialog-title">
            Recovered work is from an earlier version
          </h2>
          <p id="resume-stale-recovery-dialog-description">
            Unsaved work from an earlier version of this Resume was found. The
            Resume has been saved or changed since that work was created, so it
            cannot be restored automatically. You can review and copy anything
            you still need, or discard it.
          </p>
          {recoveryDiscardError ? (
            <p className="resume-dialog-error" role="alert">
              Local recovery could not be discarded. Please try again.
            </p>
          ) : null}
          <div className="resume-dialog-actions">
            <button
              ref={reviewRecoveryButtonRef}
              type="button"
              className="primary-button resume-primary-button"
              onClick={reviewStaleRecovery}
            >
              Review recovered draft
            </button>
            <button
              type="button"
              className="destructive-button resume-danger-button"
              onClick={discardRecovery}
            >
              Discard recovery
            </button>
          </div>
        </Dialog>
      ) : null}

      {blocker.state === "blocked" && recoveryGate === undefined ? (
        <Dialog
          open
          className="resume-dialog"
          labelledBy="resume-navigation-dialog-title"
          describedBy="resume-navigation-dialog-description"
          initialFocusRef={keepEditingButtonRef}
          onCancel={handleKeepEditing}
        >
          <h2 id="resume-navigation-dialog-title">Unsaved changes</h2>
          <p id="resume-navigation-dialog-description">
            Leaving now will discard changes that have not been saved as
            a new version.
          </p>
          {navigationDiscardError ? (
            <p className="resume-dialog-error" role="alert">
              Your unsaved recovery could not be removed. Please try again
              before leaving.
            </p>
          ) : null}
          <div className="resume-dialog-actions">
            <button
              ref={keepEditingButtonRef}
              type="button"
              onClick={handleKeepEditing}
            >
              Keep editing
            </button>
            <button
              type="button"
              className="destructive-button resume-danger-button"
              onClick={handleLeaveWithoutSaving}
            >
              Leave without saving
            </button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
