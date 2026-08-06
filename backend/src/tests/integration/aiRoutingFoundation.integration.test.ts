import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { env } from "../../config/env.js";
import { failOrRetryJob, enqueueJob } from "../../jobs/job.queue.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AiCredentialModel } from "../../modules/ai/aiCredential.model.js";
import { AiCredentialExecutionLeaseModel } from "../../modules/ai/aiCredentialExecutionLease.model.js";
import { AiProviderPreferenceModel } from "../../modules/ai/aiProviderPreference.model.js";
import {
  activateProvider,
  deleteCredential,
  ensureAiFoundation,
  saveCredential,
} from "../../modules/ai/aiProvider.service.js";
import { AiRoutingProfileModel } from "../../modules/ai/aiRoutingProfile.model.js";
import {
  encryptCredential,
  parseEncryptionKeyRing,
} from "../../modules/ai/credentialVault.js";
import { generateStructuredOutput } from "../../modules/ai/aiGateway.service.js";
import { SecurityAuditEventModel } from "../../modules/ai/securityAuditEvent.model.js";
import { AppError } from "../../shared/appError.js";

interface AiRoutingSnapshot {
  snapshotId: string;
  snapshotVersion: 1;
  userId: string;
  action: string;
  provider: string;
  mode: "direct" | "disabled";
  preferenceRevision: number;
  routingProfileId: string;
  routingProfileVersion: number;
  credentialSource: "none" | "user-managed" | "administrator-managed";
  credentialId?: string;
  credentialSecretVersion?: number;
  administratorCredentialPolicyVersion?: number;
  directModelId?: string;
  maximumInputTokens: number;
  maximumOutputTokens: number;
  ttftMs: number;
  streamIdleMs: number;
  totalMs: number;
  executeBefore: Date;
  createdAt: Date;
}

interface Authorization {
  snapshot: AiRoutingSnapshot;
  credential?: { read(): string };
  leaseId?: string;
  release(): Promise<void>;
}

interface RoutingModule {
  aiRoutingSnapshotSchema: z.ZodType<AiRoutingSnapshot>;
  compileAiRoutingSnapshot(input: {
    userId: string;
    action: string;
    now?: Date;
  }): Promise<AiRoutingSnapshot>;
  authorizeAiJobExecution(input: {
    jobId: string;
    workerId?: string;
    now?: Date;
    hardDisabledModelIds?: ReadonlySet<string>;
  }): Promise<Authorization>;
  expireCredentialExecutionLeases(now?: Date): Promise<number>;
  publishAiRoutingProfile(input: {
    userId: string;
    expectedVersion: number;
  }): Promise<{ id: string; version: number }>;
}

const modulePath = "../../modules/ai/aiRouting.service.js";
const byokKey = `v11:${Buffer.alloc(32, 0x5a).toString("base64url")}`;
const userCredential = "AIzaRoutingCanaryCredential-987654321";
const originalVaultKey = env.BYOK_ENCRYPTION_KEY;
const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility = env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

let routing: Partial<RoutingModule>;

async function createValidCredential(userId: string) {
  const credentialId = new Types.ObjectId();
  const plaintext = Buffer.from(userCredential);
  const encryptedSecret = encryptCredential({
    plaintext,
    credentialId: credentialId.toString(),
    userId,
    provider: "gemini-direct",
    secretVersion: 1,
    keyRing: parseEncryptionKeyRing({ current: byokKey }),
  });
  plaintext.fill(0);
  return AiCredentialModel.create({
    _id: credentialId,
    userId,
    provider: "gemini-direct",
    label: "Routing Gemini",
    maskedSuffix: "••••4321",
    secretVersion: 1,
    state: "valid",
    connectionStatus: "valid",
    lastValidatedAt: new Date(),
    encryptedSecret,
    revision: 1,
  });
}

async function setupActiveUser() {
  const userId = new Types.ObjectId().toString();
  await ensureAiFoundation(userId);
  const credential = await createValidCredential(userId);
  await activateProvider({
    userId,
    provider: "gemini-direct",
    credentialSource: "user-managed",
    routingProfileVersion: 1,
    expectedRevision: 0,
  });
  return { userId, credential };
}

async function createSnapshottedJob(
  snapshot: AiRoutingSnapshot,
  overrides: Record<string, unknown> = {},
) {
  return JobRecordModel.create({
    userId: snapshot.userId,
    type: "resume.analyze",
    payload: {},
    status: "queued",
    attempts: 1,
    maxAttempts: 3,
    aiRoutingSnapshot: snapshot,
    ...overrides,
  });
}

describe("AI routing foundation", () => {
  beforeEach(async () => {
    env.BYOK_ENCRYPTION_KEY = byokKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = true;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = false;
    routing = await import(modulePath) as Partial<RoutingModule>;
  });

  afterEach(() => {
    env.BYOK_ENCRYPTION_KEY = originalVaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = originalAdminCompatibility;
    vi.unstubAllGlobals();
  });

  it("compiles a complete immutable disabled snapshot", async () => {
    expect(routing.compileAiRoutingSnapshot).toBeTypeOf("function");
    if (!routing.compileAiRoutingSnapshot) return;
    const userId = new Types.ObjectId().toString();
    await ensureAiFoundation(userId);

    const snapshot = await routing.compileAiRoutingSnapshot({
      userId,
      action: "resume-analysis",
      now: new Date("2026-08-03T10:00:00.000Z"),
    });

    expect(snapshot).toMatchObject({
      snapshotVersion: 1,
      userId,
      action: "resume-analysis",
      provider: "disabled",
      mode: "disabled",
      preferenceRevision: 0,
      routingProfileVersion: 1,
      credentialSource: "none",
      maximumInputTokens: 32_000,
      maximumOutputTokens: 8_192,
      ttftMs: 8_000,
      streamIdleMs: 15_000,
      totalMs: 45_000,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toMatch(
      /apiKey|ciphertext|nonce|authTag|authorization|environment/i,
    );
  });

  it("compiles a secret-free user-managed Gemini snapshot", async () => {
    if (!routing.compileAiRoutingSnapshot) return;
    const { userId, credential } = await setupActiveUser();

    const snapshot = await routing.compileAiRoutingSnapshot({
      userId,
      action: "learning-quiz-generation",
    });

    expect(snapshot).toMatchObject({
      provider: "gemini-direct",
      mode: "direct",
      preferenceRevision: 1,
      credentialSource: "user-managed",
      credentialId: credential._id.toString(),
      credentialSecretVersion: 1,
      directModelId: env.GEMINI_MODEL,
    });
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain(userCredential);
    expect(serialized).not.toMatch(/ciphertext|nonce|authTag|apiKey/i);
  });

  it("publishes routing-profile replacements as immutable new versions", async () => {
    expect(routing.publishAiRoutingProfile).toBeTypeOf("function");
    if (!routing.publishAiRoutingProfile) return;
    const userId = new Types.ObjectId().toString();
    const { profile } = await ensureAiFoundation(userId);

    const replacement = await routing.publishAiRoutingProfile({
      userId,
      expectedVersion: 1,
    });

    expect(replacement).toMatchObject({ version: 2 });
    await expect(AiRoutingProfileModel.findById(profile._id).lean())
      .resolves.toMatchObject({ status: "retired" });
    const active = await AiRoutingProfileModel.findById(replacement.id).lean();
    expect(active).toMatchObject({ version: 2, status: "active", activeMarker: "active" });
    await expect(AiProviderPreferenceModel.findOne({ userId }).lean())
      .resolves.toMatchObject({
        routingProfileVersion: 2,
        revision: 1,
      });
    await expect(AiRoutingProfileModel.updateOne(
      { _id: replacement.id },
      { $set: { "geminiDirect.directModelId": "mutated-model" } },
    )).rejects.toThrow("Published AI routing profiles are immutable.");
  });

  it("rejects provider and model injection in snapshot validation", async () => {
    expect(routing.aiRoutingSnapshotSchema).toBeDefined();
    if (!routing.aiRoutingSnapshotSchema || !routing.compileAiRoutingSnapshot) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({
      userId,
      action: "resume-analysis",
    });

    for (const directModelId of [
      "https://attacker.example/model",
      "gemini\r\nAuthorization: injected",
      "../gemini-model",
      "gemini/model",
      "gemini\u0000model",
    ]) {
      expect(routing.aiRoutingSnapshotSchema.safeParse({
        ...snapshot,
        directModelId,
      }).success).toBe(false);
    }
  });

  it("stores the snapshot immutably and reuses it on worker retry", async () => {
    if (!routing.compileAiRoutingSnapshot) return;
    const { userId } = await setupActiveUser();
    const job = await enqueueJob({
      type: "resume.analyze",
      userId,
      payload: {},
      maxAttempts: 3,
    });
    const original = JSON.parse(JSON.stringify(job.aiRoutingSnapshot));
    await JobRecordModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "processing",
          phase: "preparing",
          attempts: 1,
          executionId: randomUUID(),
          lockedBy: env.JOB_WORKER_ID,
          lockedAt: new Date(),
          lockExpiresAt: new Date(Date.now() + 60_000),
        },
      },
    );
    const processing = await JobRecordModel.findById(job._id).lean();
    await failOrRetryJob(
      processing!,
      new AppError(503, "provider_unavailable", "Synthetic retry.", undefined, true),
    );

    const retried = await JobRecordModel.findById(job._id).lean();
    expect(JSON.parse(JSON.stringify(retried?.aiRoutingSnapshot))).toEqual(original);
    await expect(JobRecordModel.updateOne(
      { _id: job._id },
      { $set: { "aiRoutingSnapshot.provider": "openai-direct" } },
    )).rejects.toThrow("AI routing snapshots are immutable.");
  });

  it("rejects a provider switch before credential resolution or lease acquisition", async () => {
    expect(routing.authorizeAiJobExecution).toBeTypeOf("function");
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    await activateProvider({
      userId,
      provider: "disabled",
      expectedRevision: 1,
      routingProfileVersion: 1,
    });

    await expect(routing.authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    await expect(AiCredentialExecutionLeaseModel.countDocuments()).resolves.toBe(0);
  });

  it("makes a queued snapshot stale after credential replacement", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    await saveCredential({
      userId,
      provider: "gemini-direct",
      apiKey: "AIzaReplacementCredential-123456789",
      expectedRevision: 1,
    });

    await expect(routing.authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    await expect(AiCredentialExecutionLeaseModel.countDocuments()).resolves.toBe(0);
  });

  it("makes a queued snapshot stale after credential deletion", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    await deleteCredential({
      userId,
      provider: "gemini-direct",
      expectedRevision: 1,
    });

    await expect(routing.authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    await expect(AiCredentialExecutionLeaseModel.countDocuments()).resolves.toBe(0);
  });

  it("rejects expired, hard-disabled, and unsupported snapshots", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const expired = await createSnapshottedJob({
      ...snapshot,
      snapshotId: randomUUID(),
      executeBefore: new Date(Date.now() - 1_000),
    });
    const hardDisabled = await createSnapshottedJob({
      ...snapshot,
      snapshotId: randomUUID(),
    });
    const unsupported = await createSnapshottedJob({
      ...snapshot,
      snapshotId: randomUUID(),
      provider: "openai-direct",
    });

    await expect(routing.authorizeAiJobExecution({ jobId: expired._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    await expect(routing.authorizeAiJobExecution({
      jobId: hardDisabled._id.toString(),
      hardDisabledModelIds: new Set([snapshot.directModelId!]),
    })).rejects.toMatchObject({ code: "stale_routing_snapshot" });
    await expect(routing.authorizeAiJobExecution({ jobId: unsupported._id.toString() }))
      .rejects.toMatchObject({ code: "provider_not_available" });
    await expect(AiCredentialExecutionLeaseModel.countDocuments()).resolves.toBe(0);
  });

  it("acquires one idempotent execution lease and releases it safely", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);

    const first = await routing.authorizeAiJobExecution({ jobId: job._id.toString() });
    const replay = await routing.authorizeAiJobExecution({ jobId: job._id.toString() });

    expect(first.leaseId).toBe(replay.leaseId);
    expect(first.credential?.read()).toBe(userCredential);
    await first.release();
    await replay.release();
    await expect(AiCredentialExecutionLeaseModel.findById(first.leaseId).lean())
      .resolves.toMatchObject({ state: "released" });
  });

  it("holds cryptographic deletion for an active lease and blocks new execution", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId, credential } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    const authorization = await routing.authorizeAiJobExecution({ jobId: job._id.toString() });

    await expect(deleteCredential({
      userId,
      provider: "gemini-direct",
      expectedRevision: 1,
    })).resolves.toEqual({ pending: true });
    const deleting = await AiCredentialModel.findById(credential._id)
      .select("+encryptedSecret")
      .lean();
    expect(deleting).toMatchObject({ state: "deleting" });
    expect(deleting).toHaveProperty("encryptedSecret.ciphertext");
    await expect(routing.authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });

    await authorization.release();
    const deleted = await AiCredentialModel.findById(credential._id)
      .select("+encryptedSecret")
      .lean();
    expect(deleted).toMatchObject({ state: "deleted" });
    expect(deleted).not.toHaveProperty("encryptedSecret");
  });

  it("expires abandoned leases and completes pending deletion", async () => {
    expect(routing.expireCredentialExecutionLeases).toBeTypeOf("function");
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution ||
      !routing.expireCredentialExecutionLeases) return;
    const { userId, credential } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    await routing.authorizeAiJobExecution({ jobId: job._id.toString() });
    await deleteCredential({ userId, provider: "gemini-direct", expectedRevision: 1 });

    const expired = await routing.expireCredentialExecutionLeases(
      new Date(Date.now() + env.JOB_LEASE_SECONDS * 1_000 + 1),
    );

    expect(expired).toBe(1);
    await expect(AiCredentialModel.findById(credential._id).lean())
      .resolves.toMatchObject({ state: "deleted" });
  });

  it("normalizes decryption failure and audits without leaking material", async () => {
    if (!routing.compileAiRoutingSnapshot || !routing.authorizeAiJobExecution) return;
    const { userId, credential } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    await AiCredentialModel.collection.updateOne(
      { _id: credential._id },
      { $set: { "encryptedSecret.authTag": "AAAAAAAAAAAAAAAAAAAAAA" } },
    );

    const error = await routing.authorizeAiJobExecution({ jobId: job._id.toString() })
      .catch((caught) => caught as AppError);

    expect(error).toMatchObject({ code: "credential_decryption_failed" });
    const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
    expect(serialized).not.toContain(userCredential);
    expect(serialized).not.toContain(snapshot.snapshotId);
    await expect(SecurityAuditEventModel.countDocuments({
      subjectUserId: userId,
      action: "credential.decryption-failed",
    })).resolves.toBe(1);
  });

  it("creates administrator Gemini metadata without persisting the environment key", async () => {
    if (!routing.compileAiRoutingSnapshot) return;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = true;
    const userId = new Types.ObjectId().toString();
    await ensureAiFoundation(userId);
    await activateProvider({
      userId,
      provider: "gemini-direct",
      credentialSource: "administrator-managed",
      routingProfileVersion: 1,
      expectedRevision: 0,
    });

    const snapshot = await routing.compileAiRoutingSnapshot({
      userId,
      action: "resume-analysis",
    });

    expect(snapshot).toMatchObject({
      credentialSource: "administrator-managed",
      administratorCredentialPolicyVersion: env.AI_ADMIN_GEMINI_POLICY_VERSION,
    });
    expect(snapshot).not.toHaveProperty("credentialId");
    expect(snapshot).not.toHaveProperty("credentialSecretVersion");
    const databaseDump = JSON.stringify([
      await AiProviderPreferenceModel.find({ userId }).lean(),
      await AiRoutingProfileModel.find({ userId }).lean(),
      await JobRecordModel.find({ userId }).lean(),
    ]);
    expect(databaseDump).not.toContain(env.GEMINI_API_KEY);
  });

  it("fails legacy unsnapshotted jobs safely after foundation cutover", async () => {
    expect(routing.authorizeAiJobExecution).toBeTypeOf("function");
    if (!routing.authorizeAiJobExecution) return;
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analyze",
      payload: {},
    });

    await expect(routing.authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
  });

  it("preserves the environment Gemini gateway when the foundation is disabled and BYOK is absent", async () => {
    env.AI_ROUTING_FOUNDATION_ENABLED = false;
    env.BYOK_ENCRYPTION_KEY = undefined;
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateStructuredOutput({
      userId: new Types.ObjectId().toString(),
      feature: "test.compatibility",
      systemPrompt: "Return JSON.",
      userPrompt: "Synthetic compatibility input.",
      schema: z.object({ status: z.literal("ok") }).strict(),
    })).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gates a snapshotted user credential before the provider call and releases its lease", async () => {
    if (!routing.compileAiRoutingSnapshot) return;
    const { userId } = await setupActiveUser();
    const snapshot = await routing.compileAiRoutingSnapshot({ userId, action: "resume-analysis" });
    const job = await createSnapshottedJob(snapshot);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateStructuredOutput({
      userId,
      feature: "test.routed-user-credential",
      systemPrompt: "Return JSON.",
      userPrompt: "Synthetic routed input.",
      schema: z.object({ status: z.literal("ok") }).strict(),
      jobId: job._id.toString(),
    })).resolves.toEqual({ status: "ok" });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get("key")).toBe(userCredential);
    await expect(AiCredentialExecutionLeaseModel.findOne({ jobId: job._id }).lean())
      .resolves.toMatchObject({ state: "released" });
  });
});
