import type { Request, Response } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import { AppError } from "../../shared/appError.js";
import { createAsset } from "../assets/asset.service.js";
import {
  getOwnedResumeVersion,
  requireOwnedResume,
} from "../resumes/resume.service.js";
import {
  applyAnalysisSuggestions,
  getOwnedAnalysis,
  listResumeAnalyses,
} from "./resumeAnalysis.service.js";

type ResumeIdParams = {
  resumeId: string;
};

type AnalysisIdParams = {
  analysisId: string;
};

export async function importPdfController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.file) {
    throw new AppError(
      400,
      "RESUME_PDF_REQUIRED",
      "A PDF resume is required.",
    );
  }

  const asset = await createAsset({
    userId: request.auth!.userId,
    purpose: "resume-import",
    file: request.file,
    temporary: true,
    expiresInSeconds: 24 * 60 * 60,
  });

  const job = await enqueueJob({
    type: "resume.import-pdf",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      assetId: asset._id.toString(),
      title: request.body.title,
    },
    maxAttempts: env.RESUME_ANALYSIS_JOB_MAX_ATTEMPTS,
  });

  response.status(202).json({
    success: true,
    data: {
      assetId: asset._id.toString(),
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function queueAnalysisController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const resume = await requireOwnedResume(
    request.auth!.userId,
    request.params.resumeId,
  );

  const versionId =
    request.body.versionId ?? resume.currentVersionId?.toString();

  if (!versionId) {
    throw new AppError(
      409,
      "CURRENT_RESUME_VERSION_MISSING",
      "The resume does not have a current version.",
    );
  }

  await getOwnedResumeVersion(
    request.auth!.userId,
    request.params.resumeId,
    versionId,
  );

  const job = await enqueueJob({
    type: "resume.analyze",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      resumeId: request.params.resumeId,
      versionId,
      targetRole: request.body.targetRole,
      company: request.body.company,
      jobDescription: request.body.jobDescription,
    },
    maxAttempts: env.RESUME_ANALYSIS_JOB_MAX_ATTEMPTS,
  });

  response.status(202).json({
    success: true,
    data: {
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function listAnalysesController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const result = await listResumeAnalyses(
    request.auth!.userId,
    request.params.resumeId,
    request.query as unknown as { page: number; limit: number },
  );

  response.status(200).json({ success: true, data: result });
}

export async function getAnalysisController(
  request: Request<AnalysisIdParams>,
  response: Response,
): Promise<void> {
  const analysis = await getOwnedAnalysis(
    request.auth!.userId,
    request.params.analysisId,
  );

  response.status(200).json({ success: true, data: { analysis } });
}

export async function applyRewritesController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const result = await applyAnalysisSuggestions({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
    analysisId: request.body.analysisId,
    suggestionIds: request.body.suggestionIds,
    changeSummary: request.body.changeSummary,
  });

  response.status(201).json({ success: true, data: result });
}

export const resumePdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: env.ASSET_MAX_FILE_SIZE_BYTES,
    fields: 10,
  },
}).single("file");
