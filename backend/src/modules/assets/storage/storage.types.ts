import type { Readable } from "node:stream";

export type DownloadTarget =
  | {
      kind: "stream";
      stream: Readable;
    }
  | {
      kind: "redirect";
      url: string;
    };

export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  checksumSha256: string;
}

export interface PrivateStorageAdapter {
  readonly provider: "local" | "s3";
  initialize(): Promise<void>;
  healthCheck(): Promise<void>;
  putObject(input: PutObjectInput): Promise<void>;
  deleteObject(key: string): Promise<void>;
  getObjectBuffer(key: string, maximumBytes: number): Promise<Buffer>;
  createDownloadTarget(key: string, expiresInSeconds: number): Promise<DownloadTarget>;
}
