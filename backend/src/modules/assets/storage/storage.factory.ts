import { env } from "../../../config/env.js";
import { LocalPrivateStorageAdapter } from "./local.storage.js";
import { S3PrivateStorageAdapter } from "./s3.storage.js";
import type { PrivateStorageAdapter } from "./storage.types.js";

const adapters = new Map<"local" | "s3", PrivateStorageAdapter>();

function createAdapter(provider: "local" | "s3"): PrivateStorageAdapter {
  if (provider === "s3") {
    if (!env.AWS_REGION || !env.AWS_S3_BUCKET) {
      throw new Error(
        "S3 storage was requested but AWS_REGION or AWS_S3_BUCKET is missing.",
      );
    }

    return new S3PrivateStorageAdapter({
      region: env.AWS_REGION,
      bucket: env.AWS_S3_BUCKET,
      endpoint: env.AWS_S3_ENDPOINT,
      forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    });
  }

  return new LocalPrivateStorageAdapter(env.ASSET_LOCAL_ROOT);
}

export function getStorageForProvider(
  provider: "local" | "s3",
): PrivateStorageAdapter {
  const existing = adapters.get(provider);
  if (existing) return existing;

  const adapter = createAdapter(provider);
  adapters.set(provider, adapter);
  return adapter;
}

export function getPrivateStorage(): PrivateStorageAdapter {
  return getStorageForProvider(env.ASSET_STORAGE_DRIVER);
}

export async function initializePrivateStorage(): Promise<void> {
  await getPrivateStorage().initialize();
}
