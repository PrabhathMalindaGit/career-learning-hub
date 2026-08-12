import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { registerTestUser } from "../helpers/auth.js";

function png(width = 800, height = 1000): Buffer {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  Buffer.from("IHDR", "ascii").copy(buffer, 12);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = 2;
  buffer[26] = 0;
  buffer[27] = 0;
  buffer[28] = 0;
  return buffer;
}

async function createOwnedResume(accessToken: string, title: string) {
  const response = await request(app)
    .post("/api/v1/resumes")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title })
    .expect(201);
  return response.body.data.resume._id as string;
}

describe("Resume Candidate Photo integration", () => {
  it("uploads, hides, replaces, sources, and removes without creating Resume versions", async () => {
    const owner = await registerTestUser(app, {
      email: "candidate-photo-owner@example.com",
      displayName: "Candidate Photo Owner",
    });
    const resumeId = await createOwnedResume(
      owner.accessToken,
      "Candidate Photo Resume",
    );
    const versionCountBefore = await ResumeVersionModel.countDocuments({
      userId: owner.userId,
      resumeId,
    });

    const uploaded = await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("expectedCandidatePhotoAssetId", "none")
      .attach("file", png(), {
        filename: "candidate.png",
        contentType: "image/png",
      })
      .expect(201);

    const firstAssetId = uploaded.body.data.resume.candidatePhotoAssetId as string;
    expect(firstAssetId).toMatch(/^[a-f\d]{24}$/i);
    expect(uploaded.body.data.resume.design.showProfilePhoto).toBe(true);
    expect(uploaded.body.data.resume.latestVersionNumber).toBe(1);

    const firstAsset = await AssetModel.findById(firstAssetId).lean();
    expect(firstAsset).toMatchObject({
      purpose: "resume-photo",
      status: "active",
    });
    expect(firstAsset?.metadata).toMatchObject({ resumeId });

    const source = await request(app)
      .get(`/api/v1/resumes/${resumeId}/candidate-photo/source`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(source.body.data.url).toEqual(expect.any(String));
    expect(source.body.data.expiresAt).toEqual(expect.any(String));
    expect(source.body.data).not.toHaveProperty("storageKey");
    expect(source.body.data).not.toHaveProperty("checksumSha256");

    await request(app)
      .patch(`/api/v1/resumes/${resumeId}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ showProfilePhoto: false })
      .expect(200);

    const replaced = await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("expectedCandidatePhotoAssetId", firstAssetId)
      .attach("file", png(900, 900), {
        filename: "replacement.png",
        contentType: "image/png",
      })
      .expect(201);

    const secondAssetId = replaced.body.data.resume.candidatePhotoAssetId as string;
    expect(secondAssetId).not.toBe(firstAssetId);
    expect(replaced.body.data.resume.design.showProfilePhoto).toBe(false);
    expect(replaced.body.data.resume.latestVersionNumber).toBe(1);

    const retired = await AssetModel.findById(firstAssetId).lean();
    expect(["temporary", "deleted"]).toContain(retired?.status);

    await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("expectedCandidatePhotoAssetId", firstAssetId)
      .attach("file", png(), {
        filename: "stale.png",
        contentType: "image/png",
      })
      .expect(409);

    const removed = await request(app)
      .delete(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ expectedCandidatePhotoAssetId: secondAssetId })
      .expect(200);

    expect(removed.body.data.resume.candidatePhotoAssetId).toBeUndefined();
    expect(removed.body.data.resume.design.showProfilePhoto).toBe(false);
    expect(removed.body.data.resume.latestVersionNumber).toBe(1);
    expect(
      await ResumeVersionModel.countDocuments({
        userId: owner.userId,
        resumeId,
      }),
    ).toBe(versionCountBefore);

    await request(app)
      .get(`/api/v1/resumes/${resumeId}/candidate-photo/source`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);
  });

  it("keeps ownership and generic-upload boundaries fail closed", async () => {
    const owner = await registerTestUser(app, {
      email: "candidate-photo-owner-2@example.com",
      displayName: "Candidate Photo Owner Two",
    });
    const other = await registerTestUser(app, {
      email: "candidate-photo-other@example.com",
      displayName: "Candidate Photo Other",
    });
    const resumeId = await createOwnedResume(owner.accessToken, "Private Photo Resume");

    const uploaded = await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("expectedCandidatePhotoAssetId", "none")
      .attach("file", png(), {
        filename: "private.png",
        contentType: "image/png",
      })
      .expect(201);
    const assetId = uploaded.body.data.resume.candidatePhotoAssetId as string;

    await request(app)
      .get(`/api/v1/resumes/${resumeId}/candidate-photo/source`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .field("expectedCandidatePhotoAssetId", assetId)
      .attach("file", png(), {
        filename: "foreign.png",
        contentType: "image/png",
      })
      .expect(404);

    await request(app)
      .delete(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ expectedCandidatePhotoAssetId: assetId })
      .expect(404);

    await request(app)
      .post("/api/v1/assets")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("purpose", "resume-photo")
      .attach("file", png(), {
        filename: "unattached.png",
        contentType: "image/png",
      })
      .expect(400);

    const stored = await ResumeModel.findById(resumeId).lean();
    expect(stored?.candidatePhotoAssetId?.toString()).toBe(assetId);
    expect(
      await AssetModel.countDocuments({
        _id: new Types.ObjectId(assetId),
        userId: owner.userId,
        purpose: "resume-photo",
        status: "active",
      }),
    ).toBe(1);
  });

  it("rejects generic deletion of an attached candidate photo", async () => {
    const owner = await registerTestUser(app, {
      email: "candidate-photo-generic-delete@example.com",
      displayName: "Candidate Photo Generic Delete",
    });
    const resumeId = await createOwnedResume(
      owner.accessToken,
      "Attached Candidate Photo Resume",
    );

    const uploaded = await request(app)
      .post(`/api/v1/resumes/${resumeId}/candidate-photo`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("expectedCandidatePhotoAssetId", "none")
      .attach("file", png(), {
        filename: "attached.png",
        contentType: "image/png",
      })
      .expect(201);
    const assetId = uploaded.body.data.resume.candidatePhotoAssetId as string;

    const rejected = await request(app)
      .delete(`/api/v1/assets/${assetId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(rejected.body.error.code).toBe("RESUME_PHOTO_ATTACHED");

    const storedResume = await ResumeModel.findById(resumeId).lean();
    expect(storedResume?.candidatePhotoAssetId?.toString()).toBe(assetId);
    expect(
      await AssetModel.countDocuments({
        _id: new Types.ObjectId(assetId),
        userId: owner.userId,
        purpose: "resume-photo",
        status: "active",
      }),
    ).toBe(1);

    await request(app)
      .get(`/api/v1/resumes/${resumeId}/candidate-photo/source`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
  });

  it("rejects Show when no candidate photo exists", async () => {
    const owner = await registerTestUser(app, {
      email: "candidate-photo-show@example.com",
      displayName: "Candidate Photo Show",
    });
    const resumeId = await createOwnedResume(owner.accessToken, "No Photo Resume");

    const response = await request(app)
      .patch(`/api/v1/resumes/${resumeId}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ showProfilePhoto: true })
      .expect(409);

    expect(response.body.error.code).toBe("RESUME_PHOTO_REQUIRED");
  });
});