import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  authenticatedDownloadController,
  createSignedUrlController,
  deleteAssetController,
  getAssetController,
  signedDownloadController,
  uploadAssetController,
} from "./asset.controller.js";
import {
  assetIdParamsSchema,
  signedDownloadQuerySchema,
  signedUrlBodySchema,
  uploadAssetBodySchema,
} from "./asset.schemas.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: env.ASSET_MAX_FILE_SIZE_BYTES,
    fields: 10,
  },
});

export const assetRouter = Router();

assetRouter.get(
  "/:assetId/download",
  validate({
    params: assetIdParamsSchema,
    query: signedDownloadQuerySchema,
  }),
  asyncHandler(signedDownloadController),
);

assetRouter.use(authenticate);

assetRouter.post(
  "/",
  upload.single("file"),
  validate({ body: uploadAssetBodySchema }),
  asyncHandler(uploadAssetController),
);

assetRouter.get(
  "/:assetId",
  validate({ params: assetIdParamsSchema }),
  asyncHandler(getAssetController),
);

assetRouter.get(
  "/:assetId/content",
  validate({ params: assetIdParamsSchema }),
  asyncHandler(authenticatedDownloadController),
);

assetRouter.post(
  "/:assetId/signed-url",
  validate({
    params: assetIdParamsSchema,
    body: signedUrlBodySchema,
  }),
  asyncHandler(createSignedUrlController),
);

assetRouter.delete(
  "/:assetId",
  validate({ params: assetIdParamsSchema }),
  asyncHandler(deleteAssetController),
);
