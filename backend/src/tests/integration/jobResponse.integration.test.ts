import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";
import { registerTestUser } from "../helpers/auth.js";

const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility = env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

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
  afterEach(() => {
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = originalAdminCompatibility;
  });

  it("allowlists failed-job error fields in the public response", async () => {
    const owner = await registerTestUser(app, {
      email: "job-error-owner@example.com",
      displayName: "Job Error Owner",
    });
    const job = await createOwnedJob(owner.userId, {
      status: "failed",
      phase: "failed",
      progress: 60,
      attempts: 3,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is currently unavailable.",
        classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
        retryable: true,
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
      phase: "failed",
      phaseSequence: 0,
      progress: 60,
      attempts: 3,
      maxAttempts: 3,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is currently unavailable.",
        classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
        retryable: true,
      },
      canRetry: true,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    });
    expect(Object.keys(response.body.data.job.error).sort()).toEqual([
      "classification",
      "code",
      "message",
      "retryable",
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
      phase: "completed",
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
      phase: "queued",
      phaseSequence: 0,
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      canRetry: false,
      createdAt: queued.createdAt.toISOString(),
      updatedAt: queued.updatedAt.toISOString(),
    });
    expect(completedResponse.body.data.job).toEqual({
      id: completed._id.toString(),
      type: "learning.quiz.generate",
      status: "completed",
      phase: "completed",
      phaseSequence: 0,
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      result,
      canRetry: false,
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

  it("cancels owned queued and processing jobs idempotently", async () => {
    const owner = await registerTestUser(app, {
      email: "job-cancel-owner@example.com",
      displayName: "Job Cancel Owner",
    });
    const queued = await createOwnedJob(owner.userId);
    const processing = await createOwnedJob(owner.userId, {
      status: "processing",
      phase: "receiving_response",
      attempts: 1,
      executionId: "11111111-1111-4111-8111-111111111111",
      lockedBy: "another-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    for (const job of [queued, processing]) {
      const first = await request(app)
        .post(`/api/v1/jobs/${job._id.toString()}/cancel`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(200);
      const repeated = await request(app)
        .post(`/api/v1/jobs/${job._id.toString()}/cancel`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(first.body.data.job).toMatchObject({
        id: job._id.toString(),
        status: "cancelled",
        phase: "cancelled",
        canRetry: true,
      });
      expect(repeated.body.data.job).toMatchObject(first.body.data.job);
    }
  });

  it("rejects terminal and persisting cancellation without changing the job", async () => {
    const owner = await registerTestUser(app, {
      email: "job-cancel-terminal@example.com",
      displayName: "Job Cancel Terminal",
    });
    const completed = await createOwnedJob(owner.userId, {
      status: "completed",
      phase: "completed",
    });
    const persisting = await createOwnedJob(owner.userId, {
      status: "processing",
      phase: "persisting",
      attempts: 1,
      executionId: "22222222-2222-4222-8222-222222222222",
      lockedBy: "vitest-worker",
    });

    for (const job of [completed, persisting]) {
      await request(app)
        .post(`/api/v1/jobs/${job._id.toString()}/cancel`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(409);
    }
  });

  it("creates one owned linked Retry job and leaves the source failed", async () => {
    const owner = await registerTestUser(app, {
      email: "job-retry-owner@example.com",
      displayName: "Job Retry Owner",
    });
    const source = await createOwnedJob(owner.userId, {
      type: "resume.analyze",
      payload: {
        userId: owner.userId,
        resumeId: new Types.ObjectId().toString(),
        targetRole: "Synthetic Engineer",
      },
      status: "failed",
      phase: "failed",
      attempts: 3,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The AI provider is temporarily unavailable.",
        classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
        retryable: true,
      },
    });
    await connectApplicationManagedGemini(owner.userId);

    const first = await request(app)
      .post(`/api/v1/jobs/${source._id.toString()}/retry`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(202);
    const duplicate = await request(app)
      .post(`/api/v1/jobs/${source._id.toString()}/retry`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(202);

    expect(duplicate.body.data.job.id).toBe(first.body.data.job.id);
    expect(first.body.data.job).toMatchObject({
      status: "queued",
      phase: "queued",
      retryOfJobId: source._id.toString(),
      rootJobId: source._id.toString(),
    });
    await expect(JobRecordModel.findById(source._id).lean()).resolves.toMatchObject({
      status: "failed",
      phase: "failed",
    });
    await expect(
      JobRecordModel.countDocuments({ retryOfJobId: source._id }),
    ).resolves.toBe(1);
  });

  it("does not offer or create Retry for a non-retryable failure", async () => {
    const owner = await registerTestUser(app, {
      email: "job-no-retry-owner@example.com",
      displayName: "Job No Retry Owner",
    });
    const source = await createOwnedJob(owner.userId, {
      status: "failed",
      phase: "failed",
      error: {
        code: "INVALID_APPLICATION_INPUT",
        message: "The application input is invalid.",
        classification: "NON_RETRYABLE_REQUEST",
        retryable: false,
      },
    });

    const fetched = await request(app)
      .get(`/api/v1/jobs/${source._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(fetched.body.data.job.canRetry).toBe(false);

    await request(app)
      .post(`/api/v1/jobs/${source._id.toString()}/retry`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);
    await expect(
      JobRecordModel.countDocuments({ retryOfJobId: source._id }),
    ).resolves.toBe(0);
  });

  it("keeps foreign cancel and Retry indistinguishable from missing jobs", async () => {
    const owner = await registerTestUser(app, {
      email: "job-action-owner@example.com",
      displayName: "Job Action Owner",
    });
    const other = await registerTestUser(app, {
      email: "job-action-other@example.com",
      displayName: "Job Action Other",
    });
    const job = await createOwnedJob(owner.userId, {
      status: "failed",
      phase: "failed",
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The AI provider is temporarily unavailable.",
        classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
        retryable: true,
      },
    });

    for (const action of ["cancel", "retry"]) {
      const foreign = await request(app)
        .post(`/api/v1/jobs/${job._id.toString()}/${action}`)
        .set("Authorization", `Bearer ${other.accessToken}`)
        .expect(404);
      expect(foreign.body.error).toMatchObject({
        code: "JOB_NOT_FOUND",
        message: "Job not found.",
      });
    }
  });
});
