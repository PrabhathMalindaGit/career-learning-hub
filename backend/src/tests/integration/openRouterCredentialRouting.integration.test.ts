import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import { AiCredentialModel } from "../../modules/ai/aiCredential.model.js";
import { generateStructuredOutput } from "../../modules/ai/aiGateway.service.js";
import { hardDisableOpenRouterModel, refreshOpenRouterCatalogue } from "../../modules/ai/openRouterCatalogue.service.js";
import { AiProviderPreferenceModel } from "../../modules/ai/aiProviderPreference.model.js";
import { authorizeAiJobExecution, compileAiRoutingSnapshot } from "../../modules/ai/aiRouting.service.js";
import { AiRoutingProfileModel } from "../../modules/ai/aiRoutingProfile.model.js";
import { UsageEventModel } from "../../modules/ai/usageEvent.model.js";
import { AuthSessionModel } from "../../modules/auth/authSession.model.js";
import { signAccessToken, signRefreshToken } from "../../modules/auth/token.service.js";
import { UserModel } from "../../modules/users/user.model.js";
import { createSessionFamilyId, hashToken } from "../../shared/crypto.js";

const origin = "http://localhost:5173";
const vaultKey = `v12:${Buffer.alloc(32, 0x52).toString("base64url")}`;
const canary = "sk-or-v1-synthetic-openrouter-canary";
const modelId = "synthetic/model-a";
const originalVaultKey = env.BYOK_ENCRYPTION_KEY;
const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;

function catalogueResponse(pricing: Record<string, unknown> = {
  prompt: "0",
  completion: "0",
  request: "0",
}) {
  return new Response(JSON.stringify({ data: [{
    id: modelId,
    canonical_slug: modelId,
    name: "Synthetic Free Model",
    created: 1_700_000_000,
    context_length: 131_072,
    architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    top_provider: { max_completion_tokens: 8_192 },
    supported_parameters: ["max_tokens", "response_format", "structured_outputs"],
    pricing,
  }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function completionResponse(content = '{"status":"ok"}') {
  return new Response(JSON.stringify({
    id: "gen-safe-123",
    model: modelId,
    choices: [{ message: { content }, finish_reason: "stop" }],
    usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

async function testUser(email: string, roles: Array<"user" | "admin"> = ["user"]) {
  const sessionId = new Types.ObjectId();
  const user = await UserModel.create({
    email,
    passwordHash: "SyntheticPassword1",
    profile: { displayName: "OpenRouter Test" },
    roles,
    accountStatus: "active",
  });
  const refreshToken = signRefreshToken(user._id.toString(), sessionId.toString());
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
    userId: user._id.toString(),
    accessToken: signAccessToken(user._id.toString(), sessionId.toString()),
  };
}

function headers(revision?: number) {
  return {
    Origin: origin,
    "Idempotency-Key": randomUUID(),
    ...(revision === undefined ? {} : { "If-Match": `"${revision}"` }),
  };
}

async function seedCatalogue() {
  await refreshOpenRouterCatalogue({
    ownerId: "credential-routing-seed",
    fetchImpl: vi.fn().mockResolvedValue(catalogueResponse()),
  });
}

async function configureOpenRouter(accessToken: string) {
  const saved = await request(app)
    .put("/api/v1/ai/providers/openrouter/credential")
    .set("Authorization", `Bearer ${accessToken}`)
    .set(headers())
    .send({ apiKey: canary, label: "Synthetic OpenRouter" })
    .expect(201);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(completionResponse()));
  const tested = await request(app)
    .post("/api/v1/ai/providers/openrouter/test")
    .set("Authorization", `Bearer ${accessToken}`)
    .set(headers())
    .send({ credentialVersion: 1 })
    .expect(200);
  const activated = await request(app)
    .patch("/api/v1/ai/providers/openrouter/activate")
    .set("Authorization", `Bearer ${accessToken}`)
    .set(headers(0))
    .send({ credentialSource: "user-managed" })
    .expect(200);
  return { saved, tested, activated };
}

describe("OpenRouter credential, routing, and models APIs", () => {
  beforeEach(() => {
    env.BYOK_ENCRYPTION_KEY = vaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = true;
  });

  afterEach(() => {
    env.BYOK_ENCRYPTION_KEY = originalVaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    vi.unstubAllGlobals();
  });

  it("supports owner save/test/activate without returning the key or enabling direct providers", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-owner@example.com");
    const { saved, tested, activated } = await configureOpenRouter(owner.accessToken);

    expect(JSON.stringify([saved.body, tested.body, activated.body])).not.toContain(canary);
    expect(activated.body.data.routing).toMatchObject({
      activeProvider: "openrouter",
      credentialSource: "user-managed",
      revision: 1,
    });
    const listed = await request(app)
      .get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(listed.body.data.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "openrouter", available: true, configured: true }),
      expect.objectContaining({ id: "gemini-direct", available: true }),
      expect.objectContaining({ id: "openai-direct", available: false }),
      expect.objectContaining({ id: "anthropic-direct", available: false }),
      expect.objectContaining({ id: "deepseek-direct", available: false }),
    ]));
  });

  it("freezes an OpenRouter action plan in an immutable secret-free snapshot", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-snapshot@example.com");
    await configureOpenRouter(owner.accessToken);
    const snapshot = await compileAiRoutingSnapshot({
      userId: owner.userId,
      action: "resume-analysis",
    });
    expect(snapshot).toMatchObject({
      provider: "openrouter",
      mode: "openrouter",
      rankingPolicyVersion: "openrouter-free-ranking-v2",
      catalogueVersion: 1,
      freeModelIds: [modelId],
      paidFallbackAllowed: false,
      maximumOutputTokens: 8_192,
    });
    expect(snapshot).not.toHaveProperty("paidModelId");
    expect(JSON.stringify(snapshot)).not.toContain(canary);
    expect(JSON.stringify(snapshot)).not.toContain("ciphertext");
    const profile = await AiRoutingProfileModel.findOne({
      userId: owner.userId,
      status: "active",
    }).lean();
    expect(profile?.openRouterActions).toHaveLength(11);
  });

  it("routes an authorized job only to OpenRouter and records actual usage metadata", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-gateway@example.com");
    await configureOpenRouter(owner.accessToken);
    const job = await enqueueJob({
      type: "resume.analyze",
      payload: { synthetic: true },
      userId: owner.userId,
    });
    const fetchMock = vi.fn().mockResolvedValue(completionResponse('{"answer":"valid"}'));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateStructuredOutput({
      userId: owner.userId,
      feature: "test.openrouter.gateway",
      systemPrompt: "Return JSON.",
      userPrompt: "Synthetic only.",
      schema: z.object({ answer: z.string() }).strict(),
      jobId: job._id.toString(),
    })).resolves.toEqual({ answer: "valid" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
    const usage = await UsageEventModel.findOne({ userId: owner.userId }).lean();
    expect(usage).toMatchObject({
      provider: "openrouter",
      model: modelId,
      metadata: {
        catalogueVersion: 1,
        rankingPolicyVersion: "openrouter-free-ranking-v2",
        actualModel: modelId,
        freeTier: true,
      },
    });
  });

  it("rejects hard-disabled, provider-switched, and replaced-credential snapshots before fetch", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-stale@example.com");
    const configured = await configureOpenRouter(owner.accessToken);
    const first = await enqueueJob({ type: "resume.analyze", payload: {}, userId: owner.userId });
    await hardDisableOpenRouterModel({ modelId, reason: "security_policy" });
    await expect(authorizeAiJobExecution({ jobId: first._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(fetchMock).not.toHaveBeenCalled();

    const credentialRevision = configured.tested.body.data.credential.revision;
    await request(app)
      .put("/api/v1/ai/providers/openrouter/credential")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(headers(credentialRevision))
      .send({ apiKey: `${canary}-replacement` })
      .expect(200);
    expect(await AiCredentialModel.findOne({ userId: owner.userId }).lean())
      .toMatchObject({ secretVersion: 2 });

    await AiProviderPreferenceModel.updateOne(
      { userId: owner.userId },
      {
        $set: { activeProvider: "disabled", credentialSource: "none" },
        $unset: { activeCredentialId: 1, activeCredentialSecretVersion: 1 },
        $inc: { revision: 1 },
      },
    );
    await expect(authorizeAiJobExecution({ jobId: first._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a queued model that gains an applicable paid override before provider execution", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-override-stale@example.com");
    await configureOpenRouter(owner.accessToken);
    const job = await enqueueJob({
      type: "resume.analyze",
      payload: {},
      userId: owner.userId,
    });
    await expect(refreshOpenRouterCatalogue({
      ownerId: "paid-override-refresh",
      now: new Date(Date.now() + 1_000),
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse({
        prompt: "0",
        completion: "0",
        request: "0",
        overrides: [{ min_prompt_tokens: 1, prompt: "0.000001" }],
      })),
    })).resolves.toMatchObject({ status: "refreshed", catalogueVersion: 2 });

    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);
    await expect(authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "stale_routing_snapshot" });
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it("returns safe action models and restricts manual refresh to administrators", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-models-user@example.com");
    const admin = await testUser("openrouter-models-admin@example.com", ["user", "admin"]);
    const listed = await request(app)
      .get("/api/v1/ai/models?provider=openrouter&action=resume-analysis")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(listed.body.data).toMatchObject({
      provider: "openrouter",
      action: "resume-analysis",
      freshness: "fresh",
      catalogueVersion: 1,
      models: [expect.objectContaining({ id: modelId, contextLength: 131_072 })],
    });
    expect(JSON.stringify(listed.body)).not.toContain("pricing");

    await request(app)
      .post("/api/v1/ai/models/refresh")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set(headers())
      .send({ provider: "openrouter" })
      .expect(403);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(catalogueResponse()));
    const refreshed = await request(app)
      .post("/api/v1/ai/models/refresh")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set(headers())
      .send({ provider: "openrouter" })
      .expect(200);
    expect(refreshed.body.data.refresh).toMatchObject({
      status: "refreshed",
      catalogueVersion: 2,
    });
  });
});
