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

const REFRESH_REUSE_CONCURRENCY_GRACE_MS = 5_000;

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

function invalidSessionError(): AppError {
  return new AppError(
    401,
    "INVALID_SESSION",
    "The session is invalid or expired.",
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11_000
  );
}

function registrationFailedError(): AppError {
  return new AppError(
    400,
    "REGISTRATION_FAILED",
    "Registration could not be completed. Check the details or sign in if you already have an account.",
  );
}

export async function registerUser(
  input: RegisterInput,
  request: Request,
) {
  let user: UserDocument;
  try {
    user = await UserModel.create({
      email: input.email,
      passwordHash: input.password,
      profile: {
        displayName: input.displayName,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw registrationFailedError();
    }
    throw error;
  }

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
  const suppliedHash = hashToken(refreshToken);
  const user = await UserModel.findOne({
    _id: payload.sub,
    accountStatus: "active",
  });

  if (!user) {
    await AuthSessionModel.updateOne(
      {
        _id: payload.sid,
        userId: payload.sub,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: "user-unavailable",
        },
      },
    );

    throw new AppError(
      401,
      "USER_UNAVAILABLE",
      "The user account is unavailable.",
    );
  }

  const nextRefreshToken = signRefreshToken(
    user._id.toString(),
    payload.sid,
  );
  const rotatedAt = new Date();
  const session = await AuthSessionModel.findOneAndUpdate(
    {
      _id: payload.sid,
      userId: payload.sub,
      refreshTokenHash: suppliedHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: rotatedAt },
    },
    {
      $set: {
        refreshTokenHash: hashToken(nextRefreshToken),
        lastUsedAt: rotatedAt,
        userAgent: request.get("user-agent")?.slice(0, 500),
        ipAddressHash: hashIpAddress(request.ip),
      },
    },
    {
      new: true,
    },
  );

  if (!session) {
    const currentSession = await AuthSessionModel.findOne({
      _id: payload.sid,
      userId: payload.sub,
    })
      .select(
        "refreshTokenHash lastUsedAt revokedAt expiresAt",
      )
      .lean();

    if (
      currentSession &&
      !currentSession.revokedAt &&
      currentSession.expiresAt.getTime() > rotatedAt.getTime() &&
      currentSession.refreshTokenHash !== suppliedHash
    ) {
      const staleBefore = new Date(
        rotatedAt.getTime() -
          REFRESH_REUSE_CONCURRENCY_GRACE_MS,
      );

      if (currentSession.lastUsedAt <= staleBefore) {
        await AuthSessionModel.updateOne(
          {
            _id: payload.sid,
            userId: payload.sub,
            refreshTokenHash:
              currentSession.refreshTokenHash,
            lastUsedAt: currentSession.lastUsedAt,
            revokedAt: { $exists: false },
            expiresAt: { $gt: rotatedAt },
          },
          {
            $set: {
              revokedAt: rotatedAt,
              revokeReason:
                "refresh-token-reuse-detected",
            },
          },
        );
      }
    }

    throw invalidSessionError();
  }

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
