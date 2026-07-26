import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { registerTestUser } from "../helpers/auth.js";

async function createOwnedJob(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return JobRecordModel.create({
    userId: new Types.ObjectId(userId),
    type: "learning.quiz.generate",
    payload: { quizId: new Types.ObjectId().toString() },
    status: "queued",
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    ...overrides,
  });
}

describe("owned job response integration", () => {
  it("allowlists failed-job error fields in the public response", async () => {
    const owner = await registerTestUser(app, {
      email: "job-error-owner@example.com",
      displayName: "Job Error Owner",
    });
    const job = await createOwnedJob(owner.userId, {
      status: "failed",
      progress: 60,
      attempts: 3,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is currently unavailable.",
        stack: "private-stack",
      },
    });
    await JobRecordModel.collection.updateOne(
      { _id: job._id },
      {
        $set: {
          "error.cause": "private-cause",
          "error.details": { private: true },
          "error.providerOutput": "private-provider-output",
          "error.retryInternals": { attempt: 3 },
          "error.privateMetadata": { source: "worker" },
        },
      },
    );

    const response = await request(app)
      .get(`/api/v1/jobs/${job._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body.data.job).toEqual({
      id: job._id.toString(),
      type: "learning.quiz.generate",
      status: "failed",
      progress: 60,
      attempts: 3,
      maxAttempts: 3,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is currently unavailable.",
      },
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    });
    expect(Object.keys(response.body.data.job.error).sort()).toEqual([
      "code",
      "message",
    ]);
  });

  it("preserves queued and completed public job fields without an error", async () => {
    const owner = await registerTestUser(app, {
      email: "job-state-owner@example.com",
      displayName: "Job State Owner",
    });
    const queued = await createOwnedJob(owner.userId);
    const result = {
      quizId: new Types.ObjectId().toString(),
      questionCount: 2,
    };
    const completed = await createOwnedJob(owner.userId, {
      status: "completed",
      progress: 100,
      attempts: 1,
      result,
    });

    const queuedResponse = await request(app)
      .get(`/api/v1/jobs/${queued._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    const completedResponse = await request(app)
      .get(`/api/v1/jobs/${completed._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(queuedResponse.body.data.job).toEqual({
      id: queued._id.toString(),
      type: "learning.quiz.generate",
      status: "queued",
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      createdAt: queued.createdAt.toISOString(),
      updatedAt: queued.updatedAt.toISOString(),
    });
    expect(completedResponse.body.data.job).toEqual({
      id: completed._id.toString(),
      type: "learning.quiz.generate",
      status: "completed",
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result,
      createdAt: completed.createdAt.toISOString(),
      updatedAt: completed.updatedAt.toISOString(),
    });
  });

  it("keeps foreign and missing jobs safely indistinguishable", async () => {
    const owner = await registerTestUser(app, {
      email: "job-ownership-owner@example.com",
      displayName: "Job Ownership Owner",
    });
    const other = await registerTestUser(app, {
      email: "job-ownership-other@example.com",
      displayName: "Job Ownership Other",
    });
    const job = await createOwnedJob(owner.userId);

    const foreign = await request(app)
      .get(`/api/v1/jobs/${job._id.toString()}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);
    const missing = await request(app)
      .get(`/api/v1/jobs/${new Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(foreign.body.error).toMatchObject({
      code: "JOB_NOT_FOUND",
      message: "Job not found.",
    });
    expect(missing.body.error).toMatchObject({
      code: "JOB_NOT_FOUND",
      message: "Job not found.",
    });
    expect(Object.keys(foreign.body.error).sort()).toEqual([
      "code",
      "message",
      "requestId",
    ]);
    expect(Object.keys(missing.body.error).sort()).toEqual([
      "code",
      "message",
      "requestId",
    ]);
  });
});
