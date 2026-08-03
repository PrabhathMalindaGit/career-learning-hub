import { randomUUID } from "node:crypto";
import { Types, type ClientSession } from "mongoose";
import { env } from "../../config/env.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { AiCredentialModel } from "./aiCredential.model.js";
import { AiCredentialExecutionLeaseModel } from "./aiCredentialExecutionLease.model.js";
import { AiProviderPreferenceModel } from "./aiProviderPreference.model.js";
import { ensureAiFoundation, recordAudit } from "./aiProvider.service.js";
import { AiRoutingProfileModel } from "./aiRoutingProfile.model.js";
import { OPENROUTER_RANKING_POLICY_VERSION } from "./openRouterCatalogue.js";
import { isOpenRouterPlanSecure } from "./openRouterCatalogue.service.js";
import {
  aiActionForJobType,
  aiRoutingSnapshotSchema,
  type AiRoutingAction,
  type AiRoutingSnapshot,
} from "./aiRoutingSnapshot.js";
import {
  clearSecretBuffer,
  CredentialDecryptionError,
  decryptCredential,
  parseEncryptionKeyRing,
  type EncryptedCredentialSecret,
} from "./credentialVault.js";

export { aiRoutingSnapshotSchema } from "./aiRoutingSnapshot.js";

const releasedLeaseRetentionMilliseconds = 24 * 60 * 60 * 1_000;

export interface AiExecutionAuthorization {
  snapshot: AiRoutingSnapshot;
  workerAttempt: number;
  credential?: { read(): string };
  leaseId?: string;
  release(): Promise<void>;
}

function routingError(
  code: "routing_configuration_invalid" | "stale_routing_snapshot" | "provider_not_available",
): AppError {
  if (code === "provider_not_available") {
    return new AppError(409, code, "The selected AI provider is not available.");
  }
  if (code === "routing_configuration_invalid") {
    return new AppError(409, code, "AI routing settings are unavailable.");
  }
  return new AppError(409, code, "This AI job can no longer be executed.");
}

async function rejectStaleSnapshot(
  snapshot: AiRoutingSnapshot | undefined,
  userId: string,
  reason: string,
): Promise<never> {
  await recordAudit({
    userId,
    action: "routing.stale-rejected",
    provider: snapshot?.provider,
    preferenceRevision: snapshot?.preferenceRevision,
    routingProfileVersion: snapshot?.routingProfileVersion,
    outcome: "failure",
    normalizedReason: reason,
    context: { actorRole: "system" },
  });
  throw routingError("stale_routing_snapshot");
}

function snapshotFromState(input: {
  userId: string;
  action: AiRoutingAction;
  now: Date;
  preference: Awaited<ReturnType<typeof ensureAiFoundation>>["preference"];
  profile: Awaited<ReturnType<typeof ensureAiFoundation>>["profile"];
}): AiRoutingSnapshot {
  const { userId, action, now, preference, profile } = input;
  const gemini = profile.geminiDirect;
  const identity = {
    snapshotId: randomUUID(),
    snapshotVersion: 1 as const,
    userId,
    action,
    preferenceRevision: preference.revision,
    routingProfileId: profile._id.toString(),
    routingProfileVersion: profile.version,
    createdAt: now,
  };
  const geminiExecution = {
    maximumInputTokens: gemini.maximumInputTokens,
    maximumOutputTokens: gemini.maximumOutputTokens,
    ttftMs: gemini.timeoutProfile.ttftMs,
    streamIdleMs: gemini.timeoutProfile.streamIdleMs,
    totalMs: gemini.timeoutProfile.totalMs,
    executeBefore: new Date(
      now.getTime() + gemini.executionDeadlineSeconds * 1_000,
    ),
  };

  if (preference.activeProvider === "disabled") {
    return aiRoutingSnapshotSchema.parse({
      ...identity,
      ...geminiExecution,
      provider: "disabled",
      mode: "disabled",
      credentialSource: "none",
    });
  }
  if (preference.activeProvider === "openrouter") {
    const openRouter = profile.openRouterActions?.find(
      (entry) => entry.action === action,
    );
    if (
      !openRouter ||
      preference.credentialSource !== "user-managed" ||
      !preference.activeCredentialId ||
      !preference.activeCredentialSecretVersion
    ) {
      throw routingError("routing_configuration_invalid");
    }
    return aiRoutingSnapshotSchema.parse({
      ...identity,
      provider: "openrouter",
      mode: "openrouter",
      credentialSource: "user-managed",
      credentialId: preference.activeCredentialId.toString(),
      credentialSecretVersion: preference.activeCredentialSecretVersion,
      rankingPolicyVersion: openRouter.rankingPolicyVersion,
      catalogueVersion: openRouter.catalogueVersion,
      pricingObservedAt: openRouter.pricingObservedAt,
      freeModelIds: openRouter.freeModelIds,
      paidFallbackAllowed: false,
      maximumInputTokens: openRouter.maximumInputTokens,
      maximumOutputTokens: openRouter.maximumOutputTokens,
      ttftMs: openRouter.timeoutProfile.ttftMs,
      streamIdleMs: openRouter.timeoutProfile.streamIdleMs,
      totalMs: openRouter.timeoutProfile.totalMs,
      executeBefore: new Date(
        now.getTime() + openRouter.executionDeadlineSeconds * 1_000,
      ),
    });
  }
  if (preference.activeProvider !== "gemini-direct") {
    throw routingError("provider_not_available");
  }
  if (
    preference.credentialSource === "user-managed" &&
    preference.activeCredentialId &&
    preference.activeCredentialSecretVersion
  ) {
    return aiRoutingSnapshotSchema.parse({
      ...identity,
      ...geminiExecution,
      provider: "gemini-direct",
      mode: "direct",
      credentialSource: "user-managed",
      credentialId: preference.activeCredentialId.toString(),
      credentialSecretVersion: preference.activeCredentialSecretVersion,
      directModelId: gemini.directModelId,
    });
  }
  if (
    preference.credentialSource === "administrator-managed" &&
    preference.administratorCredentialPolicyVersion
  ) {
    return aiRoutingSnapshotSchema.parse({
      ...identity,
      ...geminiExecution,
      provider: "gemini-direct",
      mode: "direct",
      credentialSource: "administrator-managed",
      administratorCredentialPolicyVersion:
        preference.administratorCredentialPolicyVersion,
      directModelId: gemini.directModelId,
    });
  }
  throw routingError("routing_configuration_invalid");
}

export async function compileAiRoutingSnapshot(input: {
  userId: string;
  action:
    | AiRoutingAction
    | "interview-attempt-feedback"
    | "learning-document-summary"
    | "learning-flashcard-generation"
    | "learning-quiz-generation";
  now?: Date;
}): Promise<AiRoutingSnapshot> {
  if (!env.AI_ROUTING_FOUNDATION_ENABLED) {
    throw routingError("routing_configuration_invalid");
  }
  const now = input.now ?? new Date();
  const legacyActionAliases = {
    "interview-attempt-feedback": "interview-answer-feedback",
    "learning-document-summary": "learning-summary",
    "learning-flashcard-generation": "flashcard-generation",
    "learning-quiz-generation": "quiz-generation",
  } as const;
  const action =
    input.action in legacyActionAliases
      ? legacyActionAliases[
          input.action as keyof typeof legacyActionAliases
        ]
      : input.action as AiRoutingAction;
  const { preference } = await ensureAiFoundation(input.userId);
  const profile = await AiRoutingProfileModel.findOne({
    _id: preference.routingProfileId,
    userId: input.userId,
    version: preference.routingProfileVersion,
    status: "active",
    activeMarker: "active",
  });
  if (!profile) throw routingError("routing_configuration_invalid");

  return Object.freeze(snapshotFromState({
    userId: input.userId,
    action,
    now,
    preference,
    profile,
  }));
}

export async function compileAiRoutingSnapshotForJob(input: {
  type: string;
  userId: string;
  now?: Date;
}): Promise<AiRoutingSnapshot | undefined> {
  const action = aiActionForJobType(input.type);
  if (!action) return undefined;
  return compileAiRoutingSnapshot({
    userId: input.userId,
    action,
    now: input.now,
  });
}

export async function publishAiRoutingProfile(input: {
  userId: string;
  expectedVersion: number;
}): Promise<{ id: string; version: number }> {
  const replacement = await withMongoTransaction(async (session) => {
    const current = await AiRoutingProfileModel.findOne({
      userId: input.userId,
      version: input.expectedVersion,
      status: "active",
      activeMarker: "active",
    }).session(session);
    const preference = await AiProviderPreferenceModel.findOne({
      userId: input.userId,
      routingProfileId: current?._id,
      routingProfileVersion: input.expectedVersion,
    }).session(session);
    if (!current || !preference) return null;

    await AiRoutingProfileModel.updateOne(
      { _id: current._id, status: "active", activeMarker: "active" },
      {
        $set: { status: "retired" },
        $unset: { activeMarker: 1 },
      },
      { session },
    );
    const [created] = await AiRoutingProfileModel.create([{
      userId: current.userId,
      version: current.version + 1,
      status: "active",
      activeMarker: "active",
      policyVersion: current.policyVersion,
      geminiDirect: current.toObject().geminiDirect,
    }], { session });
    const updated = await AiProviderPreferenceModel.updateOne(
      {
        _id: preference._id,
        revision: preference.revision,
        routingProfileId: current._id,
        routingProfileVersion: current.version,
      },
      {
        $set: {
          routingProfileId: created._id,
          routingProfileVersion: created.version,
        },
        $inc: { revision: 1 },
      },
      { session },
    );
    if (updated.matchedCount !== 1) {
      throw routingError("routing_configuration_invalid");
    }
    return { id: created._id.toString(), version: created.version };
  });
  if (!replacement) throw routingError("routing_configuration_invalid");
  return replacement;
}

async function finalizeDeletingCredential(
  credentialId: Types.ObjectId,
  now: Date,
  session?: ClientSession,
): Promise<void> {
  const activeLeaseCount = await AiCredentialExecutionLeaseModel.countDocuments({
    credentialId,
    state: "active",
    expiresAt: { $gt: now },
  }).session(session ?? null);
  if (activeLeaseCount > 0) return;

  await AiCredentialModel.updateOne(
    { _id: credentialId, state: "deleting" },
    {
      $set: { state: "deleted", deletedAt: now },
      $unset: {
        encryptedSecret: 1,
        maskedSuffix: 1,
        lastValidatedAt: 1,
        lastValidationError: 1,
      },
      $inc: { revision: 1 },
    },
    session ? { session } : undefined,
  );
}

async function releaseLease(input: {
  leaseId: Types.ObjectId;
  credentialId: Types.ObjectId;
  userId: string;
  provider: AiRoutingSnapshot["provider"];
  secret: Buffer;
}): Promise<void> {
  clearSecretBuffer(input.secret);
  const now = new Date();
  try {
    await withMongoTransaction(async (session) => {
      await AiCredentialExecutionLeaseModel.updateOne(
        { _id: input.leaseId, state: "active" },
        {
          $set: {
            state: "released",
            heartbeatAt: now,
            expiresAt: new Date(now.getTime() + releasedLeaseRetentionMilliseconds),
          },
        },
        { session },
      );
      await finalizeDeletingCredential(input.credentialId, now, session);
      return true;
    });
  } catch {
    await recordAudit({
      userId: input.userId,
      action: "execution-lease.release-failed",
      provider: input.provider,
      outcome: "failure",
      normalizedReason: "lease_release_failed",
      context: { actorRole: "system" },
    });
    throw new AppError(
      503,
      "provider_unavailable",
      "The AI execution lease could not be released safely.",
    );
  }
}

export async function authorizeAiJobExecution(input: {
  jobId: string;
  workerId?: string;
  now?: Date;
  hardDisabledModelIds?: ReadonlySet<string>;
}): Promise<AiExecutionAuthorization> {
  const now = input.now ?? new Date();
  const job = await JobRecordModel.findById(input.jobId).lean();
  if (!job?.userId) throw routingError("stale_routing_snapshot");
  const userId = job.userId.toString();
  const parsed = aiRoutingSnapshotSchema.safeParse(job.aiRoutingSnapshot);
  if (!parsed.success) {
    return rejectStaleSnapshot(undefined, userId, "missing_or_invalid_snapshot");
  }
  const snapshot = parsed.data;
  if (snapshot.userId !== userId) {
    return rejectStaleSnapshot(snapshot, userId, "snapshot_owner_mismatch");
  }
  if (snapshot.provider === "disabled") {
    return rejectStaleSnapshot(snapshot, userId, "ai_disabled");
  }
  if (
    snapshot.provider !== "gemini-direct" &&
    snapshot.provider !== "openrouter"
  ) {
      await recordAudit({
        userId,
        action: "routing.stale-rejected",
        provider: snapshot.provider,
        preferenceRevision: snapshot.preferenceRevision,
        routingProfileVersion: snapshot.routingProfileVersion,
        outcome: "failure",
        normalizedReason: "provider_not_available",
        context: { actorRole: "system" },
      });
      throw routingError("provider_not_available");
  }
  if (
    snapshot.executeBefore.getTime() <= now.getTime() ||
    (snapshot.directModelId && input.hardDisabledModelIds?.has(snapshot.directModelId))
  ) {
    return rejectStaleSnapshot(snapshot, userId, "execution_policy_stale");
  }
  if (snapshot.provider === "openrouter") {
    if (
      snapshot.rankingPolicyVersion !== OPENROUTER_RANKING_POLICY_VERSION ||
      !await isOpenRouterPlanSecure({
        action: snapshot.action,
        modelIds: snapshot.freeModelIds ?? [],
        now,
      })
    ) {
      return rejectStaleSnapshot(snapshot, userId, "openrouter_model_plan_stale");
    }
  }

  const preference = await AiProviderPreferenceModel.findOne({
    userId,
    activeProvider: snapshot.provider,
    credentialSource: snapshot.credentialSource,
    routingProfileId: snapshot.routingProfileId,
    routingProfileVersion: snapshot.routingProfileVersion,
    revision: snapshot.preferenceRevision,
  }).lean();
  if (!preference) {
    return rejectStaleSnapshot(snapshot, userId, "preference_changed");
  }
  const profile = await AiRoutingProfileModel.findOne({
    _id: snapshot.routingProfileId,
    userId,
    version: snapshot.routingProfileVersion,
    status: "active",
    activeMarker: "active",
  }).lean();
  if (!profile) {
    return rejectStaleSnapshot(snapshot, userId, "routing_profile_changed");
  }
  if (
    snapshot.provider === "gemini-direct" &&
    profile.geminiDirect.directModelId !== snapshot.directModelId
  ) {
    return rejectStaleSnapshot(snapshot, userId, "routing_profile_changed");
  }
  if (snapshot.provider === "openrouter") {
    const planned = profile.openRouterActions?.find(
      (entry) => entry.action === snapshot.action,
    );
    if (
      !planned ||
      planned.catalogueVersion !== snapshot.catalogueVersion ||
      planned.rankingPolicyVersion !== snapshot.rankingPolicyVersion ||
      planned.freeModelIds.length !== snapshot.freeModelIds?.length ||
      planned.freeModelIds.some(
        (modelId, index) => modelId !== snapshot.freeModelIds?.[index],
      )
    ) {
      return rejectStaleSnapshot(snapshot, userId, "routing_profile_changed");
    }
  }

  if (snapshot.credentialSource === "administrator-managed") {
    if (
      !env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED ||
      !env.GEMINI_API_KEY ||
      snapshot.administratorCredentialPolicyVersion !==
        env.AI_ADMIN_GEMINI_POLICY_VERSION ||
      preference.administratorCredentialPolicyVersion !==
        snapshot.administratorCredentialPolicyVersion
    ) {
      return rejectStaleSnapshot(snapshot, userId, "administrator_policy_changed");
    }
    return {
      snapshot,
      workerAttempt: job.attempts,
      release: async () => undefined,
    };
  }

  if (
    snapshot.credentialSource !== "user-managed" ||
    !snapshot.credentialId ||
    !snapshot.credentialSecretVersion ||
    preference.activeCredentialId?.toString() !== snapshot.credentialId ||
    preference.activeCredentialSecretVersion !== snapshot.credentialSecretVersion
  ) {
    return rejectStaleSnapshot(snapshot, userId, "credential_reference_changed");
  }

  const attemptId = `${job._id.toString()}:${job.attempts}`;
  let credentialId: Types.ObjectId;
  let encryptedSecret: EncryptedCredentialSecret;
  let leaseId: Types.ObjectId;

  try {
    const acquired = await withMongoTransaction(async (session) => {
      const existing = await AiCredentialExecutionLeaseModel.findOne({
        attemptId,
        credentialId: snapshot.credentialId,
        credentialSecretVersion: snapshot.credentialSecretVersion,
        state: "active",
        expiresAt: { $gt: now },
      }).session(session);
      const credential = await AiCredentialModel.findOne({
        _id: snapshot.credentialId,
        userId,
      provider: snapshot.provider,
        secretVersion: snapshot.credentialSecretVersion,
        state: "valid",
        connectionStatus: "valid",
        deletedAt: null,
      }).select("+encryptedSecret +leaseEpoch").session(session);
      if (!credential?.encryptedSecret) return null;

      if (existing) {
        return {
          credentialId: credential._id,
          encryptedSecret: credential.encryptedSecret,
          leaseId: existing._id,
        };
      }

      const fenced = await AiCredentialModel.updateOne(
        {
          _id: credential._id,
          userId,
          provider: snapshot.provider,
          secretVersion: snapshot.credentialSecretVersion,
          state: "valid",
          connectionStatus: "valid",
          deletedAt: null,
          leaseEpoch: credential.leaseEpoch,
        },
        { $inc: { leaseEpoch: 1 } },
        { session },
      );
      if (fenced.matchedCount !== 1) return null;

      const [lease] = await AiCredentialExecutionLeaseModel.create([{
        credentialId: credential._id,
        credentialSecretVersion: snapshot.credentialSecretVersion,
        routingSnapshotId: snapshot.snapshotId,
        jobId: job._id,
        attemptId,
        workerId: input.workerId ?? env.JOB_WORKER_ID,
        state: "active",
        acquiredAt: now,
        heartbeatAt: now,
        expiresAt: new Date(now.getTime() + env.JOB_LEASE_SECONDS * 1_000),
      }], { session });
      return {
        credentialId: credential._id,
        encryptedSecret: credential.encryptedSecret,
        leaseId: lease._id,
      };
    });
    if (!acquired) {
      await recordAudit({
        userId,
        action: "execution-lease.acquisition-failed",
        provider: snapshot.provider,
        credentialSecretVersion: snapshot.credentialSecretVersion,
        preferenceRevision: snapshot.preferenceRevision,
        routingProfileVersion: snapshot.routingProfileVersion,
        outcome: "failure",
        normalizedReason: "credential_state_changed",
        context: { actorRole: "system" },
      });
      return rejectStaleSnapshot(snapshot, userId, "credential_state_changed");
    }
    ({ credentialId, encryptedSecret, leaseId } = acquired);
  } catch (error) {
    if (error instanceof AppError) throw error;
    await recordAudit({
      userId,
      action: "execution-lease.acquisition-failed",
      provider: snapshot.provider,
      credentialSecretVersion: snapshot.credentialSecretVersion,
      outcome: "failure",
      normalizedReason: "lease_acquisition_failed",
      context: { actorRole: "system" },
    });
    throw new AppError(503, "provider_unavailable", "AI execution is unavailable.");
  }

  let secret: Buffer;
  try {
    secret = decryptCredential({
      encryptedSecret,
      credentialId: credentialId.toString(),
      userId,
      provider: snapshot.provider,
      secretVersion: snapshot.credentialSecretVersion,
      keyRing: parseEncryptionKeyRing({
        current: env.BYOK_ENCRYPTION_KEY,
        previous: env.BYOK_ENCRYPTION_KEY_PREVIOUS,
      }),
    });
  } catch (error) {
    await AiCredentialExecutionLeaseModel.updateOne(
      { _id: leaseId, state: "active" },
      {
        $set: {
          state: "released",
          expiresAt: new Date(Date.now() + releasedLeaseRetentionMilliseconds),
        },
      },
    );
    if (error instanceof CredentialDecryptionError) {
      await recordAudit({
        userId,
        action: "credential.decryption-failed",
        provider: snapshot.provider,
        credentialSecretVersion: snapshot.credentialSecretVersion,
        preferenceRevision: snapshot.preferenceRevision,
        routingProfileVersion: snapshot.routingProfileVersion,
        outcome: "failure",
        normalizedReason: "credential_decryption_failed",
        context: { actorRole: "system" },
      });
      throw new AppError(
        503,
        "credential_decryption_failed",
        "The saved credential cannot be used.",
      );
    }
    throw error;
  }

  let released = false;
  return {
    snapshot,
    workerAttempt: job.attempts,
    credential: { read: () => secret.toString("utf8") },
    leaseId: leaseId.toString(),
    release: async () => {
      if (released) return;
      released = true;
      await releaseLease({
        leaseId,
        credentialId,
        userId,
        provider: snapshot.provider,
        secret,
      });
    },
  };
}

export async function expireCredentialExecutionLeases(
  now = new Date(),
): Promise<number> {
  const leases = await AiCredentialExecutionLeaseModel.find({
    state: "active",
    expiresAt: { $lte: now },
  }).select("credentialId").lean();
  if (leases.length === 0) return 0;

  await withMongoTransaction(async (session) => {
    await AiCredentialExecutionLeaseModel.updateMany(
      {
        _id: { $in: leases.map((lease) => lease._id) },
        state: "active",
        expiresAt: { $lte: now },
      },
      {
        $set: {
          state: "expired",
          heartbeatAt: now,
          expiresAt: new Date(now.getTime() + releasedLeaseRetentionMilliseconds),
        },
      },
      { session },
    );
    const credentialIds = new Set(
      leases.map((lease) => lease.credentialId.toString()),
    );
    for (const credentialId of credentialIds) {
      await finalizeDeletingCredential(new Types.ObjectId(credentialId), now, session);
    }
    return true;
  });
  return leases.length;
}
