import { describe, expect, it } from "vitest";
import { uploadAssetBodySchema } from "../../modules/assets/asset.schemas.js";
import { validateAssetFile } from "../../modules/assets/asset.policy.js";

const MAX = 10 * 1024 * 1024;

function png(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  Buffer.from("IHDR", "ascii").copy(buffer, 12);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function jpeg(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(13);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xc0;
  buffer.writeUInt16BE(7, 4);
  buffer[6] = 8;
  buffer.writeUInt16BE(height, 7);
  buffer.writeUInt16BE(width, 9);
  buffer[11] = 1;
  buffer[12] = 1;
  return buffer;
}

function webpVp8x(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  Buffer.from("RIFF", "ascii").copy(buffer, 0);
  buffer.writeUInt32LE(22, 4);
  Buffer.from("WEBP", "ascii").copy(buffer, 8);
  Buffer.from("VP8X", "ascii").copy(buffer, 12);
  buffer.writeUInt32LE(10, 16);
  const w = width - 1;
  const h = height - 1;
  buffer[24] = w & 0xff;
  buffer[25] = (w >> 8) & 0xff;
  buffer[26] = (w >> 16) & 0xff;
  buffer[27] = h & 0xff;
  buffer[28] = (h >> 8) & 0xff;
  buffer[29] = (h >> 16) & 0xff;
  return buffer;
}

function validate(mimeType: string, buffer: Buffer) {
  return validateAssetFile({
    purpose: "resume-photo",
    mimeType,
    sizeBytes: buffer.length,
    buffer,
    globalMaxSizeBytes: MAX,
  });
}

describe("Candidate Photo asset policy", () => {
  it.each([
    ["image/png", png(800, 1000)],
    ["image/jpeg", jpeg(800, 1000)],
    ["image/webp", webpVp8x(800, 1000)],
  ])("accepts bounded %s raster dimensions", (mimeType, buffer) => {
    expect(validate(mimeType, buffer)).toEqual({
      checksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("rejects resume-photo through the generic upload schema", () => {
    expect(
      uploadAssetBodySchema.safeParse({ purpose: "resume-photo" }).success,
    ).toBe(false);
  });

  it("rejects unsupported and mismatched files", () => {
    expect(() => validate("image/svg+xml", Buffer.from("<svg/>"))).toThrow();
    expect(() => validate("image/png", jpeg(100, 100))).toThrow();
  });

  it("rejects oversized encoded files", () => {
    const buffer = Buffer.alloc(2 * 1024 * 1024 + 1);
    png(100, 100).copy(buffer, 0);
    expect(() => validate("image/png", buffer)).toThrow();
  });

  it.each([
    [png(4097, 100), "image/png"],
    [jpeg(100, 4097), "image/jpeg"],
    [webpVp8x(4001, 4000), "image/webp"],
  ])("rejects excessive raster dimensions", (buffer, mimeType) => {
    expect(() => validate(mimeType, buffer)).toThrow();
  });

  it.each([
    ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff])],
    ["image/webp", Buffer.from("RIFF0000WEBP")],
  ])("rejects truncated %s headers", (mimeType, buffer) => {
    expect(() => validate(mimeType, buffer)).toThrow();
  });
});
