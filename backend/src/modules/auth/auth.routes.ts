import { Router } from "express";
import {
  loginRateLimiter,
  refreshRateLimiter,
  registrationRateLimiter,
} from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import {
  loginBodySchema,
  registerBodySchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  registrationRateLimiter,
  validate({ body: registerBodySchema }),
  asyncHandler(registerController),
);

authRouter.post(
  "/login",
  loginRateLimiter,
  validate({ body: loginBodySchema }),
  asyncHandler(loginController),
);

authRouter.post(
  "/refresh",
  refreshRateLimiter,
  asyncHandler(refreshController),
);

authRouter.post("/logout", asyncHandler(logoutController));
