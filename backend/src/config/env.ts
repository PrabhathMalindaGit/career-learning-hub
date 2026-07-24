import { z } from "zod";
import { logger } from "../shared/logger.js";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    CLIENT_ORIGINS: z.string().min(1).default("http://localhost:5173"),
    CORS_MAX_AGE_SECONDS: z.coerce
      .number()
      .int()
      .min(0)
      .max(86_400)
      .default(600),
    TRUST_PROXY_HOPS: z.coerce
      .number()
      .int()
      .min(0)
      .max(5)
      .default(0),
    LOG_LEVEL: z
      .enum(["silent", "error", "warn", "info", "debug"])
      .default("info"),
    REQUEST_LOGGING_ENABLED: booleanFromEnv.default(true),
    GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(24 * 60 * 60 * 1_000)
      .default(15 * 60 * 1_000),
    GLOBAL_RATE_LIMIT_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(100_000)
      .default(300),
    HEALTH_RATE_LIMIT_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(10_000)
      .default(120),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(10_000)
      .default(1_500),
    SHUTDOWN_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(120_000)
      .default(15_000),
    SERVER_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(5_000)
      .max(10 * 60 * 1_000)
      .default(120_000),
    SERVER_HEADERS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(5_000)
      .max(10 * 60 * 1_000)
      .default(65_000),
    SERVER_KEEP_ALIVE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(5 * 60 * 1_000)
      .default(60_000),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    REFRESH_COOKIE_NAME: z.string().min(1).default("clh_refresh"),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    API_PUBLIC_ORIGIN: z.string().url().default("http://localhost:8000"),
    ASSET_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    ASSET_LOCAL_ROOT: z.string().min(1).default("./storage/private"),
    ASSET_MAX_FILE_SIZE_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .max(100 * 1024 * 1024)
      .default(15 * 1024 * 1024),
    ASSET_USER_QUOTA_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .default(250 * 1024 * 1024),
    ASSET_SIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(30)
      .max(3600)
      .default(300),
    ASSET_SIGNING_SECRET: z.string().min(32),

    AWS_REGION: optionalString,
    AWS_S3_BUCKET: optionalString,
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    AWS_S3_ENDPOINT: optionalString,
    AWS_S3_FORCE_PATH_STYLE: booleanFromEnv.default(false),

    AI_DEFAULT_PROVIDER: z.enum(["gemini"]).default("gemini"),
    GEMINI_API_KEY: optionalString,
    GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
    AI_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(120_000)
      .default(30_000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().min(1).default(100),
    AI_DAILY_TOKEN_LIMIT: z.coerce.number().int().min(1_000).default(500_000),

    JOB_WORKER_ENABLED: booleanFromEnv.default(true),
    JOB_WORKER_ID: z.string().min(1).max(120).default("api-local-worker"),
    JOB_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60_000).default(1_000),
    JOB_LEASE_SECONDS: z.coerce.number().int().min(15).max(900).default(60),
    JOB_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
    JOB_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    RESUME_PDF_MAX_PAGES: z.coerce
      .number()
      .int()
      .min(1)
      .max(250)
      .default(50),
    RESUME_PDF_MAX_TEXT_CHARACTERS: z.coerce
      .number()
      .int()
      .min(5_000)
      .max(500_000)
      .default(120_000),
    RESUME_ANALYSIS_JOB_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(5)
      .default(3),

    INTERVIEW_MAX_QUESTIONS_PER_SESSION: z.coerce
      .number()
      .int()
      .min(20)
      .max(5_000)
      .default(500),
    INTERVIEW_MAX_ANSWER_CHARACTERS: z.coerce
      .number()
      .int()
      .min(500)
      .max(50_000)
      .default(12_000),
    INTERVIEW_AI_JOB_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(5)
      .default(3),

    LEARNING_MAX_DOCUMENT_PAGES: z.coerce
      .number()
      .int()
      .min(1)
      .max(1_000)
      .default(250),
    LEARNING_CHUNK_TARGET_WORDS: z.coerce
      .number()
      .int()
      .min(100)
      .max(2_000)
      .default(450),
    LEARNING_CHUNK_OVERLAP_WORDS: z.coerce
      .number()
      .int()
      .min(0)
      .max(500)
      .default(50),
    LEARNING_MAX_CHAT_MESSAGE_CHARACTERS: z.coerce
      .number()
      .int()
      .min(500)
      .max(50_000)
      .default(12_000),
    LEARNING_MAX_FLASHCARDS_PER_SET: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(100),
    LEARNING_MAX_QUIZ_QUESTIONS: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(100),
    LEARNING_AI_JOB_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(5)
      .default(3),

    ENABLE_DEV_ROUTES: booleanFromEnv.default(false),
  })
  .superRefine((value, context) => {
    const originValues = value.CLIENT_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (originValues.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLIENT_ORIGINS"],
        message: "At least one explicit frontend origin is required.",
      });
    }

    for (const origin of originValues) {
      if (origin === "*" || origin.includes("*")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CLIENT_ORIGINS"],
          message: "Wildcard CORS origins are not permitted.",
        });
        continue;
      }

      try {
        const url = new URL(origin);
        if (
          url.origin !== origin.replace(/\/$/, "") ||
          url.username ||
          url.password ||
          url.search ||
          url.hash
        ) {
          throw new Error("Origin must contain only scheme, host, and port.");
        }

        const localHost =
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname === "::1";

        if (
          value.NODE_ENV === "production" &&
          url.protocol !== "https:" &&
          !localHost
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["CLIENT_ORIGINS"],
            message:
              "Production frontend origins must use HTTPS.",
          });
        }
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CLIENT_ORIGINS"],
          message: `Invalid frontend origin: ${origin}`,
        });
      }
    }

    const secretValues = [
      value.JWT_ACCESS_SECRET,
      value.JWT_REFRESH_SECRET,
      value.ASSET_SIGNING_SECRET,
    ];

    if (new Set(secretValues).size !== secretValues.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message:
          "Access, refresh, and asset-signing secrets must be different.",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      secretValues.some((secret) =>
        /replace|example|changeme|development/i.test(secret),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message:
          "Placeholder secrets are not permitted in production.",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.BCRYPT_ROUNDS < 12
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["BCRYPT_ROUNDS"],
        message:
          "Production BCRYPT_ROUNDS must be at least 12.",
      });
    }

    if (
      value.SERVER_HEADERS_TIMEOUT_MS <=
      value.SERVER_KEEP_ALIVE_TIMEOUT_MS
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SERVER_HEADERS_TIMEOUT_MS"],
        message:
          "SERVER_HEADERS_TIMEOUT_MS must exceed SERVER_KEEP_ALIVE_TIMEOUT_MS.",
      });
    }

    if (value.ASSET_STORAGE_DRIVER === "s3") {
      for (const field of ["AWS_REGION", "AWS_S3_BUCKET"] as const) {
        if (!value[field]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required when ASSET_STORAGE_DRIVER=s3.`,
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("environment.validation.failed", {
    invalidFields: Object.keys(
      parsed.error.flatten().fieldErrors,
    ),
  });
  throw new Error("Environment validation failed.");
}

const clientOrigins = [
  ...new Set(
    parsed.data.CLIENT_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin),
  ),
];

export const env = {
  ...parsed.data,
  clientOrigins,
  isProduction: parsed.data.NODE_ENV === "production",
};
