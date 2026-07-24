import type { Request, Response } from "express";
import {
  createResume,
  createResumeVersion,
  getOwnedResumeVersion,
  getResumeWorkspace,
  listResumes,
  listResumeVersions,
  updateResumeDesign,
} from "./resume.service.js";

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
