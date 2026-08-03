import { afterEach, describe, expect, it, vi } from "vitest";

const controlledKeys = [
  "BYOK_ENCRYPTION_KEY",
  "BYOK_ENCRYPTION_KEY_PREVIOUS",
  "AI_ROUTING_FOUNDATION_ENABLED",
  "AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED",
  "AI_ADMIN_GEMINI_POLICY_VERSION",
] as const;

const originalEnvironment = Object.fromEntries(
  controlledKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof controlledKeys)[number], string | undefined>;

function restoreEnvironment(): void {
  for (const key of controlledKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function loadEnvironment(
  overrides: Partial<Record<(typeof controlledKeys)[number], string>> = {},
) {
  restoreEnvironment();
  Object.assign(process.env, overrides);
  vi.resetModules();
  return import("../../config/env.js");
}

describe("AI vault environment configuration", () => {
  afterEach(() => {
    restoreEnvironment();
    vi.resetModules();
  });

  it("keeps BYOK and routing foundation configuration optional", async () => {
    const { env } = await loadEnvironment();

    expect(env).toMatchObject({
      AI_ROUTING_FOUNDATION_ENABLED: false,
      AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED: false,
      AI_ADMIN_GEMINI_POLICY_VERSION: 1,
    });
    expect(env.BYOK_ENCRYPTION_KEY).toBeUndefined();
    expect(env.BYOK_ENCRYPTION_KEY_PREVIOUS).toBeUndefined();
  });

  it("accepts a valid current and previous BYOK key ring", async () => {
    const current = `v2:${Buffer.alloc(32, 0x22).toString("base64url")}`;
    const previous = `v1:${Buffer.alloc(32, 0x11).toString("base64url")}`;

    const { env } = await loadEnvironment({
      BYOK_ENCRYPTION_KEY: current,
      BYOK_ENCRYPTION_KEY_PREVIOUS: previous,
    });

    expect(env.BYOK_ENCRYPTION_KEY).toBe(current);
    expect(env.BYOK_ENCRYPTION_KEY_PREVIOUS).toBe(previous);
  });

  it("rejects an invalid BYOK key ring during environment parsing", async () => {
    await expect(loadEnvironment({
      BYOK_ENCRYPTION_KEY: `v0:${Buffer.alloc(32).toString("base64url")}`,
    })).rejects.toThrow("Environment validation failed.");
  });

  it("allows foundation metadata without a BYOK key for environment Gemini compatibility", async () => {
    const { env } = await loadEnvironment({
      AI_ROUTING_FOUNDATION_ENABLED: "true",
      AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED: "true",
      AI_ADMIN_GEMINI_POLICY_VERSION: "3",
    });

    expect(env).toMatchObject({
      AI_ROUTING_FOUNDATION_ENABLED: true,
      AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED: true,
      AI_ADMIN_GEMINI_POLICY_VERSION: 3,
    });
    expect(env.BYOK_ENCRYPTION_KEY).toBeUndefined();
  });

  it("rejects administrator Gemini compatibility when the routing foundation is disabled", async () => {
    await expect(loadEnvironment({
      AI_ROUTING_FOUNDATION_ENABLED: "false",
      AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED: "true",
    })).rejects.toThrow("Environment validation failed.");
  });
});
