import { Types } from "mongoose";
import { beforeAll, describe, expect, it, vi } from "vitest";

const observedAt = new Date("2026-08-03T00:00:00.000Z");

function model(id = "synthetic/model-a", overrides: Record<string, unknown> = {}) {
  return {
    id,
    canonical_slug: id,
    name: id,
    created: 1_700_000_000,
    context_length: 131_072,
    architecture: {
      input_modalities: ["text"],
      output_modalities: ["text"],
    },
    top_provider: { max_completion_tokens: 8_192 },
    supported_parameters: ["max_tokens", "response_format", "structured_outputs"],
    pricing: { prompt: "0", completion: "0", request: "0" },
    ...overrides,
  };
}

function catalogueResponse(data: unknown[], root: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ data, ...root }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

interface CatalogueModels {
  OpenRouterModelCatalogueModel?: typeof import("mongoose").Model;
  OpenRouterCatalogueStateModel?: typeof import("mongoose").Model;
}

let models: CatalogueModels = {};

describe("OpenRouter last-valid catalogue refresh", () => {
  beforeAll(async () => {
    models = await import("../../modules/ai/openRouterCatalogue.model.js")
      .catch(() => ({}));
  });

  it("exports normalized catalogue/state models with required indexes", async () => {
    expect(models.OpenRouterModelCatalogueModel).toBeDefined();
    expect(models.OpenRouterCatalogueStateModel).toBeDefined();
    if (!models.OpenRouterModelCatalogueModel || !models.OpenRouterCatalogueStateModel) return;
    await Promise.all([
      models.OpenRouterModelCatalogueModel.init(),
      models.OpenRouterCatalogueStateModel.init(),
    ]);
    const modelIndexes = await models.OpenRouterModelCatalogueModel.collection.indexes();
    const stateIndexes = await models.OpenRouterCatalogueStateModel.collection.indexes();
    expect(modelIndexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "openrouter_model_id_unique", unique: true }),
      expect.objectContaining({ name: "openrouter_catalogue_version_model" }),
      expect.objectContaining({ name: "openrouter_free_structured_text" }),
      expect.objectContaining({ name: "openrouter_missing_disabled" }),
    ]));
    expect(stateIndexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "openrouter_refresh_lease" }),
    ]));
  });

  it("performs an initial valid refresh and atomically advances the version", async () => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    const result = await refreshOpenRouterCatalogue({
      ownerId: "test-worker-a",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([
        model("synthetic/model-b"),
        model("synthetic/model-a"),
      ])),
    });
    expect(result).toMatchObject({ status: "refreshed", catalogueVersion: 1, itemCount: 2 });

    await expect(models.OpenRouterCatalogueStateModel?.findById("openrouter").lean())
      .resolves.toMatchObject({
        currentVersion: 1,
        itemCount: 2,
        freshness: "fresh",
        lastSuccessAt: observedAt,
      });
    await expect(models.OpenRouterModelCatalogueModel?.countDocuments({ catalogueVersion: 1 }))
      .resolves.toBe(2);
  });

  it("accepts official root metadata without following pagination links", async () => {
    const { OPENROUTER_MODELS_ENDPOINT, refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    const fetchImpl = vi.fn().mockResolvedValue(catalogueResponse([model()], {
      total_count: 1,
      links: { next: "https://untrusted.example/models?offset=1" },
    }));
    await expect(refreshOpenRouterCatalogue({
      ownerId: "root-metadata",
      now: observedAt,
      fetchImpl,
    })).resolves.toMatchObject({ status: "refreshed", catalogueVersion: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(OPENROUTER_MODELS_ENDPOINT);
    expect(fetchImpl.mock.calls[0]?.[1]).not.toHaveProperty("headers.Authorization");
  });

  it.each([
    ["failed", vi.fn().mockRejectedValue(new Error("raw secret detail"))],
    ["empty", vi.fn().mockResolvedValue(catalogueResponse([]))],
    ["malformed", vi.fn().mockResolvedValue(new Response('{"data":"bad"}', { status: 200 }))],
  ])("preserves the last valid catalogue after a %s refresh", async (_label, fetchImpl) => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    await refreshOpenRouterCatalogue({
      ownerId: "seed-worker",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([model()])),
    });
    const result = await refreshOpenRouterCatalogue({
      ownerId: "failed-worker",
      now: new Date(observedAt.getTime() + 1_000),
      fetchImpl,
    });
    expect(result).toMatchObject({ status: "failed", catalogueVersion: 1 });
    await expect(models.OpenRouterModelCatalogueModel?.countDocuments()).resolves.toBe(1);
    const state = await models.OpenRouterCatalogueStateModel?.findById("openrouter").lean();
    expect(state).toMatchObject({ currentVersion: 1, itemCount: 1, freshness: "stale" });
    expect(JSON.stringify(state)).not.toContain("raw secret detail");
  });

  it("preserves the last valid catalogue after a malformed override array", async () => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    await refreshOpenRouterCatalogue({
      ownerId: "override-seed",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([model()])),
    });
    const result = await refreshOpenRouterCatalogue({
      ownerId: "override-malformed",
      now: new Date(observedAt.getTime() + 1_000),
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([model(
        "synthetic/model-paid",
        { pricing: { prompt: "0", completion: "0", request: "0", overrides: "bad" } },
      )])),
    });
    expect(result).toMatchObject({ status: "failed", catalogueVersion: 1 });
    await expect(models.OpenRouterModelCatalogueModel?.countDocuments())
      .resolves.toBe(1);
    await expect(models.OpenRouterModelCatalogueModel?.findOne().lean())
      .resolves.toMatchObject({ modelId: "synthetic/model-a", catalogueVersion: 1 });
  });

  it("persists exact override evidence with its catalogue version", async () => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    const result = await refreshOpenRouterCatalogue({
      ownerId: "override-evidence",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([model(
        "synthetic/model-a",
        { pricing: {
          prompt: "0",
          completion: "0",
          request: "0",
          overrides: [{ min_prompt_tokens: 10_000, prompt: "0.000", completion: "0" }],
        } },
      )])),
    });
    expect(result).toMatchObject({ status: "refreshed", catalogueVersion: 1 });
    const stored = await models.OpenRouterModelCatalogueModel?.findOne().lean();
    expect(stored).toMatchObject({
      catalogueVersion: 1,
      pricingOverrides: [{
        minPromptTokens: 10_000,
        pricingStrings: { prompt: "0.000", completion: "0" },
      }],
    });
    const overrideEvidence = (stored as unknown as {
      pricingOverrides?: Array<{
        pricingDecimals?: { prompt?: { toString(): string } };
      }>;
    } | null)?.pricingOverrides?.[0];
    expect(overrideEvidence?.pricingDecimals?.prompt?.toString()).toBe("0.000");
  });

  it("leaves OpenRouter unavailable when the first refresh fails", async () => {
    const { refreshOpenRouterCatalogue, getOpenRouterCatalogueStatus } =
      await import("../../modules/ai/openRouterCatalogue.service.js");
    await expect(refreshOpenRouterCatalogue({
      ownerId: "first-failure",
      now: observedAt,
      fetchImpl: vi.fn().mockRejectedValue(new Error("synthetic")),
    })).resolves.toMatchObject({ status: "failed", catalogueVersion: 0 });
    await expect(getOpenRouterCatalogueStatus(observedAt)).resolves.toMatchObject({
      available: false,
      freshness: "unavailable",
      catalogueVersion: 0,
    });
  });

  it("allows one concurrent refresh lease winner", async () => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    let release!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => { release = resolve; });
    const first = refreshOpenRouterCatalogue({
      ownerId: "lease-winner",
      now: observedAt,
      fetchImpl: vi.fn().mockReturnValue(pending),
    });
    await vi.waitFor(async () => {
      const state = await models.OpenRouterCatalogueStateModel?.findById("openrouter").lean();
      expect(state).toMatchObject({ refreshLeaseOwner: "lease-winner" });
    });
    const second = await refreshOpenRouterCatalogue({
      ownerId: "lease-loser",
      now: observedAt,
      fetchImpl: vi.fn(),
    });
    expect(second).toMatchObject({ status: "lease-held" });
    release(catalogueResponse([model()]));
    await expect(first).resolves.toMatchObject({ status: "refreshed" });
  });

  it("recovers an expired refresh lease", async () => {
    const { refreshOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    await models.OpenRouterCatalogueStateModel?.create({
      _id: "openrouter",
      currentVersion: 0,
      itemCount: 0,
      freshness: "unavailable",
      refreshLeaseOwner: "dead-worker",
      refreshLeaseExpiresAt: new Date(observedAt.getTime() - 1),
    });
    await expect(refreshOpenRouterCatalogue({
      ownerId: "recovery-worker",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([model()])),
    })).resolves.toMatchObject({ status: "refreshed", catalogueVersion: 1 });
  });

  it("marks ordinary missing models with grace and preserves hard disable", async () => {
    const {
      hardDisableOpenRouterModel,
      refreshOpenRouterCatalogue,
    } = await import("../../modules/ai/openRouterCatalogue.service.js");
    await refreshOpenRouterCatalogue({
      ownerId: "seed",
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([
        model("synthetic/model-a"),
        model("synthetic/model-b"),
      ])),
    });
    await hardDisableOpenRouterModel({
      modelId: "synthetic/model-a",
      reason: "security_policy",
      now: new Date(observedAt.getTime() + 100),
    });
    await refreshOpenRouterCatalogue({
      ownerId: "next",
      now: new Date(observedAt.getTime() + 1_000),
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([
        model("synthetic/model-a"),
      ])),
    });
    const hardDisabled = await models.OpenRouterModelCatalogueModel
      ?.findOne({ modelId: "synthetic/model-a" }).lean();
    const missing = await models.OpenRouterModelCatalogueModel
      ?.findOne({ modelId: "synthetic/model-b" }).lean();
    expect(hardDisabled).toMatchObject({ disableReason: "security_policy" });
    expect(hardDisabled).toHaveProperty("disabledAt");
    expect(missing).toHaveProperty("missingSince");
    expect(missing).not.toHaveProperty("disabledAt");
  });

  it("returns a deterministic action plan from persisted free models", async () => {
    const { getOpenRouterActionPlan, refreshOpenRouterCatalogue } =
      await import("../../modules/ai/openRouterCatalogue.service.js");
    await refreshOpenRouterCatalogue({
      ownerId: new Types.ObjectId().toString(),
      now: observedAt,
      fetchImpl: vi.fn().mockResolvedValue(catalogueResponse([
        model("synthetic/model-z", { context_length: 65_536 }),
        model("synthetic/model-a", { context_length: 65_536 }),
      ])),
    });
    await expect(getOpenRouterActionPlan({
      action: "resume-analysis",
      now: observedAt,
      maximumCandidates: 2,
    })).resolves.toMatchObject({
      modelIds: ["synthetic/model-a", "synthetic/model-z"],
      catalogueVersion: 1,
      paidFallbackAllowed: false,
    });
  });
});
