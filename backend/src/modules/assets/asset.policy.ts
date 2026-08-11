import { createHash } from "node:crypto";
import { AppError } from "../../shared/appError.js";
import type { AssetPurpose } from "./asset.model.js";

const RESUME_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const RESUME_PHOTO_MAX_SIDE = 4_096;
const RESUME_PHOTO_MAX_PIXELS = 16_000_000;

const allowedMimeTypesByPurpose: Record<AssetPurpose, readonly string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  "resume-import": ["application/pdf"],
  "resume-export": ["application/pdf"],
  "resume-thumbnail": ["image/jpeg", "image/png", "image/webp"],
  "resume-photo": ["image/jpeg", "image/png", "image/webp"],
  "learning-document": ["application/pdf"],
  "interview-audio": ["audio/mpeg", "audio/wav", "audio/webm"],
  other: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
};

const purposeSizeLimits: Record<AssetPurpose, number> = {
  avatar: 5 * 1024 * 1024,
  "resume-import": 15 * 1024 * 1024,
  "resume-export": 15 * 1024 * 1024,
  "resume-thumbnail": 5 * 1024 * 1024,
  "resume-photo": RESUME_PHOTO_MAX_BYTES,
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

type RasterDimensions = {
  width: number;
  height: number;
};

function malformedImage(): never {
  throw new AppError(
    415,
    "INVALID_IMAGE_DIMENSIONS",
    "The image dimensions could not be validated.",
  );
}

function readPngDimensions(buffer: Buffer): RasterDimensions {
  if (
    buffer.length < 24 ||
    buffer.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    malformedImage();
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

function readJpegDimensions(buffer: Buffer): RasterDimensions {
  if (buffer.length < 4 || !hasPrefix(buffer, [0xff, 0xd8])) {
    malformedImage();
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= buffer.length) malformedImage();

    const marker = buffer[offset];
    offset += 1;

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    if (offset + 2 > buffer.length) malformedImage();
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      malformedImage();
    }

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (segmentLength < 7 || offset + 7 > buffer.length) malformedImage();
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return malformedImage();
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  if (offset + 3 > buffer.length) malformedImage();
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readWebpDimensions(buffer: Buffer): RasterDimensions {
  if (
    buffer.length < 16 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    malformedImage();
  }

  const chunkType = buffer.subarray(12, 16).toString("ascii");

  if (chunkType === "VP8X") {
    if (buffer.length < 30) malformedImage();
    return {
      width: readUInt24LE(buffer, 24) + 1,
      height: readUInt24LE(buffer, 27) + 1,
    };
  }

  if (chunkType === "VP8 ") {
    if (
      buffer.length < 30 ||
      !hasPrefix(buffer.subarray(23), [0x9d, 0x01, 0x2a])
    ) {
      malformedImage();
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L") {
    if (buffer.length < 25 || buffer[20] !== 0x2f) malformedImage();
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + (b0 | ((b1 & 0x3f) << 8)),
      height: 1 + (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)),
    };
  }

  return malformedImage();
}

function validateResumePhotoDimensions(
  buffer: Buffer,
  mimeType: string,
): void {
  const dimensions =
    mimeType === "image/png"
      ? readPngDimensions(buffer)
      : mimeType === "image/jpeg"
        ? readJpegDimensions(buffer)
        : mimeType === "image/webp"
          ? readWebpDimensions(buffer)
          : malformedImage();

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    malformedImage();
  }

  if (
    dimensions.width > RESUME_PHOTO_MAX_SIDE ||
    dimensions.height > RESUME_PHOTO_MAX_SIDE ||
    dimensions.width > Math.floor(RESUME_PHOTO_MAX_PIXELS / dimensions.height)
  ) {
    throw new AppError(
      413,
      "IMAGE_DIMENSIONS_TOO_LARGE",
      "The image dimensions exceed the permitted Candidate Photo limits.",
    );
  }
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

  if (input.purpose === "resume-photo") {
    validateResumePhotoDimensions(input.buffer, input.mimeType);
  }

  return {
    checksumSha256: createHash("sha256").update(input.buffer).digest("hex"),
  };
}
