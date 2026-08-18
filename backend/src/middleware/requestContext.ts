import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { hashIpAddress } from "../shared/crypto.js";
import {
  logger,
  runWithRequestLogContext,
} from "../shared/logger.js";

const trustedRequestIdPattern = /^[A-Za-z0-9._-]{16,128}$/;

function resolveRequestId(value: string | undefined): string {
  if (value && trustedRequestIdPattern.test(value)) {
    return value;
  }

  return randomUUID();
}

// Feature 7.8 — Request context and diagnostic identity.
// Establishes the bounded request identifier used for safe error correlation.
// Feature 7.8 — Safe Request ID generation/propagation for support/error correlation.
export const requestContextMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  const requestId = resolveRequestId(
    request.get("x-request-id"),
  );
  const startedAt = process.hrtime.bigint();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  runWithRequestLogContext({ requestId }, () => {
    let completed = false;

    response.once("finish", () => {
      completed = true;
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) /
        1_000_000;

      if (
        process.env.REQUEST_LOGGING_ENABLED !== "false"
      ) {
        logger.info("http.request.completed", {
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          userId: request.auth?.userId,
          clientIpHash: hashIpAddress(request.ip),
        });
      }
    });

    response.once("close", () => {
      if (completed) return;

      logger.warn("http.request.aborted", {
        method: request.method,
        path: request.path,
        userId: request.auth?.userId,
        clientIpHash: hashIpAddress(request.ip),
      });
    });

    next();
  });
};
