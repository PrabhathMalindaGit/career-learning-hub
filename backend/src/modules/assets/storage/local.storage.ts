import { constants, createReadStream } from "node:fs";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../../shared/appError.js";
import type {
  DownloadTarget,
  PrivateStorageAdapter,
  PutObjectInput,
} from "./storage.types.js";

export class LocalPrivateStorageAdapter implements PrivateStorageAdapter {
  readonly provider = "local" as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(process.cwd(), root);
  }

  async initialize(): Promise<void> {
    await mkdir(this.root, { recursive: true });
  }

  async healthCheck(): Promise<void> {
    await access(
      this.root,
      constants.R_OK | constants.W_OK,
    );
  }

  private resolveKey(key: string): string {
    const resolved = path.resolve(this.root, key);
    const relative = path.relative(this.root, resolved);

    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      throw new AppError(
        400,
        "INVALID_STORAGE_KEY",
        "The storage key is invalid.",
      );
    }

    return resolved;
  }

  async putObject(input: PutObjectInput): Promise<void> {
    const destination = this.resolveKey(input.key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, input.body, { flag: "wx" });
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  async getObjectBuffer(
    key: string,
    maximumBytes: number,
  ): Promise<Buffer> {
    const filePath = this.resolveKey(key);
    const details = await stat(filePath);

    if (details.size > maximumBytes) {
      throw new AppError(
        413,
        "STORAGE_OBJECT_TOO_LARGE",
        "The stored object exceeds the permitted read size.",
      );
    }

    return readFile(filePath);
  }

  async createDownloadTarget(
    key: string,
    _expiresInSeconds: number,
  ): Promise<DownloadTarget> {
    return {
      kind: "stream",
      stream: createReadStream(this.resolveKey(key)),
    };
  }
}
