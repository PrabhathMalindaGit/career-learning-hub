import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/authenticate.js";
import { resumePhotoRateLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  createResumeController,
  createVersionController,
  deleteResumeController,
  getCandidatePhotoSourceController,
  getResumeController,
  getVersionController,
  listResumesController,
  listVersionsController,
  removeCandidatePhotoController,
  updateDesignController,
  uploadCandidatePhotoController,
} from "./resume.controller.js";
import {
  candidatePhotoMutationBodySchema,
  candidatePhotoUploadBodySchema,
  createResumeBodySchema,
  createVersionBodySchema,
  resumeIdParamsSchema,
  resumeListQuerySchema,
  updateDesignBodySchema,
  versionIdParamsSchema,
} from "./resume.validation.js";

const candidatePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024,
    fields: 5,
  },
});

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
  "/:resumeId/candidate-photo/source",
  validate({ params: resumeIdParamsSchema }),
  asyncHandler(getCandidatePhotoSourceController),
);

resumeRouter.post(
  "/:resumeId/candidate-photo",
  resumePhotoRateLimiter,
  candidatePhotoUpload.single("file"),
  validate({
    params: resumeIdParamsSchema,
    body: candidatePhotoUploadBodySchema,
  }),
  asyncHandler(uploadCandidatePhotoController),
);

resumeRouter.delete(
  "/:resumeId/candidate-photo",
  resumePhotoRateLimiter,
  validate({
    params: resumeIdParamsSchema,
    body: candidatePhotoMutationBodySchema,
  }),
  asyncHandler(removeCandidatePhotoController),
);

resumeRouter.delete(
  "/:resumeId",
  validate({ params: resumeIdParamsSchema }),
  asyncHandler(deleteResumeController),
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
