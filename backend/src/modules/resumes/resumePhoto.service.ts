import { Readable } from "node:stream";
import type { ClientSession } from "mongoose";
import {
  AssetModel,
  type AssetDocument,
} from "../assets/asset.model.js";
import {
  createAsset,
  createSignedAssetUrl,
  deleteOwnedAsset,
} from "../assets/asset.service.js";
import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { requireOwnedResume } from "./resume.service.js";

export const RESUME_PHOTO_STAGING_TTL_SECONDS = 15 * 60;

type CandidatePhotoExpectation = string | "none";
type ResumePhotoMimeType = "image/jpeg" | "image/png" | "image/webp";

function currentCandidatePhotoId(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }
  return "none";
}

function assertExpectedCandidatePhoto(
  actual: unknown,
  expected: CandidatePhotoExpectation,
): void {
  if (currentCandidatePhotoId(actual) !== expected) {
    throw new AppError(
      409,
      "RESUME_PHOTO_CONFLICT",
      "The candidate photo changed after this Resume was loaded. Refresh and try again.",
    );
  }
}

function assetBelongsToResume(
  metadata: Record<string, unknown> | undefined,
  resumeId: string,
): boolean {
  return metadata?.resumeId === resumeId;
}

function metadataRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

async function cleanupRetiredPhoto(
  userId: string,
  assetId: string,
): Promise<void> {
  try {
    await deleteOwnedAsset(userId, assetId);
  } catch (error) {
    logger.error("resume.candidate-photo.cleanup.failed", {
      assetId,
      ...serializeErrorForLog(error),
    });
  }
}

function importedPhotoFilename(
  mimeType: ResumePhotoMimeType,
  ordinal: number,
): string {
  const extension =
    mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  return `resume-import-photo-${ordinal}.${extension}`;
}

export async function stageResumeImportPhotoCandidate(input: {
  userId: string;
  importJobId: string;
  sourceAssetId: string;
  buffer: Buffer;
  mimeType: ResumePhotoMimeType;
  ordinal: number;
}): Promise<AssetDocument> {
  const staged = await createAsset({
    userId: input.userId,
    purpose: "resume-photo",
    temporary: true,
    expiresInSeconds: RESUME_PHOTO_STAGING_TTL_SECONDS,
    file: {
      fieldname: "file",
      originalname: importedPhotoFilename(input.mimeType, input.ordinal),
      encoding: "7bit",
      mimetype: input.mimeType,
      size: input.buffer.length,
      buffer: input.buffer,
      destination: "",
      filename: "",
      path: "",
      stream: Readable.from(input.buffer),
    },
  });

  try {
    staged.metadata = {
      ...(metadataRecord(staged.metadata) ?? {}),
      resumeImportJobId: input.importJobId,
      resumeImportSourceAssetId: input.sourceAssetId,
      resumeImportOrdinal: input.ordinal,
    };
    await staged.save();
    return staged;
  } catch (error) {
    void cleanupRetiredPhoto(input.userId, staged._id.toString());
    throw error;
  }
}

export async function assertStagedImportPhotoCandidate(input: {
  userId: string;
  assetId: string;
  importJobId: string;
  sourceAssetId: string;
  session?: ClientSession;
}): Promise<AssetDocument> {
  let query = AssetModel.findOne({
    _id: input.assetId,
    userId: input.userId,
    purpose: "resume-photo",
    status: "temporary",
    expiresAt: { $gt: new Date() },
  });
  if (input.session) query = query.session(input.session);
  const asset = await query;
  const metadata = metadataRecord(asset?.metadata);

  if (
    !asset ||
    metadata?.resumeImportJobId !== input.importJobId ||
    metadata?.resumeImportSourceAssetId !== input.sourceAssetId
  ) {
    throw new AppError(
      409,
      "RESUME_IMPORT_NOT_CONFIRMABLE",
      "The Resume import is not ready for confirmation.",
      undefined,
      false,
    );
  }

  return asset;
}

export async function attachStagedImportPhotoCandidate(input: {
  userId: string;
  resumeId: string;
  assetId: string;
  importJobId: string;
  sourceAssetId: string;
  session: ClientSession;
}): Promise<void> {
  const ownedResume = await requireOwnedResume(
    input.userId,
    input.resumeId,
    input.session,
  );
  const currentAssetId = ownedResume.candidatePhotoAssetId?.toString();

  if (currentAssetId) {
    if (currentAssetId !== input.assetId) {
      throw new AppError(
        409,
        "RESUME_PHOTO_CONFLICT",
        "The candidate photo changed after this Resume was loaded. Refresh and try again.",
      );
    }

    const existing = await AssetModel.findOne({
      _id: input.assetId,
      userId: input.userId,
      purpose: "resume-photo",
      status: "active",
    }).session(input.session);
    if (
      !existing ||
      !assetBelongsToResume(
        metadataRecord(existing.metadata),
        input.resumeId,
      )
    ) {
      throw new AppError(
        409,
        "RESUME_PHOTO_STATE_INVALID",
        "The current candidate photo could not be attached safely.",
      );
    }
    return;
  }

  const staged = await assertStagedImportPhotoCandidate({
    userId: input.userId,
    assetId: input.assetId,
    importJobId: input.importJobId,
    sourceAssetId: input.sourceAssetId,
    session: input.session,
  });

  staged.status = "active";
  staged.expiresAt = undefined;
  staged.metadata = {
    ...(metadataRecord(staged.metadata) ?? {}),
    resumeId: input.resumeId,
  };
  await staged.save({ session: input.session });

  ownedResume.candidatePhotoAssetId = staged._id;
  ownedResume.design.showProfilePhoto = true;
  await ownedResume.save({ session: input.session });
}

export async function createOrReplaceCandidatePhoto(input: {
  userId: string;
  resumeId: string;
  expectedCandidatePhotoAssetId: CandidatePhotoExpectation;
  file: Express.Multer.File;
}) {
  const stagedAsset = await createAsset({
    userId: input.userId,
    purpose: "resume-photo",
    file: input.file,
    temporary: true,
    expiresInSeconds: RESUME_PHOTO_STAGING_TTL_SECONDS,
  });

  let retiredAssetId: string | undefined;

  try {
    const resume = await withMongoTransaction(async (session) => {
      const ownedResume = await requireOwnedResume(
        input.userId,
        input.resumeId,
        session,
      );
      assertExpectedCandidatePhoto(
        ownedResume.candidatePhotoAssetId,
        input.expectedCandidatePhotoAssetId,
      );

      const staged = await AssetModel.findOne({
        _id: stagedAsset._id,
        userId: input.userId,
        purpose: "resume-photo",
        status: "temporary",
      }).session(session);

      if (!staged) {
        throw new AppError(
          409,
          "RESUME_PHOTO_STAGING_INVALID",
          "The candidate photo upload could not be attached safely.",
        );
      }

      const previousAssetId = ownedResume.candidatePhotoAssetId?.toString();
      if (previousAssetId) {
        const previous = await AssetModel.findOne({
          _id: previousAssetId,
          userId: input.userId,
          purpose: "resume-photo",
          status: "active",
        }).session(session);

        if (
          !previous ||
          !assetBelongsToResume(
            metadataRecord(previous.metadata),
            input.resumeId,
          )
        ) {
          throw new AppError(
            409,
            "RESUME_PHOTO_STATE_INVALID",
            "The current candidate photo could not be replaced safely.",
          );
        }

        previous.status = "temporary";
        previous.expiresAt = new Date();
        await previous.save({ session });
        retiredAssetId = previousAssetId;
      }

      staged.status = "active";
      staged.expiresAt = undefined;
      staged.metadata = {
        ...(metadataRecord(staged.metadata) ?? {}),
        resumeId: input.resumeId,
      };
      await staged.save({ session });

      ownedResume.candidatePhotoAssetId = staged._id;
      if (!previousAssetId) {
        ownedResume.design.showProfilePhoto = true;
      }
      await ownedResume.save({ session });

      return ownedResume;
    });

    if (retiredAssetId) {
      void cleanupRetiredPhoto(input.userId, retiredAssetId);
    }

    return resume;
  } catch (error) {
    void cleanupRetiredPhoto(input.userId, stagedAsset._id.toString());
    throw error;
  }
}

export async function removeCandidatePhoto(input: {
  userId: string;
  resumeId: string;
  expectedCandidatePhotoAssetId: CandidatePhotoExpectation;
}) {
  let retiredAssetId: string | undefined;

  const resume = await withMongoTransaction(async (session) => {
    const ownedResume = await requireOwnedResume(
      input.userId,
      input.resumeId,
      session,
    );
    assertExpectedCandidatePhoto(
      ownedResume.candidatePhotoAssetId,
      input.expectedCandidatePhotoAssetId,
    );

    const currentAssetId = ownedResume.candidatePhotoAssetId?.toString();
    if (!currentAssetId || input.expectedCandidatePhotoAssetId === "none") {
      throw new AppError(
        409,
        "RESUME_PHOTO_CONFLICT",
        "The candidate photo changed after this Resume was loaded. Refresh and try again.",
      );
    }

    const currentAsset = await AssetModel.findOne({
      _id: currentAssetId,
      userId: input.userId,
      purpose: "resume-photo",
      status: "active",
    }).session(session);

    if (
      !currentAsset ||
      !assetBelongsToResume(
        metadataRecord(currentAsset.metadata),
        input.resumeId,
      )
    ) {
      throw new AppError(
        409,
        "RESUME_PHOTO_STATE_INVALID",
        "The current candidate photo could not be removed safely.",
      );
    }

    currentAsset.status = "temporary";
    currentAsset.expiresAt = new Date();
    await currentAsset.save({ session });

    ownedResume.candidatePhotoAssetId = undefined;
    ownedResume.design.showProfilePhoto = false;
    await ownedResume.save({ session });

    retiredAssetId = currentAssetId;
    return ownedResume;
  });

  if (retiredAssetId) {
    void cleanupRetiredPhoto(input.userId, retiredAssetId);
  }

  return resume;
}

export async function getCandidatePhotoSource(input: {
  userId: string;
  resumeId: string;
}) {
  const resume = await requireOwnedResume(input.userId, input.resumeId);
  const assetId = resume.candidatePhotoAssetId?.toString();
  if (!assetId) {
    throw new AppError(
      404,
      "RESUME_PHOTO_NOT_FOUND",
      "Candidate photo not found.",
    );
  }

  const asset = await AssetModel.findOne({
    _id: assetId,
    userId: input.userId,
    purpose: "resume-photo",
    status: "active",
  });

  if (
    !asset ||
    !assetBelongsToResume(
      metadataRecord(asset.metadata),
      input.resumeId,
    )
  ) {
    throw new AppError(
      404,
      "RESUME_PHOTO_NOT_FOUND",
      "Candidate photo not found.",
    );
  }

  return createSignedAssetUrl(input.userId, assetId);
}
