import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import {
  cancelJobController,
  cancelJobPostController,
  createInfrastructureTestJobController,
  getJobController,
  retryJobController,
} from "./job.controller.js";
import {
  infrastructureTestJobBodySchema,
  jobIdParamsSchema,
} from "./job.schemas.js";

export const jobRouter = Router();

jobRouter.use(authenticate);

jobRouter.post(
  "/infrastructure-test",
  validate({ body: infrastructureTestJobBodySchema }),
  asyncHandler(createInfrastructureTestJobController),
);

jobRouter.get(
  "/:jobId",
  validate({ params: jobIdParamsSchema }),
  asyncHandler(getJobController),
);

jobRouter.post(
  "/:jobId/cancel",
  validate({ params: jobIdParamsSchema }),
  asyncHandler(cancelJobPostController),
);

jobRouter.post(
  "/:jobId/retry",
  validate({ params: jobIdParamsSchema }),
  asyncHandler(retryJobController),
);

jobRouter.delete(
  "/:jobId",
  validate({ params: jobIdParamsSchema }),
  asyncHandler(cancelJobController),
);
