import { afterEach, describe, expect, it, vi } from "vitest";

const canary = "sk-or-v1-synthetic-canary-never-log";
const models = ["synthetic/model-a", "synthetic/model-b"];

function requestInput(overrides: Record<string, unknown> = {}) {
  return {
    systemPrompt: "Return structured synthetic data.",
    userPrompt: "Use synthetic content only.",
    responseJsonSchema: {
      type: "object",
      properties: { status: { type: "string" } },
      required: ["status"],
      additionalProperties: false,
    },
    models,
    maximumOutputTokens: 512,
    timeoutMs: 5_000,
    signal: new AbortController().signal,
    credential: { read: () => canary },
    ...overrides,
  };
}

function successResponse(overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    id: "gen-synthetic-123",
    model: "synthetic/model-b",
    choices: [{
      message: { role: "assistant", content: '{"status":"ok"}' },
      finish_reason: "stop",
    }],
    usage: {
      prompt_tokens: 12,
      completion_tokens: 4,
      total_tokens: 16,
    },
    ...overrides,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

async function providerModule() {
  return import("../../modules/ai/providers/openRouter.provider.js").catch(() => ({}));
}

describe("OpenRouter free-only provider adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("exports the fixed endpoint adapter contract", async () => {
    const module = await providerModule();
    expect(module).toHaveProperty("OpenRouterProviderAdapter");
    expect(module).toHaveProperty(
      "OPENROUTER_CHAT_COMPLETIONS_ENDPOINT",
      "https://openrouter.ai/api/v1/chat/completions",
    );
  });

  it("sends one fixed non-streaming strict-schema request with exact model order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );

    await new OpenRouterProviderAdapter().generateStructured(requestInput());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${canary}`,
      "Content-Type": "application/json",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      models,
      messages: [
        { role: "system", content: "Return structured synthetic data." },
        { role: "user", content: "Use synthetic content only." },
      ],
      stream: false,
      max_tokens: 512,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "career_learning_hub_response",
          strict: true,
          schema: requestInput().responseJsonSchema,
        },
      },
      provider: { require_parameters: true },
    });
    expect(JSON.stringify(body)).not.toContain("openrouter/auto");
    expect(JSON.stringify(body)).not.toContain("openrouter/free");
    expect(JSON.stringify(body)).not.toContain("plugins");
  });

  it("captures actual model, usage, finish reason, and bounded generation ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse()));
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    const result = await new OpenRouterProviderAdapter()
      .generateStructured(requestInput());

    expect(result).toEqual({
      text: '{"status":"ok"}',
      model: "synthetic/model-b",
      providerRequestId: "gen-synthetic-123",
      finishReason: "stop",
      usage: { inputTokens: 12, outputTokens: 4, totalTokens: 16 },
    });
  });

  it.each([
    [[], "empty candidate list"],
    [["openrouter/auto"], "automatic router"],
    [["openrouter/free"], "random free router"],
    [["https://evil.example/model"], "URL-shaped model"],
    [["synthetic/../model"], "path-traversal model"],
    [["synthetic/model\r\nHeader"], "control-character model"],
  ])("rejects %s before fetch (%s)", async (candidateModels, _label) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    await expect(new OpenRouterProviderAdapter().generateStructured(
      requestInput({ models: candidateModels }),
    )).rejects.toMatchObject({ code: "routing_configuration_invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an actual returned model outside the frozen list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      successResponse({ model: "synthetic/unplanned" }),
    ));
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    await expect(new OpenRouterProviderAdapter().generateStructured(requestInput()))
      .rejects.toMatchObject({ code: "invalid_provider_output", retryable: false });
  });

  it("rejects malformed, empty, and oversized successful output safely", async () => {
    const { OpenRouterProviderAdapter, OPENROUTER_MAX_RESPONSE_BYTES } =
      await import("../../modules/ai/providers/openRouter.provider.js");
    for (const response of [
      new Response("not-json", { status: 200 }),
      successResponse({ choices: [{ message: { content: "" } }] }),
      successResponse({ choices: [{ message: { content: "x".repeat(OPENROUTER_MAX_RESPONSE_BYTES + 1) } }] }),
    ]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      await expect(new OpenRouterProviderAdapter().generateStructured(requestInput()))
        .rejects.toMatchObject({ code: "invalid_provider_output" });
    }
  });

  it.each([
    [400, "invalid_request", false],
    [401, "invalid_credentials", false],
    [402, "quota_exhausted", false],
    [403, "permission_denied", false],
    [404, "model_not_found", false],
    [408, "request_timeout", true],
    [429, "rate_limited", true],
    [500, "unknown_provider_error", true],
    [502, "model_unavailable", true],
    [503, "provider_overloaded", true],
  ])("normalizes HTTP %i to %s", async (status, code, retryable) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { code: status, message: `Bearer ${canary}` } }),
      { status },
    )));
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    const error = await new OpenRouterProviderAdapter()
      .generateStructured(requestInput())
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code, retryable });
    expect(String((error as Error).message)).not.toContain(canary);
    expect(String((error as Error).message)).not.toContain("Bearer");
  });

  it("normalizes a provider error embedded in HTTP 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        code: 429,
        message: "synthetic raw detail",
        metadata: { error_type: "rate_limit_exceeded" },
      },
    }), { status: 200 })));
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    await expect(new OpenRouterProviderAdapter().generateStructured(requestInput()))
      .rejects.toMatchObject({ code: "rate_limited", retryable: true });
  });

  it("normalizes network failure and cancellation without raw details", async () => {
    const { OpenRouterProviderAdapter } = await import(
      "../../modules/ai/providers/openRouter.provider.js"
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(`network ${canary}`)));
    await expect(new OpenRouterProviderAdapter().generateStructured(requestInput()))
      .rejects.toMatchObject({ code: "network_error", retryable: true });

    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("aborted")));
    await expect(new OpenRouterProviderAdapter().generateStructured(
      requestInput({ signal: controller.signal }),
    )).rejects.toMatchObject({ code: "request_timeout", retryable: true });
  });
});
