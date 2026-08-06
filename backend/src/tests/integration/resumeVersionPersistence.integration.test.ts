import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  createResume,
  createResumeVersion,
} from "../../modules/resumes/resume.service.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";

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
