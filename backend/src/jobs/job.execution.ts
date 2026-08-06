import type { JobExecutionIdentity } from "./job.model.js";

interface ActiveJobExecution {
  executionId: string;
  controller: AbortController;
}

const activeExecutions = new Map<string, ActiveJobExecution>();

export function registerActiveJobExecution(
  execution: JobExecutionIdentity,
  controller: AbortController,
): void {
  activeExecutions.set(execution.jobId, {
    executionId: execution.executionId,
    controller,
  });
}

export function abortActiveJobExecution(
  execution: JobExecutionIdentity,
  reason: "user_cancelled" | "lease_lost" | "job_attempt_timeout" | "worker_stopping",
): boolean {
  const active = activeExecutions.get(execution.jobId);
  if (!active || active.executionId !== execution.executionId) return false;
  if (!active.controller.signal.aborted) active.controller.abort(reason);
  return true;
}

export function abortAllActiveJobExecutions(
  reason: "worker_stopping",
): void {
  for (const active of activeExecutions.values()) {
    if (!active.controller.signal.aborted) {
      active.controller.abort(reason);
    }
  }
}

export function unregisterActiveJobExecution(
  execution: JobExecutionIdentity,
): void {
  const active = activeExecutions.get(execution.jobId);
  if (active?.executionId === execution.executionId) {
    activeExecutions.delete(execution.jobId);
  }
}
