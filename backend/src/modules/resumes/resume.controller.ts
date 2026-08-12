import type { Request, Response } from "express";
import { AppError } from "../../shared/appError.js";
import {
  createResume,
  createResumeVersion,
  getOwnedResumeVersion,
  getResumeWorkspace,
  listResumes,
  listResumeVersions,
  updateResumeDesign,
} from "./resume.service.js";
import {
  createOrReplaceCandidatePhoto,
  getCandidatePhotoSource,
  removeCandidatePhoto,
} from "./resumePhoto.service.js";

type ResumeIdParams = {
  resumeId: string;
};

type VersionIdParams = ResumeIdParams & {
  versionId: string;
};

export async function createResumeController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await createResume({
    userId: request.auth!.userId,
    title: request.body.title,
    content: request.body.content,
    design: request.body.design,
  });

  response.status(201).json({ success: true, data: result });
}

export async function listResumesController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listResumes(
    request.auth!.userId,
    request.query as unknown as {
      page: number;
      limit: number;
      status?: "draft" | "active" | "archived";
    },
  );

  response.status(200).json({ success: true, data: result });
}

export async function getResumeController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const result = await getResumeWorkspace(
    request.auth!.userId,
    request.params.resumeId,
  );

  response.status(200).json({ success: true, data: result });
}

export async function createVersionController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const result = await createResumeVersion({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
    content: request.body.content,
    source: "manual",
    changeSummary: request.body.changeSummary,
    expectedCurrentVersionId: request.body.expectedCurrentVersionId,
  });

  response.status(201).json({ success: true, data: result });
}

export async function listVersionsController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const result = await listResumeVersions(
    request.auth!.userId,
    request.params.resumeId,
    request.query as unknown as { page: number; limit: number },
  );

  response.status(200).json({ success: true, data: result });
}

export async function getVersionController(
  request: Request<VersionIdParams>,
  response: Response,
): Promise<void> {
  const version = await getOwnedResumeVersion(
    request.auth!.userId,
    request.params.resumeId,
    request.params.versionId,
  );

  response.status(200).json({ success: true, data: { version } });
}

export async function updateDesignController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const resume = await updateResumeDesign({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
    designPatch: request.body,
  });

  response.status(200).json({ success: true, data: { resume } });
}

export async function uploadCandidatePhotoController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  if (!request.file) {
    throw new AppError(
      400,
      "RESUME_PHOTO_FILE_REQUIRED",
      "Choose a candidate photo to upload.",
    );
  }

  const resume = await createOrReplaceCandidatePhoto({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
    expectedCandidatePhotoAssetId:
      request.body.expectedCandidatePhotoAssetId,
    file: request.file,
  });

  response.status(201).json({ success: true, data: { resume } });
}

export async function getCandidatePhotoSourceController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const source = await getCandidatePhotoSource({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
  });

  response.status(200).json({ success: true, data: source });
}

export async function removeCandidatePhotoController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  const resume = await removeCandidatePhoto({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
    expectedCandidatePhotoAssetId:
      request.body.expectedCandidatePhotoAssetId,
  });

  response.status(200).json({ success: true, data: { resume } });
}
