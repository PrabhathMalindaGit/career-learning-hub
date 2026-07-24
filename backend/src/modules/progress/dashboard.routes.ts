import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { dashboardRateLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  getDashboardOverviewController,
  getProgressSnapshotController,
  listDashboardActivityController,
} from "./dashboard.controller.js";
import { requireOwnDashboard } from "./dashboardOwnership.middleware.js";
import {
  dashboardActivityQuerySchema,
  dashboardOverviewQuerySchema,
} from "./dashboard.schemas.js";

export const dashboardRouter = Router();

dashboardRouter.use(
  authenticate,
  requireOwnDashboard,
  dashboardRateLimiter,
);

dashboardRouter.get(
  "/",
  validate({ query: dashboardOverviewQuerySchema }),
  asyncHandler(getDashboardOverviewController),
);

dashboardRouter.get(
  "/progress",
  validate({ query: dashboardOverviewQuerySchema }),
  asyncHandler(getProgressSnapshotController),
);

dashboardRouter.get(
  "/activity",
  validate({ query: dashboardActivityQuerySchema }),
  asyncHandler(listDashboardActivityController),
);
