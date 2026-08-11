import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ResumeApiModule = typeof import("./resumeApi");

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const assetId = "507f1f77bcf86cd799439013";
const timestamp = "2026-08-12T00:00:00.000Z";

function contentFixture() {
  return {
    basics: { fullName: "Synthetic Candidate", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function resumeFixture(candidatePhotoAssetId?: string) {
  return {
    _id: resumeId,
    title: "Synthetic Resume",
    status: "draft",
    currentVersionId: versionId,
    ...(candidatePhotoAssetId ? { candidatePhotoAssetId } : {}),
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4",
      fontFamily: "Inter",
      showProfilePhoto: candidatePhotoAssetId !== undefined,
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

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

describe("Candidate Photo Resume API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses the optional Candidate Photo id from the owned workspace", async () => {
    const { fetchResume } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        resume: resumeFixture(assetId),
        version: versionFixture(),
      }),
    );

    const workspace = await fetchResume(resumeId);
    expect(workspace.resume.candidatePhotoAssetId).toBe(assetId);
  });

  it("uploads initial Candidate Photo with explicit expected absence", async () => {
    const { uploadResumeCandidatePhoto } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ resume: resumeFixture(assetId) }, 201),
    );
    const file = new File([new Uint8Array(32)], "candidate.png", {
      type: "image/png",
    });

    await uploadResumeCandidatePhoto(resumeId, file, undefined);

    const [url, init] = requestAt();
    expect(url).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/candidate-photo`,
    );
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("expectedCandidatePhotoAssetId")).toBe("none");
    expect(form.get("file")).toBe(file);
  });

  it("uploads replacement with the exact current Candidate Photo id", async () => {
    const { uploadResumeCandidatePhoto } = await loadApi();
    const replacementId = "507f1f77bcf86cd799439014";
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ resume: resumeFixture(replacementId) }, 201),
    );
    const file = new File([new Uint8Array(32)], "candidate.webp", {
      type: "image/webp",
    });

    const resume = await uploadResumeCandidatePhoto(resumeId, file, assetId);
    const form = requestAt()[1].body as FormData;
    expect(form.get("expectedCandidatePhotoAssetId")).toBe(assetId);
    expect(resume.candidatePhotoAssetId).toBe(replacementId);
  });

  it("removes Candidate Photo with a strict expected-current JSON body", async () => {
    const { removeResumeCandidatePhoto } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ resume: resumeFixture() }),
    );

    await removeResumeCandidatePhoto(resumeId, assetId);

    const [url, init] = requestAt();
    expect(url).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/candidate-photo`,
    );
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedCandidatePhotoAssetId: assetId,
    });
  });

  it("fetches the relation-validated Candidate Photo source descriptor", async () => {
    const { fetchResumeCandidatePhotoSource } = await loadApi();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        url: "https://storage.example.test/signed-photo",
        expiresAt: "2026-08-12T00:05:00.000Z",
      }),
    );

    await expect(fetchResumeCandidatePhotoSource(resumeId)).resolves.toEqual({
      url: "https://storage.example.test/signed-photo",
      expiresAt: "2026-08-12T00:05:00.000Z",
    });
    expect(requestAt()[0]).toBe(
      `https://api.example.test/api/v1/resumes/${resumeId}/candidate-photo/source`,
    );
  });

  it("sends Show and Hide as isolated partial design patches", async () => {
    const { updateResumeDesign } = await loadApi();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          resume: {
            ...resumeFixture(assetId),
            design: { ...resumeFixture(assetId).design, showProfilePhoto: true },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          resume: {
            ...resumeFixture(assetId),
            design: { ...resumeFixture(assetId).design, showProfilePhoto: false },
          },
        }),
      );

    await updateResumeDesign(resumeId, { showProfilePhoto: true });
    await updateResumeDesign(resumeId, { showProfilePhoto: false });

    expect(JSON.parse(String(requestAt(0)[1].body))).toEqual({
      showProfilePhoto: true,
    });
    expect(JSON.parse(String(requestAt(1)[1].body))).toEqual({
      showProfilePhoto: false,
    });
  });
});
