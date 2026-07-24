import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";

type TokenType = "access" | "refresh";

interface SessionTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  type: TokenType;
}

export function signAccessToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { sid: sessionId, type: "access" },
    env.JWT_ACCESS_SECRET,
    {
      subject: userId,
      expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
      jwtid: randomUUID(),
      issuer: "career-learning-hub-api",
      audience: "career-learning-hub-web",
    },
  );
}

export function signRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { sid: sessionId, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    {
      subject: userId,
      expiresIn: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
      jwtid: randomUUID(),
      issuer: "career-learning-hub-api",
      audience: "career-learning-hub-web",
    },
  );
}

function verifyToken(
  token: string,
  secret: string,
  expectedType: TokenType,
): SessionTokenPayload {
  try {
    const payload = jwt.verify(token, secret, {
      issuer: "career-learning-hub-api",
      audience: "career-learning-hub-web",
    });

    if (
      typeof payload === "string" ||
      payload.type !== expectedType ||
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string"
    ) {
      throw new Error("Unexpected token payload.");
    }

    return payload as SessionTokenPayload;
  } catch {
    throw new AppError(
      401,
      "INVALID_TOKEN",
      "The authentication token is invalid or expired.",
    );
  }
}

export function verifyAccessToken(token: string): SessionTokenPayload {
  return verifyToken(token, env.JWT_ACCESS_SECRET, "access");
}

export function verifyRefreshToken(token: string): SessionTokenPayload {
  return verifyToken(token, env.JWT_REFRESH_SECRET, "refresh");
}
