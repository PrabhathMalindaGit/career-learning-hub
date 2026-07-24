import type { Request, Response } from "express";
import { AppError } from "../../shared/appError.js";
import { AuthSessionModel } from "../auth/authSession.model.js";
import { clearRefreshCookie } from "../auth/auth.service.js";
import { UserModel } from "./user.model.js";

export async function getCurrentUserController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  response.status(200).json({
    success: true,
    data: {
      user: request.user.toPublicJSON(),
    },
  });
}

export async function updateCurrentUserController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  const profile = request.body as {
    displayName?: string;
    headline?: string;
    timezone?: string;
    locale?: string;
  };

  if (profile.displayName !== undefined) {
    request.user.profile.displayName = profile.displayName;
  }
  if (profile.headline !== undefined) {
    request.user.profile.headline = profile.headline;
  }
  if (profile.timezone !== undefined) {
    request.user.profile.timezone = profile.timezone;
  }
  if (profile.locale !== undefined) {
    request.user.profile.locale = profile.locale;
  }

  await request.user.save();

  response.status(200).json({
    success: true,
    data: {
      user: request.user.toPublicJSON(),
    },
  });
}

export async function changePasswordController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  const { currentPassword, newPassword } = request.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await UserModel.findById(request.auth.userId).select(
    "+passwordHash",
  );

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError(
      401,
      "CURRENT_PASSWORD_INCORRECT",
      "The current password is incorrect.",
    );
  }

  user.passwordHash = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  await AuthSessionModel.updateMany(
    {
      userId: user._id,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: "password-changed",
      },
    },
  );

  clearRefreshCookie(response);
  response.status(204).send();
}

export async function logoutAllSessionsController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
    );
  }

  await AuthSessionModel.updateMany(
    {
      userId: request.auth.userId,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: "logout-all",
      },
    },
  );

  clearRefreshCookie(response);
  response.status(204).send();
}
