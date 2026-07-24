import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import {
  cancelJobController,
  createInfrastructureTestJobController,
  getJobController,
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

jobRouter.delete(
  "/:jobId",
  validate({ params: jobIdParamsSchema }),
  asyncHandler(cancelJobController),
);
