import type { CorsOptions } from "cors";
import { env } from "./env.js";
import { AppError } from "../shared/appError.js";

const allowedOrigins = new Set(env.clientOrigins);

export function isAllowedOrigin(
  origin: string | undefined,
): boolean {
  if (!origin) return true;

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        403,
        "ORIGIN_NOT_ALLOWED",
        "The request origin is not allowed.",
      ),
    );
  },
  credentials: true,
  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Accept",
    "Authorization",
    "Content-Type",
    "If-Match",
    "X-Request-Id",
  ],
  exposedHeaders: [
    "X-Request-Id",
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
    "Retry-After",
  ],
  maxAge: env.CORS_MAX_AGE_SECONDS,
  optionsSuccessStatus: 204,
};
