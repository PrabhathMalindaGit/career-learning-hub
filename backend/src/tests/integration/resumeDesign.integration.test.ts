import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../../app.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { registerTestUser } from "../helpers/auth.js";

const approvedDesign = {
  templateId: "modern-professional",
  colorPaletteId: "forest",
  pageSize: "LETTER",
  fontFamily: "Georgia",
  showProfilePhoto: false,
} as const;

describe("Resume design integration", () => {
  it("updates only an authenticated owner's existing Resume design without creating a version", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-design-owner@example.com",
      displayName: "Resume Design Owner",
    });
    const otherUser = await registerTestUser(app, {
      email: "resume-design-other@example.com",
      displayName: "Resume Design Other",
    });

    const ownerCreated = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Owner Design Resume" })
      .expect(201);
    const otherCreated = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ title: "Other Design Resume" })
      .expect(201);

    const ownerResumeId = ownerCreated.body.data.resume._id as string;
    const otherResumeId = otherCreated.body.data.resume._id as string;
    const originalOwnerResume = await ResumeModel.findById(
      ownerResumeId,
    ).lean();
    const originalOwnerVersion = await ResumeVersionModel.findOne({
      _id: originalOwnerResume?.currentVersionId,
      resumeId: ownerResumeId,
      userId: owner.userId,
    }).lean();
    const originalOtherDesign = (
      await ResumeModel.findById(otherResumeId).lean()
    )?.design;
    const versionCountBefore = await ResumeVersionModel.countDocuments({
      resumeId: ownerResumeId,
      userId: owner.userId,
    });

    const unauthenticated = await request(app)
      .patch(`/api/v1/resumes/${ownerResumeId}/design`)
      .send(approvedDesign)
      .expect(401);
    expect(unauthenticated.body.error.requestId).toEqual(
      expect.any(String),
    );

    await request(app)
      .patch(`/api/v1/resumes/${ownerResumeId}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(400);

    await request(app)
      .patch(`/api/v1/resumes/${ownerResumeId}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ pageSize: "LEGAL" })
      .expect(400);

    const foreign = await request(app)
      .patch(`/api/v1/resumes/${ownerResumeId}/design`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send(approvedDesign)
      .expect(404);
    expect(foreign.body.error.code).toBe("RESUME_NOT_FOUND");
    expect(foreign.body.error.requestId).toEqual(expect.any(String));

    const missing = await request(app)
      .patch(`/api/v1/resumes/${new Types.ObjectId().toString()}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(approvedDesign)
      .expect(404);
    expect(missing.body.error.code).toBe("RESUME_NOT_FOUND");

    const updated = await request(app)
      .patch(`/api/v1/resumes/${ownerResumeId}/design`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(approvedDesign)
      .expect(200);

    expect(updated.body.data.resume._id).toBe(ownerResumeId);
    expect(updated.body.data.resume.design).toEqual(approvedDesign);

    const ownerAfter = await ResumeModel.findById(ownerResumeId).lean();
    const ownerVersionAfter = await ResumeVersionModel.findOne({
      _id: ownerAfter?.currentVersionId,
      resumeId: ownerResumeId,
      userId: owner.userId,
    }).lean();
    const otherAfter = await ResumeModel.findById(otherResumeId).lean();

    expect(ownerAfter?.design).toMatchObject(approvedDesign);
    expect(ownerAfter?.currentVersionId?.toString()).toBe(
      originalOwnerResume?.currentVersionId?.toString(),
    );
    expect(ownerAfter?.latestVersionNumber).toBe(
      originalOwnerResume?.latestVersionNumber,
    );
    expect(ownerVersionAfter?.content).toEqual(originalOwnerVersion?.content);
    expect(
      await ResumeVersionModel.countDocuments({
        resumeId: ownerResumeId,
        userId: owner.userId,
      }),
    ).toBe(versionCountBefore);
    expect(otherAfter?.design).toEqual(originalOtherDesign);
  });
});
