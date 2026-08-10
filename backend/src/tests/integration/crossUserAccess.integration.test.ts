import { describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { registerTestUser } from "../helpers/auth.js";

describe("cross-user access denial integration", () => {
  it("prevents another user from reading a resume and version", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-owner@example.com",
      displayName: "Resume Owner",
    });
    const attacker = await registerTestUser(app, {
      email: "resume-attacker@example.com",
      displayName: "Resume Attacker",
    });

    const created = await request(app)
      .post("/api/v1/resumes")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Private Resume",
      })
      .expect(201);

    const resumeId = created.body.data.resume._id;
    const versionId = created.body.data.version._id;

    const resumeResponse = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(resumeResponse.body.error.code).toBe(
      "RESUME_NOT_FOUND",
    );

    const versionResponse = await request(app)
      .get(
        `/api/v1/resumes/${resumeId}/versions/${versionId}`,
      )
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(versionResponse.body.error.code).toBe(
      "RESUME_VERSION_NOT_FOUND",
    );
  });

  it("prevents another user from confirming or inspecting staged import content", async () => {
    const owner = await registerTestUser(app, {
      email: "import-review-owner@example.com",
      displayName: "Import Review Owner",
    });
    const other = await registerTestUser(app, {
      email: "import-review-other@example.com",
      displayName: "Import Review Other",
    });
    const job = await JobRecordModel.create({
      userId: owner.userId,
      type: "resume.import-pdf",
      payload: {
        userId: owner.userId,
        assetId: new Types.ObjectId().toString(),
        title: "Private staged Resume",
      },
      status: "completed",
      phase: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result: {
        kind: "import-review",
        content: {
          basics: { fullName: "Private Synthetic Candidate", links: [] },
          experience: [], education: [], skills: [], projects: [],
          certifications: [], languages: [], interests: [],
        },
      },
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .post(`/api/v1/resume-analyses/import-pdf/${job._id.toString()}/confirm`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error).toMatchObject({
      code: "JOB_NOT_FOUND",
      message: "Job not found.",
    });
    const stored = await JobRecordModel.findById(job._id).lean();
    expect(stored?.result).toHaveProperty("content");
  });
});
