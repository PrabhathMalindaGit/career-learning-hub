import { AssetModel } from "../assets/asset.model.js";
import {
  createAsset,
  createSignedAssetUrl,
  deleteOwnedAsset,
} from "../assets/asset.service.js";
import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { requireOwnedResume } from "./resume.service.js";

const TEMPORARY_PHOTO_TTL_SECONDS = 15 * 60;

type CandidatePhotoExpectation = string | "none";

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
    expiresInSeconds: TEMPORARY_PHOTO_TTL_SECONDS,
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
            previous.metadata as Record<string, unknown> | undefined,
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
        ...(staged.metadata ?? {}),
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
        currentAsset.metadata as Record<string, unknown> | undefined,
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
      asset.metadata as Record<string, unknown> | undefined,
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
