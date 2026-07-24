import { randomUUID } from "node:crypto";
import path from "node:path";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { recordActivitySafely } from "../activity/activity.service.js";
import {
  AssetModel,
  type AssetDocument,
  type AssetPurpose,
} from "./asset.model.js";
import { validateAssetFile } from "./asset.policy.js";
import {
  signLocalAssetDownload,
  verifyLocalAssetDownload,
} from "./asset.signing.js";
import {
  getPrivateStorage,
  getStorageForProvider,
} from "./storage/storage.factory.js";

function safeOriginalFilename(filename: string): string {
  return path
    .basename(filename)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 255);
}

function buildStorageKey(userId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${userId}/${year}/${month}/${randomUUID()}`;
}

export async function assertAssetQuota(
  userId: string,
  incomingBytes: number,
): Promise<void> {
  const [summary] = await AssetModel.aggregate<{ usedBytes: number }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: ["active", "temporary"] },
      },
    },
    {
      $group: {
        _id: null,
        usedBytes: { $sum: "$sizeBytes" },
      },
    },
  ]);

  const usedBytes = summary?.usedBytes ?? 0;
  if (usedBytes + incomingBytes > env.ASSET_USER_QUOTA_BYTES) {
    throw new AppError(
      413,
      "ASSET_QUOTA_EXCEEDED",
      "The account storage quota would be exceeded.",
      {
        usedBytes,
        incomingBytes,
        quotaBytes: env.ASSET_USER_QUOTA_BYTES,
      },
    );
  }
}

export async function createAsset(input: {
  userId: string;
  purpose: AssetPurpose;
  file: Express.Multer.File;
  temporary?: boolean;
  expiresInSeconds?: number;
}): Promise<AssetDocument> {
  const { checksumSha256 } = validateAssetFile({
    purpose: input.purpose,
    mimeType: input.file.mimetype,
    sizeBytes: input.file.size,
    buffer: input.file.buffer,
    globalMaxSizeBytes: env.ASSET_MAX_FILE_SIZE_BYTES,
  });

  await assertAssetQuota(input.userId, input.file.size);

  const storage = getPrivateStorage();
  const storageKey = buildStorageKey(input.userId);

  await storage.putObject({
    key: storageKey,
    body: input.file.buffer,
    contentType: input.file.mimetype,
    checksumSha256,
  });

  const temporary = input.temporary === true;
  const expiresAt = temporary
    ? new Date(
        Date.now() +
          (input.expiresInSeconds ?? 60 * 60) * 1_000,
      )
    : undefined;

  let asset: AssetDocument;

  try {
    asset = await AssetModel.create({
      userId: input.userId,
      purpose: input.purpose,
      storageProvider: storage.provider,
      storageKey,
      originalFilename: safeOriginalFilename(input.file.originalname),
      mimeType: input.file.mimetype,
      sizeBytes: input.file.size,
      checksumSha256,
      status: temporary ? "temporary" : "active",
      expiresAt,
    });
  } catch (error) {
    await storage.deleteObject(storageKey).catch(() => undefined);
    throw error;
  }

  await recordActivitySafely({
    userId: input.userId,
    type: "asset.created",
    resourceType: "asset",
    resourceId: asset._id.toString(),
    metadata: {
      purpose: asset.purpose,
      sizeBytes: asset.sizeBytes,
    },
  });

  return asset;
}

export async function getOwnedAsset(
  userId: string,
  assetId: string,
): Promise<AssetDocument> {
  const asset = await AssetModel.findOne({
    _id: assetId,
    userId,
    status: { $ne: "deleted" },
  });

  if (!asset) {
    throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
  }

  return asset;
}

export async function createSignedAssetUrl(
  userId: string,
  assetId: string,
  expiresInSeconds = env.ASSET_SIGNED_URL_TTL_SECONDS,
): Promise<{ url: string; expiresAt: Date }> {
  const asset = await getOwnedAsset(userId, assetId);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1_000);
  const storage = getStorageForProvider(asset.storageProvider);

  if (asset.storageProvider === "s3") {
    const target = await storage.createDownloadTarget(
      asset.storageKey,
      expiresInSeconds,
    );

    if (target.kind !== "redirect") {
      throw new AppError(
        500,
        "SIGNED_URL_UNAVAILABLE",
        "A signed URL could not be generated.",
      );
    }

    return { url: target.url, expiresAt };
  }

  const expires = Math.floor(expiresAt.getTime() / 1_000);
  const signature = signLocalAssetDownload(
    asset._id.toString(),
    expires,
  );
  const url = new URL(
    `/api/v1/assets/${asset._id.toString()}/download`,
    env.API_PUBLIC_ORIGIN,
  );
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature);

  return { url: url.toString(), expiresAt };
}

export async function resolveSignedLocalAsset(
  assetId: string,
  expires: number,
  signature: string,
): Promise<AssetDocument> {
  if (!verifyLocalAssetDownload(assetId, expires, signature)) {
    throw new AppError(
      401,
      "INVALID_ASSET_SIGNATURE",
      "The signed asset URL is invalid or expired.",
    );
  }

  const asset = await AssetModel.findOne({
    _id: assetId,
    storageProvider: "local",
    status: { $ne: "deleted" },
  });

  if (!asset) {
    throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
  }

  return asset;
}

export async function deleteOwnedAsset(
  userId: string,
  assetId: string,
): Promise<void> {
  const asset = await getOwnedAsset(userId, assetId);
  const storage = getStorageForProvider(asset.storageProvider);

  await storage.deleteObject(asset.storageKey);

  asset.status = "deleted";
  asset.deletedAt = new Date();
  asset.expiresAt = undefined;
  await asset.save();

  await recordActivitySafely({
    userId,
    type: "asset.deleted",
    resourceType: "asset",
    resourceId: asset._id.toString(),
    metadata: {
      purpose: asset.purpose,
    },
  });
}

export async function cleanupExpiredTemporaryAssets(
  batchSize = 100,
): Promise<{ deleted: number; failed: number }> {
  const assets = await AssetModel.find({
    status: "temporary",
    expiresAt: { $lte: new Date() },
  })
    .sort({ expiresAt: 1 })
    .limit(batchSize);

  let deleted = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      await getStorageForProvider(
        asset.storageProvider,
      ).deleteObject(asset.storageKey);

      asset.status = "deleted";
      asset.deletedAt = new Date();
      asset.expiresAt = undefined;
      await asset.save();
      deleted += 1;
    } catch (error) {
      failed += 1;
      logger.error("asset.cleanup.failed", {
        assetId: asset._id.toString(),
        storageProvider: asset.storageProvider,
        ...serializeErrorForLog(error),
      });
    }
  }

  return { deleted, failed };
}


export async function readOwnedAssetBuffer(
  userId: string,
  assetId: string,
  maximumBytes: number,
): Promise<Buffer> {
  const asset = await getOwnedAsset(userId, assetId);

  if (asset.sizeBytes > maximumBytes) {
    throw new AppError(
      413,
      "ASSET_READ_LIMIT_EXCEEDED",
      "The asset exceeds the permitted read size.",
    );
  }

  return getStorageForProvider(asset.storageProvider).getObjectBuffer(
    asset.storageKey,
    maximumBytes,
  );
}

export async function promoteOwnedAsset(
  userId: string,
  assetId: string,
  metadata?: Record<string, unknown>,
): Promise<AssetDocument> {
  const asset = await getOwnedAsset(userId, assetId);
  asset.status = "active";
  asset.expiresAt = undefined;
  asset.metadata = {
    ...(asset.metadata ?? {}),
    ...(metadata ?? {}),
  };
  await asset.save();
  return asset;
}
