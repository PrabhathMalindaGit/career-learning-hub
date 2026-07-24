import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";
import {
  clearRefreshCookie,
  loginUser,
  refreshSession,
  registerUser,
  revokeSessionByRefreshToken,
  setRefreshCookie,
} from "./auth.service.js";

export async function registerController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await registerUser(
    request.body as RegisterInput,
    request,
  );

  setRefreshCookie(response, result.refreshToken);
  response.status(201).json({
    success: true,
    data: {
      user: result.user.toPublicJSON(),
      accessToken: result.accessToken,
    },
  });
}

export async function loginController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await loginUser(
    request.body as LoginInput,
    request,
  );

  setRefreshCookie(response, result.refreshToken);
  response.status(200).json({
    success: true,
    data: {
      user: result.user.toPublicJSON(),
      accessToken: result.accessToken,
    },
  });
}

export async function refreshController(
  request: Request,
  response: Response,
): Promise<void> {
  const refreshToken = request.cookies?.[env.REFRESH_COOKIE_NAME];

  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new AppError(
      401,
      "REFRESH_TOKEN_REQUIRED",
      "A refresh token is required.",
    );
  }

  const result = await refreshSession(refreshToken, request);
  setRefreshCookie(response, result.refreshToken);

  response.status(200).json({
    success: true,
    data: {
      user: result.user.toPublicJSON(),
      accessToken: result.accessToken,
    },
  });
}

export async function logoutController(
  request: Request,
  response: Response,
): Promise<void> {
  const refreshToken = request.cookies?.[env.REFRESH_COOKIE_NAME];
  await revokeSessionByRefreshToken(
    typeof refreshToken === "string" ? refreshToken : undefined,
  );

  clearRefreshCookie(response);
  response.status(204).send();
}
