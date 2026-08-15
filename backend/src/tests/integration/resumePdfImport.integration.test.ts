import { Readable } from "node:stream";
import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { claimNextJob, enqueueJob } from "../../jobs/job.queue.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { activateProvider } from "../../modules/ai/aiProvider.service.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { createAsset } from "../../modules/assets/asset.service.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { createResume } from "../../modules/resumes/resume.service.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { normalizeResumeContent } from "../../modules/resumes/resume.validation.js";
import { AppError } from "../../shared/appError.js";
import { registerTestUser } from "../helpers/auth.js";

const { extractPdfImagesMock, extractPdfTextMock } = vi.hoisted(() => ({
  extractPdfImagesMock: vi.fn(),
  extractPdfTextMock: vi.fn(),
}));

vi.mock("../../modules/resume-analysis/pdf.service.js", () => ({
  extractFirstPagePdfImages: extractPdfImagesMock,
  extractPdfText: extractPdfTextMock,
}));

import {
  confirmResumePdfImport,
  prepareResumePdfImport,
} from "../../modules/resume-analysis/resumeAnalysis.service.js";

const syntheticPdf = Buffer.from(
  "%PDF-1.4\n% Synthetic privacy-safe Resume PDF fixture\n%%EOF\n",
);
const originalAdminCompatibility = env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

function syntheticPng(width = 240, height = 320, marker = 0): Buffer {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
    buffer,
  );
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[32] = marker;
  return buffer;
}

function extractedPng(marker: number, width = 240, height = 320) {
  return {
    buffer: syntheticPng(width, height, marker),
    mimeType: "image/png" as const,
    width,
    height,
  };
}

function geminiResponse(value: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                text:
                  typeof value === "string" ? value : JSON.stringify(value),
              },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 5 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function mockGemini(value: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(geminiResponse(value));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function createImportAsset(userId: string) {
  return createAsset({
    userId,
    purpose: "resume-import",
    temporary: true,
    file: {
      fieldname: "file",
      originalname: "synthetic-resume.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: syntheticPdf.length,
      buffer: syntheticPdf,
      destination: "",
      filename: "",
      path: "",
      stream: Readable.from(syntheticPdf),
    },
  });
}

async function createRoutedImportJob(userId: string, assetId: string) {
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = true;
  await activateProvider({
    userId,
    provider: "gemini-direct",
    credentialSource: "administrator-managed",
    expectedRevision: 0,
  });
  const queued = await enqueueJob({
    type: "resume.import-pdf",
    payload: { userId, assetId, title: "Synthetic routed Resume" },
    userId,
  });
  const claimed = await claimNextJob();
  if (!claimed || claimed._id.toString() !== queued._id.toString()) {
    throw new Error("Synthetic routed Resume import job was not claimed.");
  }
  return claimed;
}

async function createReviewJob(userId: string, title = "Reviewed Resume") {
  const asset = await createImportAsset(userId);
  const job = await JobRecordModel.create({
    userId,
    type: "resume.import-pdf",
    payload: { userId, assetId: asset._id.toString(), title },
    status: "completed",
    phase: "completed",
    progress: 100,
    attempts: 1,
    maxAttempts: 3,
    result: {
      kind: "import-review",
      content: normalizeResumeContent({
        basics: { fullName: "Synthetic Candidate", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      }),
    },
    expiresAt: new Date(Date.now() + 60_000),
  });
  return { asset, job };
}

async function addCandidateToReviewJob(input: {
  userId: string;
  jobId: string;
  sourceAssetId: string;
  marker: number;
  ordinal?: number;
  temporary?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  const buffer = syntheticPng(240, 320, input.marker);
  const candidate = await createAsset({
    userId: input.userId,
    purpose: "resume-photo",
    temporary: input.temporary ?? true,
    expiresInSeconds: 15 * 60,
    file: {
      fieldname: "file",
      originalname: `candidate-${input.marker}.png`,
      encoding: "7bit",
      mimetype: "image/png",
      size: buffer.length,
      buffer,
      destination: "",
      filename: "",
      path: "",
      stream: Readable.from(buffer),
    },
  });
  candidate.metadata = input.metadata ?? {
    resumeImportJobId: input.jobId,
    resumeImportSourceAssetId: input.sourceAssetId,
    resumeImportOrdinal: input.ordinal ?? 1,
  };
  if (input.expiresAt !== undefined) candidate.expiresAt = input.expiresAt;
  await candidate.save();

  const job = await JobRecordModel.findById(input.jobId);
  if (!job) throw new Error("Synthetic import job missing.");
  const result = job.result as {
    kind: "import-review";
    content: unknown;
    photoCandidates?: Array<{ assetId: string }>;
  };
  job.result = {
    ...result,
    photoCandidates: [
      ...(result.photoCandidates ?? []),
      { assetId: candidate._id.toString() },
    ],
  };
  await job.save();
  return candidate;
}

function minimalResume() {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      email: null,
      phone: null,
      location: null,
      headline: null,
      summary: null,
      links: [],
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

describe("Resume PDF staged import", () => {
  afterEach(() => {
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = originalAdminCompatibility;
    vi.unstubAllGlobals();
    extractPdfImagesMock.mockReset();
    extractPdfTextMock.mockReset();
  });

  it("stages canonical multi-section content without creating a Resume or Version", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume with experience, education, projects, and skills.",
      pageCount: 2,
      characterCount: 78,
    });
    extractPdfImagesMock.mockResolvedValue([]);
    mockGemini({
      ...minimalResume(),
      basics: {
        ...minimalResume().basics,
        email: "candidate@example.test",
        links: [{ label: "Portfolio", url: "portfolio.example/path" }],
      },
      experience: [
        {
          employer: "Example Company",
          jobTitle: "Engineer",
          location: null,
          startDate: "2024-01",
          endDate: null,
          isCurrent: true,
          bullets: [{ text: "Built a privacy-safe integration fixture." }],
        },
      ],
      education: [
        {
          institution: "Example University",
          qualification: "BSc",
          fieldOfStudy: "Computing",
          location: null,
          startDate: null,
          endDate: null,
          isCurrent: false,
          details: [],
        },
      ],
      skills: [{ name: "Engineering", keywords: ["TypeScript"] }],
      projects: [
        {
          name: "Synthetic Project",
          role: null,
          description: null,
          startDate: null,
          endDate: null,
          technologies: [],
          links: [],
          bullets: [],
        },
      ],
    });

    const result = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
    });

    expect(result).toMatchObject({
      kind: "import-review",
      content: {
        basics: {
          links: [
            { label: "Portfolio", url: "https://portfolio.example/path" },
          ],
        },
        experience: [{ employer: "Example Company" }],
      },
    });
    expect(result).not.toHaveProperty("photoCandidates");
    expect(extractPdfImagesMock).not.toHaveBeenCalled();
    expect(result.content.experience[0]?.id).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(AssetModel.findById(asset._id).lean()).resolves.toMatchObject({
      status: "temporary",
    });
  });

  it("accepts a minimal Resume with absent optional sections and valid empty arrays", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for the import boundary.",
      pageCount: 1,
      characterCount: 69,
    });
    extractPdfImagesMock.mockResolvedValue([]);
    mockGemini({ basics: { fullName: "Minimal Candidate", links: [] } });

    const result = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
    });

    expect(result).toMatchObject({
      kind: "import-review",
      content: {
        basics: { fullName: "Minimal Candidate", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      },
    });
  });

  it("extracts images only after canonical text parsing succeeds and only when a Job ID is available", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate Resume text long enough to parse safely.",
      pageCount: 1,
      characterCount: 61,
    });
    extractPdfImagesMock.mockResolvedValue([extractedPng(1)]);
    mockGemini(minimalResume());

    const result = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
    });

    expect(result).not.toHaveProperty("photoCandidates");
    expect(extractPdfImagesMock).not.toHaveBeenCalled();
    await expect(
      AssetModel.countDocuments({ userId, purpose: "resume-photo" }),
    ).resolves.toBe(0);
  });

  it("stages at most three eligible import-bound photo candidates and skips invalid images", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    const job = await createRoutedImportJob(userId, asset._id.toString());
    const jobId = job._id.toString();
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate Resume text long enough for photo staging.",
      pageCount: 1,
      characterCount: 64,
    });
    extractPdfImagesMock.mockResolvedValue([
      {
        buffer: Buffer.from("not-an-image"),
        mimeType: "image/png",
        width: 500,
        height: 500,
      },
      extractedPng(1, 500, 500),
      extractedPng(2, 450, 450),
      extractedPng(3, 400, 400),
      extractedPng(4, 350, 350),
    ]);
    mockGemini(minimalResume());

    const before = Date.now();
    const result = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
      jobId,
    });

    expect(result.photoCandidates).toHaveLength(3);
    expect(result.photoCandidates).toEqual(
      expect.arrayContaining([
        { assetId: expect.stringMatching(/^[a-f\d]{24}$/i) },
      ]),
    );
    expect(JSON.stringify(result.photoCandidates)).not.toContain("buffer");
    expect(JSON.stringify(result.photoCandidates)).not.toContain("data:");

    const candidateIds = result.photoCandidates?.map((item) => item.assetId) ?? [];
    const staged = await AssetModel.find({ _id: { $in: candidateIds } })
      .sort({ createdAt: 1 })
      .lean();
    expect(staged).toHaveLength(3);
    staged.forEach((candidate, index) => {
      expect(candidate).toMatchObject({
        userId: new Types.ObjectId(userId),
        purpose: "resume-photo",
        status: "temporary",
        metadata: {
          resumeImportJobId: jobId,
          resumeImportSourceAssetId: asset._id.toString(),
          resumeImportOrdinal: index + 1,
        },
      });
      expect(candidate.expiresAt?.getTime()).toBeGreaterThanOrEqual(
        before + 14 * 60 * 1_000,
      );
      expect(candidate.expiresAt?.getTime()).toBeLessThanOrEqual(
        Date.now() + 16 * 60 * 1_000,
      );
    });
    await expect(
      AssetModel.countDocuments({ userId, purpose: "resume-photo" }),
    ).resolves.toBe(3);
  });

  it.each([
    ["malformed JSON", "not-json", "AI_INVALID_JSON"],
    ["structurally invalid JSON", { basics: 42 }, "AI_SCHEMA_VALIDATION_FAILED"],
    [
      "semantically invalid output",
      {
        ...minimalResume(),
        basics: {
          ...minimalResume().basics,
          links: [{ label: "Unsafe", url: "javascript:alert(1)" }],
        },
      },
      "AI_SCHEMA_VALIDATION_FAILED",
    ],
  ])("persists no partial Resume for %s", async (_label, response, code) => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for a failed import.",
      pageCount: 1,
      characterCount: 65,
    });
    extractPdfImagesMock.mockResolvedValue([extractedPng(1)]);
    mockGemini(response);

    await expect(
      prepareResumePdfImport({
        userId,
        assetId: asset._id.toString(),
      }),
    ).rejects.toMatchObject({ code });
    expect(extractPdfImagesMock).not.toHaveBeenCalled();
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(
      AssetModel.countDocuments({ userId, purpose: "resume-photo" }),
    ).resolves.toBe(0);
    await expect(AssetModel.findById(asset._id).lean()).resolves.toMatchObject({
      status: "temporary",
    });
  });

  it("returns a safe semantic field path without provider content", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for semantic validation.",
      pageCount: 1,
      characterCount: 73,
    });
    mockGemini({
      ...minimalResume(),
      basics: {
        ...minimalResume().basics,
        links: [{ label: "Unsafe", url: "javascript:private-content" }],
      },
    });

    const error = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: "AI_SCHEMA_VALIDATION_FAILED",
      retryable: false,
      details: { fieldPaths: ["basics.links.0.url"] },
    });
    expect((error as Error).message).toContain("basics.links.0.url");
    expect((error as Error).message).not.toContain("private-content");
  });

  it("persists nothing when PDF extraction reports an unreadable document", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockRejectedValue(
      new AppError(
        422,
        "PDF_EXTRACTION_FAILED",
        "Text could not be extracted from the uploaded PDF.",
      ),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      prepareResumePdfImport({
        userId,
        assetId: asset._id.toString(),
      }),
    ).rejects.toMatchObject({ code: "PDF_EXTRACTION_FAILED" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(extractPdfImagesMock).not.toHaveBeenCalled();
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("classifies a transient provider failure without persisting a Resume", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for a transient failure.",
      pageCount: 1,
      characterCount: 70,
    });
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({ error: { status: "UNAVAILABLE" } }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      prepareResumePdfImport({
        userId,
        assetId: asset._id.toString(),
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(extractPdfImagesMock).not.toHaveBeenCalled();
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("confirms once, creates Version 1, promotes the Asset, and scrubs candidate content", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId);

    const result = await confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    });

    expect(result.versionNumber).toBe(1);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(
      ResumeVersionModel.findById(result.versionId).lean(),
    ).resolves.toMatchObject({
      userId: new Types.ObjectId(userId),
      source: "pdf-import",
      sourceAssetId: asset._id,
      versionNumber: 1,
    });
    await expect(AssetModel.findById(asset._id).lean()).resolves.toMatchObject({
      status: "active",
      metadata: { resumeId: result.resumeId },
    });
    const storedJob = await JobRecordModel.findById(job._id).lean();
    expect(storedJob?.result).toEqual({
      kind: "import-adopted",
      resumeId: result.resumeId,
      versionId: result.versionId,
      versionNumber: 1,
    });
    expect(storedJob?.result).not.toHaveProperty("content");
  });

  it("keeps bodyless and empty-body public confirmation backward compatible", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-import-confirm@example.com",
      displayName: "Resume Import Confirm",
    });
    const first = await createReviewJob(owner.userId, "Confirmed Resume");
    const firstResponse = await request(app)
      .post(`/api/v1/resume-analyses/import-pdf/${first.job._id.toString()}/confirm`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(firstResponse.body).toMatchObject({
      success: true,
      data: {
        resume: { title: "Confirmed Resume", latestVersionNumber: 1 },
        version: { versionNumber: 1, source: "pdf-import" },
      },
    });

    const second = await createReviewJob(owner.userId, "Empty body Resume");
    const secondResponse = await request(app)
      .post(`/api/v1/resume-analyses/import-pdf/${second.job._id.toString()}/confirm`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(200);
    expect(secondResponse.body.data.resume.title).toBe("Empty body Resume");
  });

  it("adopts an explicitly selected import-bound candidate photo", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId, "Photo Resume");
    const candidate = await addCandidateToReviewJob({
      userId,
      jobId: job._id.toString(),
      sourceAssetId: asset._id.toString(),
      marker: 11,
    });

    const result = await confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
      selectedPhotoAssetId: candidate._id.toString(),
    });

    await expect(ResumeModel.findById(result.resumeId).lean()).resolves.toMatchObject({
      candidatePhotoAssetId: candidate._id,
      design: { showProfilePhoto: true },
    });
    const adoptedCandidate = await AssetModel.findById(candidate._id).lean();
    expect(adoptedCandidate).toMatchObject({
      status: "active",
      metadata: {
        resumeId: result.resumeId,
        resumeImportJobId: job._id.toString(),
        resumeImportSourceAssetId: asset._id.toString(),
      },
    });
    expect(adoptedCandidate).not.toHaveProperty("expiresAt");
    await expect(ResumeVersionModel.findById(result.versionId).lean()).resolves.toMatchObject({
      sourceAssetId: asset._id,
      source: "pdf-import",
    });
  });

  it("rejects selected assets outside the current review membership or import binding", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId);
    const foreignJob = new Types.ObjectId().toString();
    const wrongJobCandidate = await addCandidateToReviewJob({
      userId,
      jobId: job._id.toString(),
      sourceAssetId: asset._id.toString(),
      marker: 21,
      metadata: {
        resumeImportJobId: foreignJob,
        resumeImportSourceAssetId: asset._id.toString(),
        resumeImportOrdinal: 1,
      },
    });

    await expect(
      confirmResumePdfImport({
        userId,
        jobId: job._id.toString(),
        selectedPhotoAssetId: wrongJobCandidate._id.toString(),
      }),
    ).rejects.toMatchObject({ code: "RESUME_IMPORT_NOT_CONFIRMABLE" });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);

    const unlisted = await createAsset({
      userId,
      purpose: "resume-photo",
      temporary: true,
      expiresInSeconds: 15 * 60,
      file: {
        fieldname: "file",
        originalname: "unlisted.png",
        encoding: "7bit",
        mimetype: "image/png",
        size: syntheticPng(240, 320, 22).length,
        buffer: syntheticPng(240, 320, 22),
        destination: "",
        filename: "",
        path: "",
        stream: Readable.from(syntheticPng(240, 320, 22)),
      },
    });
    await expect(
      confirmResumePdfImport({
        userId,
        jobId: job._id.toString(),
        selectedPhotoAssetId: unlisted._id.toString(),
      }),
    ).rejects.toMatchObject({ code: "RESUME_IMPORT_NOT_CONFIRMABLE" });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("rejects cross-user, wrong-source, expired, deleted, and active photo candidates", async () => {
    const ownerId = new Types.ObjectId().toString();
    const otherUserId = new Types.ObjectId().toString();

    for (const scenario of [
      "cross-user",
      "wrong-source",
      "expired",
      "deleted",
      "active",
    ] as const) {
      const { asset, job } = await createReviewJob(ownerId, `Resume ${scenario}`);
      const candidateUserId = scenario === "cross-user" ? otherUserId : ownerId;
      const sourceAssetId =
        scenario === "wrong-source"
          ? new Types.ObjectId().toString()
          : asset._id.toString();
      const candidate = await addCandidateToReviewJob({
        userId: candidateUserId,
        jobId: job._id.toString(),
        sourceAssetId,
        marker: Math.floor(Math.random() * 200) + 30,
        temporary: scenario !== "active",
        expiresAt: scenario === "expired" ? new Date(0) : undefined,
      });
      if (scenario === "cross-user") {
        const storedJob = await JobRecordModel.findById(job._id);
        if (!storedJob) throw new Error("Synthetic job missing.");
        const result = storedJob.result as { kind: string; content: unknown };
        storedJob.result = {
          ...result,
          photoCandidates: [{ assetId: candidate._id.toString() }],
        };
        await storedJob.save();
      }
      if (scenario === "deleted") {
        candidate.status = "deleted";
        candidate.deletedAt = new Date();
        await candidate.save();
      }

      await expect(
        confirmResumePdfImport({
          userId: ownerId,
          jobId: job._id.toString(),
          selectedPhotoAssetId: candidate._id.toString(),
        }),
      ).rejects.toMatchObject({ code: "RESUME_IMPORT_NOT_CONFIRMABLE" });
      await expect(
        ResumeModel.countDocuments({ userId: ownerId, title: `Resume ${scenario}` }),
      ).resolves.toBe(0);
    }
  });

  it("does not let expired non-selected candidates block a no-photo confirmation", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId, "No photo Resume");
    await addCandidateToReviewJob({
      userId,
      jobId: job._id.toString(),
      sourceAssetId: asset._id.toString(),
      marker: 61,
      expiresAt: new Date(0),
    });

    const result = await confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    });

    await expect(ResumeModel.findById(result.resumeId).lean()).resolves.toMatchObject({
      design: { showProfilePhoto: false },
    });
  });

  it("returns one Resume/version and preserves one authoritative photo under repeated and racing confirmations", async () => {
    await ResumeVersionModel.init();
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId, "Concurrent reviewed Resume");
    const firstCandidate = await addCandidateToReviewJob({
      userId,
      jobId: job._id.toString(),
      sourceAssetId: asset._id.toString(),
      marker: 71,
      ordinal: 1,
    });
    const secondCandidate = await addCandidateToReviewJob({
      userId,
      jobId: job._id.toString(),
      sourceAssetId: asset._id.toString(),
      marker: 72,
      ordinal: 2,
    });

    const results = await Promise.allSettled([
      confirmResumePdfImport({
        userId,
        jobId: job._id.toString(),
        selectedPhotoAssetId: firstCandidate._id.toString(),
      }),
      confirmResumePdfImport({
        userId,
        jobId: job._id.toString(),
        selectedPhotoAssetId: secondCandidate._id.toString(),
      }),
    ]);
    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<
        Awaited<ReturnType<typeof confirmResumePdfImport>>
      > => result.status === "fulfilled",
    );
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const identity = fulfilled[0]!.value;
    const repeated = await confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
      selectedPhotoAssetId: firstCandidate._id.toString(),
    });
    expect(repeated).toEqual(identity);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);

    const resume = await ResumeModel.findById(identity.resumeId).lean();
    const winnerPhotoId = resume?.candidatePhotoAssetId?.toString();
    expect([firstCandidate._id.toString(), secondCandidate._id.toString()]).toContain(
      winnerPhotoId,
    );
    const activeCandidates = await AssetModel.find({
      _id: { $in: [firstCandidate._id, secondCandidate._id] },
      status: "active",
    }).lean();
    expect(activeCandidates).toHaveLength(1);
    expect(activeCandidates[0]?._id.toString()).toBe(winnerPhotoId);
  });

  it("rejects malformed candidate content before any Resume write", async () => {
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId);
    await JobRecordModel.updateOne(
      { _id: job._id },
      { $set: { result: { kind: "import-review", content: { basics: 42 } } } },
    );

    await expect(
      confirmResumePdfImport({ userId, jobId: job._id.toString() }),
    ).rejects.toBeTruthy();
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("rejects an import review without its required bounded expiry", async () => {
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId);
    await JobRecordModel.updateOne({ _id: job._id }, { $unset: { expiresAt: 1 } });

    await expect(
      confirmResumePdfImport({ userId, jobId: job._id.toString() }),
    ).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it.each([
    ["queued", { status: "queued", phase: "queued" }],
    ["processing", { status: "processing", phase: "validating" }],
    ["failed", { status: "failed", phase: "failed" }],
    ["cancelled", { status: "cancelled", phase: "cancelled" }],
    ["wrong type", { type: "resume.analyze" }],
    ["expired", { expiresAt: new Date(0) }],
  ])("rejects a %s import job before any Resume write", async (_label, update) => {
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId);
    await JobRecordModel.updateOne({ _id: job._id }, { $set: update });

    await expect(
      confirmResumePdfImport({ userId, jobId: job._id.toString() }),
    ).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("rejects a missing source Asset before any Resume write", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId);
    await AssetModel.updateOne(
      { _id: asset._id },
      { $set: { status: "deleted", deletedAt: new Date() } },
    );

    await expect(
      confirmResumePdfImport({ userId, jobId: job._id.toString() }),
    ).rejects.toMatchObject({ code: "ASSET_NOT_FOUND" });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("recovers an existing source-Asset winner, promotes it, and scrubs the review", async () => {
    const userId = new Types.ObjectId().toString();
    const { asset, job } = await createReviewJob(userId, "Recovered Resume");
    const winner = await createResume({
      userId,
      title: "Recovered Resume",
      content: normalizeResumeContent({
        basics: { fullName: "Synthetic Candidate", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      }),
      source: "pdf-import",
      sourceAssetId: asset._id.toString(),
    });

    const result = await confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    });

    expect(result).toEqual({
      resumeId: winner.resume._id.toString(),
      versionId: winner.version._id.toString(),
      versionNumber: 1,
    });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(AssetModel.findById(asset._id).lean()).resolves.toMatchObject({
      status: "active",
      metadata: { resumeId: winner.resume._id.toString() },
    });
    await expect(JobRecordModel.findById(job._id).lean()).resolves.toMatchObject({
      result: {
        kind: "import-adopted",
        resumeId: winner.resume._id.toString(),
      },
    });
  });
});
