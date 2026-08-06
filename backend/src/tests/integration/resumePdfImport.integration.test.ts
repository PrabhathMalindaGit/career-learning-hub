import { Readable } from "node:stream";
import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAsset } from "../../modules/assets/asset.service.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { AppError } from "../../shared/appError.js";

const { extractPdfTextMock } = vi.hoisted(() => ({
  extractPdfTextMock: vi.fn(),
}));

vi.mock("../../modules/resume-analysis/pdf.service.js", () => ({
  extractPdfText: extractPdfTextMock,
}));

import { importResumePdf } from "../../modules/resume-analysis/resumeAnalysis.service.js";

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

describe("Resume PDF import persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    extractPdfTextMock.mockReset();
  });

  it("creates exactly one owned Resume for a representative multi-section import", async () => {
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

    const result = await importResumePdf({
      userId,
      assetId: asset._id.toString(),
      title: "Synthetic imported Resume",
    });

    expect(result.versionNumber).toBe(1);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.findById(result.versionId).lean()).resolves.toMatchObject({
      userId: new Types.ObjectId(userId),
      source: "pdf-import",
      sourceAssetId: asset._id,
      content: {
        basics: {
          links: [{ label: "Portfolio", url: "https://portfolio.example/path" }],
        },
        experience: [{ employer: "Example Company" }],
      },
    });
    await expect(AssetModel.findById(asset._id).lean()).resolves.toMatchObject({
      status: "active",
      metadata: { resumeId: result.resumeId, pageCount: 2 },
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

    const result = await importResumePdf({
      userId,
      assetId: asset._id.toString(),
      title: "Minimal imported Resume",
    });

    await expect(ResumeVersionModel.findById(result.versionId).lean()).resolves.toMatchObject({
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
      importResumePdf({
        userId,
        assetId: asset._id.toString(),
        title: "Failed imported Resume",
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

    const error = await importResumePdf({
      userId,
      assetId: asset._id.toString(),
      title: "Semantic failure",
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
      importResumePdf({
        userId,
        assetId: asset._id.toString(),
        title: "Unreadable imported Resume",
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
      importResumePdf({
        userId,
        assetId: asset._id.toString(),
        title: "Transient failure",
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(0);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("returns the same result without a second provider call when the import is observed twice", async () => {
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for idempotency verification.",
      pageCount: 1,
      characterCount: 75,
    });
    const fetchMock = mockGemini(minimalResume());
    const input = {
      userId,
      assetId: asset._id.toString(),
      title: "Idempotent imported Resume",
    };

    const first = await importResumePdf(input);
    const second = await importResumePdf(input);

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(extractPdfTextMock).toHaveBeenCalledTimes(1);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("returns the winning version for simultaneous same-asset execution", async () => {
    await ResumeVersionModel.init();
    const userId = new Types.ObjectId().toString();
    const asset = await createImportAsset(userId);
    extractPdfTextMock.mockResolvedValue({
      text: "Synthetic candidate resume text long enough for a concurrent replay.",
      pageCount: 1,
      characterCount: 69,
    });
    const pendingResponses: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          pendingResponses.push(resolve);
          if (pendingResponses.length === 2) {
            pendingResponses.forEach((release) =>
              release(geminiResponse(minimalResume())),
            );
          }
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      userId,
      assetId: asset._id.toString(),
      title: "Concurrent imported Resume",
    };

    const [first, second] = await Promise.all([
      importResumePdf(input),
      importResumePdf(input),
    ]);

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(ResumeModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
  });
});
