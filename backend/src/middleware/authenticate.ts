import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { AuthSessionModel } from "../modules/auth/authSession.model.js";
import { UserModel } from "../modules/users/user.model.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";
import { AppError } from "../shared/appError.js";
import { asyncHandler } from "../shared/asyncHandler.js";

function invalidSessionError(): AppError {
  return new AppError(
    401,
    "INVALID_SESSION",
    "The session is invalid or expired.",
  );
}

function readBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid Bearer access token is required.",
    );
  }

  return authorization.slice("Bearer ".length).trim();
}

// Features 7.1–7.2 — Authenticated request boundary.
// Resolves the current session/user context used by owner-scoped protected APIs.
export const authenticate: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const token = readBearerToken(request.get("authorization"));
    const payload = verifyAccessToken(token);

    if (
      !Types.ObjectId.isValid(payload.sub) ||
      !Types.ObjectId.isValid(payload.sid)
    ) {
      throw invalidSessionError();
    }

    const now = new Date();
    const [user, session] = await Promise.all([
      UserModel.findOne({
        _id: payload.sub,
        accountStatus: "active",
      }),
      AuthSessionModel.exists({
        _id: payload.sid,
        userId: payload.sub,
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
      }),
    ]);

    if (!user) {
      throw new AppError(
        401,
        "USER_UNAVAILABLE",
        "The user account is unavailable.",
      );
    }

    if (
      user.passwordChangedAt &&
      payload.iat &&
      payload.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      throw new AppError(
        401,
        "TOKEN_REVOKED",
        "Please sign in again.",
      );
    }

    if (!session) {
      throw invalidSessionError();
    }

    request.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
    };
    request.user = user;
    next();
  },
);
