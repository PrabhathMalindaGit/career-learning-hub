import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { createResume } from "../../modules/resumes/resume.service.js";
import { registerTestUser } from "../helpers/auth.js";

async function connectApplicationManagedGemini(userId: string) {
  env.AI_ROUTING_FOUNDATION_ENABLED = true;
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = true;
  await ensureAiFoundation(userId);
  await activateProvider({
    userId,
    provider: "gemini-direct",
    credentialSource: "administrator-managed",
    expectedRevision: 0,
  });
}

describe("Resume AI job submission idempotency", () => {
  it("creates one owned analysis job for repeated use of one request ID", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-job-owner@example.com",
      displayName: "Resume Job Owner",
    });
    await connectApplicationManagedGemini(owner.userId);
    const created = await createResume({
      userId: owner.userId,
      title: "Synthetic Resume",
      content: {
        basics: { fullName: "Synthetic Candidate", links: [] },
        experience: [], education: [], skills: [], projects: [],
        certifications: [], languages: [], interests: [],
      },
    });
    const requestId = randomUUID();
    const route = `/api/v1/resume-analyses/resumes/${created.resume._id.toString()}/analyze`;
    const body = {
      requestId,
      versionId: created.version._id.toString(),
      targetRole: "Synthetic Engineer",
    };

    const first = await request(app)
      .post(route)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(body)
      .expect(202);
    const duplicate = await request(app)
      .post(route)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(body)
      .expect(202);

    expect(duplicate.body.data.job.id).toBe(first.body.data.job.id);
    await expect(JobRecordModel.countDocuments({
      userId: owner.userId,
      type: "resume.analyze",
    })).resolves.toBe(1);
  });

  it("rejects an invalid request ID before enqueueing work", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-job-invalid@example.com",
      displayName: "Resume Job Invalid",
    });
    const created = await createResume({
      userId: owner.userId,
      title: "Synthetic Resume",
    });

    await request(app)
      .post(`/api/v1/resume-analyses/resumes/${created.resume._id.toString()}/analyze`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ requestId: "not-a-uuid", targetRole: "Synthetic Engineer" })
      .expect(400);
    await expect(JobRecordModel.countDocuments({
      userId: owner.userId,
      type: "resume.analyze",
    })).resolves.toBe(0);
  });

  it("deduplicates concurrent PDF imports without returning an orphan asset", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-import-concurrent@example.com",
      displayName: "Resume Import Concurrent",
    });
    await connectApplicationManagedGemini(owner.userId);
    const pdf = await readFile("../tests/browser/fixtures/synthetic-learning.pdf");
    const requestId = randomUUID();
    const submit = () => request(app)
      .post("/api/v1/resume-analyses/import-pdf")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .field("requestId", requestId)
      .field("title", "Concurrent Synthetic Resume")
      .attach("file", pdf, { filename: "resume.pdf", contentType: "application/pdf" });

    const [first, second] = await Promise.all([submit(), submit()]);
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.body.data.job.id).toBe(first.body.data.job.id);
    expect(second.body.data.assetId).toBe(first.body.data.assetId);
    await expect(AssetModel.countDocuments({
      userId: owner.userId,
      purpose: "resume-import",
      status: { $ne: "deleted" },
    })).resolves.toBe(1);
    const [asset, job] = await Promise.all([
      AssetModel.findById(first.body.data.assetId).lean(),
      JobRecordModel.findById(first.body.data.job.id).lean(),
    ]);
    expect(asset?.expiresAt).toBeInstanceOf(Date);
    expect(job?.expiresAt?.getTime()).toBe(asset?.expiresAt?.getTime());
  });
});
