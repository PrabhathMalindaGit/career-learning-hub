import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../../app.js";
import { hashToken } from "../../shared/crypto.js";
import { AuthSessionModel } from "../../modules/auth/authSession.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../modules/auth/token.service.js";
import { UserModel } from "../../modules/users/user.model.js";
import { TEST_PASSWORD } from "../helpers/auth.js";

const TEST_ORIGIN = "http://localhost:5173";
const INVALID_SESSION_ERROR = {
  code: "INVALID_SESSION",
  message: "The session is invalid or expired.",
};

function readRefreshCookie(response: {
  headers: Record<string, unknown>;
}): string {
  const value = response.headers["set-cookie"];
  const header = Array.isArray(value) ? value[0] : value;

  if (typeof header !== "string") {
    throw new Error("Expected a refresh cookie.");
  }

  const cookie = header.split(";")[0];
  if (!cookie) {
    throw new Error("Expected a refresh cookie value.");
  }

  return cookie;
}

function readRefreshToken(cookie: string): string {
  const separatorIndex = cookie.indexOf("=");
  if (separatorIndex === -1) {
    throw new Error("Expected a named refresh cookie.");
  }

  return decodeURIComponent(cookie.slice(separatorIndex + 1));
}

async function registerSession(
  email: string,
  displayName: string,
) {
  await UserModel.create({
    email,
    passwordHash: TEST_PASSWORD,
    profile: { displayName },
  });

  const agent = request.agent(app);
  const response = await agent
    .post("/api/v1/auth/login")
    .set("Origin", TEST_ORIGIN)
    .send({
      email,
      password: TEST_PASSWORD,
    })
    .expect(200);

  return {
    agent,
    accessToken: response.body.data.accessToken as string,
    userId: response.body.data.user.id as string,
    refreshCookie: readRefreshCookie(response),
  };
}

async function loginSession(email: string) {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/v1/auth/login")
    .set("Origin", TEST_ORIGIN)
    .send({
      email,
      password: TEST_PASSWORD,
    })
    .expect(200);

  return {
    agent,
    accessToken: response.body.data.accessToken as string,
    refreshCookie: readRefreshCookie(response),
  };
}

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

  it("rejects an access token after ordinary logout revokes its session", async () => {
    const session = await registerSession(
      "logout-access@example.com",
      "Logout Access",
    );

    await session.agent
      .post("/api/v1/auth/logout")
      .set("Origin", TEST_ORIGIN)
      .expect(204);

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(401);

    expect(response.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );
  });

  it("rejects every access token after logout-all revokes the user's sessions", async () => {
    const first = await registerSession(
      "logout-all@example.com",
      "Logout All",
    );
    const second = await loginSession("logout-all@example.com");

    await first.agent
      .post("/api/v1/users/me/logout-all")
      .set("Origin", TEST_ORIGIN)
      .set("Authorization", `Bearer ${first.accessToken}`)
      .expect(204);

    for (const accessToken of [
      first.accessToken,
      second.accessToken,
    ]) {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.error).toMatchObject(
        INVALID_SESSION_ERROR,
      );
    }
  });

  it("keeps a different active session valid after ordinary logout", async () => {
    const first = await registerSession(
      "parallel-session@example.com",
      "Parallel Session",
    );
    const second = await loginSession(
      "parallel-session@example.com",
    );

    await first.agent
      .post("/api/v1/auth/logout")
      .set("Origin", TEST_ORIGIN)
      .expect(204);

    await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${second.accessToken}`)
      .expect(200);
  });

  it("preserves the password-change cutoff for an otherwise active session", async () => {
    const session = await registerSession(
      "password-cutoff@example.com",
      "Password Cutoff",
    );

    await UserModel.updateOne(
      { _id: session.userId },
      {
        $set: {
          passwordChangedAt: new Date(Date.now() + 1_000),
        },
      },
    );

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: "TOKEN_REVOKED",
      message: "Please sign in again.",
    });
  });

  it("rejects fabricated and expired access-token sessions generically", async () => {
    const session = await registerSession(
      "invalid-access-session@example.com",
      "Invalid Access Session",
    );
    const fabricatedToken = signAccessToken(
      session.userId,
      new Types.ObjectId().toString(),
    );

    const fabricatedResponse = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${fabricatedToken}`)
      .expect(401);

    expect(fabricatedResponse.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );

    const payload = verifyRefreshToken(
      readRefreshToken(session.refreshCookie),
    );
    await AuthSessionModel.updateOne(
      { _id: payload.sid },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );

    const expiredResponse = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(401);

    expect(expiredResponse.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );
  });

  it("atomically allows exactly one concurrent refresh and keeps the winner usable", async () => {
    const session = await registerSession(
      "concurrent-refresh@example.com",
      "Concurrent Refresh",
    );

    const [first, second] = await Promise.all([
      request(app)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_ORIGIN)
        .set("Cookie", session.refreshCookie),
      request(app)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_ORIGIN)
        .set("Cookie", session.refreshCookie),
    ]);

    expect([first.status, second.status].sort()).toEqual([
      200,
      401,
    ]);

    const winner = first.status === 200 ? first : second;
    const loser = first.status === 401 ? first : second;
    const winnerCookie = readRefreshCookie(winner);
    const winnerToken = readRefreshToken(winnerCookie);
    const originalPayload = verifyRefreshToken(
      readRefreshToken(session.refreshCookie),
    );
    const storedSession = await AuthSessionModel.findById(
      originalPayload.sid,
    ).lean();

    expect(winner.body.data.accessToken).toEqual(
      expect.any(String),
    );
    expect(loser.body.data).toBeUndefined();
    expect(loser.headers["set-cookie"]).toBeUndefined();
    expect(loser.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );
    expect(storedSession?.refreshTokenHash).toBe(
      hashToken(winnerToken),
    );
    expect(storedSession?.refreshTokenHash).not.toBe(
      winnerToken,
    );

    const originalReplay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", TEST_ORIGIN)
      .set("Cookie", session.refreshCookie)
      .expect(401);

    expect(originalReplay.body.data).toBeUndefined();
    expect(originalReplay.headers["set-cookie"]).toBeUndefined();
    expect(originalReplay.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );

    const nextRotation = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", TEST_ORIGIN)
      .set("Cookie", winnerCookie)
      .expect(200);

    expect(nextRotation.body.data.accessToken).toEqual(
      expect.any(String),
    );
    expect(readRefreshCookie(nextRotation)).not.toBe(
      winnerCookie,
    );
  });

  it("revokes a session when an old refresh token is replayed after the concurrency grace", async () => {
    const session = await registerSession(
      "stale-refresh@example.com",
      "Stale Refresh",
    );
    const rotation = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", TEST_ORIGIN)
      .set("Cookie", session.refreshCookie)
      .expect(200);
    const nextCookie = readRefreshCookie(rotation);
    const payload = verifyRefreshToken(
      readRefreshToken(session.refreshCookie),
    );

    await AuthSessionModel.updateOne(
      { _id: payload.sid },
      {
        $set: {
          lastUsedAt: new Date(Date.now() - 60_000),
        },
      },
    );

    const staleReplay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", TEST_ORIGIN)
      .set("Cookie", session.refreshCookie)
      .expect(401);

    expect(staleReplay.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );

    const storedSession = await AuthSessionModel.findById(
      payload.sid,
    ).lean();
    expect(storedSession?.revokedAt).toBeInstanceOf(Date);
    expect(storedSession?.revokeReason).toBe(
      "refresh-token-reuse-detected",
    );

    const winnerAfterReplay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", TEST_ORIGIN)
      .set("Cookie", nextCookie)
      .expect(401);

    expect(winnerAfterReplay.body.error).toMatchObject(
      INVALID_SESSION_ERROR,
    );
  });

  it("returns the same generic refresh failure for missing, revoked, and expired sessions", async () => {
    const missing = await registerSession(
      "missing-refresh@example.com",
      "Missing Refresh",
    );
    const revoked = await registerSession(
      "revoked-refresh@example.com",
      "Revoked Refresh",
    );
    const expired = await registerSession(
      "expired-refresh@example.com",
      "Expired Refresh",
    );
    const missingCookieName =
      missing.refreshCookie.slice(
        0,
        missing.refreshCookie.indexOf("=") + 1,
      );
    const missingCookie = `${missingCookieName}${signRefreshToken(
      missing.userId,
      new Types.ObjectId().toString(),
    )}`;
    const revokedPayload = verifyRefreshToken(
      readRefreshToken(revoked.refreshCookie),
    );
    const expiredPayload = verifyRefreshToken(
      readRefreshToken(expired.refreshCookie),
    );

    await AuthSessionModel.updateOne(
      { _id: revokedPayload.sid },
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: "test-revoked",
        },
      },
    );
    await AuthSessionModel.updateOne(
      { _id: expiredPayload.sid },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );

    for (const cookie of [
      missingCookie,
      revoked.refreshCookie,
      expired.refreshCookie,
    ]) {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_ORIGIN)
        .set("Cookie", cookie)
        .expect(401);

      expect(response.body.error).toMatchObject(
        INVALID_SESSION_ERROR,
      );
      expect(response.body.data).toBeUndefined();
      expect(response.headers["set-cookie"]).toBeUndefined();
    }
  });
});
