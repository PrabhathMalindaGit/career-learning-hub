import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  createResumeController,
  createVersionController,
  getResumeController,
  getVersionController,
  listResumesController,
  listVersionsController,
  updateDesignController,
} from "./resume.controller.js";
import {
  createResumeBodySchema,
  createVersionBodySchema,
  resumeIdParamsSchema,
  resumeListQuerySchema,
  updateDesignBodySchema,
  versionIdParamsSchema,
} from "./resume.validation.js";

export const resumeRouter = Router();

resumeRouter.use(authenticate);

resumeRouter.post(
  "/",
  validate({ body: createResumeBodySchema }),
  asyncHandler(createResumeController),
);

resumeRouter.get(
  "/",
  validate({ query: resumeListQuerySchema }),
  asyncHandler(listResumesController),
);

resumeRouter.get(
  "/:resumeId",
  validate({ params: resumeIdParamsSchema }),
  asyncHandler(getResumeController),
);

resumeRouter.patch(
  "/:resumeId/design",
  validate({
    params: resumeIdParamsSchema,
    body: updateDesignBodySchema,
  }),
  asyncHandler(updateDesignController),
);

resumeRouter.post(
  "/:resumeId/versions",
  validate({
    params: resumeIdParamsSchema,
    body: createVersionBodySchema,
  }),
  asyncHandler(createVersionController),
);

resumeRouter.get(
  "/:resumeId/versions",
  validate({
    params: resumeIdParamsSchema,
    query: resumeListQuerySchema.pick({ page: true, limit: true }),
  }),
  asyncHandler(listVersionsController),
);

resumeRouter.get(
  "/:resumeId/versions/:versionId",
  validate({ params: versionIdParamsSchema }),
  asyncHandler(getVersionController),
);
