import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import { app } from "../../app.js";

describe("strict CORS allowlist", () => {
  it("allows the configured frontend origin", async () => {
    const response = await request(app)
      .get("/api/v1/health/live")
      .set("Origin", "http://localhost:5173")
      .expect(200);

    expect(
      response.headers["access-control-allow-origin"],
    ).toBe("http://localhost:5173");
    expect(
      response.headers["access-control-allow-credentials"],
    ).toBe("true");
  });

  it("rejects an unlisted browser origin", async () => {
    const response = await request(app)
      .get("/api/v1/health/live")
      .set("Origin", "https://evil.example")
      .expect(403);

    expect(response.body.error.code).toBe(
      "ORIGIN_NOT_ALLOWED",
    );
    expect(response.headers["x-request-id"]).toEqual(
      expect.any(String),
    );
  });

  it("does not reflect arbitrary origins during preflight", async () => {
    const response = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "https://attacker.example")
      .set(
        "Access-Control-Request-Method",
        "POST",
      )
      .expect(403);

    expect(
      response.headers["access-control-allow-origin"],
    ).toBeUndefined();
  });

  it("keeps the public registration rate limit active before validation", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }

    const limited = await request(app)
      .post("/api/v1/auth/register")
      .send({})
      .expect(429);

    expect(limited.body.error).toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
      limiter: "auth-register",
    });
  });
});

const controlledKeys = [
  "NODE_ENV",
  "CLIENT_ORIGINS",
  "API_PUBLIC_ORIGIN",
  "BCRYPT_ROUNDS",
] as const;

const originalEnvironment = Object.fromEntries(
  controlledKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof controlledKeys)[number], string | undefined>;

function restoreEnvironment(): void {
  for (const key of controlledKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function loadEnvironment(
  overrides: Partial<Record<(typeof controlledKeys)[number], string>>,
  removed: readonly (typeof controlledKeys)[number][] = [],
) {
  restoreEnvironment();
  Object.assign(process.env, overrides);
  for (const key of removed) {
    delete process.env[key];
  }
  vi.resetModules();
  return import("../../config/env.js");
}

const productionEnvironment = {
  NODE_ENV: "production",
  BCRYPT_ROUNDS: "12",
  CLIENT_ORIGINS: "https://app.example.test",
  API_PUBLIC_ORIGIN: "https://api.example.test",
} as const;

describe("environment origin validation", () => {
  afterEach(() => {
    restoreEnvironment();
    vi.resetModules();
  });

  it("requires API_PUBLIC_ORIGIN in production", async () => {
    await expect(
      loadEnvironment(productionEnvironment, ["API_PUBLIC_ORIGIN"]),
    ).rejects.toThrow("Environment validation failed.");
  });

  it("requires CLIENT_ORIGINS in production", async () => {
    await expect(
      loadEnvironment(productionEnvironment, ["CLIENT_ORIGINS"]),
    ).rejects.toThrow("Environment validation failed.");
  });

  it.each([
    "http://api.example.test",
    "https://localhost:8000",
    "https://api.localhost:8000",
    "https://127.0.0.1:8000",
    "https://127.8.9.10:8000",
    "https://[::1]:8000",
    "https://[::ffff:127.0.0.1]:8000",
    "not-a-url",
    "https://user:password@api.example.test",
    "https://api.example.test?unsafe=true",
    "https://api.example.test#unsafe",
  ])("rejects unsafe production API_PUBLIC_ORIGIN %s", async (origin) => {
    await expect(
      loadEnvironment({
        ...productionEnvironment,
        API_PUBLIC_ORIGIN: origin,
      }),
    ).rejects.toThrow("Environment validation failed.");
  });

  it.each([
    "http://app.example.test",
    "https://localhost:5173",
    "https://app.localhost:5173",
    "https://127.0.0.1:5173",
    "https://127.8.9.10:5173",
    "https://[::1]:5173",
    "https://[::ffff:127.0.0.1]:5173",
    "not-a-url",
    "https://user:password@app.example.test",
    "https://app.example.test?unsafe=true",
    "https://app.example.test#unsafe",
  ])("rejects unsafe production CLIENT_ORIGINS %s", async (origin) => {
    await expect(
      loadEnvironment({
        ...productionEnvironment,
        CLIENT_ORIGINS: origin,
      }),
    ).rejects.toThrow("Environment validation failed.");
  });

  it("accepts and normalizes explicit HTTPS production origins", async () => {
    const { env } = await loadEnvironment({
      ...productionEnvironment,
      CLIENT_ORIGINS: "https://app.example.test/",
      API_PUBLIC_ORIGIN: "https://api.example.test/",
    });

    expect(env.clientOrigins).toEqual(["https://app.example.test"]);
    expect(env.API_PUBLIC_ORIGIN).toBe("https://api.example.test");
  });

  it.each(["development", "test"] as const)(
    "preserves local defaults in %s",
    async (nodeEnvironment) => {
      const { env } = await loadEnvironment(
        { NODE_ENV: nodeEnvironment },
        ["CLIENT_ORIGINS", "API_PUBLIC_ORIGIN"],
      );

      expect(env.clientOrigins).toEqual(["http://localhost:5173"]);
      expect(env.API_PUBLIC_ORIGIN).toBe("http://localhost:8000");
    },
  );
});
