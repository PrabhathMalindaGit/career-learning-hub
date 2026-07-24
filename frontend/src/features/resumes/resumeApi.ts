import { apiRequest } from "../../api/apiClient";

export function fetchResume(
  resumeId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(`/resumes/${resumeId}`, {
    authentication: "required",
    accessToken,
  });
}

export function saveResumeVersion(
  resumeId: string,
  accessToken: string,
  payload: unknown,
) {
  return apiRequest<unknown>(`/resumes/${resumeId}/versions`, {
    method: "POST",
    body: payload,
    authentication: "required",
    accessToken,
  });
}

export function importResumePdf(
  title: string,
  file: File,
  accessToken: string,
) {
  const form = new FormData();
  form.set("title", title);
  form.set("file", file);

  return apiRequest<unknown>("/resume-analyses/import-pdf", {
    method: "POST",
    body: form,
    authentication: "required",
    accessToken,
  });
}

export function queueResumeAnalysis(
  resumeId: string,
  accessToken: string,
  payload: unknown,
) {
  return apiRequest<unknown>(
    `/resume-analyses/resumes/${resumeId}/analyze`,
    {
      method: "POST",
      body: payload,
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchResumeAnalyses(
  resumeId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/resume-analyses/resumes/${resumeId}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchResumeAnalysis(
  analysisId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(
    `/resume-analyses/${analysisId}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function applyResumeSuggestions(
  resumeId: string,
  accessToken: string,
  payload: {
    analysisId: string;
    suggestionIds: string[];
    changeSummary?: string;
  },
) {
  return apiRequest<unknown>(
    `/resume-analyses/resumes/${resumeId}/rewrites/apply`,
    {
      method: "POST",
      body: payload,
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchJob(
  jobId: string,
  accessToken: string,
) {
  return apiRequest<unknown>(`/jobs/${jobId}`, {
    authentication: "required",
    accessToken,
  });
}
