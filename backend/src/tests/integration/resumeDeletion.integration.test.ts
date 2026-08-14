import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { ResumeAnalysisModel } from "../../modules/resume-analysis/resumeAnalysis.model.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { registerTestUser } from "../helpers/auth.js";

async function createOwnedResume(accessToken: string, title: string) {
  const response = await request(app)
    .post("/api/v1/resumes")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title })
    .expect(201);

  return {
    resumeId: response.body.data.resume._id as string,
    versionId: response.body.data.version._id as string,
  };
}

async function createAnalysis(input: {
  userId: string;
  resumeId: string;
  versionId: string;
}) {
  return ResumeAnalysisModel.create({
    userId: input.userId,
    resumeId: input.resumeId,
    resumeVersionId: input.versionId,
    target: { role: "Software Engineer" },
    provider: "gemini",
    model: "test-model",
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
  });
}

describe("Resume permanent deletion", () => {
  it("permanently deletes the owned Resume, versions, analyses, and direct Assets", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-delete-owner@example.com",
      displayName: "Resume Delete Owner",
    });
    const { resumeId, versionId } = await createOwnedResume(
      owner.accessToken,
      "Delete Me",
    );

    await createAnalysis({
      userId: owner.userId,
      resumeId,
      versionId,
    });

    const sourceAsset = await AssetModel.create({
      userId: owner.userId,
      purpose: "resume-import",
      storageProvider: "local",
      storageKey: `${owner.userId}/test/resume-delete-source.pdf`,
      originalFilename: "source.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      checksumSha256: "a".repeat(64),
      status: "active",
      metadata: { resumeId },
    });

    await ResumeVersionModel.updateOne(
      { _id: versionId, userId: owner.userId, resumeId },
      { $set: { sourceAssetId: sourceAsset._id, source: "pdf-import" } },
    );

    const photoAsset = await AssetModel.create({
      userId: owner.userId,
      purpose: "resume-photo",
      storageProvider: "local",
      storageKey: `${owner.userId}/test/resume-delete-photo.png`,
      originalFilename: "photo.png",
      mimeType: "image/png",
      sizeBytes: 128,
      checksumSha256: "b".repeat(64),
      status: "active",
      metadata: { resumeId },
    });
    await ResumeModel.updateOne(
      { _id: resumeId, userId: owner.userId },
      { $set: { candidatePhotoAssetId: photoAsset._id } },
    );

    await request(app)
      .delete(`/api/v1/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await ResumeModel.countDocuments({ _id: resumeId })).toBe(0);
    expect(await ResumeVersionModel.countDocuments({ resumeId })).toBe(0);
    expect(await ResumeAnalysisModel.countDocuments({ resumeId })).toBe(0);

    const storedAssets = await AssetModel.find({
      _id: { $in: [sourceAsset._id, photoAsset._id] },
    }).lean();
    expect(storedAssets).toHaveLength(2);
    expect(storedAssets.every((asset) => asset.status === "deleted")).toBe(true);
    expect(storedAssets.every((asset) => asset.deletedAt instanceof Date)).toBe(true);
  });

  it("uses owner-scoped not-found behavior and never touches another user's Resume", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-delete-private-owner@example.com",
      displayName: "Resume Delete Private Owner",
    });
    const other = await registerTestUser(app, {
      email: "resume-delete-private-other@example.com",
      displayName: "Resume Delete Private Other",
    });
    const { resumeId } = await createOwnedResume(
      owner.accessToken,
      "Private Resume",
    );

    const response = await request(app)
      .delete(`/api/v1/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("RESUME_NOT_FOUND");
    expect(await ResumeModel.exists({ _id: resumeId, userId: owner.userId })).toBeTruthy();
  });

  it.each(["queued", "processing"] as const)(
    "returns 409 with no partial deletion while related analysis work is %s",
    async (status) => {
      const owner = await registerTestUser(app, {
        email: `resume-delete-${status}@example.com`,
        displayName: `Resume Delete ${status}`,
      });
      const { resumeId } = await createOwnedResume(
        owner.accessToken,
        `Blocked ${status}`,
      );

      await JobRecordModel.create({
        userId: owner.userId,
        type: "resume.analyze",
        payload: { userId: owner.userId, resumeId },
        status,
      });

      const response = await request(app)
        .delete(`/api/v1/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(409);

      expect(response.body.error.code).toBe(
        "RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB",
      );
      expect(await ResumeModel.exists({ _id: resumeId })).toBeTruthy();
      expect(await ResumeVersionModel.countDocuments({ resumeId })).toBeGreaterThan(0);
    },
  );

  it.each(["completed", "failed", "cancelled"] as const)(
    "removes matching terminal Resume analysis jobs with status %s",
    async (status) => {
      const owner = await registerTestUser(app, {
        email: `resume-delete-terminal-${status}@example.com`,
        displayName: `Resume Delete Terminal ${status}`,
      });
      const { resumeId } = await createOwnedResume(
        owner.accessToken,
        `Terminal ${status}`,
      );

      const job = await JobRecordModel.create({
        userId: owner.userId,
        type: "resume.analyze",
        payload: { userId: owner.userId, resumeId },
        status,
      });

      await request(app)
        .delete(`/api/v1/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(204);

      expect(await JobRecordModel.exists({ _id: job._id })).toBeFalsy();
    },
  );

  it("removes an adopted terminal PDF import job for the deleted Resume but leaves unrelated jobs", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-delete-import-job@example.com",
      displayName: "Resume Delete Import Job",
    });
    const { resumeId } = await createOwnedResume(
      owner.accessToken,
      "Imported Resume",
    );

    const adopted = await JobRecordModel.create({
      userId: owner.userId,
      type: "resume.import-pdf",
      payload: { userId: owner.userId, assetId: "a".repeat(24), title: "Imported Resume" },
      status: "completed",
      result: {
        kind: "import-adopted",
        resumeId,
        versionId: "b".repeat(24),
        versionNumber: 1,
      },
    });
    const unrelated = await JobRecordModel.create({
      userId: owner.userId,
      type: "resume.import-pdf",
      payload: { userId: owner.userId, assetId: "c".repeat(24), title: "Other" },
      status: "completed",
      result: { kind: "import-review", content: {} },
    });

    await request(app)
      .delete(`/api/v1/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await JobRecordModel.exists({ _id: adopted._id })).toBeFalsy();
    expect(await JobRecordModel.exists({ _id: unrelated._id })).toBeTruthy();
  });
});
