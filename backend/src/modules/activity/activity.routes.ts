import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { listActivityController } from "./activity.controller.js";
import { activityListQuerySchema } from "./activity.schemas.js";

export const activityRouter = Router();

activityRouter.use(authenticate);
activityRouter.get(
  "/",
  validate({ query: activityListQuerySchema }),
  asyncHandler(listActivityController),
);
