import { env } from "../config/env.js";
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

  await enqueueAssetCleanup();

  const maintenanceTimer = setInterval(
    () => void enqueueAssetCleanup(),
    60 * 60 * 1_000,
  );
  maintenanceTimer.unref();

  return {
    async stop() {
      clearInterval(maintenanceTimer);
      await worker?.stop();
    },
  };
}
