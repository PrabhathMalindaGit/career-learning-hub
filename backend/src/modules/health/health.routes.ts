import { Router } from "express";
import { healthRateLimiter } from "../../middleware/rateLimit.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  getLivenessController,
  getReadinessController,
} from "./health.controller.js";

export const healthRouter = Router();

healthRouter.use(healthRateLimiter);
healthRouter.get("/", asyncHandler(getReadinessController));
healthRouter.get("/ready", asyncHandler(getReadinessController));
healthRouter.get("/live", getLivenessController);
