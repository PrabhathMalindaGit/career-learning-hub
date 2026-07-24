import type { Request, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  identifier: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: Request) => string;
}

export function createRateLimiter(
  options: RateLimiterOptions,
): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests:
      options.skipSuccessfulRequests ?? false,
    keyGenerator: options.keyGenerator,
    passOnStoreError: false,
    handler(request, response) {
      response.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message:
            "Too many requests. Please try again later.",
          requestId: request.requestId,
          limiter: options.identifier,
        },
      });
    },
  });
}

const authenticatedUserKey = (request: Request) =>
  request.auth?.userId
    ? `user:${request.auth.userId}`
    : "unauthenticated";

export const apiRateLimiter = createRateLimiter({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit: env.GLOBAL_RATE_LIMIT_MAX,
  identifier: "global-api",
});

export const healthRateLimiter = createRateLimiter({
  windowMs: 60 * 1_000,
  limit: env.HEALTH_RATE_LIMIT_MAX,
  identifier: "health",
});

export const registrationRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 10,
    identifier: "auth-register",
  });

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  identifier: "auth-login",
  skipSuccessfulRequests: true,
});

export const refreshRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1_000,
  limit: 60,
  identifier: "auth-refresh",
});

export const resumeImportRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 20,
    identifier: "resume-import",
    keyGenerator: authenticatedUserKey,
  });

export const resumeAnalysisRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 30,
    identifier: "resume-analysis",
    keyGenerator: authenticatedUserKey,
  });

export const interviewGenerationRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 30,
    identifier: "interview-generation",
    keyGenerator: authenticatedUserKey,
  });

export const interviewFeedbackRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 60,
    identifier: "interview-feedback",
    keyGenerator: authenticatedUserKey,
  });

export const learningUploadRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 30,
    identifier: "learning-upload",
    keyGenerator: authenticatedUserKey,
  });

export const learningAiRateLimiter =
  createRateLimiter({
    windowMs: 60 * 60 * 1_000,
    limit: 100,
    identifier: "learning-ai",
    keyGenerator: authenticatedUserKey,
  });

export const dashboardRateLimiter =
  createRateLimiter({
    windowMs: 15 * 60 * 1_000,
    limit: 180,
    identifier: "dashboard",
    keyGenerator: authenticatedUserKey,
  });
