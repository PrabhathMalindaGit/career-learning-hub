import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../api/apiClient";
import {
  confirmResumePdfImport,
  fetchResumeImportPhotoCandidateSource,
} from "./resumeApi";
import { parseJob } from "./resumeContracts";

vi.mock("../../api/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/apiClient")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const jobId = "507f1f77bcf86cd799439014";
const firstAssetId = "507f1f77bcf86cd799439015";
const secondAssetId = "507f1f77bcf86cd799439016";
const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const stableId = "123e4567-e89b-42d3-a456-426614174000";
const timestamp = "2026-08-15T00:00:00.000Z";

function contentFixture() {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      links: [],
    },
    experience: [],
    education: [],
    skills: [
      {
        id: stableId,
        name: "Technical Skills",
        keywords: ["TypeScript"],
      },
    ],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function completedReview(result: unknown) {
  return {
    job: {
      id: jobId,
      type: "resume.import-pdf",
      status: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

function workspaceEnvelope() {
  return {
    resume: {
      _id: resumeId,
      title: "Imported Resume",
      status: "draft",
      currentVersionId: versionId,
      candidatePhotoAssetId: firstAssetId,
      latestVersionNumber: 1,
      design: {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        pageSize: "A4",
        fontFamily: "Inter",
        showProfilePhoto: true,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    version: {
      _id: versionId,
      resumeId,
      versionNumber: 1,
      source: "pdf-import",
      content: contentFixture(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

describe("Resume import photo frontend contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts an optional bounded list of exact photo candidate asset identifiers", () => {
    const parsed = parseJob(
      completedReview({
        kind: "import-review",
        content: contentFixture(),
        photoCandidates: [
          { assetId: firstAssetId },
          { assetId: secondAssetId },
        ],
      }),
    );

    expect(parsed.result).toEqual({
      kind: "import-review",
      content: contentFixture(),
      photoCandidates: [
        { assetId: firstAssetId },
        { assetId: secondAssetId },
      ],
    });
  });

  it("keeps a text-only import review valid without photoCandidates", () => {
    const parsed = parseJob(
      completedReview({
        kind: "import-review",
        content: contentFixture(),
      }),
    );

    expect(parsed.result).toEqual({
      kind: "import-review",
      content: contentFixture(),
    });
  });

  it.each([
    [
      "too many candidates",
      Array.from({ length: 4 }, (_, index) => ({
        assetId: `${firstAssetId.slice(0, -1)}${index}`,
      })),
    ],
    ["invalid identifier", [{ assetId: "not-an-object-id" }]],
    ["unexpected candidate metadata", [{ assetId: firstAssetId, width: 400 }]],
    ["duplicate identifier", [{ assetId: firstAssetId }, { assetId: firstAssetId }]],
  ])("rejects %s", (_label, photoCandidates) => {
    expect(() =>
      parseJob(
        completedReview({
          kind: "import-review",
          content: contentFixture(),
          photoCandidates,
        }),
      ),
    ).toThrowError(/invalid resume response/i);
  });

  it("keeps the existing bodyless confirm call and sends a selected photo only as the optional third argument", async () => {
    vi.mocked(apiRequest).mockResolvedValue(workspaceEnvelope());
    const signal = new AbortController().signal;

    await confirmResumePdfImport(jobId, signal);
    expect(apiRequest).toHaveBeenLastCalledWith(
      `/resume-analyses/import-pdf/${jobId}/confirm`,
      {
        method: "POST",
        authentication: "required",
        signal,
      },
    );

    await confirmResumePdfImport(jobId, signal, firstAssetId);
    expect(apiRequest).toHaveBeenLastCalledWith(
      `/resume-analyses/import-pdf/${jobId}/confirm`,
      {
        method: "POST",
        body: { selectedPhotoAssetId: firstAssetId },
        authentication: "required",
        signal,
      },
    );
  });

  it("requests an owner-authenticated short-lived source for an extracted candidate", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      url: "http://localhost:8000/api/v1/assets/signed",
      expiresAt: "2026-08-15T00:05:00.000Z",
    });
    const signal = new AbortController().signal;

    const source = await fetchResumeImportPhotoCandidateSource(
      firstAssetId,
      signal,
    );

    expect(apiRequest).toHaveBeenCalledWith(
      `/assets/${firstAssetId}/signed-url`,
      {
        method: "POST",
        body: { expiresInSeconds: 300 },
        authentication: "required",
        signal,
      },
    );
    expect(source.url).toContain("/assets/signed");
  });
});
