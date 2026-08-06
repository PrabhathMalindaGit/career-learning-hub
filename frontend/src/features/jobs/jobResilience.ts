import {
  ApiError,
  requestWithStatusMetadata,
} from "../../api/apiClient";

export const safeJobPhases = [
  "queued",
  "preparing",
  "contacting_provider",
  "waiting_for_first_response",
  "receiving_response",
  "validating",
  "persisting",
  "retry_scheduled",
  "completed",
  "failed",
  "cancelled",
] as const;

export type SafeJobPhase = (typeof safeJobPhases)[number];
export type SafeJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface SafeJob {
  id: string;
  type: string;
  status: SafeJobStatus;
  phase: SafeJobPhase;
  phaseSequence: number;
  progress: number;
  attempts: number;
  maxAttempts: number;
  canRetry: boolean;
  retryOfJobId?: string;
  rootJobId?: string;
  error?: {
    code: string;
    message: string;
    classification?: string;
    retryable?: boolean;
    timeoutPhase?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type JobResilienceMetadata = Pick<
  SafeJob,
  | "phase"
  | "phaseSequence"
  | "canRetry"
  | "retryOfJobId"
  | "rootJobId"
>;

export type PartialJobResilienceMetadata = Partial<JobResilienceMetadata>;

export function defaultPhaseForStatus(status: SafeJobStatus): SafeJobPhase {
  if (status === "processing") return "preparing";
  return status;
}

export function parseJobResilienceMetadata(
  value: Record<string, unknown>,
  status: SafeJobStatus,
): JobResilienceMetadata {
  const retryOfJobId = optionalString(value.retryOfJobId, 120);
  const rootJobId = optionalString(value.rootJobId, 120);
  return {
    phase:
      value.phase === undefined
        ? defaultPhaseForStatus(status)
        : safePhase(value.phase),
    phaseSequence:
      value.phaseSequence === undefined
        ? 0
        : boundedInteger(value.phaseSequence, 0, Number.MAX_SAFE_INTEGER),
    canRetry: value.canRetry === true,
    ...(retryOfJobId ? { retryOfJobId } : {}),
    ...(rootJobId ? { rootJobId } : {}),
  };
}

const forbiddenJobFields = [
  "payload",
  "routing",
  "aiRoutingSnapshot",
  "executionId",
  "lockedBy",
  "provider",
  "model",
  "stack",
] as const;

const phaseLabels: Readonly<Record<SafeJobPhase, string>> = {
  queued: "Queued",
  preparing: "Preparing",
  contacting_provider: "Contacting Gemini",
  waiting_for_first_response: "Waiting for response",
  receiving_response: "Processing response",
  validating: "Validating",
  persisting: "Saving",
  retry_scheduled: "Retrying",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

function invalidJob(): never {
  throw new ApiError(
    502,
    "INVALID_JOB_RESPONSE",
    "The server returned an invalid job response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidJob();
  }
  return value as Record<string, unknown>;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalidJob();
  }
  return value;
}

function nonEmptyString(value: unknown, maximum = 2_000): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum
  ) {
    invalidJob();
  }
  return value;
}

function optionalString(value: unknown, maximum = 200): string | undefined {
  if (value === undefined) return undefined;
  return nonEmptyString(value, maximum);
}

function safeStatus(value: unknown): SafeJobStatus {
  if (
    value !== "queued" &&
    value !== "processing" &&
    value !== "completed" &&
    value !== "failed" &&
    value !== "cancelled"
  ) {
    invalidJob();
  }
  return value;
}

function safePhase(value: unknown): SafeJobPhase {
  if (!safeJobPhases.includes(value as SafeJobPhase)) invalidJob();
  return value as SafeJobPhase;
}

export function phaseLabel(phase: SafeJobPhase): string {
  return phaseLabels[phase];
}

export function normalizeSafeJob(job: {
  id: string;
  type: string;
  status: SafeJobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  error?: SafeJob["error"];
  createdAt: string;
  updatedAt: string;
} & PartialJobResilienceMetadata): SafeJob {
  return {
    ...job,
    phase: job.phase ?? defaultPhaseForStatus(job.status),
    phaseSequence: job.phaseSequence ?? 0,
    canRetry: job.canRetry ?? false,
  };
}

export function parseSafeJob(value: unknown): SafeJob {
  const item = record(value);
  const allowedJobFields = new Set([
    "id",
    "type",
    "status",
    "phase",
    "phaseSequence",
    "progress",
    "attempts",
    "maxAttempts",
    "canRetry",
    "retryOfJobId",
    "rootJobId",
    "error",
    "createdAt",
    "updatedAt",
  ]);
  if (Object.keys(item).some((key) => !allowedJobFields.has(key))) {
    invalidJob();
  }
  for (const field of forbiddenJobFields) {
    if (Object.hasOwn(item, field)) invalidJob();
  }
  const status = safeStatus(item.status);
  const phase = safePhase(item.phase);
  const errorItem =
    item.error === undefined ? undefined : record(item.error);
  if (errorItem) {
    const allowedErrorFields = new Set([
      "code",
      "message",
      "classification",
      "retryable",
      "timeoutPhase",
    ]);
    if (Object.keys(errorItem).some((key) => !allowedErrorFields.has(key))) {
      invalidJob();
    }
  }
  const retryOfJobId = optionalString(item.retryOfJobId, 120);
  const rootJobId = optionalString(item.rootJobId, 120);

  return {
    id: nonEmptyString(item.id, 120),
    type: nonEmptyString(item.type, 160),
    status,
    phase,
    phaseSequence: boundedInteger(item.phaseSequence, 0, Number.MAX_SAFE_INTEGER),
    progress: boundedInteger(item.progress, 0, 100),
    attempts: boundedInteger(item.attempts, 0, 100),
    maxAttempts: boundedInteger(item.maxAttempts, 1, 100),
    canRetry: item.canRetry === true,
    ...(retryOfJobId ? { retryOfJobId } : {}),
    ...(rootJobId ? { rootJobId } : {}),
    ...(errorItem
      ? {
          error: {
            code: nonEmptyString(errorItem.code, 160),
            message: nonEmptyString(errorItem.message),
            ...(optionalString(errorItem.classification, 160)
              ? { classification: errorItem.classification as string }
              : {}),
            ...(typeof errorItem.retryable === "boolean"
              ? { retryable: errorItem.retryable }
              : {}),
            ...(optionalString(errorItem.timeoutPhase, 80)
              ? { timeoutPhase: errorItem.timeoutPhase as string }
              : {}),
          },
        }
      : {}),
    createdAt: nonEmptyString(item.createdAt, 80),
    updatedAt: nonEmptyString(item.updatedAt, 80),
  };
}

function parseSafeJobEnvelope(value: unknown): SafeJob {
  return parseSafeJob(record(value).job);
}

export async function cancelJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<SafeJob> {
  let response;
  try {
    response = await requestWithStatusMetadata<unknown>(
      `/jobs/${encodeURIComponent(jobId)}/cancel`,
      { method: "POST", authentication: "required", signal },
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "JOB_NOT_CANCELLABLE") {
      return getJob(jobId, signal);
    }
    throw error;
  }
  if (response.status !== 200) invalidJob();
  return parseSafeJobEnvelope(response.data);
}

export async function getJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<SafeJob> {
  const response = await requestWithStatusMetadata<unknown>(
    `/jobs/${encodeURIComponent(jobId)}`,
    { authentication: "required", signal },
  );
  if (response.status !== 200) invalidJob();
  return parseSafeJobEnvelope(response.data);
}

export async function retryJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<SafeJob> {
  const response = await requestWithStatusMetadata<unknown>(
    `/jobs/${encodeURIComponent(jobId)}/retry`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
  );
  if (response.status !== 202) invalidJob();
  return parseSafeJobEnvelope(response.data);
}

export function createSingleFlightJobPoller() {
  let controller: AbortController | undefined;
  let sequence = 0;

  return {
    async run<T>(
      operation: (signal: AbortSignal) => Promise<T>,
      onResult?: (result: T) => void,
    ): Promise<T> {
      controller?.abort();
      controller = new AbortController();
      const currentController = controller;
      const currentSequence = ++sequence;
      const result = await operation(currentController.signal);
      if (
        !currentController.signal.aborted &&
        currentSequence === sequence
      ) {
        onResult?.(result);
      }
      if (controller === currentController) controller = undefined;
      return result;
    },
    stop(): void {
      sequence += 1;
      controller?.abort();
      controller = undefined;
    },
  };
}
