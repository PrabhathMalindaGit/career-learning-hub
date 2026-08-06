import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { AiCredentialModel } from "../../modules/ai/aiCredential.model.js";
import { AiProviderPreferenceModel } from "../../modules/ai/aiProviderPreference.model.js";
import { AiRoutingProfileModel } from "../../modules/ai/aiRoutingProfile.model.js";
import { SecurityAuditEventModel } from "../../modules/ai/securityAuditEvent.model.js";
import { UsageEventModel } from "../../modules/ai/usageEvent.model.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AuthSessionModel } from "../../modules/auth/authSession.model.js";
import { signAccessToken, signRefreshToken } from "../../modules/auth/token.service.js";
import { UserModel } from "../../modules/users/user.model.js";
import { createSessionFamilyId, hashToken } from "../../shared/crypto.js";

const TEST_ORIGIN = "http://localhost:5173";
const byokKey = `v9:${Buffer.alloc(32, 0x39).toString("base64url")}`;
const canaryCredential = "AIzaSyntheticCanaryCredential-123456789";

const originalVaultKey = env.BYOK_ENCRYPTION_KEY;
const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility = env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;
const originalAdminPolicyVersion = env.AI_ADMIN_GEMINI_POLICY_VERSION;
const originalGeminiApiKey = env.GEMINI_API_KEY;

async function registerTestUser(_application: typeof app, input: {
  email: string;
  displayName: string;
}): Promise<{ accessToken: string; userId: string }> {
  const sessionId = new Types.ObjectId();
  const user = await UserModel.create({
    email: input.email,
    passwordHash: "SyntheticPassword1",
    profile: { displayName: input.displayName },
    roles: ["user"],
    accountStatus: "active",
  });
  const refreshToken = signRefreshToken(
    user._id.toString(),
    sessionId.toString(),
  );
  const now = new Date();
  await AuthSessionModel.create({
    _id: sessionId,
    userId: user._id,
    familyId: createSessionFamilyId(),
    refreshTokenHash: hashToken(refreshToken),
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + 86_400_000),
  });
  return {
    accessToken: signAccessToken(user._id.toString(), sessionId.toString()),
    userId: user._id.toString(),
  };
}

function mutationHeaders(revision?: number) {
  return {
    Origin: TEST_ORIGIN,
    "Idempotency-Key": randomUUID(),
    ...(revision === undefined ? {} : { "If-Match": `"${revision}"` }),
  };
}

function mockSuccessfulGeminiConnection() {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({
      candidates: [{
        content: { parts: [{ text: '{"status":"ok"}' }] },
      }],
      usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1 },
    }), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function createCredential(input: {
  accessToken: string;
  apiKey?: string;
  idempotencyKey?: string;
}) {
  return request(app)
    .put("/api/v1/ai/providers/gemini-direct/credential")
    .set("Authorization", `Bearer ${input.accessToken}`)
    .set("Origin", TEST_ORIGIN)
    .set("Idempotency-Key", input.idempotencyKey ?? randomUUID())
    .send({
      apiKey: input.apiKey ?? canaryCredential,
      label: "Synthetic Gemini",
    });
}

async function validateCredential(input: {
  accessToken: string;
  credentialVersion?: number;
  idempotencyKey?: string;
}) {
  return request(app)
    .post("/api/v1/ai/providers/gemini-direct/test")
    .set("Authorization", `Bearer ${input.accessToken}`)
    .set("Origin", TEST_ORIGIN)
    .set("Idempotency-Key", input.idempotencyKey ?? randomUUID())
    .send({ credentialVersion: input.credentialVersion ?? 1 });
}

describe("AI-3 provider credential APIs", () => {
  beforeEach(() => {
    env.BYOK_ENCRYPTION_KEY = byokKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = true;
    mockSuccessfulGeminiConnection();
  });

  afterEach(() => {
    env.BYOK_ENCRYPTION_KEY = originalVaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = originalAdminCompatibility;
    env.AI_ADMIN_GEMINI_POLICY_VERSION = originalAdminPolicyVersion;
    env.GEMINI_API_KEY = originalGeminiApiKey;
    vi.unstubAllGlobals();
  });

  it("lists exact provider availability and owner-scoped safe metadata", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-provider-list@example.com",
      displayName: "AI Provider List",
    });

    const response = await request(app)
      .get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      activeProvider: "disabled",
      preferenceRevision: 0,
      foundationEnabled: true,
      geminiModel: "gemini-3.6-flash",
      administratorManagedAvailable: false,
    });
    expect(response.body.data.providers).toEqual([
      expect.objectContaining({ id: "openrouter", available: false }),
      expect.objectContaining({ id: "gemini-direct", available: true, configured: false }),
      expect.objectContaining({ id: "openai-direct", available: false }),
      expect.objectContaining({ id: "anthropic-direct", available: false }),
      expect.objectContaining({ id: "deepseek-direct", available: false }),
    ]);
    expect(JSON.stringify(response.body)).not.toContain("GEMINI_API_KEY");
  });

  it("tests application-managed Gemini without exposing environment credential metadata", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-application-managed@example.com",
      displayName: "AI Application Managed",
    });
    const managedKey = "AIzaApplicationManagedCanary-1122334455";
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = true;
    env.AI_ADMIN_GEMINI_POLICY_VERSION = 4;
    env.GEMINI_API_KEY = managedKey;
    const fetchMock = mockSuccessfulGeminiConnection();

    const response = await request(app)
      .post("/api/v1/ai/providers/gemini-direct/test")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders())
      .send({ credentialSource: "administrator-managed" })
      .expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.has("key")).toBe(false);
    expect(init.headers).toMatchObject({ "x-goog-api-key": managedKey });
    expect(response.body.data).toMatchObject({
      credentialSource: "administrator-managed",
      connectionStatus: "valid",
      model: "gemini-3.6-flash",
    });
    expect(response.body.data.lastValidatedAt).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain(managedKey);
    expect(JSON.stringify(response.body)).not.toMatch(/maskedSuffix|credentialVersion/);
    await expect(AiCredentialModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);

    await request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(0))
      .send({ credentialSource: "administrator-managed" })
      .expect(200);
    const routing = await request(app)
      .get("/api/v1/ai/routing")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(routing.body.data).toMatchObject({
      activeProvider: "gemini-direct",
      credentialSource: "administrator-managed",
      administratorCredentialPolicyVersion: 4,
      preferenceRevision: 1,
    });
  });

  it("keeps provider and routing GET requests read-only", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-read-only@example.com",
      displayName: "AI Read Only",
    });

    await request(app)
      .get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    const routing = await request(app)
      .get("/api/v1/ai/routing")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(routing.body.data).toMatchObject({
      activeProvider: "disabled",
      credentialSource: "none",
      preferenceRevision: 0,
      routingProfile: null,
    });
    await expect(AiProviderPreferenceModel.countDocuments({ userId: owner.userId }))
      .resolves.toBe(0);
    await expect(AiRoutingProfileModel.countDocuments({ userId: owner.userId }))
      .resolves.toBe(0);
    await expect(AiCredentialModel.countDocuments({ userId: owner.userId }))
      .resolves.toBe(0);
  });

  it("requires an exact allowed Origin for credential mutations", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-origin@example.com",
      displayName: "AI Origin",
    });

    const missing = await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("Idempotency-Key", randomUUID())
      .send({ apiKey: canaryCredential })
      .expect(403);
    expect(missing.body.error.code).toBe("origin_required");

    const foreign = await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("Origin", "https://attacker.example")
      .set("Idempotency-Key", randomUUID())
      .send({ apiKey: canaryCredential })
      .expect(403);
    expect(foreign.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
  });

  it("fails credential save safely when the vault is unavailable", async () => {
    env.BYOK_ENCRYPTION_KEY = undefined;
    const owner = await registerTestUser(app, {
      email: "ai-vault-missing@example.com",
      displayName: "AI Vault Missing",
    });

    const response = await createCredential({ accessToken: owner.accessToken });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("provider_not_configured");
    await expect(AiCredentialModel.countDocuments()).resolves.toBe(0);
  });

  it("tests a candidate exactly once before persisting a valid credential", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-candidate-before-write@example.com",
      displayName: "AI Candidate Before Write",
    });
    const fetchMock = vi.fn(async () => {
      await expect(AiCredentialModel.countDocuments({
        userId: owner.userId,
      })).resolves.toBe(0);
      return new Response(JSON.stringify({
        candidates: [{
          content: { parts: [{ text: '{"status":"ok"}' }] },
        }],
        usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1 },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await createCredential({ accessToken: owner.accessToken });

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.body.data.credential).toMatchObject({
      state: "valid",
      connectionStatus: "valid",
      secretVersion: 1,
      revision: 1,
    });
    expect(response.body.data.credential.lastValidatedAt).toEqual(
      expect.any(String),
    );
    const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.pathname).toContain("/models/gemini-3.6-flash:");
  });

  it("does not persist an invalid candidate credential", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-invalid-candidate@example.com",
      displayName: "AI Invalid Candidate",
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"error":{"message":"synthetic rejection"}}', {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createCredential({ accessToken: owner.accessToken });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("invalid_credentials");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(AiCredentialModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
  });

  it("saves encrypted Gemini metadata without returning or persisting plaintext", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-save@example.com",
      displayName: "AI Save",
    });

    const response = await createCredential({ accessToken: owner.accessToken });

    expect(response.status).toBe(201);
    expect(response.body.data.credential).toMatchObject({
      provider: "gemini-direct",
      label: "Synthetic Gemini",
      maskedSuffix: "••••6789",
      secretVersion: 1,
      state: "valid",
      connectionStatus: "valid",
      revision: 1,
    });
    expect(JSON.stringify(response.body)).not.toContain(canaryCredential);

    const raw = await AiCredentialModel.collection.findOne({});
    expect(raw).not.toHaveProperty("apiKey");
    expect(raw).not.toHaveProperty("plaintext");
    expect(JSON.stringify(raw)).not.toContain(canaryCredential);
    expect(raw).toHaveProperty("encryptedSecret.ciphertext");
  });

  it("replays a successful credential save idempotently", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-save-idempotent@example.com",
      displayName: "AI Save Idempotent",
    });
    const idempotencyKey = randomUUID();

    const first = await createCredential({
      accessToken: owner.accessToken,
      idempotencyKey,
    });
    const replay = await createCredential({
      accessToken: owner.accessToken,
      idempotencyKey,
    });

    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    await expect(AiCredentialModel.countDocuments()).resolves.toBe(1);
  });

  it("replaces with a fresh nonce under revision control and rejects stale replacement", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-replace@example.com",
      displayName: "AI Replace",
    });
    await createCredential({ accessToken: owner.accessToken });
    const before = await AiCredentialModel.collection.findOne({
      userId: new Types.ObjectId(owner.userId),
    });
    const replacement = "AIzaReplacementCanaryCredential-987654321";

    const response = await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1))
      .send({ apiKey: replacement, label: "Replacement Gemini" })
      .expect(200);

    expect(response.body.data.credential).toMatchObject({
      secretVersion: 2,
      revision: 2,
      state: "valid",
      connectionStatus: "valid",
      maskedSuffix: "••••4321",
    });
    const after = await AiCredentialModel.collection.findOne({
      userId: new Types.ObjectId(owner.userId),
    });
    expect(after?.encryptedSecret.nonce).not.toBe(before?.encryptedSecret.nonce);
    expect(after?.encryptedSecret.ciphertext).not.toBe(before?.encryptedSecret.ciphertext);
    expect(JSON.stringify([response.body, after])).not.toContain(replacement);

    await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1))
      .send({ apiKey: "AIzaStaleReplacement-111111111" })
      .expect(409);
    await expect(AiCredentialModel.findOne({ userId: owner.userId }).lean())
      .resolves.toMatchObject({ secretVersion: 2, revision: 2 });
  });

  it("atomically advances an active personal preference when replacing its key", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-active-replacement@example.com",
      displayName: "AI Active Replacement",
    });
    await createCredential({ accessToken: owner.accessToken });
    await request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(0))
      .send({ credentialSource: "user-managed", routingProfileVersion: 1 })
      .expect(200);

    const replacement = "AIzaAtomicReplacementCanary-246813579";
    const response = await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1))
      .send({ apiKey: replacement })
      .expect(200);

    expect(response.body.data.credential).toMatchObject({
      secretVersion: 2,
      revision: 2,
      state: "valid",
      connectionStatus: "valid",
    });
    await expect(AiProviderPreferenceModel.findOne({
      userId: owner.userId,
    }).lean()).resolves.toMatchObject({
      activeProvider: "gemini-direct",
      credentialSource: "user-managed",
      activeCredentialSecretVersion: 2,
      revision: 2,
    });
  });

  it("preserves an active personal key and routing state when replacement testing fails", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-failed-replacement@example.com",
      displayName: "AI Failed Replacement",
    });
    await createCredential({ accessToken: owner.accessToken });
    await request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(0))
      .send({ credentialSource: "user-managed", routingProfileVersion: 1 })
      .expect(200);
    const credentialBefore = await AiCredentialModel.collection.findOne({
      userId: new Types.ObjectId(owner.userId),
    });
    const preferenceBefore = await AiProviderPreferenceModel.findOne({
      userId: owner.userId,
    }).lean();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response('{"error":{"message":"synthetic rejection"}}', {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1))
      .send({ apiKey: "AIzaRejectedReplacementCanary-135792468" })
      .expect(409);

    const credentialAfter = await AiCredentialModel.collection.findOne({
      userId: new Types.ObjectId(owner.userId),
    });
    const preferenceAfter = await AiProviderPreferenceModel.findOne({
      userId: owner.userId,
    }).lean();
    expect(credentialAfter?.secretVersion).toBe(credentialBefore?.secretVersion);
    expect(credentialAfter?.revision).toBe(credentialBefore?.revision);
    expect(credentialAfter?.encryptedSecret).toEqual(credentialBefore?.encryptedSecret);
    expect(preferenceAfter).toEqual(preferenceBefore);
  });

  it("tests only the stored credential with fixed synthetic content", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-test@example.com",
      displayName: "AI Test",
    });
    await createCredential({ accessToken: owner.accessToken });
    const fetchMock = mockSuccessfulGeminiConnection();

    const response = await validateCredential({ accessToken: owner.accessToken });

    expect(response.status).toBe(200);
    expect(response.body.data.credential).toMatchObject({
      state: "valid",
      connectionStatus: "valid",
      secretVersion: 1,
      revision: 2,
    });
    expect(JSON.stringify(response.body)).not.toContain(canaryCredential);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.has("key")).toBe(false);
    expect(init.headers).toMatchObject({ "x-goog-api-key": canaryCredential });
    const body = String(init.body);
    expect(body).toContain("credential connection check");
    expect(body).not.toMatch(/resume|interview|learning|document|job description/i);
  });

  it("replays a successful connection test without another provider call", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-test-idempotent@example.com",
      displayName: "AI Test Idempotent",
    });
    await createCredential({ accessToken: owner.accessToken });
    const fetchMock = mockSuccessfulGeminiConnection();
    const idempotencyKey = randomUUID();

    const first = await validateCredential({ accessToken: owner.accessToken, idempotencyKey });
    const replay = await validateCredential({ accessToken: owner.accessToken, idempotencyKey });

    expect(first.status).toBe(200);
    expect(replay.body).toEqual(first.body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives foreign and missing owners equivalent credential-test behavior", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-owner@example.com",
      displayName: "AI Owner",
    });
    const foreign = await registerTestUser(app, {
      email: "ai-foreign@example.com",
      displayName: "AI Foreign",
    });
    const missing = await registerTestUser(app, {
      email: "ai-missing@example.com",
      displayName: "AI Missing",
    });
    await createCredential({ accessToken: owner.accessToken });
    const fetchMock = mockSuccessfulGeminiConnection();

    const foreignResponse = await validateCredential({ accessToken: foreign.accessToken });
    const missingResponse = await validateCredential({ accessToken: missing.accessToken });

    expect(foreignResponse.status).toBe(409);
    expect(missingResponse.status).toBe(409);
    expect(foreignResponse.body.error).toMatchObject({
      code: "provider_not_configured",
      message: missingResponse.body.error.message,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps read, replace, activate, and delete operations owner-scoped", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-all-owner@example.com",
      displayName: "AI All Owner",
    });
    const foreign = await registerTestUser(app, {
      email: "ai-all-foreign@example.com",
      displayName: "AI All Foreign",
    });
    const missing = await registerTestUser(app, {
      email: "ai-all-missing@example.com",
      displayName: "AI All Missing",
    });
    const saved = await createCredential({ accessToken: owner.accessToken });
    const ownerCredentialId = saved.body.data.credential.id as string;

    const ownerRead = await request(app).get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`).expect(200);
    const foreignRead = await request(app).get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${foreign.accessToken}`).expect(200);
    expect(ownerRead.body.data.providers.find(
      (provider: { id: string }) => provider.id === "gemini-direct",
    )).toMatchObject({ configured: true });
    expect(foreignRead.body.data.providers.find(
      (provider: { id: string }) => provider.id === "gemini-direct",
    )).toMatchObject({ configured: false });

    for (const actor of [foreign, missing]) {
      await request(app)
        .put("/api/v1/ai/providers/gemini-direct/credential")
        .set("Authorization", `Bearer ${actor.accessToken}`)
        .set(mutationHeaders(1))
        .send({ apiKey: "AIzaForeignReplacement-222222222", credentialId: ownerCredentialId })
        .expect(400);
    }

    const activate = (accessToken: string) => request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${accessToken}`)
      .set(mutationHeaders(0))
      .send({ credentialSource: "user-managed", routingProfileVersion: 1 });
    const foreignActivation = await activate(foreign.accessToken);
    const missingActivation = await activate(missing.accessToken);
    expect(foreignActivation.status).toBe(409);
    expect(foreignActivation.body.error).toMatchObject({
      code: "provider_not_configured",
      message: missingActivation.body.error.message,
    });

    for (const actor of [foreign, missing]) {
      await request(app)
        .delete("/api/v1/ai/providers/gemini-direct/credential")
        .set("Authorization", `Bearer ${actor.accessToken}`)
        .set(mutationHeaders(1))
        .expect(204);
    }
    await expect(AiCredentialModel.findOne({ userId: owner.userId }).lean())
      .resolves.toMatchObject({ state: "valid", revision: 1 });
  });

  it("rejects ownership override fields and provider path injection", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-validation@example.com",
      displayName: "AI Validation",
    });

    const override = await request(app)
      .put("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders())
      .send({
        apiKey: canaryCredential,
        userId: "64a64a64a64a64a64a64a64a",
        credentialId: "64b64b64b64b64b64b64b64b",
      })
      .expect(400);
    expect(override.body.error.code).toBe("VALIDATION_ERROR");

    const injected = await request(app)
      .put("/api/v1/ai/providers/gemini-direct%2F..%2Fopenai/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders())
      .send({ apiKey: canaryCredential });
    expect([400, 404]).toContain(injected.status);
    await expect(AiCredentialModel.countDocuments()).resolves.toBe(0);
  });

  it("never calls an unavailable provider", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-unavailable@example.com",
      displayName: "AI Unavailable",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await request(app)
      .put("/api/v1/ai/providers/openai-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders())
      .send({ apiKey: canaryCredential })
      .expect(409);

    expect(response.body.error.code).toBe("provider_not_available");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows exactly one activation winner for the same preference revision", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-activation@example.com",
      displayName: "AI Activation",
    });
    await request(app)
      .get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    await createCredential({ accessToken: owner.accessToken });
    mockSuccessfulGeminiConnection();
    await validateCredential({ accessToken: owner.accessToken });

    const activate = () => request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(0))
      .send({
        credentialSource: "user-managed",
        routingProfileVersion: 1,
      });
    const responses = await Promise.all([activate(), activate()]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(responses.find((response) => response.status === 409)?.body.error.code)
      .toBe("routing_configuration_invalid");
    await expect(AiProviderPreferenceModel.findOne({ userId: owner.userId }).lean())
      .resolves.toMatchObject({
        activeProvider: "gemini-direct",
        credentialSource: "user-managed",
        revision: 1,
      });
    await expect(SecurityAuditEventModel.countDocuments({
      subjectUserId: owner.userId,
      action: "provider.activated",
    })).resolves.toBe(1);
  });

  it("disables AI and clears active credential references", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-disable@example.com",
      displayName: "AI Disable",
    });
    await request(app).get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`);
    await createCredential({ accessToken: owner.accessToken });
    mockSuccessfulGeminiConnection();
    await validateCredential({ accessToken: owner.accessToken });
    await request(app)
      .patch("/api/v1/ai/providers/gemini-direct/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(0))
      .send({ credentialSource: "user-managed", routingProfileVersion: 1 })
      .expect(200);

    const disabled = await request(app)
      .patch("/api/v1/ai/providers/disabled/activate")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1))
      .send({})
      .expect(200);

    expect(disabled.body.data.routing).toMatchObject({
      activeProvider: "disabled",
      credentialSource: "none",
      revision: 2,
    });
    const stored = await AiProviderPreferenceModel.findOne({ userId: owner.userId }).lean();
    expect(stored).not.toHaveProperty("activeCredentialId");
    expect(stored).not.toHaveProperty("activeCredentialSecretVersion");
  });

  it("deletes an owned credential safely and repeated deletion does not expose existence", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-delete@example.com",
      displayName: "AI Delete",
    });
    await createCredential({ accessToken: owner.accessToken });

    const remove = () => request(app)
      .delete("/api/v1/ai/providers/gemini-direct/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(mutationHeaders(1));
    await remove().expect(204);
    await remove().expect(204);

    const raw = await AiCredentialModel.collection.findOne({
      userId: new Types.ObjectId(owner.userId),
    });
    expect(raw).toMatchObject({ state: "deleted" });
    expect(raw).not.toHaveProperty("encryptedSecret");
    expect(raw).not.toHaveProperty("maskedSuffix");
  });

  it("keeps canary secrets out of API, jobs, usage, and audit persistence", async () => {
    const owner = await registerTestUser(app, {
      email: "ai-secret-safety@example.com",
      displayName: "AI Secret Safety",
    });
    const fetchMock = mockSuccessfulGeminiConnection();
    const save = await createCredential({ accessToken: owner.accessToken });
    const tested = await validateCredential({ accessToken: owner.accessToken });

    expect(JSON.stringify([save.body, tested.body])).not.toContain(canaryCredential);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url] of fetchMock.mock.calls as [URL, RequestInit][]) {
      expect(url.toString()).not.toContain(canaryCredential);
      expect(url.searchParams.has("key")).toBe(false);
    }
    for (const collectionValue of [
      await JobRecordModel.find({ userId: owner.userId }).lean(),
      await UsageEventModel.find({ userId: owner.userId }).lean(),
      await SecurityAuditEventModel.find({ subjectUserId: owner.userId }).lean(),
    ]) {
      expect(JSON.stringify(collectionValue)).not.toContain(canaryCredential);
    }
  });
});
