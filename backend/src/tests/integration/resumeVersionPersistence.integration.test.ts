import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  applyAnalysisSuggestions,
} from "../../modules/resume-analysis/resumeAnalysis.service.js";
import { ResumeAnalysisModel } from "../../modules/resume-analysis/resumeAnalysis.model.js";
import {
  createResume,
  createResumeVersion,
} from "../../modules/resumes/resume.service.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import type { ResumeContent } from "../../modules/resumes/resume.types.js";

function content(fullName: string, url = "https://example.test/profile") {
  return {
    basics: {
      fullName,
      links: [{ label: "Portfolio", url }],
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

function fullContent() {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      headline: "Platform Engineer",
      links: [{ id: randomUUID(), label: "Portfolio", url: "https://example.test" }],
    },
    experience: [
      {
        id: randomUUID(),
        employer: "Example Systems",
        jobTitle: "Engineer",
        startDate: "2024-01",
        isCurrent: true,
        bullets: [{ id: randomUUID(), text: "Built a synthetic service." }],
      },
      {
        id: randomUUID(),
        employer: "Example Studio",
        jobTitle: "Developer",
        startDate: "2023-01",
        endDate: "2023-12",
        isCurrent: false,
        bullets: [{ id: randomUUID(), text: "Maintained a synthetic tool." }],
      },
    ],
    education: [
      {
        id: randomUUID(),
        institution: "Example University",
        qualification: "BSc",
        fieldOfStudy: "Computing",
        startDate: "2020",
        endDate: "2024",
        isCurrent: false,
        details: [{ id: randomUUID(), text: "Completed a synthetic project." }],
      },
    ],
    skills: [
      {
        id: randomUUID(),
        name: "Frontend",
        keywords: ["React", "TypeScript"],
      },
    ],
    projects: [
      {
        id: randomUUID(),
        name: "StudyShare",
        technologies: ["React"],
        links: [],
        bullets: [{ id: randomUUID(), text: "Created a synthetic dashboard." }],
      },
    ],
    certifications: [
      {
        id: randomUUID(),
        name: "Synthetic Certificate",
        issuer: "Example Institute",
      },
    ],
    languages: [
      { id: randomUUID(), name: "English", proficiency: "Professional" },
    ],
    interests: ["Open-source development"],
  };
}

function plainContent(value: unknown): ResumeContent {
  return JSON.parse(JSON.stringify(value)) as ResumeContent;
}

describe("Resume immutable version persistence", () => {
  it("creates one immutable version, normalizes a domain URL, and advances the active version", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Synthetic Resume",
      content: content("Original Candidate"),
    });

    const saved = await createResumeVersion({
      userId,
      resumeId: created.resume._id.toString(),
      expectedCurrentVersionId: created.version._id.toString(),
      content: content("Updated Candidate", "github.com/example"),
    });

    expect(saved.version.versionNumber).toBe(2);
    expect(saved.version.parentVersionId?.toString()).toBe(created.version._id.toString());
    expect(saved.version.content.basics.links[0]?.url).toBe("https://github.com/example");
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(2);
    await expect(ResumeVersionModel.findById(created.version._id).lean()).resolves.toMatchObject({
      versionNumber: 1,
      content: { basics: { fullName: "Original Candidate" } },
    });
    await expect(ResumeModel.findById(created.resume._id).lean()).resolves.toMatchObject({
      latestVersionNumber: 2,
      currentVersionId: saved.version._id,
    });
  });

  it("preserves every untouched canonical section when one field is saved as a new version", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Full synthetic Resume",
      content: fullContent(),
    });
    const original = plainContent(created.version.content);
    const nextContent = structuredClone(original);
    nextContent.basics.headline = "Senior Platform Engineer";

    const saved = await createResumeVersion({
      userId,
      resumeId: created.resume._id.toString(),
      expectedCurrentVersionId: created.version._id.toString(),
      content: nextContent,
    });

    const expected = structuredClone(original);
    expected.basics.headline = "Senior Platform Engineer";
    expect(plainContent(saved.version.content)).toEqual(expected);
    expect(plainContent(saved.version.content).experience).toEqual(
      original.experience,
    );
    expect(plainContent(saved.version.content).education).toEqual(
      original.education,
    );
    expect(plainContent(saved.version.content).skills).toEqual(original.skills);
    expect(plainContent(saved.version.content).projects).toEqual(
      original.projects,
    );
    expect(plainContent(saved.version.content).certifications).toEqual(
      original.certifications,
    );
    expect(plainContent(saved.version.content).languages).toEqual(
      original.languages,
    );
    expect(plainContent(saved.version.content).interests).toEqual(
      original.interests,
    );
    expect(plainContent(saved.version.content).basics.links).toEqual(
      original.basics.links,
    );

    const historical = await ResumeVersionModel.findById(created.version._id)
      .lean();
    expect(plainContent(historical?.content)).toEqual(original);
  });

  it.each(["experience", "project"] as const)(
    "changes only one selected %s bullet when applying an AI suggestion",
    async (targetSection) => {
      const userId = new Types.ObjectId().toString();
      const created = await createResume({
        userId,
        title: "Rewrite preservation Resume",
        content: fullContent(),
      });
      const original = plainContent(created.version.content);
      const target = targetSection === "experience"
        ? original.experience[0]!.bullets[0]!
        : original.projects[0]!.bullets[0]!;
      const rewrittenText = `${target.text} Revised.`;
      const suggestionId = randomUUID();
      const analysis = await ResumeAnalysisModel.create({
        userId,
        resumeId: created.resume._id,
        resumeVersionId: created.version._id,
        target: { role: "Platform Engineer" },
        scoringVersion: "resume-readiness-v1",
        promptVersion: "resume-analysis-prompt-v1",
        provider: "gemini-direct",
        model: "gemini-3.6-flash",
        scoreBreakdown: {
          keywordMatch: 10,
          clarity: 10,
          evidence: 10,
          formatting: 10,
        },
        totalScore: 40,
        issues: [],
        strengths: [],
        missingKeywords: [],
        suggestions: [
          {
            id: suggestionId,
            bulletId: target.id,
            originalText: target.text,
            rewrittenText,
            rationale: "Synthetic rewrite evidence.",
            verificationRequired: true,
          },
        ],
      });

      const applied = await applyAnalysisSuggestions({
        userId,
        resumeId: created.resume._id.toString(),
        analysisId: analysis._id.toString(),
        suggestionIds: [suggestionId],
      });

      const expected = structuredClone(original);
      if (targetSection === "experience") {
        expected.experience[0]!.bullets[0]!.text = rewrittenText;
      } else {
        expected.projects[0]!.bullets[0]!.text = rewrittenText;
      }
      expect(applied.appliedCount).toBe(1);
      expect(plainContent(applied.version.content)).toEqual(expected);
      expect(plainContent(applied.version.content).education).toEqual(
        original.education,
      );
      expect(plainContent(applied.version.content).skills).toEqual(
        original.skills,
      );
      expect(plainContent(applied.version.content).certifications).toEqual(
        original.certifications,
      );
      await expect(
        ResumeVersionModel.countDocuments({ userId }),
      ).resolves.toBe(2);
    },
  );

  it("rejects a version conflict without creating a partial version", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Conflict Resume",
      content: content("Original Candidate"),
    });

    await expect(
      createResumeVersion({
        userId,
        resumeId: created.resume._id.toString(),
        expectedCurrentVersionId: new Types.ObjectId().toString(),
        content: content("Conflicting Candidate"),
      }),
    ).rejects.toMatchObject({ code: "RESUME_VERSION_CONFLICT", statusCode: 409 });
    await expect(ResumeVersionModel.countDocuments({ userId })).resolves.toBe(1);
    await expect(ResumeModel.findById(created.resume._id).lean()).resolves.toMatchObject({
      latestVersionNumber: 1,
      currentVersionId: created.version._id,
    });
  });

  it("preserves ownership boundaries without exposing or creating a version", async () => {
    const ownerId = new Types.ObjectId().toString();
    const otherUserId = new Types.ObjectId().toString();
    const created = await createResume({
      userId: ownerId,
      title: "Owned Resume",
      content: content("Owner Candidate"),
    });

    await expect(
      createResumeVersion({
        userId: otherUserId,
        resumeId: created.resume._id.toString(),
        expectedCurrentVersionId: created.version._id.toString(),
        content: content("Unauthorized Candidate"),
      }),
    ).rejects.toMatchObject({ code: "RESUME_NOT_FOUND", statusCode: 404 });
    await expect(ResumeVersionModel.countDocuments({ resumeId: created.resume._id })).resolves.toBe(1);
  });
});
