import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

type ResumeApiModule = typeof import("./resumeApi");

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const analysisId = "507f1f77bcf86cd799439013";
const jobId = "507f1f77bcf86cd799439014";
const timestamp = "2026-07-24T10:00:00.000Z";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function contentFixture() {
  return {
    basics: { fullName: "", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function resumeFixture() {
  return {
    _id: resumeId,
    title: "Synthetic Resume",
    status: "draft",
    currentVersionId: versionId,
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4",
      fontFamily: "Inter",
      showProfilePhoto: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function versionFixture() {
  return {
    _id: versionId,
    resumeId,
    versionNumber: 1,
    source: "manual",
    content: contentFixture(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function loadApi(): Promise<ResumeApiModule> {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
  return import("./resumeApi");
}

function requestAt(index = 0): [string, RequestInit] {
  const call = vi.mocked(fetch).mock.calls[index];
  return [String(call?.[0]), call?.[1] ?? {}];
}

describe("resumeApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lists owned resumes with bounded pagination and no user ID", async () => {
    const { listResumes } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          resumes: [resumeFixture()],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      }),
    );

    await listResumes({ page: -4, limit: 500 });

    expect(requestAt()[0]).toBe(
      "https://api.example.test/api/v1/resumes?page=1&limit=100",
    );
    expect(requestAt()[0]).not.toContain("user");
    expect(requestAt()[1].method).toBe("GET");
  });

  it("creates a blank resume with the exact title-only body", async () => {
    const { createResume } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: true,
          data: { resume: resumeFixture(), version: versionFixture() },
        },
        201,
      ),
    );

    await createResume("Synthetic Resume");

    expect(requestAt()[0]).toBe("https://api.example.test/api/v1/resumes");
    expect(requestAt()[1].method).toBe("POST");
    expect(JSON.parse(String(requestAt()[1].body))).toEqual({
      title: "Synthetic Resume",
    });
  });

  it("loads a workspace and forwards AbortSignal", async () => {
    const { fetchResume } = await loadApi();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: { resume: resumeFixture(), version: versionFixture() },
      }),
    );

    await fetchResume(resumeId, controller.signal);

    expect(requestAt()[0]).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}`,
    );
    expect(requestAt()[1].signal).toBe(controller.signal);
  });

  it("saves one immutable version with the exact baseline and canonical content", async () => {
    const { saveResumeVersion } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: true,
          data: { resume: resumeFixture(), version: versionFixture() },
        },
        201,
      ),
    );

    await saveResumeVersion(resumeId, {
      expectedCurrentVersionId: versionId,
      changeSummary: "Updated basics",
      content: contentFixture(),
    });

    expect(requestAt()[0]).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/versions`,
    );
    expect(requestAt()[1].method).toBe("POST");
    expect(JSON.parse(String(requestAt()[1].body))).toEqual({
      expectedCurrentVersionId: versionId,
      changeSummary: "Updated basics",
      content: contentFixture(),
    });
  });

  it("lists and loads immutable versions with bounded queries", async () => {
    const { listResumeVersions, fetchResumeVersion } = await loadApi();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            versions: [versionFixture()],
            pagination: { page: 1, limit: 100, total: 1, pages: 1 },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { version: versionFixture() },
        }),
      );

    await listResumeVersions(resumeId, { page: 0, limit: 200 });
    await fetchResumeVersion(resumeId, versionId);

    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/versions?page=1&limit=100`,
    );
    expect(requestAt(1)[0]).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/versions/${versionId}`,
    );
  });

  it("uploads title and exactly one PDF as FormData without forcing content type", async () => {
    const { importResumePdf } = await loadApi();
    const file = new File(["%PDF-synthetic"], "synthetic.pdf", {
      type: "application/pdf",
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: true,
          data: {
            assetId: "507f1f77bcf86cd799439015",
            job: { id: jobId, type: "resume.import-pdf", status: "queued" },
          },
        },
        202,
      ),
    );

    await importResumePdf("Imported Resume", file);

    expect(requestAt()[0]).toBe(
      "https://api.example.test/api/v1/resume-analyses/import-pdf",
    );
    const body = requestAt()[1].body as FormData;
    expect(body.get("title")).toBe("Imported Resume");
    expect(body.get("file")).toBe(file);
    expect(new Headers(requestAt()[1].headers).has("Content-Type")).toBe(false);
  });

  it("queues analysis for the current saved version with non-empty optional fields only", async () => {
    const { queueResumeAnalysis } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: true,
          data: {
            job: { id: jobId, type: "resume.analyze", status: "queued" },
          },
        },
        202,
      ),
    );

    await queueResumeAnalysis(resumeId, {
      versionId,
      targetRole: "Platform Engineer",
      company: "",
      jobDescription: "  ",
    });

    expect(JSON.parse(String(requestAt()[1].body))).toEqual({
      versionId,
      targetRole: "Platform Engineer",
    });
    expect(String(requestAt()[1].body)).not.toContain("userId");
  });

  it("polls one owned job and fetches one owned analysis", async () => {
    const { fetchJob, fetchResumeAnalysis } = await loadApi();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            job: {
              id: jobId,
              type: "resume.analyze",
              status: "queued",
              progress: 0,
              attempts: 0,
              maxAttempts: 3,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            analysis: {
              _id: analysisId,
              resumeId,
              resumeVersionId: versionId,
              target: { role: "Platform Engineer" },
              scoreBreakdown: {
                keywordMatch: 20,
                clarity: 20,
                evidence: 20,
                formatting: 20,
              },
              totalScore: 80,
              issues: [],
              strengths: [],
              missingKeywords: [],
              suggestions: [],
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
        }),
      );

    await fetchJob(jobId);
    await fetchResumeAnalysis(analysisId);

    expect(requestAt(0)[0]).toBe(
      `https://api.example.test/api/v1/jobs/${jobId}`,
    );
    expect(requestAt(1)[0]).toBe(
      `https://api.example.test/api/v1/resume-analyses/${analysisId}`,
    );
  });

  it("applies only deduplicated selected stored suggestion UUIDs", async () => {
    const { applyResumeSuggestions } = await loadApi();
    const suggestionId = "123e4567-e89b-42d3-a456-426614174000";
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: true,
          data: {
            resume: resumeFixture(),
            version: versionFixture(),
            appliedCount: 1,
          },
        },
        201,
      ),
    );

    await applyResumeSuggestions(resumeId, {
      analysisId,
      suggestionIds: [suggestionId, suggestionId],
    });

    expect(JSON.parse(String(requestAt()[1].body))).toEqual({
      analysisId,
      suggestionIds: [suggestionId],
    });
  });

  it("rejects malformed successful DTOs and preserves structured API errors", async () => {
    const { fetchResume } = await loadApi();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { resume: { _id: "bad" }, version: null },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: {
              code: "RESUME_NOT_FOUND",
              message: "Resume not found.",
              requestId: "resume-request-id-0001",
            },
          },
          404,
        ),
      );

    await expect(fetchResume(resumeId)).rejects.toMatchObject({
      code: "INVALID_RESUME_RESPONSE",
    });
    await expect(fetchResume(resumeId)).rejects.toMatchObject({
      status: 404,
      code: "RESUME_NOT_FOUND",
      requestId: "resume-request-id-0001",
    });
  });

  it("rejects canonical responses that do not match the requested route identity", async () => {
    const {
      applyResumeSuggestions,
      fetchResume,
      fetchResumeVersion,
      saveResumeVersion,
    } = await loadApi();
    const otherResumeId = "507f1f77bcf86cd799439099";
    const otherVersionId = "507f1f77bcf86cd799439098";
    const otherResume = {
      ...resumeFixture(),
      _id: otherResumeId,
      currentVersionId: otherVersionId,
    };
    const otherVersion = {
      ...versionFixture(),
      _id: otherVersionId,
      resumeId: otherResumeId,
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { resume: otherResume, version: otherVersion },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { resume: otherResume, version: otherVersion },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { version: otherVersion },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            resume: otherResume,
            version: otherVersion,
            appliedCount: 1,
          },
        }),
      );

    await expect(fetchResume(resumeId)).rejects.toMatchObject({
      code: "INVALID_RESUME_RESPONSE",
    });
    await expect(
      saveResumeVersion(resumeId, {
        expectedCurrentVersionId: versionId,
        content: contentFixture(),
      }),
    ).rejects.toMatchObject({
      code: "INVALID_RESUME_RESPONSE",
    });
    await expect(
      fetchResumeVersion(resumeId, versionId),
    ).rejects.toMatchObject({
      code: "INVALID_RESUME_RESPONSE",
    });
    await expect(
      applyResumeSuggestions(resumeId, {
        analysisId,
        suggestionIds: [
          "123e4567-e89b-42d3-a456-426614174000",
        ],
      }),
    ).rejects.toMatchObject({
      code: "INVALID_RESUME_RESPONSE",
    });
  });
});
