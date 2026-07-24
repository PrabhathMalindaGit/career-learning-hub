import type { Request, Response } from "express";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import {
  createSessionFamilyId,
  hashIpAddress,
  hashToken,
} from "../../shared/crypto.js";
import { UserModel, type UserDocument } from "../users/user.model.js";
import { AuthSessionModel } from "./authSession.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export function setRefreshCookie(response: Response, token: string): void {
  response.cookie(env.REFRESH_COOKIE_NAME, token, refreshCookieOptions);
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

function getRequestMetadata(request: Request) {
  return {
    userAgent: request.get("user-agent")?.slice(0, 500),
    ipAddressHash: hashIpAddress(request.ip),
  };
}

async function createSession(
  user: UserDocument,
  request: Request,
): Promise<{ accessToken: string; refreshToken: string }> {
  const sessionId = new Types.ObjectId();
  const refreshToken = signRefreshToken(
    user._id.toString(),
    sessionId.toString(),
  );

  await AuthSessionModel.create({
    _id: sessionId,
    userId: user._id,
    familyId: createSessionFamilyId(),
    refreshTokenHash: hashToken(refreshToken),
    ...getRequestMetadata(request),
    lastUsedAt: new Date(),
    expiresAt: new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  return {
    accessToken: signAccessToken(
      user._id.toString(),
      sessionId.toString(),
    ),
    refreshToken,
  };
}

export async function registerUser(
  input: RegisterInput,
  request: Request,
) {
  const existing = await UserModel.exists({ email: input.email });
  if (existing) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "An account with that email already exists.",
    );
  }

  const user = await UserModel.create({
    email: input.email,
    passwordHash: input.password,
    profile: {
      displayName: input.displayName,
    },
  });

  const tokens = await createSession(user, request);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput, request: Request) {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash",
  );

  const validPassword =
    user && (await user.comparePassword(input.password));

  if (!user || !validPassword) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  if (user.accountStatus !== "active") {
    throw new AppError(
      403,
      "ACCOUNT_UNAVAILABLE",
      "This account is not available.",
    );
  }

  const tokens = await createSession(user, request);
  return { user, ...tokens };
}

export async function refreshSession(
  refreshToken: string,
  request: Request,
) {
  const payload = verifyRefreshToken(refreshToken);
  const session = await AuthSessionModel.findById(payload.sid);

  if (!session || session.userId.toString() !== payload.sub) {
    throw new AppError(
      401,
      "INVALID_SESSION",
      "The session is invalid or expired.",
    );
  }

  const suppliedHash = hashToken(refreshToken);
  const tokenWasReused = session.refreshTokenHash !== suppliedHash;

  if (tokenWasReused) {
    session.revokedAt = new Date();
    session.revokeReason = "refresh-token-reuse-detected";
    await session.save();

    throw new AppError(
      401,
      "SESSION_REVOKED",
      "The session has been revoked.",
    );
  }

  if (
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      401,
      "INVALID_SESSION",
      "The session is invalid or expired.",
    );
  }

  const user = await UserModel.findOne({
    _id: payload.sub,
    accountStatus: "active",
  });

  if (!user) {
    session.revokedAt = new Date();
    session.revokeReason = "user-unavailable";
    await session.save();

    throw new AppError(
      401,
      "USER_UNAVAILABLE",
      "The user account is unavailable.",
    );
  }

  const nextRefreshToken = signRefreshToken(
    user._id.toString(),
    session._id.toString(),
  );

  session.refreshTokenHash = hashToken(nextRefreshToken);
  session.lastUsedAt = new Date();
  session.userAgent = request.get("user-agent")?.slice(0, 500);
  session.ipAddressHash = hashIpAddress(request.ip);
  await session.save();

  return {
    user,
    refreshToken: nextRefreshToken,
    accessToken: signAccessToken(
      user._id.toString(),
      session._id.toString(),
    ),
  };
}

export async function revokeSessionByRefreshToken(
  refreshToken: string | undefined,
): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await AuthSessionModel.updateOne(
      {
        _id: payload.sid,
        userId: payload.sub,
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: "logout",
        },
      },
    );
  } catch {
    // Logout remains idempotent and does not disclose token validity.
  }
}
