import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { getPrivateStorage } from "../assets/storage/storage.factory.js";
import { getRuntimeReadiness } from "./runtimeReadiness.js";

async function withTimeout<T>(
  operation: Promise<T>,
  milliseconds: number,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Health dependency check timed out.",
              ),
            ),
          milliseconds,
        );
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function databaseStatus(): Promise<{
  ready: boolean;
  state: string;
}> {
  const state = mongoose.connection.readyState;
  const labels: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };

  if (state !== 1 || !mongoose.connection.db) {
    return {
      ready: false,
      state: labels[state] ?? "unknown",
    };
  }

  try {
    await withTimeout(
      mongoose.connection.db.admin().ping(),
      env.HEALTH_CHECK_TIMEOUT_MS,
    );
    return { ready: true, state: "connected" };
  } catch {
    return { ready: false, state: "unresponsive" };
  }
}

async function storageStatus(
  initialized: boolean,
): Promise<{
  ready: boolean;
  driver: string;
}> {
  if (!initialized) {
    return {
      ready: false,
      driver: env.ASSET_STORAGE_DRIVER,
    };
  }

  try {
    await withTimeout(
      getPrivateStorage().healthCheck(),
      env.HEALTH_CHECK_TIMEOUT_MS,
    );
    return {
      ready: true,
      driver: env.ASSET_STORAGE_DRIVER,
    };
  } catch {
    return {
      ready: false,
      driver: env.ASSET_STORAGE_DRIVER,
    };
  }
}

export async function getReadinessStatus() {
  const runtime = getRuntimeReadiness();
  const [database, storage] = await Promise.all([
    databaseStatus(),
    storageStatus(runtime.storageReady),
  ]);

  const ready =
    database.ready &&
    storage.ready &&
    runtime.storageReady &&
    runtime.jobsReady &&
    !runtime.shuttingDown;

  return {
    ready,
    service: "career-learning-hub-api",
    status: ready ? "ready" : "not-ready",
    dependencies: {
      database,
      storage: {
        ready: runtime.storageReady,
        driver: env.ASSET_STORAGE_DRIVER,
      },
      jobs: {
        ready: runtime.jobsReady,
        enabled: env.JOB_WORKER_ENABLED,
      },
    },
    shuttingDown: runtime.shuttingDown,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

export function getLivenessStatus() {
  const runtime = getRuntimeReadiness();

  return {
    live: !runtime.shuttingDown,
    service: "career-learning-hub-api",
    status: runtime.shuttingDown
      ? "shutting-down"
      : "alive",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
