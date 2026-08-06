import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../config/env.js";
import {
  AiProviderError,
  aiProviderFailureClassifications,
  type ProviderTimeoutProfile,
} from "../../modules/ai/providers/provider.types.js";
import {
  composeProviderSignal,
  readProviderResponseBody,
} from "../../modules/ai/providers/providerTimeouts.js";

const timeoutProfile: ProviderTimeoutProfile = {
  connectMs: 40,
  firstResponseMs: 30,
  idleMs: 20,
  totalMs: 100,
};

describe("provider resilience contracts", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("loads range-validated timeout defaults from server configuration", () => {
    expect(env.GEMINI_CONNECT_TIMEOUT_MS).toBe(45_000);
    expect(env.GEMINI_FIRST_RESPONSE_TIMEOUT_MS).toBe(8_000);
    expect(env.GEMINI_IDLE_TIMEOUT_MS).toBe(15_000);
    expect(env.GEMINI_TOTAL_TIMEOUT_MS).toBe(45_000);
    expect(env.AI_JOB_ATTEMPT_TIMEOUT_MS).toBe(60_000);
  });

  it("defines the complete safe provider classification boundary", () => {
    expect(aiProviderFailureClassifications).toEqual([
      "RETRYABLE_RATE_LIMIT",
      "RETRYABLE_PROVIDER_UNAVAILABLE",
      "RETRYABLE_PROVIDER_TIMEOUT",
      "RETRYABLE_NETWORK",
      "NON_RETRYABLE_AUTHENTICATION",
      "NON_RETRYABLE_CONFIGURATION",
      "NON_RETRYABLE_REQUEST",
      "NON_RETRYABLE_CONTENT_POLICY",
      "NON_RETRYABLE_OUTPUT_VALIDATION",
      "CANCELLED",
      "UNKNOWN_PROVIDER_FAILURE",
    ]);
  });

  it.each([
    ["GEMINI_CONNECT_TIMEOUT_MS", "0"],
    ["GEMINI_FIRST_RESPONSE_TIMEOUT_MS", "120001"],
    ["GEMINI_IDLE_TIMEOUT_MS", "0"],
    ["GEMINI_TOTAL_TIMEOUT_MS", "300001"],
    ["AI_JOB_ATTEMPT_TIMEOUT_MS", "600001"],
  ])("rejects an out-of-range %s without exposing its value", async (field, value) => {
    vi.stubEnv(field, value);
    vi.resetModules();

    await expect(import("../../config/env.js")).rejects.toThrow(
      "Environment validation failed.",
    );
  });

  it("rejects timeout phase and job deadline cross-field violations", async () => {
    vi.stubEnv("GEMINI_FIRST_RESPONSE_TIMEOUT_MS", "46000");
    vi.stubEnv("GEMINI_TOTAL_TIMEOUT_MS", "45000");
    vi.stubEnv("AI_JOB_ATTEMPT_TIMEOUT_MS", "59000");
    vi.resetModules();

    await expect(import("../../config/env.js")).rejects.toThrow(
      "Environment validation failed.",
    );
  });

  it.each([
    ["connection", 40],
    ["first_response", 30],
    ["idle", 20],
    ["total", 100],
  ] as const)("classifies a %s timeout and clears its timers", (phase, delay) => {
    vi.useFakeTimers();
    const scope = composeProviderSignal({
      parentSignal: new AbortController().signal,
      timeouts:
        phase === "total"
          ? {
              connectMs: 200,
              firstResponseMs: 200,
              idleMs: 200,
              totalMs: 100,
            }
          : timeoutProfile,
    });

    if (phase === "first_response" || phase === "idle") {
      scope.markResponseHeaders();
    }
    if (phase === "idle") {
      scope.markResponseChunk();
    }
    if (phase === "total") {
      scope.markResponseHeaders();
      scope.markResponseChunk();
    }

    vi.advanceTimersByTime(delay);

    expect(scope.signal.aborted).toBe(true);
    expect(scope.failure()).toMatchObject({
      classification: "RETRYABLE_PROVIDER_TIMEOUT",
      retryable: true,
      timeoutPhase: phase,
    });
    scope.cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("classifies parent cancellation separately from timeouts", () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const scope = composeProviderSignal({
      parentSignal: parent.signal,
      timeouts: timeoutProfile,
    });

    parent.abort();

    expect(scope.signal.aborted).toBe(true);
    expect(scope.failure()).toMatchObject({
      classification: "CANCELLED",
      retryable: false,
      timeoutPhase: undefined,
    });
    scope.cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reads a buffered response through first-response and receiving phases", async () => {
    const phases: string[] = [];
    const scope = composeProviderSignal({
      parentSignal: new AbortController().signal,
      timeouts: timeoutProfile,
    });
    scope.markResponseHeaders();

    await expect(
      readProviderResponseBody(
        new Response('{"answer":"synthetic"}'),
        {
          scope,
          onPhase: (phase) => {
            phases.push(phase);
          },
        },
      ),
    ).resolves.toBe('{"answer":"synthetic"}');

    expect(phases).toEqual([
      "waiting_for_first_response",
      "receiving_response",
    ]);
    scope.cleanup();
  });

  it("keeps normalized provider errors free of raw provider detail", () => {
    const error = new AiProviderError({
      code: "GEMINI_INVALID_REQUEST",
      classification: "NON_RETRYABLE_REQUEST",
      retryable: false,
      statusCode: 400,
      safeMessage: "The AI request could not be processed.",
    });

    expect(error.message).toBe("The AI request could not be processed.");
    expect(JSON.stringify(error)).not.toContain("provider body");
  });
});
