import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import {
  createAsset,
  createSignedAssetUrl,
  deleteOwnedAsset,
  getOwnedAsset,
  resolveSignedLocalAsset,
} from "./asset.service.js";
import { getStorageForProvider } from "./storage/storage.factory.js";

type AssetIdParams = {
  assetId: string;
};

export async function uploadAssetController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth || !request.file) {
    throw new AppError(
      400,
      "ASSET_FILE_REQUIRED",
      "A file upload is required.",
    );
  }

  const { purpose, temporary, expiresInSeconds } = request.body as {
    purpose: Parameters<typeof createAsset>[0]["purpose"];
    temporary?: boolean;
    expiresInSeconds?: number;
  };

  const asset = await createAsset({
    userId: request.auth.userId,
    purpose,
    file: request.file,
    temporary,
    expiresInSeconds,
  });

  response.status(201).json({
    success: true,
    data: {
      asset: {
        id: asset._id.toString(),
        purpose: asset.purpose,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        status: asset.status,
        createdAt: asset.createdAt,
        expiresAt: asset.expiresAt,
      },
    },
  });
}

export async function getAssetController(
  request: Request<AssetIdParams>,
  response: Response,
): Promise<void> {
  const asset = await getOwnedAsset(
    request.auth!.userId,
    request.params.assetId,
  );

  response.status(200).json({
    success: true,
    data: {
      asset: {
        id: asset._id.toString(),
        purpose: asset.purpose,
        originalFilename: asset.originalFilename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        checksumSha256: asset.checksumSha256,
        status: asset.status,
        createdAt: asset.createdAt,
        expiresAt: asset.expiresAt,
      },
    },
  });
}

export async function createSignedUrlController(
  request: Request<AssetIdParams>,
  response: Response,
): Promise<void> {
  const { expiresInSeconds } = request.body as {
    expiresInSeconds?: number;
  };

  const signed = await createSignedAssetUrl(
    request.auth!.userId,
    request.params.assetId,
    expiresInSeconds,
  );

  response.status(200).json({
    success: true,
    data: signed,
  });
}

export async function authenticatedDownloadController(
  request: Request<AssetIdParams>,
  response: Response,
): Promise<void> {
  const asset = await getOwnedAsset(
    request.auth!.userId,
    request.params.assetId,
  );
  const target = await getStorageForProvider(
    asset.storageProvider,
  ).createDownloadTarget(
    asset.storageKey,
    env.ASSET_SIGNED_URL_TTL_SECONDS,
  );

  if (target.kind === "redirect") {
    response.redirect(302, target.url);
    return;
  }

  response.setHeader("Content-Type", asset.mimeType);
  response.setHeader("Content-Length", String(asset.sizeBytes));
  response.setHeader("Cache-Control", "private, no-store");
  target.stream.on(
    "error",
    (error: Error) => response.destroy(error),
  );
  target.stream.pipe(response);
}

export async function signedDownloadController(
  request: Request<AssetIdParams>,
  response: Response,
): Promise<void> {
  const { expires, signature } = request.query as unknown as {
    expires: number;
    signature: string;
  };

  const asset = await resolveSignedLocalAsset(
    request.params.assetId,
    expires,
    signature,
  );
  const target = await getStorageForProvider(
    asset.storageProvider,
  ).createDownloadTarget(
    asset.storageKey,
    Math.max(1, expires - Math.floor(Date.now() / 1_000)),
  );

  if (target.kind !== "stream") {
    throw new AppError(
      400,
      "SIGNED_DOWNLOAD_UNAVAILABLE",
      "This signed download route is only used by local storage.",
    );
  }

  response.setHeader("Content-Type", asset.mimeType);
  response.setHeader("Content-Length", String(asset.sizeBytes));
  response.setHeader("Cache-Control", "private, no-store");
  target.stream.on(
    "error",
    (error: Error) => response.destroy(error),
  );
  target.stream.pipe(response);
}

export async function deleteAssetController(
  request: Request<AssetIdParams>,
  response: Response,
): Promise<void> {
  await deleteOwnedAsset(
    request.auth!.userId,
    request.params.assetId,
  );
  response.status(204).send();
}
