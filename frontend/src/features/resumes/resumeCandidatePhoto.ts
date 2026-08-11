import { ApiError } from "../../api/apiClient";
import type { CandidatePhotoSource } from "./types";

export const CANDIDATE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const CANDIDATE_PHOTO_MAX_SIDE = 4_096;
export const CANDIDATE_PHOTO_MAX_PIXELS = 16_000_000;

const CANDIDATE_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export class CandidatePhotoError extends Error {
  constructor(
    public readonly code:
      | "UNSUPPORTED_TYPE"
      | "INVALID_SIZE"
      | "INVALID_DIMENSIONS"
      | "UNDECODABLE_IMAGE"
      | "INVALID_SOURCE"
      | "SOURCE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "CandidatePhotoError";
  }
}

function ensureDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > CANDIDATE_PHOTO_MAX_SIDE ||
    height > CANDIDATE_PHOTO_MAX_SIDE ||
    width > Math.floor(CANDIDATE_PHOTO_MAX_PIXELS / height)
  ) {
    throw new CandidatePhotoError(
      "INVALID_DIMENSIONS",
      "Choose an image no larger than 4096 × 4096 pixels and 16 megapixels.",
    );
  }
}

function ensureCandidatePhotoType(type: string): void {
  if (!CANDIDATE_PHOTO_MIME_TYPES.has(type)) {
    throw new CandidatePhotoError(
      "UNSUPPORTED_TYPE",
      "Choose a JPEG, PNG, or WebP image.",
    );
  }
}

function ensureCandidatePhotoSize(size: number): void {
  if (size <= 0 || size > CANDIDATE_PHOTO_MAX_BYTES) {
    throw new CandidatePhotoError(
      "INVALID_SIZE",
      "Choose an image no larger than 2 MiB.",
    );
  }
}

function createImage(url: string): HTMLImageElement {
  const image = new Image();
  image.src = url;
  return image;
}

export async function preflightCandidatePhoto(
  file: File,
  isCurrentSelection: () => boolean,
): Promise<void> {
  ensureCandidatePhotoType(file.type);
  ensureCandidatePhotoSize(file.size);

  const localUrl = URL.createObjectURL(file);
  try {
    const image = createImage(localUrl);
    try {
      await image.decode();
    } catch {
      throw new CandidatePhotoError(
        "UNDECODABLE_IMAGE",
        "This image could not be decoded. Choose a different JPEG, PNG, or WebP file.",
      );
    }

    if (!isCurrentSelection()) {
      throw new DOMException("The selected image changed.", "AbortError");
    }

    ensureDimensions(image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(localUrl);
  }
}

function invalidResumeResponse(): never {
  throw new ApiError(
    502,
    "INVALID_RESUME_RESPONSE",
    "The server returned an invalid resume response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidResumeResponse();
  }
  return value as Record<string, unknown>;
}

export function parseCandidatePhotoAssetIdFromResumeData(
  value: unknown,
): string | undefined {
  const resume = record(record(value).resume);
  const candidatePhotoAssetId = resume.candidatePhotoAssetId;
  if (candidatePhotoAssetId === undefined || candidatePhotoAssetId === null) {
    return undefined;
  }
  if (
    typeof candidatePhotoAssetId !== "string" ||
    !OBJECT_ID_PATTERN.test(candidatePhotoAssetId)
  ) {
    invalidResumeResponse();
  }
  return candidatePhotoAssetId;
}

export function parseCandidatePhotoSource(value: unknown): CandidatePhotoSource {
  const item = record(value);
  if (
    Object.keys(item).some((key) => key !== "url" && key !== "expiresAt") ||
    !("url" in item) ||
    !("expiresAt" in item) ||
    typeof item.url !== "string" ||
    item.url.length === 0 ||
    item.url.length > 2_000 ||
    typeof item.expiresAt !== "string" ||
    Number.isNaN(Date.parse(item.expiresAt))
  ) {
    invalidResumeResponse();
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(item.url);
  } catch {
    return invalidResumeResponse();
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    invalidResumeResponse();
  }

  return { url: item.url, expiresAt: item.expiresAt };
}

export async function loadCanonicalCandidatePhoto(
  source: CandidatePhotoSource,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(source.url, {
    method: "GET",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new CandidatePhotoError(
      "SOURCE_UNAVAILABLE",
      "The saved candidate photo could not be loaded. Try again.",
    );
  }

  const mimeType = (response.headers.get("Content-Type") ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  ensureCandidatePhotoType(mimeType);

  const declaredLength = response.headers.get("Content-Length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isFinite(parsedLength) || parsedLength <= 0) {
      throw new CandidatePhotoError(
        "INVALID_SOURCE",
        "The saved candidate photo response was invalid.",
      );
    }
    ensureCandidatePhotoSize(parsedLength);
  }

  const blob = await response.blob();
  ensureCandidatePhotoSize(blob.size);
  if (signal?.aborted) {
    throw new DOMException("The candidate photo request was aborted.", "AbortError");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = createImage(objectUrl);
    try {
      await image.decode();
    } catch {
      throw new CandidatePhotoError(
        "UNDECODABLE_IMAGE",
        "The saved candidate photo could not be decoded. Try re-uploading it.",
      );
    }
    if (signal?.aborted) {
      throw new DOMException("The candidate photo request was aborted.", "AbortError");
    }
    ensureDimensions(image.naturalWidth, image.naturalHeight);
    return objectUrl;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
