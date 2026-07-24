import { env } from "../config/env.js";
import { logger, serializeErrorForLog } from "../shared/logger.js";
import { getJobHandler } from "./job.registry.js";
import {
  claimNextJob,
  completeJob,
  failOrRetryJob,
  heartbeatJob,
  updateJobProgress,
} from "./job.queue.js";

export interface JobWorkerHandle {
  stop(): Promise<void>;
}

export function startJobWorker(): JobWorkerHandle {
  let stopping = false;
  let active = 0;
  let timer: NodeJS.Timeout | undefined;

  async function processOne(): Promise<void> {
    const job = await claimNextJob();
    if (!job) return;

    active += 1;
    const heartbeatTimer = setInterval(
      () =>
        heartbeatJob(job._id.toString()).catch((error) => {
          logger.warn("job.heartbeat.failed", {
            jobId: job._id.toString(),
            jobType: job.type,
            ...serializeErrorForLog(error),
          });
        }),
      Math.max(5_000, Math.floor((env.JOB_LEASE_SECONDS * 1_000) / 3)),
    );
    heartbeatTimer.unref();

    try {
      const registered = getJobHandler(job.type);
      const payload = registered.schema.parse(job.payload);

      const result = await registered.handler(payload, {
        jobId: job._id.toString(),
        userId: job.userId?.toString(),
        attempt: job.attempts,
        reportProgress: (progress) =>
          updateJobProgress(job._id.toString(), progress),
        heartbeat: () => heartbeatJob(job._id.toString()),
      });

      await completeJob(job._id.toString(), result);
    } catch (error) {
      logger.error("job.execution.failed", {
        jobId: job._id.toString(),
        jobType: job.type,
        attempt: job.attempts,
        ...serializeErrorForLog(error),
      });
      await failOrRetryJob(job, error);
    } finally {
      clearInterval(heartbeatTimer);
      active -= 1;
    }
  }

  async function tick(): Promise<void> {
    if (stopping) return;

    const available = Math.max(
      0,
      env.JOB_MAX_CONCURRENCY - active,
    );

    await Promise.all(
      Array.from({ length: available }, () =>
        processOne().catch((error) => {
          logger.error("job.worker-loop.failed", {
            ...serializeErrorForLog(error),
          });
        }),
      ),
    );

    if (!stopping) {
      timer = setTimeout(tick, env.JOB_POLL_INTERVAL_MS);
      timer.unref();
    }
  }

  void tick();

  return {
    async stop() {
      stopping = true;
      if (timer) clearTimeout(timer);

      const deadline = Date.now() + env.JOB_LEASE_SECONDS * 1_000;
      while (active > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
  };
}
