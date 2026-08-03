import { createHmac, createHash } from "node:crypto";
import {
  Types,
  type ClientSession,
} from "mongoose";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import {
  clearSecretBuffer,
  CredentialDecryptionError,
  CredentialVaultUnavailableError,
  decryptCredential,
  encryptCredential,
  maskCredentialSuffix,
  parseEncryptionKeyRing,
} from "./credentialVault.js";
import {
  AiCredentialModel,
  type AiCredential,
} from "./aiCredential.model.js";
import { AiCredentialExecutionLeaseModel } from "./aiCredentialExecutionLease.model.js";
import { AiMutationReceiptModel } from "./aiMutationReceipt.model.js";
import {
  AiProviderPreferenceModel,
  type AiCredentialSource,
} from "./aiProviderPreference.model.js";
import {
  aiProviderIds,
  isAi4CallableProvider,
  type AiExecutionState,
  type AiProviderId,
} from "./aiProvider.types.js";
import { AiRoutingProfileModel } from "./aiRoutingProfile.model.js";
import {
  SecurityAuditEventModel,
  type SecurityAuditEvent,
} from "./securityAuditEvent.model.js";
import { GeminiProviderAdapter } from "./providers/gemini.provider.js";
import { OpenRouterProviderAdapter } from "./providers/openRouter.provider.js";
import { AiProviderError } from "./providers/provider.types.js";
import {
  compileOpenRouterActionProfiles,
  getOpenRouterActionPlan,
  getOpenRouterCatalogueStatus,
} from "./openRouterCatalogue.service.js";

const connectionResultSchema = z.object({
  status: z.literal("ok"),
}).strict();
const auditRetentionMilliseconds = 90 * 24 * 60 * 60 * 1_000;

export interface AiAuditContext {
  requestId?: string;
  sourceIp?: string;
  userAgent?: string;
  actorRole?: "user" | "admin" | "system";
}

interface CredentialMetadata {
  id: string;
  provider: AiProviderId;
  label: string;
  maskedSuffix?: string;
  secretVersion: number;
  state: AiCredential["state"];
  connectionStatus: AiCredential["connectionStatus"];
  lastValidatedAt?: Date;
  lastValidationError?: string;
  revision: number;
  replacedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function safeHash(value: string | undefined): string | undefined {
  return value
    ? createHash("sha256").update(value).digest("hex")
    : undefined;
}

function vaultKeyRing() {
  return parseEncryptionKeyRing({
    current: env.BYOK_ENCRYPTION_KEY,
    previous: env.BYOK_ENCRYPTION_KEY_PREVIOUS,
  });
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11_000,
  );
}

function providerNotAvailable(): never {
  throw new AppError(
    409,
    "provider_not_available",
    "The selected AI provider is not available.",
  );
}

function requireCredentialProvider(
  provider: AiExecutionState,
): asserts provider is "gemini-direct" | "openrouter" {
  if (provider !== "gemini-direct" && provider !== "openrouter") {
    providerNotAvailable();
  }
}

function serializeCredential(
  credential: AiCredential & { _id: Types.ObjectId },
): CredentialMetadata {
  return {
    id: credential._id.toString(),
    provider: credential.provider,
    label: credential.label,
    maskedSuffix: credential.maskedSuffix,
    secretVersion: credential.secretVersion,
    state: credential.state,
    connectionStatus: credential.connectionStatus,
    revision: credential.revision,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
    ...(credential.lastValidatedAt
      ? { lastValidatedAt: credential.lastValidatedAt }
      : {}),
    ...(credential.lastValidationError
      ? { lastValidationError: credential.lastValidationError }
      : {}),
    ...(credential.replacedAt
      ? { replacedAt: credential.replacedAt }
      : {}),
    ...(credential.deletedAt
      ? { deletedAt: credential.deletedAt }
      : {}),
  };
}

export async function recordAudit(input: {
  userId: string;
  action: SecurityAuditEvent["action"];
  provider?: AiExecutionState;
  credentialSecretVersion?: number;
  preferenceRevision?: number;
  routingProfileVersion?: number;
  outcome: SecurityAuditEvent["outcome"];
  normalizedReason?: string;
  context?: AiAuditContext;
  session?: ClientSession;
}): Promise<void> {
  const event = {
    actorUserId: input.userId,
    subjectUserId: input.userId,
    actorRole: input.context?.actorRole ?? "user",
    action: input.action,
    provider: input.provider,
    credentialSecretVersion: input.credentialSecretVersion,
    preferenceRevision: input.preferenceRevision,
    routingProfileVersion: input.routingProfileVersion,
    requestId: input.context?.requestId,
    outcome: input.outcome,
    normalizedReason: input.normalizedReason,
    sourceIpHash: safeHash(input.context?.sourceIp),
    userAgentHash: safeHash(input.context?.userAgent),
    occurredAt: new Date(),
    expiresAt: new Date(Date.now() + auditRetentionMilliseconds),
  };

  if (input.session) {
    await SecurityAuditEventModel.create([event], { session: input.session });
  } else {
    await SecurityAuditEventModel.create(event);
  }
}

function defaultRoutingProfile(userId: string, version = 1) {
  return {
    userId,
    version,
    status: "active" as const,
    activeMarker: "active" as const,
    policyVersion: 1,
    geminiDirect: {
      directModelId: env.GEMINI_MODEL,
      timeoutProfile: {
        ttftMs: 8_000,
        streamIdleMs: 15_000,
        totalMs: 45_000,
      },
      maximumInputTokens: 32_000,
      maximumOutputTokens: 8_192,
      validatorIdentity: "strict-zod-feature-semantics",
      validatorVersion: 1,
      executionDeadlineSeconds: 900,
      maximumCostMicrousd: 0 as const,
    },
  };
}

export async function ensureAiFoundation(userId: string) {
  let profile = await AiRoutingProfileModel.findOne({
    userId,
    status: "active",
    activeMarker: "active",
  });

  if (!profile) {
    try {
      profile = await AiRoutingProfileModel.create(
        defaultRoutingProfile(userId),
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      profile = await AiRoutingProfileModel.findOne({
        userId,
        status: "active",
        activeMarker: "active",
      });
    }
  }
  if (!profile) {
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "AI routing settings are unavailable.",
    );
  }

  let preference = await AiProviderPreferenceModel.findOne({ userId });
  if (!preference) {
    try {
      preference = await AiProviderPreferenceModel.create({
        userId,
        activeProvider: "disabled",
        credentialSource: "none",
        routingProfileId: profile._id,
        routingProfileVersion: profile.version,
        revision: 0,
        disabledReason: "not-configured",
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      preference = await AiProviderPreferenceModel.findOne({ userId });
    }
  }
  if (!preference) {
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "AI routing settings are unavailable.",
    );
  }

  return { preference, profile };
}

export async function withAiIdempotency<T>(input: {
  userId: string;
  operation: string;
  idempotencyKey: string;
  execute(): Promise<{ statusCode: number; value?: T }>;
}): Promise<{ statusCode: number; value?: T }> {
  await AiMutationReceiptModel.init();
  const keyHash = createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(input.idempotencyKey)
    .digest("hex");

  try {
    await AiMutationReceiptModel.create({
      userId: input.userId,
      operation: input.operation,
      keyHash,
      state: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const existing = await AiMutationReceiptModel.findOne({
      userId: input.userId,
      operation: input.operation,
      keyHash,
    }).lean();
    if (existing?.state === "completed" && existing.statusCode) {
      return {
        statusCode: existing.statusCode,
        value: existing.response as T | undefined,
      };
    }
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "An identical AI settings request is still processing.",
    );
  }

  try {
    const result = await input.execute();
    await AiMutationReceiptModel.updateOne(
      { userId: input.userId, operation: input.operation, keyHash },
      {
        $set: {
          state: "completed",
          statusCode: result.statusCode,
          response: result.value,
        },
      },
    );
    return result;
  } catch (error) {
    await AiMutationReceiptModel.deleteOne({
      userId: input.userId,
      operation: input.operation,
      keyHash,
      state: "pending",
    });
    throw error;
  }
}

export async function listProviderSettings(userId: string) {
  const [preference, credentials, openRouterStatus] = await Promise.all([
    AiProviderPreferenceModel.findOne({ userId }).lean(),
    AiCredentialModel.find({ userId, deletedAt: null }).lean(),
    getOpenRouterCatalogueStatus(),
  ]);
  const byProvider = new Map(
    credentials.map((credential) => [credential.provider, credential]),
  );

  return {
    activeProvider: preference?.activeProvider ?? "disabled",
    preferenceRevision: preference?.revision ?? 0,
    foundationEnabled: env.AI_ROUTING_FOUNDATION_ENABLED,
    providers: aiProviderIds.map((id) => {
      const credential = byProvider.get(id);
      return {
        id,
        available:
          id === "gemini-direct" ||
          (id === "openrouter" && openRouterStatus.available),
        configured: Boolean(credential),
        ...(credential
          ? {
              credential: serializeCredential(
                credential as AiCredential & { _id: Types.ObjectId },
              ),
            }
          : {}),
      };
    }),
  };
}

export async function getRoutingSettings(userId: string) {
  const preference = await AiProviderPreferenceModel.findOne({ userId }).lean();
  if (!preference) {
    return {
      foundationEnabled: env.AI_ROUTING_FOUNDATION_ENABLED,
      activeProvider: "disabled" as const,
      credentialSource: "none" as const,
      preferenceRevision: 0,
      routingProfile: null,
    };
  }
  const profile = await AiRoutingProfileModel.findOne({
    _id: preference.routingProfileId,
    userId,
    version: preference.routingProfileVersion,
  }).lean();
  return {
    foundationEnabled: env.AI_ROUTING_FOUNDATION_ENABLED,
    activeProvider: preference.activeProvider,
    credentialSource: preference.credentialSource,
    activeCredentialId: preference.activeCredentialId?.toString(),
    activeCredentialSecretVersion: preference.activeCredentialSecretVersion,
    administratorCredentialPolicyVersion:
      preference.administratorCredentialPolicyVersion,
    preferenceRevision: preference.revision,
    routingProfile: profile
      ? {
          id: profile._id.toString(),
          version: profile.version,
          policyVersion: profile.policyVersion,
          status: profile.status,
          geminiDirect: profile.geminiDirect,
          openRouterActions: profile.openRouterActions,
        }
      : null,
  };
}

export async function saveCredential(input: {
  userId: string;
  provider: AiExecutionState;
  apiKey: string;
  label?: string;
  expectedRevision?: number;
  audit?: AiAuditContext;
}): Promise<{ created: boolean; credential: CredentialMetadata }> {
  requireCredentialProvider(input.provider);
  const existing = await AiCredentialModel.findOne({
    userId: input.userId,
    provider: input.provider,
    deletedAt: null,
  }).lean();

  if (existing && input.expectedRevision === undefined) {
    throw new AppError(
      428,
      "routing_configuration_invalid",
      "A current If-Match revision is required to replace a credential.",
    );
  }
  if (existing && existing.revision !== input.expectedRevision) {
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "The credential changed before this request completed.",
    );
  }

  const credentialId = existing?._id ?? new Types.ObjectId();
  const secretVersion = existing ? existing.secretVersion + 1 : 1;
  const plaintext = Buffer.from(input.apiKey, "utf8");
  let encryptedSecret;
  try {
    encryptedSecret = encryptCredential({
      plaintext,
      credentialId: credentialId.toString(),
      userId: input.userId,
      provider: input.provider,
      secretVersion,
      keyRing: vaultKeyRing(),
    });
  } catch (error) {
    if (error instanceof CredentialVaultUnavailableError) {
      throw new AppError(
        409,
        "provider_not_configured",
        "Credential storage is not configured.",
      );
    }
    throw error;
  } finally {
    clearSecretBuffer(plaintext);
  }

  return withMongoTransaction(async (session) => {
    if (!existing) {
      const [created] = await AiCredentialModel.create([{
        _id: credentialId,
        userId: input.userId,
        provider: input.provider,
        label:
          input.label ??
          (input.provider === "openrouter" ? "OpenRouter" : "Gemini Direct"),
        maskedSuffix: maskCredentialSuffix(input.apiKey),
        secretVersion,
        state: "configured",
        connectionStatus: "untested",
        encryptedSecret,
        revision: 1,
      }], { session });
      await recordAudit({
        userId: input.userId,
        action: "credential.saved",
        provider: input.provider,
        credentialSecretVersion: secretVersion,
        outcome: "success",
        context: input.audit,
        session,
      });
      return {
        created: true,
        credential: serializeCredential(created),
      };
    }

    const replacedAt = new Date();
    const updated = await AiCredentialModel.findOneAndUpdate(
      {
        _id: existing._id,
        userId: input.userId,
        provider: input.provider,
        revision: input.expectedRevision,
        state: { $in: ["configured", "valid", "invalid"] },
        deletedAt: null,
      },
      {
        $set: {
          label: input.label ?? existing.label,
          maskedSuffix: maskCredentialSuffix(input.apiKey),
          secretVersion,
          state: "configured",
          connectionStatus: "untested",
          encryptedSecret,
          replacedAt,
        },
        $unset: {
          lastValidatedAt: 1,
          lastValidationError: 1,
        },
        $inc: { revision: 1, leaseEpoch: 1 },
      },
      { new: true, session },
    );
    if (!updated) {
      throw new AppError(
        409,
        "routing_configuration_invalid",
        "The credential changed before this request completed.",
      );
    }
    await recordAudit({
      userId: input.userId,
      action: "credential.replaced",
      provider: input.provider,
      credentialSecretVersion: secretVersion,
      outcome: "success",
      context: input.audit,
      session,
    });
    return {
      created: false,
      credential: serializeCredential(updated),
    };
  });
}

function normalizeConnectionError(error: unknown): AppError {
  if (error instanceof AiProviderError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return new AppError(409, "invalid_credentials", "The provider credential is invalid.");
    }
    if (error.statusCode === 404) {
      return new AppError(422, "model_not_found", "The configured provider model is unavailable.");
    }
    if (error.statusCode && error.statusCode >= 500) {
      return new AppError(503, "provider_unavailable", "The AI provider is unavailable.");
    }
    return new AppError(400, "invalid_request", "The provider connection test was rejected.");
  }
  return new AppError(502, "unknown_provider_error", "The provider connection test failed.");
}

export async function testCredentialConnection(input: {
  userId: string;
  provider: AiExecutionState;
  credentialVersion: number;
  audit?: AiAuditContext;
}): Promise<{ credential: CredentialMetadata }> {
  requireCredentialProvider(input.provider);
  const credential = await AiCredentialModel.findOne({
    userId: input.userId,
    provider: input.provider,
    deletedAt: null,
    state: { $in: ["configured", "valid", "invalid"] },
  }).select("+encryptedSecret");
  if (
    !credential ||
    credential.secretVersion !== input.credentialVersion ||
    !credential.encryptedSecret
  ) {
    throw new AppError(
      409,
      "provider_not_configured",
      "The selected AI provider is not configured.",
    );
  }

  let secret: Buffer;
  try {
    secret = decryptCredential({
      encryptedSecret: credential.encryptedSecret,
      credentialId: credential._id.toString(),
      userId: input.userId,
      provider: input.provider,
      secretVersion: credential.secretVersion,
      keyRing: vaultKeyRing(),
    });
  } catch (error) {
    if (error instanceof CredentialDecryptionError) {
      await recordAudit({
        userId: input.userId,
        action: "credential.decryption-failed",
        provider: input.provider,
        credentialSecretVersion: credential.secretVersion,
        outcome: "failure",
        normalizedReason: "credential_decryption_failed",
        context: input.audit,
      });
      throw new AppError(
        503,
        "credential_decryption_failed",
        "The saved credential cannot be used.",
      );
    }
    throw error;
  }

  try {
    const openRouterPlan = input.provider === "openrouter"
      ? await getOpenRouterActionPlan({
          action: "interview-question-explanation",
          now: new Date(),
        })
      : undefined;
    const adapter = input.provider === "openrouter"
      ? new OpenRouterProviderAdapter()
      : new GeminiProviderAdapter();
    const result = await adapter.generateStructured({
      systemPrompt: "This is a credential connection check.",
      userPrompt: 'Return exactly {"status":"ok"}.',
      responseJsonSchema: {
        type: "object",
        properties: { status: { type: "string", enum: ["ok"] } },
        required: ["status"],
        additionalProperties: false,
      },
      ...(input.provider === "openrouter"
        ? {
            models: openRouterPlan!.modelIds,
            maximumOutputTokens: 32,
            timeoutMs: 15_000,
          }
        : { model: env.GEMINI_MODEL }),
      signal: new AbortController().signal,
      credential: { read: () => secret.toString("utf8") },
    });
    connectionResultSchema.parse(JSON.parse(result.text));

    const updated = await AiCredentialModel.findOneAndUpdate(
      {
        _id: credential._id,
        userId: input.userId,
        secretVersion: credential.secretVersion,
        state: { $in: ["configured", "valid", "invalid"] },
      },
      {
        $set: {
          state: "valid",
          connectionStatus: "valid",
          lastValidatedAt: new Date(),
        },
        $unset: { lastValidationError: 1 },
        $inc: { revision: 1 },
      },
      { new: true },
    );
    if (!updated) {
      throw new AppError(
        409,
        "routing_configuration_invalid",
        "The credential changed during validation.",
      );
    }
    await recordAudit({
      userId: input.userId,
      action: "credential.tested",
      provider: input.provider,
      credentialSecretVersion: credential.secretVersion,
      outcome: "success",
      context: input.audit,
    });
    return { credential: serializeCredential(updated) };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const normalized = normalizeConnectionError(error);
    await AiCredentialModel.updateOne(
      {
        _id: credential._id,
        userId: input.userId,
        secretVersion: credential.secretVersion,
        state: { $in: ["configured", "valid", "invalid"] },
      },
      {
        $set: {
          state: "invalid",
          connectionStatus: "invalid",
          lastValidatedAt: new Date(),
          lastValidationError: normalized.code,
        },
        $inc: { revision: 1 },
      },
    );
    await recordAudit({
      userId: input.userId,
      action: "credential.tested",
      provider: input.provider,
      credentialSecretVersion: credential.secretVersion,
      outcome: "failure",
      normalizedReason: normalized.code,
      context: input.audit,
    });
    throw normalized;
  } finally {
    clearSecretBuffer(secret);
  }
}

export async function activateProvider(input: {
  userId: string;
  provider: AiExecutionState;
  credentialSource?: AiCredentialSource;
  routingProfileVersion?: number;
  expectedRevision: number;
  audit?: AiAuditContext;
}) {
  if (!isAi4CallableProvider(input.provider)) providerNotAvailable();
  if (!env.AI_ROUTING_FOUNDATION_ENABLED) {
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "The AI routing foundation is disabled.",
    );
  }
  await ensureAiFoundation(input.userId);
  let compiledOpenRouterActions:
    Awaited<ReturnType<typeof compileOpenRouterActionProfiles>> | undefined;
  if (input.provider === "openrouter") {
    try {
      compiledOpenRouterActions = await compileOpenRouterActionProfiles();
    } catch {
      throw new AppError(
        409,
        "provider_not_available",
        "The selected AI provider is not available.",
      );
    }
  }

  try {
    return await withMongoTransaction(async (session) => {
      const preference = await AiProviderPreferenceModel.findOne({
        userId: input.userId,
        revision: input.expectedRevision,
      }).session(session);
      if (!preference) {
        throw new AppError(
          409,
          "routing_configuration_invalid",
          "The AI routing settings changed before this request completed.",
        );
      }

      let profile = await AiRoutingProfileModel.findOne({
        userId: input.userId,
        version: input.routingProfileVersion ?? preference.routingProfileVersion,
        status: "active",
        activeMarker: "active",
      }).session(session);
      if (!profile) {
        throw new AppError(
          409,
          "routing_configuration_invalid",
          "The selected AI routing profile is unavailable.",
        );
      }

      if (input.provider === "openrouter") {
        const expectedCatalogueVersion = compiledOpenRouterActions?.[0]?.catalogueVersion;
        const currentActions = profile.openRouterActions;
        const canReuse = Boolean(
          currentActions &&
          compiledOpenRouterActions &&
          currentActions.length === compiledOpenRouterActions.length &&
          currentActions.every(
            (entry, index) => {
              const compiled = compiledOpenRouterActions[index];
              return (
                entry.action === compiled.action &&
                entry.catalogueVersion === expectedCatalogueVersion &&
                entry.rankingPolicyVersion === compiled.rankingPolicyVersion &&
                entry.freeModelIds.length === compiled.freeModelIds.length &&
                entry.freeModelIds.every(
                  (modelId, modelIndex) =>
                    modelId === compiled.freeModelIds[modelIndex],
                )
              );
            },
          ),
        );
        if (!canReuse) {
          await AiRoutingProfileModel.updateOne(
            { _id: profile._id, status: "active", activeMarker: "active" },
            { $set: { status: "retired" }, $unset: { activeMarker: 1 } },
            { session },
          );
          const [replacement] = await AiRoutingProfileModel.create([{
            userId: profile.userId,
            version: profile.version + 1,
            status: "active",
            activeMarker: "active",
            policyVersion: profile.policyVersion,
            geminiDirect: profile.toObject().geminiDirect,
            openRouterActions: compiledOpenRouterActions,
          }], { session });
          profile = replacement;
        }
      }

      let set: Record<string, unknown>;
      const unset: Record<string, 1> = {};
      let action: SecurityAuditEvent["action"];
      let credentialSecretVersion: number | undefined;

      if (input.provider === "disabled") {
        set = {
          activeProvider: "disabled",
          credentialSource: "none",
          routingProfileId: profile._id,
          routingProfileVersion: profile.version,
          disabledReason: "user-disabled",
        };
        unset.activeCredentialId = 1;
        unset.activeCredentialSecretVersion = 1;
        unset.administratorCredentialPolicyVersion = 1;
        action = "ai.disabled";
      } else if (input.credentialSource === "user-managed") {
        const credential = await AiCredentialModel.findOne({
          userId: input.userId,
          provider: input.provider,
          state: "valid",
          connectionStatus: "valid",
          deletedAt: null,
        }).session(session);
        if (!credential) {
          throw new AppError(
            409,
            "provider_not_configured",
            "The selected AI provider is not configured and valid.",
          );
        }
        credentialSecretVersion = credential.secretVersion;
        set = {
          activeProvider: input.provider,
          credentialSource: "user-managed",
          activeCredentialId: credential._id,
          activeCredentialSecretVersion: credential.secretVersion,
          routingProfileId: profile._id,
          routingProfileVersion: profile.version,
        };
        unset.administratorCredentialPolicyVersion = 1;
        unset.disabledReason = 1;
        action = "provider.activated";
      } else if (
        input.provider === "gemini-direct" &&
        input.credentialSource === "administrator-managed" &&
        env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED &&
        env.GEMINI_API_KEY
      ) {
        set = {
          activeProvider: "gemini-direct",
          credentialSource: "administrator-managed",
          administratorCredentialPolicyVersion:
            env.AI_ADMIN_GEMINI_POLICY_VERSION,
          routingProfileId: profile._id,
          routingProfileVersion: profile.version,
        };
        unset.activeCredentialId = 1;
        unset.activeCredentialSecretVersion = 1;
        unset.disabledReason = 1;
        action = "provider.activated";
      } else {
        throw new AppError(
          409,
          "provider_not_configured",
          "The selected AI provider credential source is unavailable.",
        );
      }

      const updated = await AiProviderPreferenceModel.findOneAndUpdate(
        {
          _id: preference._id,
          userId: input.userId,
          revision: input.expectedRevision,
        },
        {
          $set: set,
          $unset: unset,
          $inc: { revision: 1 },
        },
        { new: true, session },
      );
      if (!updated) {
        throw new AppError(
          409,
          "routing_configuration_invalid",
          "The AI routing settings changed before this request completed.",
        );
      }
      await recordAudit({
        userId: input.userId,
        action,
        provider: input.provider,
        credentialSecretVersion,
        preferenceRevision: updated.revision,
        routingProfileVersion: profile.version,
        outcome: "success",
        context: input.audit,
        session,
      });

      return {
        activeProvider: updated.activeProvider,
        credentialSource: updated.credentialSource,
        activeCredentialId: updated.activeCredentialId?.toString(),
        activeCredentialSecretVersion: updated.activeCredentialSecretVersion,
        administratorCredentialPolicyVersion:
          updated.administratorCredentialPolicyVersion,
        routingProfileId: profile._id.toString(),
        routingProfileVersion: profile.version,
        revision: updated.revision,
      };
    });
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === "routing_configuration_invalid"
    ) {
      await recordAudit({
        userId: input.userId,
        action: "activation.conflict",
        provider: input.provider,
        preferenceRevision: input.expectedRevision,
        outcome: "conflict",
        normalizedReason: "revision_conflict",
        context: input.audit,
      });
    }
    throw error;
  }
}

export async function deleteCredential(input: {
  userId: string;
  provider: AiExecutionState;
  expectedRevision: number;
  audit?: AiAuditContext;
}): Promise<{ pending: boolean }> {
  requireCredentialProvider(input.provider);
  const live = await AiCredentialModel.findOne({
    userId: input.userId,
    provider: input.provider,
    deletedAt: null,
  });
  if (!live) {
    return { pending: false };
  }
  if (live.state === "deleting") return { pending: true };
  if (live.revision !== input.expectedRevision) {
    throw new AppError(
      409,
      "routing_configuration_invalid",
      "The credential changed before this request completed.",
    );
  }

  return withMongoTransaction(async (session) => {
    const transitioned = await AiCredentialModel.findOneAndUpdate(
      {
        _id: live._id,
        userId: input.userId,
        provider: input.provider,
        revision: input.expectedRevision,
        state: { $in: ["configured", "valid", "invalid"] },
        deletedAt: null,
      },
      {
        $set: { state: "deleting", connectionStatus: "unavailable" },
        $inc: { revision: 1, leaseEpoch: 1 },
      },
      { new: true, session },
    );
    if (!transitioned) {
      throw new AppError(
        409,
        "routing_configuration_invalid",
        "The credential changed before this request completed.",
      );
    }

    await AiProviderPreferenceModel.updateOne(
      {
        userId: input.userId,
        activeCredentialId: transitioned._id,
      },
      {
        $set: {
          activeProvider: "disabled",
          credentialSource: "none",
          disabledReason: "credential-deleted",
        },
        $unset: {
          activeCredentialId: 1,
          activeCredentialSecretVersion: 1,
          administratorCredentialPolicyVersion: 1,
        },
        $inc: { revision: 1 },
      },
      { session },
    );

    const activeLeaseCount = await AiCredentialExecutionLeaseModel.countDocuments({
      credentialId: transitioned._id,
      state: "active",
      expiresAt: { $gt: new Date() },
    }).session(session);
    const pending = activeLeaseCount > 0;

    if (!pending) {
      await AiCredentialModel.updateOne(
        { _id: transitioned._id, state: "deleting" },
        {
          $set: { state: "deleted", deletedAt: new Date() },
          $unset: {
            encryptedSecret: 1,
            maskedSuffix: 1,
            lastValidatedAt: 1,
            lastValidationError: 1,
          },
          $inc: { revision: 1 },
        },
        { session },
      );
    }

    await recordAudit({
      userId: input.userId,
      action: "credential.deleted",
      provider: input.provider,
      credentialSecretVersion: transitioned.secretVersion,
      outcome: pending ? "pending" : "success",
      normalizedReason: pending ? "active_lease_drain" : undefined,
      context: input.audit,
      session,
    });
    return { pending };
  });
}
