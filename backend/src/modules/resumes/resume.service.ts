import type { ClientSession } from "mongoose";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { recordActivitySafely } from "../activity/activity.service.js";
import {
  deleteCascadeAssetObjectsBestEffort,
  markOwnedAssetsDeletedForCascade,
} from "../assets/asset.service.js";
import { ResumeAnalysisModel } from "../resume-analysis/resumeAnalysis.model.js";
import { ResumeModel, type ResumeDocument } from "./resume.model.js";
import {
  ResumeVersionModel,
  type ResumeVersionDocument,
} from "./resumeVersion.model.js";
import type {
  ResumeContent,
  ResumeDesign,
  ResumeSource,
} from "./resume.types.js";
import {
  createBlankResumeContent,
  normalizeResumeContent,
} from "./resume.validation.js";

const defaultDesign: ResumeDesign = {
  templateId: "ats-classic",
  colorPaletteId: "slate",
  pageSize: "A4",
  fontFamily: "Inter",
  showProfilePhoto: false,
};

const activeResumeJobFilter = (userId: string, resumeId: string) => ({
  userId,
  type: "resume.analyze",
  status: { $in: ["queued", "processing"] },
  "payload.resumeId": resumeId,
});

const terminalResumeJobFilter = (userId: string, resumeId: string) => ({
  userId,
  status: { $in: ["completed", "failed", "cancelled"] },
  $or: [
    { type: "resume.analyze", "payload.resumeId": resumeId },
    {
      type: "resume.import-pdf",
      "result.kind": "import-adopted",
      "result.resumeId": resumeId,
    },
  ],
});

export async function createResume(input: {
  userId: string;
  title: string;
  content?: unknown;
  design?: Partial<ResumeDesign>;
  source?: ResumeSource;
  sourceAssetId?: string;
  changeSummary?: string;
  beforeWrites?(session: ClientSession): Promise<void>;
}): Promise<{
  resume: ResumeDocument;
  version: ResumeVersionDocument;
}> {
  const content = input.content
    ? normalizeResumeContent(input.content)
    : createBlankResumeContent();

  const result = await withMongoTransaction(async (session) => {
    await input.beforeWrites?.(session);
    const [resume] = await ResumeModel.create(
      [
        {
          userId: input.userId,
          title: input.title,
          latestVersionNumber: 0,
          design: {
            ...defaultDesign,
            ...input.design,
            showProfilePhoto: false,
          },
        },
      ],
      { session },
    );

    const [version] = await ResumeVersionModel.create(
      [
        {
          userId: input.userId,
          resumeId: resume._id,
          versionNumber: 1,
          source: input.source ?? "manual",
          sourceAssetId: input.sourceAssetId,
          content,
          changeSummary: input.changeSummary ?? "Initial version",
        },
      ],
      { session },
    );

    resume.currentVersionId = version._id;
    resume.latestVersionNumber = 1;
    await resume.save({ session });

    return { resume, version };
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "resume.created",
    resourceType: "resume",
    resourceId: result.resume._id.toString(),
    metadata: {
      source: input.source ?? "manual",
      versionNumber: 1,
    },
  });

  return result;
}

export async function listResumes(
  userId: string,
  input: {
    page: number;
    limit: number;
    status?: "draft" | "active" | "archived";
  },
) {
  const filter: Record<string, unknown> = { userId };
  if (input.status) filter.status = input.status;

  const [resumes, total] = await Promise.all([
    ResumeModel.find(filter)
      .select(
        "title status currentVersionId candidatePhotoAssetId latestVersionNumber design createdAt updatedAt",
      )
      .sort({ updatedAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    ResumeModel.countDocuments(filter),
  ]);

  return {
    resumes,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

// Feature 7.2 BACKEND — Owner-scoped Resume authorization.
export async function requireOwnedResume(
  userId: string,
  resumeId: string,
  session?: ClientSession,
): Promise<ResumeDocument> {
  const query = ResumeModel.findOne({
    _id: resumeId,
    userId,
  });

  if (session) query.session(session);
  const resume = await query;

  if (!resume) {
    throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
  }

  return resume;
}

export async function getResumeWorkspace(
  userId: string,
  resumeId: string,
) {
  const resume = await requireOwnedResume(userId, resumeId);
  const version = resume.currentVersionId
    ? await ResumeVersionModel.findOne({
        _id: resume.currentVersionId,
        resumeId: resume._id,
        userId,
      })
    : null;

  if (!version) {
    throw new AppError(
      409,
      "CURRENT_RESUME_VERSION_MISSING",
      "The resume does not have a valid current version.",
    );
  }

  return { resume, version };
}

export async function listResumeVersions(
  userId: string,
  resumeId: string,
  input: { page: number; limit: number },
) {
  await requireOwnedResume(userId, resumeId);

  const [versions, total] = await Promise.all([
    ResumeVersionModel.find({ userId, resumeId })
      .select(
        "versionNumber parentVersionId source sourceAssetId changeSummary createdAt",
      )
      .sort({ versionNumber: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    ResumeVersionModel.countDocuments({ userId, resumeId }),
  ]);

  return {
    versions,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getOwnedResumeVersion(
  userId: string,
  resumeId: string,
  versionId: string,
): Promise<ResumeVersionDocument> {
  const version = await ResumeVersionModel.findOne({
    _id: versionId,
    userId,
    resumeId,
  });

  if (!version) {
    throw new AppError(
      404,
      "RESUME_VERSION_NOT_FOUND",
      "Resume version not found.",
    );
  }

  return version;
}

export async function createResumeVersion(input: {
  userId: string;
  resumeId: string;
  content: unknown;
  source?: ResumeSource;
  changeSummary?: string;
  expectedCurrentVersionId?: string;
}) {
  const normalizedContent = normalizeResumeContent(input.content);

  const result = await withMongoTransaction(async (session) => {
    const resume = await requireOwnedResume(
      input.userId,
      input.resumeId,
      session,
    );

    if (
      input.expectedCurrentVersionId &&
      resume.currentVersionId?.toString() !==
        input.expectedCurrentVersionId
    ) {
      throw new AppError(
        409,
        "RESUME_VERSION_CONFLICT",
        "The resume changed after it was loaded. Refresh before saving.",
      );
    }

    const nextVersionNumber = resume.latestVersionNumber + 1;
    const [version] = await ResumeVersionModel.create(
      [
        {
          userId: input.userId,
          resumeId: resume._id,
          versionNumber: nextVersionNumber,
          parentVersionId: resume.currentVersionId,
          source: input.source ?? "manual",
          content: normalizedContent,
          changeSummary: input.changeSummary,
        },
      ],
      { session },
    );

    resume.currentVersionId = version._id;
    resume.latestVersionNumber = nextVersionNumber;
    await resume.save({ session });

    return { resume, version };
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "resume.version.created",
    resourceType: "resume",
    resourceId: input.resumeId,
    metadata: {
      versionId: result.version._id.toString(),
      versionNumber: result.version.versionNumber,
      source: result.version.source,
    },
  });

  return result;
}

export async function deleteResume(input: {
  userId: string;
  resumeId: string;
}): Promise<void> {
  const cleanupTargets = await withMongoTransaction(async (session) => {
    const resume = await requireOwnedResume(
      input.userId,
      input.resumeId,
      session,
    );

    const activeJob = await JobRecordModel.exists(
      activeResumeJobFilter(input.userId, input.resumeId),
    ).session(session);

    if (activeJob) {
      throw new AppError(
        409,
        "RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Resume AI work before deleting this Resume.",
      );
    }

    const versions = await ResumeVersionModel.find({
      userId: input.userId,
      resumeId: resume._id,
    })
      .select("sourceAssetId")
      .session(session);

    const assetIds = [
      ...(resume.candidatePhotoAssetId
        ? [resume.candidatePhotoAssetId.toString()]
        : []),
      ...versions.flatMap((version) =>
        version.sourceAssetId
          ? [version.sourceAssetId.toString()]
          : [],
      ),
    ];

    const targets = await markOwnedAssetsDeletedForCascade({
      userId: input.userId,
      assetIds,
      session,
    });

    await ResumeAnalysisModel.deleteMany({
      userId: input.userId,
      resumeId: resume._id,
    }).session(session);

    await ResumeVersionModel.deleteMany({
      userId: input.userId,
      resumeId: resume._id,
    }).session(session);

    await JobRecordModel.deleteMany(
      terminalResumeJobFilter(input.userId, input.resumeId),
    ).session(session);

    await ResumeModel.deleteOne({
      _id: resume._id,
      userId: input.userId,
    }).session(session);

    return targets;
  });

  await deleteCascadeAssetObjectsBestEffort(cleanupTargets);

  await recordActivitySafely({
    userId: input.userId,
    type: "resume.deleted",
    resourceType: "resume",
    resourceId: input.resumeId,
  });
}

export async function updateResumeDesign(input: {
  userId: string;
  resumeId: string;
  designPatch: Partial<ResumeDesign>;
}): Promise<ResumeDocument> {
  const resume = await requireOwnedResume(input.userId, input.resumeId);

  if (
    input.designPatch.showProfilePhoto === true &&
    !resume.candidatePhotoAssetId
  ) {
    throw new AppError(
      409,
      "RESUME_PHOTO_REQUIRED",
      "Add a candidate photo before showing it on the Resume.",
    );
  }

  if (input.designPatch.templateId !== undefined) {
    resume.design.templateId = input.designPatch.templateId;
  }
  if (input.designPatch.colorPaletteId !== undefined) {
    resume.design.colorPaletteId = input.designPatch.colorPaletteId;
  }
  if (input.designPatch.pageSize !== undefined) {
    resume.design.pageSize = input.designPatch.pageSize;
  }
  if (input.designPatch.fontFamily !== undefined) {
    resume.design.fontFamily = input.designPatch.fontFamily;
  }
  if (input.designPatch.showProfilePhoto !== undefined) {
    resume.design.showProfilePhoto = input.designPatch.showProfilePhoto;
  }

  await resume.save();

  await recordActivitySafely({
    userId: input.userId,
    type: "resume.design.updated",
    resourceType: "resume",
    resourceId: input.resumeId,
    metadata: input.designPatch,
  });

  return resume;
}

export function findResumeBullet(
  content: ResumeContent,
  bulletId: string,
): { text: string; update(nextText: string): void } | null {
  for (const entry of content.experience) {
    const bullet = entry.bullets.find((item) => item.id === bulletId);
    if (bullet) {
      return {
        text: bullet.text,
        update(nextText) {
          bullet.text = nextText;
        },
      };
    }
  }

  for (const entry of content.education) {
    const detail = entry.details.find((item) => item.id === bulletId);
    if (detail) {
      return {
        text: detail.text,
        update(nextText) {
          detail.text = nextText;
        },
      };
    }
  }

  for (const entry of content.projects) {
    const bullet = entry.bullets.find((item) => item.id === bulletId);
    if (bullet) {
      return {
        text: bullet.text,
        update(nextText) {
          bullet.text = nextText;
        },
      };
    }
  }

  return null;
}
