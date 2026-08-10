import { Readable } from "node:stream";
import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { createAsset } from "../../modules/assets/asset.service.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { createResume } from "../../modules/resumes/resume.service.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { normalizeResumeContent } from "../../modules/resumes/resume.validation.js";
import { AppError } from "../../shared/appError.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { registerTestUser } from "../helpers/auth.js";

const { extractPdfTextMock } = vi.hoisted(() => ({
  extractPdfTextMock: vi.fn(),
}));

vi.mock("../../modules/resume-analysis/pdf.service.js", () => ({
  extractPdfText: extractPdfTextMock,
}));

import {
  confirmResumePdfImport,
  prepareResumePdfImport,
} from "../../modules/resume-analysis/resumeAnalysis.service.js";

const syntheticPdf = Buffer.from(
  "%PDF-1.4\n% Synthetic privacy-safe Resume PDF fixture\n%%EOF\n",
);

function geminiResponse(value: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: typeof value === "string" ? value : JSON.stringify(value) }] } }],
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
    vi.unstubAllGlobals();
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
    mockGemini({
      ...minimalResume(),
      basics: {
        ...minimalResume().basics,
        email: "candidate@example.test",
        links: [{ label: "Portfolio", url: "portfolio.example/path" }],
      },
      experience: [{
        employer: "Example Company",
        jobTitle: "Engineer",
        location: null,
        startDate: "2024-01",
        endDate: null,
        isCurrent: true,
        bullets: [{ text: "Built a privacy-safe integration fixture." }],
      }],
      education: [{
        institution: "Example University",
        qualification: "BSc",
        fieldOfStudy: "Computing",
        location: null,
        startDate: null,
        endDate: null,
        isCurrent: false,
        details: [],
      }],
      skills: [{ name: "Engineering", keywords: ["TypeScript"] }],
      projects: [{
        name: "Synthetic Project",
        role: null,
        description: null,
        startDate: null,
        endDate: null,
        technologies: [],
        links: [],
        bullets: [],
      }],
    });

    const result = await prepareResumePdfImport({
      userId,
      assetId: asset._id.toString(),
    });

    expect(result).toMatchObject({
      kind: "import-review",
      content: {
        basics: {
          links: [{ label: "Portfolio", url: "https://portfolio.example/path" }],
        },
        experience: [{ employer: "Example Company" }],
      },
    });
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
    mockGemini({
      basics: { fullName: "Minimal Candidate", links: [] },
    });

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
    mockGemini(response);

    await expect(
      prepareResumePdfImport({
        userId,
        assetId: asset._id.toString(),
      }),
    ).rejects.toMatchObject({ code });
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
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
      new AppError(422, "PDF_EXTRACTION_FAILED", "Text could not be extracted from the uploaded PDF."),
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
    await expect(ResumeVersionModel.findById(result.versionId).lean()).resolves.toMatchObject({
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

  it("returns the existing Resume workspace envelope from the public confirm route", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-import-confirm@example.com",
      displayName: "Resume Import Confirm",
    });
    const { job } = await createReviewJob(owner.userId, "Confirmed Resume");

    const response = await request(app)
      .post(`/api/v1/resume-analyses/import-pdf/${job._id.toString()}/confirm`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        resume: { title: "Confirmed Resume", latestVersionNumber: 1 },
        version: { versionNumber: 1, source: "pdf-import" },
      },
    });
  });

  it("returns one winner for repeated and concurrent confirmation", async () => {
    await ResumeVersionModel.init();
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId, "Concurrent reviewed Resume");
    const input = {
      userId,
      jobId: job._id.toString(),
    };

    const [first, second] = await Promise.all([
      confirmResumePdfImport(input),
      confirmResumePdfImport(input),
    ]);
    const repeated = await confirmResumePdfImport(input);

    expect(second).toEqual(first);
    expect(repeated).toEqual(first);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("rejects malformed candidate content before any Resume write", async () => {
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId);
    await JobRecordModel.updateOne(
      { _id: job._id },
      { $set: { result: { kind: "import-review", content: { basics: 42 } } } },
    );

    await expect(confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    })).rejects.toBeTruthy();
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("rejects an import review without its required bounded expiry", async () => {
    const userId = new Types.ObjectId().toString();
    const { job } = await createReviewJob(userId);
    await JobRecordModel.updateOne(
      { _id: job._id },
      { $unset: { expiresAt: 1 } },
    );

    await expect(confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    })).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
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

    await expect(confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    })).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
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

    await expect(confirmResumePdfImport({
      userId,
      jobId: job._id.toString(),
    })).rejects.toMatchObject({ code: "ASSET_NOT_FOUND" });
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
        experience: [], education: [], skills: [], projects: [],
        certifications: [], languages: [], interests: [],
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
      result: { kind: "import-adopted", resumeId: winner.resume._id.toString() },
    });
  });
});
