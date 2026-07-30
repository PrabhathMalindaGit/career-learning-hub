import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  DownloadTarget,
  PrivateStorageAdapter,
  PutObjectInput,
} from "./storage.types.js";

export interface S3PrivateStorageOptions {
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class S3PrivateStorageAdapter implements PrivateStorageAdapter {
  readonly provider = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3PrivateStorageOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  async initialize(): Promise<void> {
    await this.healthCheck();
  }

  async healthCheck(): Promise<void> {
    await this.client.send(
      new HeadBucketCommand({
        Bucket: this.bucket,
      }),
    );
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ChecksumSHA256: Buffer.from(input.checksumSha256, "hex").toString("base64"),
        ServerSideEncryption: "AES256",
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getObjectBuffer(
    key: string,
    maximumBytes: number,
  ): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (
      response.ContentLength !== undefined &&
      response.ContentLength > maximumBytes
    ) {
      throw new Error("The stored object exceeds the permitted read size.");
    }

    if (!response.Body) {
      throw new Error("The S3 object did not contain a response body.");
    }

    const bytes = await response.Body.transformToByteArray();

    if (bytes.byteLength > maximumBytes) {
      throw new Error("The stored object exceeds the permitted read size.");
    }

    return Buffer.from(bytes);
  }

  async createDownloadTarget(
    key: string,
    expiresInSeconds: number,
  ): Promise<DownloadTarget> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return {
      kind: "redirect",
      url: await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      }),
    };
  }
}
