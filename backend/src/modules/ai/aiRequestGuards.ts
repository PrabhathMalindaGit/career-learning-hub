import type { Request, RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{8,128}$/;
const revisionPattern = /^(?:W\/)?"?(\d+)"?$/;

export const requireAiMutationOrigin: RequestHandler = (
  request,
  _response,
  next,
) => {
  const origin = request.get("origin");
  if (!origin) {
    next(new AppError(403, "origin_required", "An allowed request origin is required."));
    return;
  }
  if (!env.clientOrigins.includes(origin)) {
    next(new AppError(403, "ORIGIN_NOT_ALLOWED", "The request origin is not allowed."));
    return;
  }
  next();
};

export const requireAiIdempotencyKey: RequestHandler = (
  request,
  _response,
  next,
) => {
  const key = request.get("idempotency-key");
  if (!key || !idempotencyKeyPattern.test(key)) {
    next(new AppError(
      400,
      "idempotency_key_required",
      "A valid Idempotency-Key header is required.",
    ));
    return;
  }
  next();
};

export const requireAiRevision: RequestHandler = (
  request,
  _response,
  next,
) => {
  const value = request.get("if-match");
  const match = value ? revisionPattern.exec(value) : null;
  const revision = match ? Number(match[1]) : Number.NaN;
  if (!Number.isSafeInteger(revision) || revision < 0) {
    next(new AppError(
      428,
      "routing_configuration_invalid",
      "A current If-Match revision is required.",
    ));
    return;
  }
  next();
};

export function readAiIdempotencyKey(request: Request): string {
  return request.get("idempotency-key")!;
}

export function readAiRevision(request: Request): number | undefined {
  const value = request.get("if-match");
  const match = value ? revisionPattern.exec(value) : null;
  return match ? Number(match[1]) : undefined;
}
