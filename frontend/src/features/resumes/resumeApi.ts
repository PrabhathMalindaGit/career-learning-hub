const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ??
        `Request failed with HTTP ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchResume(
  resumeId: string,
  accessToken: string,
) {
  return request(`/resumes/${resumeId}`, accessToken);
}

export function saveResumeVersion(
  resumeId: string,
  accessToken: string,
  payload: unknown,
) {
  return request(`/resumes/${resumeId}/versions`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
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

  return request("/resume-analyses/import-pdf", accessToken, {
    method: "POST",
    body: form,
  });
}

export function queueResumeAnalysis(
  resumeId: string,
  accessToken: string,
  payload: unknown,
) {
  return request(
    `/resume-analyses/resumes/${resumeId}/analyze`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function fetchResumeAnalyses(
  resumeId: string,
  accessToken: string,
) {
  return request(
    `/resume-analyses/resumes/${resumeId}`,
    accessToken,
  );
}

export function fetchResumeAnalysis(
  analysisId: string,
  accessToken: string,
) {
  return request(
    `/resume-analyses/${analysisId}`,
    accessToken,
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
  return request(
    `/resume-analyses/resumes/${resumeId}/rewrites/apply`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function fetchJob(
  jobId: string,
  accessToken: string,
) {
  return request(`/jobs/${jobId}`, accessToken);
}
