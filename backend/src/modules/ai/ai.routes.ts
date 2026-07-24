import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  getAiUsageController,
  testStructuredAiController,
} from "./ai.controller.js";

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.get("/usage", asyncHandler(getAiUsageController));
aiRouter.post(
  "/structured-test",
  asyncHandler(testStructuredAiController),
);
