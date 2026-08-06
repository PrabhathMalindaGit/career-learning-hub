import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AiCredentialModel } from "../../modules/ai/aiCredential.model.js";
import { generateStructuredOutput } from "../../modules/ai/aiGateway.service.js";
import { refreshOpenRouterCatalogue } from "../../modules/ai/openRouterCatalogue.service.js";
import { AiProviderPreferenceModel } from "../../modules/ai/aiProviderPreference.model.js";
import { ensureAiFoundation } from "../../modules/ai/aiProvider.service.js";
import { authorizeAiJobExecution, compileAiRoutingSnapshot } from "../../modules/ai/aiRouting.service.js";
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

describe("OpenRouter dormant release boundary and catalogue isolation", () => {
  beforeEach(() => {
    env.BYOK_ENCRYPTION_KEY = vaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = true;
  });

  afterEach(() => {
    env.BYOK_ENCRYPTION_KEY = originalVaultKey;
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    vi.unstubAllGlobals();
  });

  it("rejects OpenRouter credential and activation mutations without provider calls", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-owner@example.com");
    const providerFetch = vi.fn();
    vi.stubGlobal("fetch", providerFetch);
    for (const mutation of [
      request(app)
        .put("/api/v1/ai/providers/openrouter/credential")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .set(headers())
        .send({ apiKey: canary, label: "Synthetic OpenRouter" }),
      request(app)
        .post("/api/v1/ai/providers/openrouter/test")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .set(headers())
        .send({ credentialVersion: 1 }),
      request(app)
        .patch("/api/v1/ai/providers/openrouter/activate")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .set(headers(0))
        .send({ credentialSource: "user-managed" }),
    ]) {
      const response = await mutation;
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("provider_not_available");
      expect(JSON.stringify(response.body)).not.toContain(canary);
    }
    expect(providerFetch).not.toHaveBeenCalled();
    await expect(AiCredentialModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
    const listed = await request(app)
      .get("/api/v1/ai/providers")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(listed.body.data.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "openrouter", available: false, configured: false }),
      expect.objectContaining({ id: "gemini-direct", available: true }),
      expect.objectContaining({ id: "openai-direct", available: false }),
      expect.objectContaining({ id: "anthropic-direct", available: false }),
      expect.objectContaining({ id: "deepseek-direct", available: false }),
    ]));
  });

  it("refuses to compile an OpenRouter preference into a new job snapshot", async () => {
    const owner = await testUser("openrouter-snapshot@example.com");
    const { preference } = await ensureAiFoundation(owner.userId);
    await AiProviderPreferenceModel.collection.updateOne(
      { _id: preference._id },
      { $set: {
        activeProvider: "openrouter",
        credentialSource: "user-managed",
        activeCredentialId: new Types.ObjectId(),
        activeCredentialSecretVersion: 1,
      } },
    );

    await expect(compileAiRoutingSnapshot({
      userId: owner.userId,
      action: "resume-analysis",
    })).rejects.toMatchObject({ code: "provider_not_available" });
    await expect(JobRecordModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
  });

  it("rejects direct OpenRouter gateway selection before network I/O", async () => {
    const owner = await testUser("openrouter-gateway@example.com");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateStructuredOutput({
      userId: owner.userId,
      feature: "test.openrouter.gateway",
      systemPrompt: "Return JSON.",
      userPrompt: "Synthetic only.",
      schema: z.object({ answer: z.string() }).strict(),
      provider: "openrouter",
    })).rejects.toMatchObject({ code: "AI_PROVIDER_NOT_FOUND" });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(UsageEventModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
  });

  it("rejects an already queued OpenRouter snapshot before credential resolution", async () => {
    const owner = await testUser("openrouter-stale@example.com");
    const job = await JobRecordModel.create({
      userId: owner.userId,
      type: "resume.analyze",
      payload: {},
      attempts: 1,
      aiRoutingSnapshot: {
        snapshotId: randomUUID(),
        snapshotVersion: 1,
        userId: owner.userId,
        action: "resume-analysis",
        provider: "openrouter",
        mode: "openrouter",
        preferenceRevision: 1,
        routingProfileId: new Types.ObjectId().toString(),
        routingProfileVersion: 1,
        credentialSource: "user-managed",
        credentialId: new Types.ObjectId().toString(),
        credentialSecretVersion: 1,
        rankingPolicyVersion: "openrouter-free-ranking-v2",
        catalogueVersion: 1,
        pricingObservedAt: new Date(),
        freeModelIds: [modelId],
        paidFallbackAllowed: false,
        maximumInputTokens: 32_000,
        maximumOutputTokens: 8_192,
        ttftMs: 8_000,
        streamIdleMs: 15_000,
        totalMs: 45_000,
        executeBefore: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      },
    });

    await expect(authorizeAiJobExecution({ jobId: job._id.toString() }))
      .rejects.toMatchObject({ code: "provider_not_available" });
    await expect(AiCredentialModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
  });

  it("keeps catalogue maintenance isolated from user routing state", async () => {
    await seedCatalogue();
    const owner = await testUser("openrouter-override-stale@example.com");
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
    await expect(AiProviderPreferenceModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
    await expect(AiCredentialModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
    await expect(UsageEventModel.countDocuments({
      userId: owner.userId,
    })).resolves.toBe(0);
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
