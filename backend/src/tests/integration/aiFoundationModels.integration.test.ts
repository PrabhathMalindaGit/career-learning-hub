import { Types } from "mongoose";
import { beforeAll, describe, expect, it } from "vitest";

const modulePaths = {
  credential: "../../modules/ai/aiCredential.model.js",
  preference: "../../modules/ai/aiProviderPreference.model.js",
  profile: "../../modules/ai/aiRoutingProfile.model.js",
  audit: "../../modules/ai/securityAuditEvent.model.js",
  lease: "../../modules/ai/aiCredentialExecutionLease.model.js",
} as const;

interface Models {
  AiCredentialModel?: typeof import("mongoose").Model;
  AiProviderPreferenceModel?: typeof import("mongoose").Model;
  AiRoutingProfileModel?: typeof import("mongoose").Model;
  SecurityAuditEventModel?: typeof import("mongoose").Model;
  AiCredentialExecutionLeaseModel?: typeof import("mongoose").Model;
}

let models: Models = {};

const encryptedSecret = {
  ciphertext: "Y2lwaGVydGV4dA",
  nonce: "bm9uY2Utbm9uY2U",
  authTag: "YXV0aC10YWctMTZieXRlcw",
  keyVersion: 1,
  aadVersion: 1,
};

function credentialInput(userId: Types.ObjectId) {
  return {
    userId,
    provider: "gemini-direct",
    label: "Synthetic Gemini",
    maskedSuffix: "••••-key",
    secretVersion: 1,
    state: "configured",
    connectionStatus: "untested",
    encryptedSecret,
    revision: 0,
  };
}

function profileInput(userId: Types.ObjectId, version = 1) {
  return {
    userId,
    version,
    status: "active",
    activeMarker: "active",
    policyVersion: 1,
    geminiDirect: {
      directModelId: "gemini-test-model",
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
      maximumCostMicrousd: 0,
    },
  };
}

describe("AI-3 foundation persistence", () => {
  beforeAll(async () => {
    const [credential, preference, profile, audit, lease] = await Promise.all(
      Object.values(modulePaths).map((path) =>
        import(path).catch(() => ({})),
      ),
    );
    models = {
      ...(credential as Models),
      ...(preference as Models),
      ...(profile as Models),
      ...(audit as Models),
      ...(lease as Models),
    };
  });

  it("exports all required persistence models", () => {
    expect(models.AiCredentialModel).toBeDefined();
    expect(models.AiProviderPreferenceModel).toBeDefined();
    expect(models.AiRoutingProfileModel).toBeDefined();
    expect(models.SecurityAuditEventModel).toBeDefined();
    expect(models.AiCredentialExecutionLeaseModel).toBeDefined();
  });

  it("contains no plaintext or active credential field", () => {
    const schema = models.AiCredentialModel?.schema;
    if (!schema) return;

    expect(schema.path("apiKey")).toBeUndefined();
    expect(schema.path("plaintext")).toBeUndefined();
    expect(schema.path("secret")).toBeUndefined();
    expect(schema.path("active")).toBeUndefined();
  });

  it("excludes encrypted credential material from ordinary queries", async () => {
    const model = models.AiCredentialModel;
    if (!model) return;
    const created = await model.create(credentialInput(new Types.ObjectId()));

    const ordinary = await model.findById(created._id).lean();
    const privileged = await model
      .findById(created._id)
      .select("+encryptedSecret")
      .lean();

    expect(ordinary).not.toHaveProperty("encryptedSecret");
    expect(privileged).toHaveProperty(
      "encryptedSecret.ciphertext",
      encryptedSecret.ciphertext,
    );
  });

  it("enforces one non-deleted credential per owner and provider", async () => {
    const model = models.AiCredentialModel;
    if (!model) return;
    await model.init();
    const userId = new Types.ObjectId();
    const first = await model.create(credentialInput(userId));

    await expect(model.create(credentialInput(userId))).rejects.toMatchObject({
      code: 11_000,
    });

    await model.updateOne(
      { _id: first._id },
      { $set: { state: "deleting" } },
    );
    await model.updateOne(
      { _id: first._id },
      {
        $set: { state: "deleted", deletedAt: new Date() },
        $unset: { encryptedSecret: 1, maskedSuffix: 1 },
      },
    );
    await expect(model.create(credentialInput(userId))).resolves.toBeDefined();
  });

  it("rejects an invalid provider and unsafe unknown fields", async () => {
    const model = models.AiCredentialModel;
    if (!model) return;

    await expect(model.create({
      ...credentialInput(new Types.ObjectId()),
      provider: "gemini-direct/../../openai",
      apiKey: "synthetic-canary-key",
    })).rejects.toBeDefined();
  });

  it("rejects transition out of the deleted credential state", async () => {
    const model = models.AiCredentialModel;
    if (!model) return;
    const credential = await model.create(credentialInput(new Types.ObjectId()));
    await model.updateOne(
      { _id: credential._id },
      { $set: { state: "deleting" } },
    );
    await model.updateOne(
      { _id: credential._id },
      {
        $set: { state: "deleted", deletedAt: new Date() },
        $unset: { encryptedSecret: 1, maskedSuffix: 1 },
      },
    );

    await expect(model.updateOne(
      { _id: credential._id },
      { $set: { state: "valid", encryptedSecret } },
    )).rejects.toThrow("Invalid AI credential state transition.");
  });

  it("enforces one preference document and cross-field callable state", async () => {
    const model = models.AiProviderPreferenceModel;
    if (!model) return;
    await model.init();
    const userId = new Types.ObjectId();
    await model.create({
      userId,
      activeProvider: "disabled",
      credentialSource: "none",
      revision: 0,
      disabledReason: "not-configured",
    });

    await expect(model.create({
      userId,
      activeProvider: "disabled",
      credentialSource: "none",
      revision: 0,
    })).rejects.toMatchObject({ code: 11_000 });

    await expect(model.create({
      userId: new Types.ObjectId(),
      activeProvider: "gemini-direct",
      credentialSource: "user-managed",
      revision: 0,
    })).rejects.toBeDefined();
  });

  it("keeps published routing content immutable", async () => {
    const model = models.AiRoutingProfileModel;
    if (!model) return;
    const profile = await model.create(profileInput(new Types.ObjectId()));

    await expect(model.updateOne(
      { _id: profile._id },
      { $set: { "geminiDirect.directModelId": "mutated-model" } },
    )).rejects.toThrow("Published AI routing profiles are immutable.");

    await expect(model.findById(profile._id).lean()).resolves.toHaveProperty(
      "geminiDirect.directModelId",
      "gemini-test-model",
    );
  });

  it("enforces owner/version uniqueness and one active routing profile", async () => {
    const model = models.AiRoutingProfileModel;
    if (!model) return;
    await model.init();
    const userId = new Types.ObjectId();
    await model.create(profileInput(userId, 1));

    await expect(model.create(profileInput(userId, 1))).rejects.toMatchObject({
      code: 11_000,
    });
    await expect(model.create(profileInput(userId, 2))).rejects.toMatchObject({
      code: 11_000,
    });
  });

  it("rejects content and cryptographic fields from security audits", async () => {
    const model = models.SecurityAuditEventModel;
    if (!model) return;

    await expect(model.create({
      actorUserId: new Types.ObjectId(),
      subjectUserId: new Types.ObjectId(),
      action: "credential.saved",
      provider: "gemini-direct",
      outcome: "success",
      occurredAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      prompt: "synthetic private prompt",
      ciphertext: encryptedSecret.ciphertext,
    })).rejects.toBeDefined();
  });

  it("enforces unique lease attempts and declares credential/TTL indexes", async () => {
    const model = models.AiCredentialExecutionLeaseModel;
    if (!model) return;
    await model.init();
    const input = {
      credentialId: new Types.ObjectId(),
      credentialSecretVersion: 1,
      routingSnapshotId: new Types.ObjectId().toString(),
      jobId: new Types.ObjectId(),
      attemptId: "job-attempt-1",
      workerId: "vitest-worker",
      state: "active",
      acquiredAt: new Date(),
      heartbeatAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    };
    await model.create(input);

    await expect(model.create(input)).rejects.toMatchObject({ code: 11_000 });
    const indexes = await model.collection.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "ai_credential_lease_attempt_unique", unique: true }),
      expect.objectContaining({ name: "ai_credential_lease_credential_state" }),
      expect.objectContaining({ name: "ai_credential_lease_expiry_ttl", expireAfterSeconds: 0 }),
    ]));
  });
});
