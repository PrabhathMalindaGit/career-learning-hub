import { describe, expect, it } from "vitest";

const observedAt = new Date("2026-08-03T00:00:00.000Z");

function remoteModel(overrides: Record<string, unknown> = {}) {
  return {
    id: "synthetic/model-a",
    canonical_slug: "synthetic/model-a",
    name: "Synthetic A",
    created: 1_700_000_000,
    context_length: 131_072,
    architecture: {
      input_modalities: ["text"],
      output_modalities: ["text"],
      ignored: "excluded",
    },
    top_provider: { max_completion_tokens: 8_192 },
    supported_parameters: [
      "max_tokens",
      "response_format",
      "structured_outputs",
    ],
    pricing: {
      prompt: "0",
      completion: "0.000",
      request: "0",
    },
    ignored: "excluded",
    ...overrides,
  };
}

async function catalogueModule() {
  return import("../../modules/ai/openRouterCatalogue.js").catch(() => ({}));
}

describe("OpenRouter catalogue validation and free-only ranking", () => {
  it("exports the AI-4 catalogue contract", async () => {
    const module = await catalogueModule();
    expect(module).toHaveProperty("parseOpenRouterCatalogue");
    expect(module).toHaveProperty("classifyOpenRouterFreePricing");
    expect(module).toHaveProperty("rankOpenRouterModelsForAction");
    expect(module).toHaveProperty("openRouterActionProfiles");
  });

  it("strictly normalizes a complete response and excludes unknown fields", async () => {
    const { parseOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    const result = parseOpenRouterCatalogue(
      { data: [remoteModel()] },
      { catalogueVersion: 7, observedAt },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      modelId: "synthetic/model-a",
      canonicalSlug: "synthetic/model-a",
      displayName: "Synthetic A",
      contextLength: 131_072,
      maximumOutputTokens: 8_192,
      inputModalities: ["text"],
      outputModalities: ["text"],
      supportedParameters: [
        "max_tokens",
        "response_format",
        "structured_outputs",
      ],
      pricingStrings: {
        prompt: "0",
        completion: "0.000",
        request: "0",
      },
      catalogueVersion: 7,
    });
    expect(result[0]).not.toHaveProperty("ignored");
    expect(result[0]).not.toHaveProperty("architecture.ignored");
  });

  it("accepts safely ignored official root metadata", async () => {
    const { parseOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(() => parseOpenRouterCatalogue({
      data: [remoteModel()],
      total_count: 1,
      links: { next: null },
    }, { catalogueVersion: 1, observedAt })).not.toThrow();
  });

  it.each([
    ["malformed root", null],
    ["unknown root member", { data: [remoteModel()], surprise: true }],
    ["empty response", { data: [] }],
    ["duplicate model IDs", { data: [remoteModel(), remoteModel()] }],
    ["URL-shaped model ID", { data: [remoteModel({ id: "https://evil.example/model" })] }],
    ["path traversal model ID", { data: [remoteModel({ id: "synthetic/../model" })] }],
    ["control character model ID", { data: [remoteModel({ id: "synthetic/model\r\nX" })] }],
    ["oversized model ID", { data: [remoteModel({ id: `synthetic/${"a".repeat(200)}` })] }],
    ["invalid context", { data: [remoteModel({ context_length: -1 })] }],
    ["invalid modality", {
      data: [remoteModel({
        architecture: { input_modalities: ["text", "unknown"], output_modalities: ["text"] },
      })],
    }],
    ["invalid parameter entry", { data: [remoteModel({ supported_parameters: ["response_format\n"] })] }],
    ["malformed pricing", { data: [remoteModel({ pricing: { prompt: "NaN", completion: "0", request: "0" } })] }],
    ["negative pricing", { data: [remoteModel({ pricing: { prompt: "-1", completion: "0", request: "0" } })] }],
    ["undocumented file pricing", { data: [remoteModel({ pricing: { prompt: "0", completion: "0", request: "0", file: "0" } })] }],
    ["oversized text", { data: [remoteModel({ name: "x".repeat(300) })] }],
  ])("rejects %s", async (_label, payload) => {
    const { parseOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(() => parseOpenRouterCatalogue(payload, {
      catalogueVersion: 1,
      observedAt,
    })).toThrow();
  });

  it("rejects an excessive catalogue item count", async () => {
    const { parseOpenRouterCatalogue, OPENROUTER_MAX_CATALOGUE_ITEMS } =
      await import("../../modules/ai/openRouterCatalogue.js");
    expect(() => parseOpenRouterCatalogue(
      { data: Array.from({ length: OPENROUTER_MAX_CATALOGUE_ITEMS + 1 }, (_, index) =>
        remoteModel({ id: `synthetic/model-${index}` })) },
      { catalogueVersion: 1, observedAt },
    )).toThrow();
  });

  it.each([
    ["all required prices are exactly zero", { prompt: "0", completion: "0.000", request: "0" }, true],
    ["one applicable price is non-zero", { prompt: "0", completion: "0.1", request: "0" }, false],
    ["a required price is missing", { prompt: "0", completion: "0" }, false],
    ["a value is unparsable", { prompt: "zero", completion: "0", request: "0" }, false],
    ["a value is negative", { prompt: "-0.1", completion: "0", request: "0" }, false],
    ["a value overflows Decimal128", { prompt: "1e999999", completion: "0", request: "0" }, false],
    ["a :free suffix has a paid price", { prompt: "0", completion: "1", request: "0" }, false],
  ])("classifies %s", async (_label, pricing, eligible) => {
    const { classifyOpenRouterFreePricing } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(classifyOpenRouterFreePricing({
      modelId: "synthetic/model:free",
      pricing,
      applicableDimensions: ["prompt", "completion", "request"],
      pricingObservedAt: observedAt,
      now: observedAt,
    }).eligible).toBe(eligible);
  });

  it("accepts zero authoritative pricing without a :free suffix", async () => {
    const { classifyOpenRouterFreePricing } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(classifyOpenRouterFreePricing({
      modelId: "synthetic/model-paid-sounding",
      pricing: { prompt: "0", completion: "0", request: "0" },
      applicableDimensions: ["prompt", "completion", "request"],
      pricingObservedAt: observedAt,
      now: observedAt,
    }).eligible).toBe(true);
  });

  it("rejects stale pricing and every non-zero optional action dimension", async () => {
    const { classifyOpenRouterFreePricing } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    const stale = classifyOpenRouterFreePricing({
      modelId: "synthetic/model",
      pricing: { prompt: "0", completion: "0", request: "0" },
      applicableDimensions: ["prompt", "completion", "request"],
      pricingObservedAt: observedAt,
      now: new Date(observedAt.getTime() + 25 * 60 * 60 * 1_000),
    });
    expect(stale.eligible).toBe(false);

    for (const dimension of [
      "image",
      "web_search",
      "internal_reasoning",
      "input_cache_read",
      "input_cache_write",
    ] as const) {
      const classified = classifyOpenRouterFreePricing({
        modelId: "synthetic/model",
        pricing: {
          prompt: "0",
          completion: "0",
          request: "0",
          [dimension]: "0.000001",
        },
        applicableDimensions: ["prompt", "completion", "request", dimension],
        pricingObservedAt: observedAt,
        now: observedAt,
      });
      expect(classified.eligible, dimension).toBe(false);
    }
  });

  it.each([
    ["zero long-context override", {
      min_prompt_tokens: 10_000,
      prompt: "0.000",
      completion: "0",
    }, true],
    ["non-zero long-context override within the action ceiling", {
      min_prompt_tokens: 10_000,
      prompt: "0.000001",
    }, false],
    ["non-zero long-context override above the action ceiling", {
      min_prompt_tokens: 57_344,
      prompt: "0.000001",
    }, true],
    ["omitted override prices inherit zero base prices", {
      min_prompt_tokens: 10_000,
      prompt: "0",
    }, true],
    ["all base and override prices are exactly zero", {
      min_prompt_tokens: 10_000,
      prompt: "0.000",
      completion: "0.0",
      request: "0",
      image: "0",
      web_search: "0",
      internal_reasoning: "0",
      input_cache_read: "0",
      input_cache_write: "0",
    }, true],
  ])("classifies %s", async (_label, pricingOverride, eligible) => {
    const { parseOpenRouterCatalogue, rankOpenRouterModelsForAction } =
      await import("../../modules/ai/openRouterCatalogue.js");
    const parsed = parseOpenRouterCatalogue({ data: [remoteModel({
      pricing: {
        prompt: "0",
        completion: "0",
        request: "0",
        overrides: [pricingOverride],
      },
    })] }, { catalogueVersion: 1, observedAt });
    const rank = () => rankOpenRouterModelsForAction({
      action: "resume-analysis",
      models: parsed,
      now: observedAt,
    });
    if (eligible) {
      expect(rank().modelIds).toEqual(["synthetic/model-a"]);
    } else {
      expect(rank).toThrow(/eligible/i);
    }
  });

  it.each([
    ["all complete time windows are zero", [
      { utc_start: 0, utc_end: 1200, prompt: "0" },
      { utc_start: 1200, utc_end: 0, completion: "0" },
    ], true],
    ["one complete time window is non-zero", [
      { utc_start: 0, utc_end: 1200, prompt: "0" },
      { utc_start: 1200, utc_end: 0, completion: "0.000001" },
    ], false],
  ])("classifies %s", async (_label, pricingOverrides, eligible) => {
    const { parseOpenRouterCatalogue, rankOpenRouterModelsForAction } =
      await import("../../modules/ai/openRouterCatalogue.js");
    const parsed = parseOpenRouterCatalogue({ data: [remoteModel({
      pricing: {
        prompt: "0",
        completion: "0",
        request: "0",
        overrides: pricingOverrides,
      },
    })] }, { catalogueVersion: 1, observedAt });
    const rank = () => rankOpenRouterModelsForAction({
      action: "resume-analysis",
      models: parsed,
      now: observedAt,
    });
    if (eligible) {
      expect(rank().modelIds).toEqual(["synthetic/model-a"]);
    } else {
      expect(rank).toThrow(/eligible/i);
    }
  });

  it.each([
    ["unknown override price dimension", { min_prompt_tokens: 1, surcharge: "0" }],
    ["unknown override condition", { region: "us", prompt: "0" }],
    ["negative override price", { min_prompt_tokens: 1, prompt: "-0.1" }],
    ["non-finite override price", { min_prompt_tokens: 1, prompt: "NaN" }],
    ["excessive override price", { min_prompt_tokens: 1, prompt: "1".repeat(81) }],
    ["invalid UTC clock", { utc_start: 1260, utc_end: 1300, prompt: "0" }],
    ["partial UTC condition", { utc_start: 100, prompt: "0" }],
    ["incomplete UTC schedule", { utc_start: 0, utc_end: 1200, prompt: "0" }],
  ])("rejects %s", async (_label, pricingOverride) => {
    const { parseOpenRouterCatalogue } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(() => parseOpenRouterCatalogue({ data: [remoteModel({
      pricing: {
        prompt: "0",
        completion: "0",
        request: "0",
        overrides: [pricingOverride],
      },
    })] }, { catalogueVersion: 1, observedAt })).toThrow();
  });

  it("rejects a :free model with a non-zero applicable override", async () => {
    const { parseOpenRouterCatalogue, rankOpenRouterModelsForAction } =
      await import("../../modules/ai/openRouterCatalogue.js");
    const parsed = parseOpenRouterCatalogue({ data: [remoteModel({
      id: "synthetic/model:free",
      canonical_slug: "synthetic/model:free",
      pricing: {
        prompt: "0",
        completion: "0",
        request: "0",
        overrides: [{ min_prompt_tokens: 1, prompt: "0.000001" }],
      },
    })] }, { catalogueVersion: 1, observedAt });
    expect(() => rankOpenRouterModelsForAction({
      action: "resume-analysis",
      models: parsed,
      now: observedAt,
    })).toThrow(/eligible/i);
  });

  it("defines exactly eleven authorized action profiles without model IDs", async () => {
    const { openRouterActionProfiles } = await import(
      "../../modules/ai/openRouterCatalogue.js"
    );
    expect(Object.keys(openRouterActionProfiles)).toEqual([
      "resume-parse",
      "resume-analysis",
      "resume-rewrite",
      "resume-job-comparison",
      "interview-question-generation",
      "interview-question-explanation",
      "interview-answer-feedback",
      "learning-summary",
      "learning-grounded-chat",
      "flashcard-generation",
      "quiz-generation",
    ]);
    expect(JSON.stringify(openRouterActionProfiles)).not.toMatch(
      /(?:openai|anthropic|google|meta-llama|mistral|deepseek)\//i,
    );
  });

  it("filters hard requirements and ranks deterministically with a stable tie-break", async () => {
    const { parseOpenRouterCatalogue, rankOpenRouterModelsForAction } =
      await import("../../modules/ai/openRouterCatalogue.js");
    const parsed = parseOpenRouterCatalogue({ data: [
      remoteModel({ id: "synthetic/model-z", context_length: 65_536 }),
      remoteModel({ id: "synthetic/model-a", context_length: 65_536 }),
      remoteModel({ id: "synthetic/too-small", context_length: 32_000 }),
      remoteModel({ id: "synthetic/no-schema", supported_parameters: ["max_tokens"] }),
      remoteModel({ id: "synthetic/paid", pricing: { prompt: "0", completion: "0.1", request: "0" } }),
    ] }, { catalogueVersion: 4, observedAt });

    const ranked = rankOpenRouterModelsForAction({
      action: "resume-analysis",
      models: parsed,
      now: observedAt,
      maximumCandidates: 1,
    });
    expect(ranked.modelIds).toEqual(["synthetic/model-a"]);
    expect(ranked.catalogueVersion).toBe(4);
    expect(ranked.rankingPolicyVersion).toBe("openrouter-free-ranking-v2");
  });

  it("fails closed when no eligible free candidate remains", async () => {
    const { parseOpenRouterCatalogue, rankOpenRouterModelsForAction } =
      await import("../../modules/ai/openRouterCatalogue.js");
    const parsed = parseOpenRouterCatalogue(
      { data: [remoteModel({ context_length: 1_024 })] },
      { catalogueVersion: 1, observedAt },
    );
    expect(() => rankOpenRouterModelsForAction({
      action: "resume-parse",
      models: parsed,
      now: observedAt,
    })).toThrow(/eligible/i);
  });

  it("schedules refresh at approximately six hours with bounded jitter", async () => {
    const { nextOpenRouterRefreshDelay } = await import(
      "../../modules/ai/openRouterCatalogue.service.js"
    );
    expect(nextOpenRouterRefreshDelay(() => 0)).toBe(5.4 * 60 * 60 * 1_000);
    expect(nextOpenRouterRefreshDelay(() => 0.5)).toBe(6 * 60 * 60 * 1_000);
    expect(nextOpenRouterRefreshDelay(() => 1)).toBe(6.6 * 60 * 60 * 1_000);
  });
});
