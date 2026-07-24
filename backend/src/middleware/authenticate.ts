import type { RequestHandler } from "express";
import { UserModel } from "../modules/users/user.model.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";
import { AppError } from "../shared/appError.js";
import { asyncHandler } from "../shared/asyncHandler.js";

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

export const authenticate: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const token = readBearerToken(request.get("authorization"));
    const payload = verifyAccessToken(token);

    const user = await UserModel.findOne({
      _id: payload.sub,
      accountStatus: "active",
    });

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

    request.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
    };
    request.user = user;
    next();
  },
);
