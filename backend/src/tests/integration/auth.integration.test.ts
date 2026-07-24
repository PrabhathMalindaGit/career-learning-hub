import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { TEST_PASSWORD } from "../helpers/auth.js";

describe("authentication integration", () => {
  it("reports readiness with security headers and a request ID", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set(
        "x-request-id",
        "integration-health-0001",
      )
      .expect(200);

    expect(response.body.data.status).toBe("ready");
    expect(response.headers["x-request-id"]).toBe(
      "integration-health-0001",
    );
    expect(response.headers["x-content-type-options"]).toBe(
      "nosniff",
    );
    expect(response.headers["cache-control"]).toContain(
      "no-store",
    );
  });

  it("registers, authenticates, refreshes, and returns the current user", async () => {
    const agent = request.agent(app);

    const registration = await agent
      .post("/api/v1/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({
        email: "auth-user@example.com",
        password: TEST_PASSWORD,
        displayName: "Auth User",
      })
      .expect(201);

    expect(
      registration.headers["access-control-allow-origin"],
    ).toBe("http://localhost:5173");
    expect(registration.body.data.accessToken).toEqual(
      expect.any(String),
    );
    expect(registration.body.data.user.email).toBe(
      "auth-user@example.com",
    );

    const current = await agent
      .get("/api/v1/users/me")
      .set(
        "Authorization",
        `Bearer ${registration.body.data.accessToken}`,
      )
      .expect(200);

    expect(current.body.data.user.email).toBe(
      "auth-user@example.com",
    );

    const refreshed = await agent
      .post("/api/v1/auth/refresh")
      .set("Origin", "http://localhost:5173")
      .expect(200);

    expect(refreshed.body.data.accessToken).toEqual(
      expect.any(String),
    );
  });

  it("rejects invalid credentials without exposing password details", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "login-user@example.com",
        password: TEST_PASSWORD,
        displayName: "Login User",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "login-user@example.com",
        password: "WrongPassword1",
      })
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
    });
    expect(JSON.stringify(response.body)).not.toContain(
      "WrongPassword1",
    );
  });
});
