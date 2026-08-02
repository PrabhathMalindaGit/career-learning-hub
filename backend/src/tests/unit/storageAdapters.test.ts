import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { validateAssetFile } from "../../modules/assets/asset.policy.js";
import {
  createAsset,
  deleteOwnedAsset,
} from "../../modules/assets/asset.service.js";
import { LocalPrivateStorageAdapter } from "../../modules/assets/storage/local.storage.js";
import { S3PrivateStorageAdapter } from "../../modules/assets/storage/s3.storage.js";
import { getStorageForProvider } from "../../modules/assets/storage/storage.factory.js";
import { getReadinessStatus } from "../../modules/health/health.service.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
});

describe("private storage adapters", () => {
  it("rejects upload content that does not match its declared PDF type", () => {
    const body = Buffer.from("synthetic non-PDF content");

    expect(() =>
      validateAssetFile({
        purpose: "learning-document",
        mimeType: "application/pdf",
        sizeBytes: body.byteLength,
        buffer: body,
        globalMaxSizeBytes: 15 * 1024 * 1024,
      }),
    ).toThrow("The file contents do not match the declared MIME type.");
  });

  it("selects and caches the configured local adapter", () => {
    const first = getStorageForProvider("local");
    const second = getStorageForProvider("local");

    expect(first).toBe(second);
    expect(first).toBeInstanceOf(LocalPrivateStorageAdapter);
    expect(first.provider).toBe("local");
  });

  it("stores, reads, streams, health-checks, and deletes local objects", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "career-learning-hub-storage-unit-"),
    );
    temporaryRoots.push(root);
    const adapter = new LocalPrivateStorageAdapter(root);
    const body = Buffer.from("synthetic private storage content");
    const key = "synthetic-owner/2026/07/object";

    await adapter.initialize();
    await expect(adapter.healthCheck()).resolves.toBeUndefined();
    await adapter.putObject({
      key,
      body,
      contentType: "application/pdf",
      checksumSha256:
        "db42778eb8c424349b717257e598409f6a7a318a8a9b1f4260d64ee999f8c7d5",
    });

    await expect(
      adapter.getObjectBuffer(key, body.byteLength - 1),
    ).rejects.toThrow(
      "The stored object exceeds the permitted read size.",
    );
    await expect(
      adapter.getObjectBuffer(key, body.byteLength),
    ).resolves.toEqual(body);

    const target = await adapter.createDownloadTarget(key, 60);
    expect(target.kind).toBe("stream");
    if (target.kind === "stream") {
      const chunks: Buffer[] = [];
      for await (const chunk of target.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks)).toEqual(body);
    }

    await adapter.deleteObject(key);
    await expect(
      adapter.getObjectBuffer(key, body.byteLength),
    ).rejects.toThrow();
  });

  it("uses private, encrypted S3 commands without network access", async () => {
    const body = Buffer.from("synthetic S3 object");
    const send = vi
      .spyOn(S3Client.prototype, "send")
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({
        ContentLength: body.byteLength,
        Body: {
          transformToByteArray: async () => body,
        },
      } as never)
      .mockResolvedValueOnce({
        ContentLength: body.byteLength + 1,
      } as never)
      .mockResolvedValueOnce({} as never);
    const adapter = new S3PrivateStorageAdapter({
      region: "ap-southeast-1",
      bucket: "synthetic-private-bucket",
      accessKeyId: "synthetic-access-key-id",
      secretAccessKey: "synthetic-secret-access-key",
    });
    const checksumSha256 =
      "08df6dc7bb38aaf2dea1e6a26fdf712a4fe9b6c65a3a4d1d2763bd697a027670";

    await adapter.initialize();
    await adapter.putObject({
      key: "synthetic-owner/object",
      body,
      contentType: "application/pdf",
      checksumSha256,
    });
    await expect(
      adapter.getObjectBuffer(
        "synthetic-owner/object",
        body.byteLength,
      ),
    ).resolves.toEqual(body);
    await expect(
      adapter.getObjectBuffer(
        "synthetic-owner/object",
        body.byteLength,
      ),
    ).rejects.toThrow(
      "The stored object exceeds the permitted read size.",
    );
    await adapter.deleteObject("synthetic-owner/object");
    const target = await adapter.createDownloadTarget(
      "synthetic-owner/object",
      60,
    );

    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(PutObjectCommand);
    expect(send.mock.calls[2]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[3]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[4]?.[0]).toBeInstanceOf(DeleteObjectCommand);
    expect(target.kind).toBe("redirect");
    if (target.kind === "redirect") {
      expect(new URL(target.url).protocol).toBe("https:");
      expect(new URL(target.url).searchParams.has("X-Amz-Signature")).toBe(
        true,
      );
      expect(
        new URL(target.url).searchParams.get("response-cache-control"),
      ).toBe("private, no-store");
    }
    expect(
      (send.mock.calls[1]?.[0] as PutObjectCommand).input,
    ).toMatchObject({
      Bucket: "synthetic-private-bucket",
      Key: "synthetic-owner/object",
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
      ChecksumSHA256: Buffer.from(
        checksumSha256,
        "hex",
      ).toString("base64"),
    });
  });

  it("deletes an owned Asset record and its stored object", async () => {
    const userId = new Types.ObjectId().toString();
    const body = Buffer.from(
      "%PDF-1.4\n% Synthetic storage deletion PDF\n%%EOF\n",
    );
    const asset = await createAsset({
      userId,
      purpose: "learning-document",
      file: {
        fieldname: "file",
        originalname: "synthetic-delete.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: body.byteLength,
        buffer: body,
        stream: Readable.from(body),
        destination: "",
        filename: "",
        path: "",
      },
    });

    await deleteOwnedAsset(userId, asset._id.toString());

    await expect(
      getStorageForProvider(asset.storageProvider).getObjectBuffer(
        asset.storageKey,
        body.byteLength,
      ),
    ).rejects.toThrow();
    await expect(
      AssetModel.findById(asset._id).lean(),
    ).resolves.toMatchObject({
      status: "deleted",
    });
  });

  it("fails readiness when configured storage health fails", async () => {
    const storage = getStorageForProvider("local");
    vi.spyOn(storage, "healthCheck").mockRejectedValueOnce(
      new Error("Synthetic storage health failure."),
    );

    const readiness = await getReadinessStatus();

    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe("not-ready");
  });
});
