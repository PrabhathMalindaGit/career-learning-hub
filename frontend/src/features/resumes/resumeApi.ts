import { ApiError, apiRequest } from "../../api/apiClient";
import {
  parseAcceptedJob,
  parseAnalysis,
  parseApplyResult,
  parseJob,
  parseResumeEnvelope,
  parseResumeList,
  parseResumeWorkspace,
  parseVersionEnvelope,
  parseVersionList,
} from "./resumeContracts";
import {
  parseCandidatePhotoAssetIdFromResumeData,
  parseCandidatePhotoSource,
} from "./resumeCandidatePhoto";
import type {
  CreateResumeInput,
  ResumeContentInput,
  ResumeDesign,
  ResumeJob,
  ResumeRecord,
  ResumeWorkspaceData,
} from "./types";

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function pageQuery(input: { page?: number; limit?: number }): string {
  const query = new URLSearchParams({
    page: String(boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER)),
    limit: String(boundedInteger(input.limit, 20, 1, 100)),
  });
  return query.toString();
}

function assertResumeIdentity(
  expectedResumeId: string,
  actualResumeId: string,
): void {
  if (actualResumeId !== expectedResumeId) {
    throw new ApiError(
      502,
      "INVALID_RESUME_RESPONSE",
      "The server returned an invalid resume response.",
    );
  }
}

function attachCandidatePhotoToResume(
  resume: ResumeRecord,
  rawData: unknown,
): ResumeRecord {
  const candidatePhotoAssetId = parseCandidatePhotoAssetIdFromResumeData(rawData);
  return {
    ...resume,
    ...(candidatePhotoAssetId === undefined
      ? {}
      : { candidatePhotoAssetId }),
  };
}

function parseWorkspaceWithCandidatePhoto(rawData: unknown): ResumeWorkspaceData {
  const workspace = parseResumeWorkspace(rawData);
  return {
    ...workspace,
    resume: attachCandidatePhotoToResume(workspace.resume, rawData),
  };
}

function parseResumeWithCandidatePhoto(rawData: unknown): ResumeRecord {
  return attachCandidatePhotoToResume(parseResumeEnvelope(rawData), rawData);
}

export async function listResumes(
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes?${pageQuery(input)}`,
    { authentication: "required", signal },
  );
  return parseResumeList(data);
}

export async function createResume(
  input: CreateResumeInput,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>("/resumes", {
    method: "POST",
    body: {
      title: input.title,
      ...(input.content === undefined ? {} : { content: input.content }),
    },
    authentication: "required",
    signal,
  });
  return parseWorkspaceWithCandidatePhoto(data);
}

export async function fetchResume(
  resumeId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(`/resumes/${resumeId}`, {
    authentication: "required",
    signal,
  });
  const workspace = parseWorkspaceWithCandidatePhoto(data);
  assertResumeIdentity(resumeId, workspace.resume.id);
  return workspace;
}

export async function saveResumeVersion(
  resumeId: string,
  payload: {
    content: ResumeContentInput;
    expectedCurrentVersionId: string;
    changeSummary?: string;
  },
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/versions`,
    {
      method: "POST",
      body: payload,
      authentication: "required",
      signal,
    },
  );
  const workspace = parseWorkspaceWithCandidatePhoto(data);
  assertResumeIdentity(resumeId, workspace.resume.id);
  return workspace;
}

export async function updateResumeDesign(
  resumeId: string,
  design: Partial<ResumeDesign>,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/design`,
    {
      method: "PATCH",
      body: design,
      authentication: "required",
      signal,
    },
  );
  const resume = parseResumeWithCandidatePhoto(data);
  assertResumeIdentity(resumeId, resume.id);
  return resume;
}

export async function uploadResumeCandidatePhoto(
  resumeId: string,
  file: File,
  expectedCandidatePhotoAssetId: string | undefined,
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.set(
    "expectedCandidatePhotoAssetId",
    expectedCandidatePhotoAssetId ?? "none",
  );
  form.set("file", file);

  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/candidate-photo`,
    {
      method: "POST",
      body: form,
      authentication: "required",
      signal,
    },
  );
  const resume = parseResumeWithCandidatePhoto(data);
  assertResumeIdentity(resumeId, resume.id);
  return resume;
}

export async function removeResumeCandidatePhoto(
  resumeId: string,
  expectedCandidatePhotoAssetId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/candidate-photo`,
    {
      method: "DELETE",
      body: { expectedCandidatePhotoAssetId },
      authentication: "required",
      signal,
    },
  );
  const resume = parseResumeWithCandidatePhoto(data);
  assertResumeIdentity(resumeId, resume.id);
  return resume;
}

export async function fetchResumeCandidatePhotoSource(
  resumeId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/candidate-photo/source`,
    { authentication: "required", signal },
  );
  return parseCandidatePhotoSource(data);
}

export async function listResumeVersions(
  resumeId: string,
  input: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/versions?${pageQuery(input)}`,
    { authentication: "required", signal },
  );
  return parseVersionList(data);
}

export async function fetchResumeVersion(
  resumeId: string,
  versionId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resumes/${resumeId}/versions/${versionId}`,
    { authentication: "required", signal },
  );
  const version = parseVersionEnvelope(data);
  assertResumeIdentity(resumeId, version.resumeId);
  if (version.id !== versionId) {
    throw new ApiError(
      502,
      "INVALID_RESUME_RESPONSE",
      "The server returned an invalid resume response.",
    );
  }
  return version;
}

export async function importResumePdf(
  title: string,
  file: File,
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.set("requestId", crypto.randomUUID());
  form.set("title", title);
  form.set("file", file);
  const data = await apiRequest<unknown>(
    "/resume-analyses/import-pdf",
    {
      method: "POST",
      body: form,
      authentication: "required",
      signal,
    },
  );
  return parseAcceptedJob(data, "resume.import-pdf");
}

export async function confirmResumePdfImport(
  jobId: string,
  signal?: AbortSignal,
): Promise<ResumeWorkspaceData> {
  const data = await apiRequest<unknown>(
    `/resume-analyses/import-pdf/${jobId}/confirm`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
  );
  return parseWorkspaceWithCandidatePhoto(data);
}

export async function queueResumeAnalysis(
  resumeId: string,
  payload: {
    versionId: string;
    targetRole: string;
    company?: string;
    jobDescription?: string;
  },
  signal?: AbortSignal,
) {
  const body = {
    requestId: crypto.randomUUID(),
    versionId: payload.versionId,
    targetRole: payload.targetRole,
    ...(payload.company?.trim()
      ? { company: payload.company.trim() }
      : {}),
    ...(payload.jobDescription?.trim()
      ? { jobDescription: payload.jobDescription.trim() }
      : {}),
  };
  const data = await apiRequest<unknown>(
    `/resume-analyses/resumes/${resumeId}/analyze`,
    {
      method: "POST",
      body,
      authentication: "required",
      signal,
    },
  );
  return parseAcceptedJob(data, "resume.analyze");
}

export async function fetchResumeAnalysis(
  analysisId: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resume-analyses/${analysisId}`,
    { authentication: "required", signal },
  );
  return parseAnalysis(data);
}

export async function applyResumeSuggestions(
  resumeId: string,
  payload: {
    analysisId: string;
    suggestionIds: string[];
    changeSummary?: string;
  },
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/resume-analyses/resumes/${resumeId}/rewrites/apply`,
    {
      method: "POST",
      body: {
        analysisId: payload.analysisId,
        suggestionIds: [...new Set(payload.suggestionIds)],
        ...(payload.changeSummary === undefined
          ? {}
          : { changeSummary: payload.changeSummary }),
      },
      authentication: "required",
      signal,
    },
  );
  const result = parseApplyResult(data);
  const resume = attachCandidatePhotoToResume(result.resume, data);
  assertResumeIdentity(resumeId, resume.id);
  return { ...result, resume };
}

export async function fetchJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<ResumeJob> {
  const data = await apiRequest<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    signal,
  });
  return parseJob(data);
}
