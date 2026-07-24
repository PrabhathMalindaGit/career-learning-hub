import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { env } from "../../config/env.js";

function payload(assetId: string, expires: number): string {
  return `${assetId}.${expires}`;
}

export function signLocalAssetDownload(
  assetId: string,
  expires: number,
): string {
  return createHmac("sha256", env.ASSET_SIGNING_SECRET)
    .update(payload(assetId, expires))
    .digest("hex");
}

export function verifyLocalAssetDownload(
  assetId: string,
  expires: number,
  suppliedSignature: string,
): boolean {
  if (expires <= Math.floor(Date.now() / 1000)) return false;

  const expected = signLocalAssetDownload(assetId, expires);
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(suppliedSignature, "hex");

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
