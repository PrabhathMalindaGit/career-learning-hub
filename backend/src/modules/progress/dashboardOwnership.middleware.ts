import type { RequestHandler } from "express";
import { AppError } from "../../shared/appError.js";

export const requireOwnDashboard: RequestHandler = (
  request,
  response,
  next,
) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Vary", "Authorization, Cookie");
  if (
    !request.auth?.userId ||
    !request.user ||
    request.user._id.toString() !== request.auth.userId
  ) {
    next(
      new AppError(
        403,
        "DASHBOARD_ACCESS_DENIED",
        "Dashboard access is restricted to the authenticated account.",
      ),
    );
    return;
  }

  next();
};
