import { env } from "../config/env.js";
import { AppError } from "../shared/appError.js";
import { logger, serializeErrorForLog } from "../shared/logger.js";
import { getJobHandler } from "./job.registry.js";
import {
  assertJobExecutionActive,
  beginJobPersistence,
  claimNextJob,
  completeJob,
  failOrRetryJob,
  heartbeatJob,
  updateJobProgress,
  updateJobPhase,
} from "./job.queue.js";
import {
  abortAllActiveJobExecutions,
  abortActiveJobExecution,
  registerActiveJobExecution,
  unregisterActiveJobExecution,
} from "./job.execution.js";
import type { JobExecutionIdentity } from "./job.model.js";

export interface JobWorkerHandle {
  stop(): Promise<void>;
}

// Feature 7.4 — Shared background-job execution boundary.
// Executes registered durable work with the existing lease, cancellation,
// retry, progress, and completion-safety rules.
// Feature 7.4 BACKEND — Durable background-job worker.
export function startJobWorker(): JobWorkerHandle {
  let stopping = false;
  let active = 0;
  let timer: NodeJS.Timeout | undefined;

  async function processOne(): Promise<void> {
    const job = await claimNextJob();
    if (!job) return;
    if (!job.executionId) {
      throw new Error("A claimed job is missing its execution ID.");
    }

    const execution: JobExecutionIdentity = {
      jobId: job._id.toString(),
      executionId: job.executionId,
      attempt: job.attempts,
    };
    const controller = new AbortController();
    registerActiveJobExecution(execution, controller);
    const deadlineTimer = setTimeout(() => {
      abortActiveJobExecution(execution, "job_attempt_timeout");
    }, env.AI_JOB_ATTEMPT_TIMEOUT_MS);
    deadlineTimer.unref();

    active += 1;
    const heartbeatTimer = setInterval(
      () =>
        heartbeatJob(execution).catch((error) => {
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

      const assertSignalActive = () => {
        if (!controller.signal.aborted) return;
        if (controller.signal.reason === "job_attempt_timeout") {
          throw new AppError(
            504,
            "AI_JOB_ATTEMPT_TIMEOUT",
            "The AI job attempt took too long.",
            undefined,
            false,
            "CANCELLED",
            "job_attempt",
          );
        }
        if (controller.signal.reason === "worker_stopping") {
          throw new AppError(
            503,
            "JOB_WORKER_STOPPED",
            "The job worker stopped before the attempt completed.",
            undefined,
            true,
          );
        }
        throw new AppError(
          409,
          "JOB_EXECUTION_CANCELLED",
          "The job execution was cancelled.",
          undefined,
          false,
          "CANCELLED",
        );
      };

      const result = await registered.handler(payload, {
        ...execution,
        userId: job.userId?.toString(),
        signal: controller.signal,
        reportProgress: (progress) =>
          updateJobProgress(execution, progress),
        reportPhase: async (phase) => {
          assertSignalActive();
          await updateJobPhase(execution, phase);
        },
        assertActive: async (session) => {
          assertSignalActive();
          await assertJobExecutionActive(execution, session);
        },
        beginPersistence: async () => {
          assertSignalActive();
          await beginJobPersistence(execution);
        },
        heartbeat: () => heartbeatJob(execution),
      });

      assertSignalActive();
      await beginJobPersistence(execution);
      assertSignalActive();
      await completeJob(execution, result, job.expiresAt);
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
      clearTimeout(deadlineTimer);
      unregisterActiveJobExecution(execution);
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
      abortAllActiveJobExecutions("worker_stopping");

      const deadline = Date.now() + env.JOB_LEASE_SECONDS * 1_000;
      while (active > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
  };
}
