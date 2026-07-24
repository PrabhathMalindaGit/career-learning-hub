import { describe, expect, it } from "vitest";
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
});
