import { z } from "zod";
import { AppError } from "../shared/appError.js";

export interface JobExecutionContext {
  jobId: string;
  userId?: string;
  attempt: number;
  reportProgress(progress: number): Promise<void>;
  heartbeat(): Promise<void>;
}

interface RuntimeHandler {
  schema: z.ZodTypeAny;
  handler: (
    payload: unknown,
    context: JobExecutionContext,
  ) => Promise<unknown>;
}

const registry = new Map<string, RuntimeHandler>();

export function registerJobHandler<TSchema extends z.ZodTypeAny>(
  type: string,
  schema: TSchema,
  handler: (
    payload: z.infer<TSchema>,
    context: JobExecutionContext,
  ) => Promise<unknown>,
): void {
  if (registry.has(type)) {
    throw new Error(`A handler is already registered for ${type}.`);
  }

  registry.set(type, {
    schema,
    handler: handler as RuntimeHandler["handler"],
  });
}

export function getJobHandler(type: string): RuntimeHandler {
  const registered = registry.get(type);

  if (!registered) {
    throw new AppError(
      500,
      "JOB_HANDLER_NOT_FOUND",
      `No job handler is registered for ${type}.`,
    );
  }

  return registered;
}
