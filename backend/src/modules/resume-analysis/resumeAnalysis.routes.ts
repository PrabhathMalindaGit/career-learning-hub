import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  resumeAnalysisRateLimiter,
  resumeImportRateLimiter,
} from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  applyRewritesController,
  confirmImportPdfController,
  getAnalysisController,
  importPdfController,
  listAnalysesController,
  queueAnalysisController,
  resumePdfUpload,
} from "./resumeAnalysis.controller.js";
import {
  analysisIdParamsSchema,
  analysisListQuerySchema,
  analysisResumeParamsSchema,
  analyzeResumeBodySchema,
  applyRewriteBodySchema,
  importPdfBodySchema,
  importJobIdParamsSchema,
} from "./resumeAnalysis.schemas.js";

export const resumeAnalysisRouter = Router();

resumeAnalysisRouter.use(authenticate);

resumeAnalysisRouter.post(
  "/import-pdf",
  resumeImportRateLimiter,
  resumePdfUpload,
  validate({ body: importPdfBodySchema }),
  asyncHandler(importPdfController),
);

resumeAnalysisRouter.post(
  "/import-pdf/:jobId/confirm",
  resumeImportRateLimiter,
  validate({ params: importJobIdParamsSchema }),
  asyncHandler(confirmImportPdfController),
);

resumeAnalysisRouter.post(
  "/resumes/:resumeId/analyze",
  resumeAnalysisRateLimiter,
  validate({
    params: analysisResumeParamsSchema,
    body: analyzeResumeBodySchema,
  }),
  asyncHandler(queueAnalysisController),
);

resumeAnalysisRouter.get(
  "/resumes/:resumeId",
  validate({
    params: analysisResumeParamsSchema,
    query: analysisListQuerySchema,
  }),
  asyncHandler(listAnalysesController),
);

resumeAnalysisRouter.post(
  "/resumes/:resumeId/rewrites/apply",
  validate({
    params: analysisResumeParamsSchema,
    body: applyRewriteBodySchema,
  }),
  asyncHandler(applyRewritesController),
);

resumeAnalysisRouter.get(
  "/:analysisId",
  validate({ params: analysisIdParamsSchema }),
  asyncHandler(getAnalysisController),
);
