import { env } from "../config/env.js";
import { expireCredentialExecutionLeases } from "../modules/ai/aiRouting.service.js";
import {
  nextOpenRouterRefreshDelay,
  refreshOpenRouterCatalogue,
} from "../modules/ai/openRouterCatalogue.service.js";
import { logger, serializeErrorForLog } from "../shared/logger.js";
import { enqueueJob } from "./job.queue.js";
import { registerInfrastructureJobHandlers } from "./job.handlers.js";
import { startJobWorker, type JobWorkerHandle } from "./job.worker.js";

export interface JobSystemHandle {
  stop(): Promise<void>;
}

export async function initializeJobSystem(): Promise<JobSystemHandle> {
  registerInfrastructureJobHandlers();

  let worker: JobWorkerHandle | undefined;
  let openRouterRefreshTimer: NodeJS.Timeout | undefined;
  let stopping = false;
  if (env.JOB_WORKER_ENABLED) {
    worker = startJobWorker();
  }

  async function enqueueAssetCleanup(): Promise<void> {
    const hour = new Date().toISOString().slice(0, 13);
    await enqueueJob({
      type: "assets.cleanup",
      payload: { batchSize: 100 },
      maxAttempts: 3,
      priority: -10,
      idempotencyKey: `assets.cleanup:${hour}`,
    }).catch((error) => {
      logger.error("asset.cleanup-enqueue.failed", {
        ...serializeErrorForLog(error),
      });
    });
  }

  async function expireAiCredentialLeases(): Promise<void> {
    if (!env.AI_ROUTING_FOUNDATION_ENABLED) return;
    await expireCredentialExecutionLeases().catch((error) => {
      logger.error("ai.credential-lease-expiry.failed", {
        ...serializeErrorForLog(error),
      });
    });
  }

  async function refreshOpenRouterAndSchedule(): Promise<void> {
    if (!env.AI_ROUTING_FOUNDATION_ENABLED || stopping) return;
    await refreshOpenRouterCatalogue({
      ownerId: `${env.JOB_WORKER_ID}:openrouter-catalogue`,
    }).catch((error) => {
      logger.error("ai.openrouter-catalogue-refresh.failed", {
        ...serializeErrorForLog(error),
      });
    });
    if (stopping) return;
    openRouterRefreshTimer = setTimeout(
      () => void refreshOpenRouterAndSchedule(),
      nextOpenRouterRefreshDelay(),
    );
    openRouterRefreshTimer.unref();
  }

  await Promise.all([
    enqueueAssetCleanup(),
    expireAiCredentialLeases(),
  ]);
  void refreshOpenRouterAndSchedule();

  const maintenanceTimer = setInterval(
    () => void enqueueAssetCleanup(),
    60 * 60 * 1_000,
  );
  maintenanceTimer.unref();
  const credentialLeaseTimer = setInterval(
    () => void expireAiCredentialLeases(),
    Math.max(
      5_000,
      Math.min(15_000, Math.floor((env.JOB_LEASE_SECONDS * 1_000) / 3)),
    ),
  );
  credentialLeaseTimer.unref();

  return {
    async stop() {
      stopping = true;
      clearInterval(maintenanceTimer);
      clearInterval(credentialLeaseTimer);
      if (openRouterRefreshTimer) clearTimeout(openRouterRefreshTimer);
      await worker?.stop();
    },
  };
}
