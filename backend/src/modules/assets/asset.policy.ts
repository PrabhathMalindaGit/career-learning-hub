import { createHash } from "node:crypto";
import { AppError } from "../../shared/appError.js";
import type { AssetPurpose } from "./asset.model.js";

const allowedMimeTypesByPurpose: Record<AssetPurpose, readonly string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  "resume-import": ["application/pdf"],
  "resume-export": ["application/pdf"],
  "resume-thumbnail": ["image/jpeg", "image/png", "image/webp"],
  "learning-document": ["application/pdf"],
  "interview-audio": ["audio/mpeg", "audio/wav", "audio/webm"],
  other: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
};

const purposeSizeLimits: Record<AssetPurpose, number> = {
  avatar: 5 * 1024 * 1024,
  "resume-import": 15 * 1024 * 1024,
  "resume-export": 15 * 1024 * 1024,
  "resume-thumbnail": 5 * 1024 * 1024,
  "learning-document": 15 * 1024 * 1024,
  "interview-audio": 25 * 1024 * 1024,
  other: 10 * 1024 * 1024,
};

function hasPrefix(buffer: Buffer, prefix: readonly number[]): boolean {
  return prefix.every((byte, index) => buffer[index] === byte);
}

function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (mimeType === "image/png") {
    return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (mimeType === "image/jpeg") {
    return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  if (mimeType === "audio/wav") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WAVE"
    );
  }

  if (mimeType === "audio/webm") {
    return hasPrefix(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
  }

  if (mimeType === "audio/mpeg") {
    const id3 = buffer.subarray(0, 3).toString("ascii") === "ID3";
    const frameSync =
      buffer.length >= 2 &&
      buffer[0] === 0xff &&
      (buffer[1] & 0xe0) === 0xe0;
    return id3 || frameSync;
  }

  return false;
}

export function validateAssetFile(input: {
  purpose: AssetPurpose;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
  globalMaxSizeBytes: number;
}): { checksumSha256: string } {
  const allowedMimeTypes = allowedMimeTypesByPurpose[input.purpose];

  if (!allowedMimeTypes.includes(input.mimeType)) {
    throw new AppError(
      415,
      "UNSUPPORTED_FILE_TYPE",
      `The MIME type ${input.mimeType} is not permitted for ${input.purpose}.`,
    );
  }

  const maximum = Math.min(
    purposeSizeLimits[input.purpose],
    input.globalMaxSizeBytes,
  );

  if (input.sizeBytes <= 0 || input.sizeBytes > maximum) {
    throw new AppError(
      413,
      "FILE_TOO_LARGE",
      `The file exceeds the ${maximum}-byte limit for ${input.purpose}.`,
    );
  }

  if (!matchesMagicBytes(input.buffer, input.mimeType)) {
    throw new AppError(
      415,
      "FILE_SIGNATURE_MISMATCH",
      "The file contents do not match the declared MIME type.",
    );
  }

  return {
    checksumSha256: createHash("sha256").update(input.buffer).digest("hex"),
  };
}
