import { describe, expect, it } from "vitest";
import {
  parseAnalysis,
  parseJob,
  parseResumeEnvelope,
  parseResumeContent,
  parseResumeList,
  parseResumeWorkspace,
  parseVersionList,
} from "./resumeContracts";

const objectId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const analysisId = "507f1f77bcf86cd799439013";
const jobId = "507f1f77bcf86cd799439014";
const stableId = "123e4567-e89b-42d3-a456-426614174000";
const suggestionId = "123e4567-e89b-42d3-a456-426614174001";
const timestamp = "2026-07-24T10:00:00.000Z";

function contentFixture() {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      email: "candidate@example.test",
      links: [
        {
          id: stableId,
          label: "Portfolio",
          url: "https://example.test",
        },
      ],
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

function resumeFixture() {
  return {
    _id: objectId,
    userId: "private-owner",
    title: "Synthetic Resume",
    status: "draft",
    currentVersionId: versionId,
    latestVersionNumber: 1,
    design: {
      templateId: "unknown-persisted-template",
      colorPaletteId: "private-palette",
      pageSize: "A4",
      fontFamily: "private-font",
      showProfilePhoto: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    storageKey: "private/storage/key",
    metadata: { prompt: "private" },
  };
}

function versionFixture() {
  return {
    _id: versionId,
    userId: "private-owner",
    resumeId: objectId,
    versionNumber: 1,
    source: "manual",
    content: contentFixture(),
    changeSummary: "Initial version",
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceAssetId: "private-asset",
  };
}

describe("resume contract validators", () => {
  it("validates canonical Resume content as a standalone trust boundary", () => {
    expect(parseResumeContent(contentFixture())).toEqual(contentFixture());
    expect(() =>
      parseResumeContent({ ...contentFixture(), unexpected: true }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeContent({
        ...contentFixture(),
        basics: { ...contentFixture().basics, email: "invalid" },
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeContent({
        ...contentFixture(),
        skills: [{ id: "not-a-uuid", name: "Tools", keywords: ["Git"] }],
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeContent({
        ...contentFixture(),
        interests: Array.from({ length: 51 }, (_, index) => `Interest ${index}`),
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it("narrows workspace persistence objects to allowlisted fields", () => {
    const result = parseResumeWorkspace({
      resume: resumeFixture(),
      version: versionFixture(),
    });

    expect(result.resume).toEqual({
      id: objectId,
      title: "Synthetic Resume",
      status: "draft",
      currentVersionId: versionId,
      latestVersionNumber: 1,
      design: {
        templateId: "unknown-persisted-template",
        colorPaletteId: "private-palette",
        pageSize: "A4",
        fontFamily: "private-font",
        showProfilePhoto: false,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    expect(result.version.content.basics.links[0]?.id).toBe(stableId);
    expect(result.resume).not.toHaveProperty("userId");
    expect(result.resume).not.toHaveProperty("storageKey");
    expect(result.version).not.toHaveProperty("sourceAssetId");
  });

  it("rejects malformed identifiers, dates, design values, and stable IDs", () => {
    expect(() =>
      parseResumeWorkspace({
        resume: { ...resumeFixture(), _id: "not-an-object-id" },
        version: versionFixture(),
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeWorkspace({
        resume: { ...resumeFixture(), updatedAt: "yesterday" },
        version: versionFixture(),
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeWorkspace({
        resume: {
          ...resumeFixture(),
          design: { ...resumeFixture().design, pageSize: "TABLOID" },
        },
        version: versionFixture(),
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseResumeWorkspace({
        resume: resumeFixture(),
        version: {
          ...versionFixture(),
          content: {
            ...contentFixture(),
            basics: {
              ...contentFixture().basics,
              links: [
                {
                  id: "not-a-uuid",
                  label: "Portfolio",
                  url: "https://example.test",
                },
              ],
            },
          },
        },
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it("rejects a malformed optional certification credential URL", () => {
    expect(() =>
      parseResumeWorkspace({
        resume: resumeFixture(),
        version: {
          ...versionFixture(),
          content: {
            ...contentFixture(),
            certifications: [
              {
                id: stableId,
                name: "Synthetic Credential",
                credentialUrl: "not-a-url",
              },
            ],
          },
        },
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it("validates list pagination and drops private list fields", () => {
    const result = parseResumeList({
      resumes: [resumeFixture()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    expect(result.resumes).toHaveLength(1);
    expect(result.resumes[0]).not.toHaveProperty("userId");
    expect(() =>
      parseResumeList({
        resumes: [resumeFixture()],
        pagination: { page: 2, limit: 20, total: 1, pages: 1 },
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it("validates a design-update Resume envelope and rejects unsupported paper sizes", () => {
    const result = parseResumeEnvelope({ resume: resumeFixture() });

    expect(result.id).toBe(objectId);
    expect(result.design.pageSize).toBe("A4");
    expect(result).not.toHaveProperty("userId");
    expect(() =>
      parseResumeEnvelope({
        resume: {
          ...resumeFixture(),
          design: { ...resumeFixture().design, pageSize: "LEGAL" },
        },
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it.each([
    ["ats-classic", "slate", "Inter"],
    ["modern-professional", "forest", "Arial"],
    ["compact-technical", "navy", "Georgia"],
  ])(
    "accepts approved design values %s, %s, and %s without narrowing unknown persistence",
    (templateId, colorPaletteId, fontFamily) => {
      const approved = parseResumeEnvelope({
        resume: {
          ...resumeFixture(),
          design: {
            ...resumeFixture().design,
            templateId,
            colorPaletteId,
            fontFamily,
          },
        },
      });
      const unknown = parseResumeEnvelope({ resume: resumeFixture() });

      expect(approved.design).toEqual({
        templateId,
        colorPaletteId,
        pageSize: "A4",
        fontFamily,
        showProfilePhoto: false,
      });
      expect(unknown.design.templateId).toBe(
        "unknown-persisted-template",
      );
      expect(unknown.design.colorPaletteId).toBe("private-palette");
      expect(unknown.design.fontFamily).toBe("private-font");
    },
  );

  it("validates immutable version metadata without exposing asset IDs", () => {
    const result = parseVersionList({
      versions: [
        {
          ...versionFixture(),
          content: undefined,
          updatedAt: undefined,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    expect(result.versions[0]).toEqual({
      id: versionId,
      versionNumber: 1,
      source: "manual",
      changeSummary: "Initial version",
      createdAt: timestamp,
    });
  });

  it("allows only supported job status and safe error fields", () => {
    const result = parseJob({
      job: {
        id: jobId,
        type: "resume.analyze",
        status: "failed",
        progress: 40,
        attempts: 3,
        maxAttempts: 3,
        result: { private: true },
        error: {
          code: "AI_REQUEST_FAILED",
          message: "Analysis could not be completed.",
          stack: "private stack",
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        payload: { jobDescription: "private" },
      },
    });

    expect(result.error).toEqual({
      code: "AI_REQUEST_FAILED",
      message: "Analysis could not be completed.",
    });
    expect(result).not.toHaveProperty("payload");
    expect(result.error).not.toHaveProperty("stack");
    expect(() =>
      parseJob({
        job: {
          ...result,
          status: "paused",
        },
      }),
    ).toThrowError(/invalid resume response/i);
  });

  it("parses only exact canonical import-review and import-adopted results", () => {
    const baseJob = {
      id: jobId,
      type: "resume.import-pdf",
      status: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const review = parseJob({
      job: {
        ...baseJob,
        result: { kind: "import-review", content: contentFixture() },
      },
    });
    expect(review.result).toEqual({
      kind: "import-review",
      content: contentFixture(),
    });
    const adopted = parseJob({
      job: {
        ...baseJob,
        result: {
          kind: "import-adopted",
          resumeId: objectId,
          versionId,
          versionNumber: 1,
        },
      },
    });
    expect(adopted.result).toEqual({
      kind: "import-adopted",
      resumeId: objectId,
      versionId,
      versionNumber: 1,
    });

    for (const result of [
      { kind: "import-review", content: { ...contentFixture(), private: true } },
      { kind: "import-review", content: contentFixture(), extra: true },
      { kind: "import-adopted", resumeId: objectId, versionId, versionNumber: 1, content: contentFixture() },
      { kind: "import", resumeId: objectId, versionId, versionNumber: 1 },
    ]) {
      expect(() => parseJob({ job: { ...baseJob, result } })).toThrowError(
        /invalid resume response/i,
      );
    }
  });

  it("validates analysis categories and strips provider metadata and job context", () => {
    const result = parseAnalysis({
      analysis: {
        _id: analysisId,
        userId: "private-owner",
        resumeId: objectId,
        resumeVersionId: versionId,
        target: {
          role: "Platform Engineer",
          company: "Example",
          jobDescription: "private job description",
        },
        scoreBreakdown: {
          keywordMatch: 20,
          clarity: 21,
          evidence: 22,
          formatting: 23,
        },
        totalScore: 86,
        issues: [
          { code: "MISSING_EVIDENCE", severity: "medium", message: "Add evidence." },
        ],
        strengths: [{ title: "Clear scope", detail: "Responsibilities are clear." }],
        missingKeywords: ["observability"],
        suggestions: [
          {
            id: suggestionId,
            bulletId: stableId,
            originalText: "Built a service.",
            rewrittenText: "Built a reliable service.",
            rationale: "Adds useful specificity.",
            verificationRequired: true,
          },
        ],
        provider: "private-provider",
        model: "private-model",
        promptVersion: "private-prompt",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    expect(result.target).toEqual({
      role: "Platform Engineer",
      company: "Example",
    });
    expect(result).not.toHaveProperty("provider");
    expect(result).not.toHaveProperty("model");
    expect(result.target).not.toHaveProperty("jobDescription");
    expect(() =>
      parseAnalysis({
        analysis: {
          ...result,
          suggestions: [
            {
              ...result.suggestions[0],
              originalText: "",
            },
          ],
        },
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseAnalysis({
        analysis: {
          ...result,
          suggestions: [
            {
              ...result.suggestions[0],
              rewrittenText: "",
            },
          ],
        },
      }),
    ).toThrowError(/invalid resume response/i);
    expect(() =>
      parseAnalysis({
        analysis: {
          ...result,
          scoreBreakdown: {
            ...result.scoreBreakdown,
            impact: 20,
            evidence: undefined,
          },
        },
      }),
    ).toThrowError(/invalid resume response/i);
  });
});
