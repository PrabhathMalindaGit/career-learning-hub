import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function globalSetup() {
  process.env.MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER =
    "true";

  const runtimeRoot = await mkdtemp(
    join(tmpdir(), "career-learning-hub-vitest-"),
  );
  const storageRoot = join(runtimeRoot, "storage");

  const replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const runtimeEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    PORT: "8000",
    MONGODB_URI: replSet.getUri(
      "career_learning_hub_test",
    ),
    CLIENT_ORIGINS: "http://localhost:5173",
    CORS_MAX_AGE_SECONDS: "60",
    TRUST_PROXY_HOPS: "0",
    LOG_LEVEL: "silent",
    REQUEST_LOGGING_ENABLED: "false",
    GLOBAL_RATE_LIMIT_WINDOW_MS: "60000",
    GLOBAL_RATE_LIMIT_MAX: "10000",
    HEALTH_RATE_LIMIT_MAX: "10000",
    HEALTH_CHECK_TIMEOUT_MS: "5000",
    SHUTDOWN_TIMEOUT_MS: "5000",
    SERVER_REQUEST_TIMEOUT_MS: "30000",
    SERVER_HEADERS_TIMEOUT_MS: "10000",
    SERVER_KEEP_ALIVE_TIMEOUT_MS: "5000",
    JWT_ACCESS_SECRET:
      "test-access-secret-abcdefghijklmnopqrstuvwxyz-0123456789",
    JWT_REFRESH_SECRET:
      "test-refresh-secret-abcdefghijklmnopqrstuvwxyz-0123456789",
    ACCESS_TOKEN_TTL_MINUTES: "15",
    REFRESH_TOKEN_TTL_DAYS: "30",
    REFRESH_COOKIE_NAME: "clh_refresh_test",
    BCRYPT_ROUNDS: "10",
    API_PUBLIC_ORIGIN: "http://localhost:8000",
    ASSET_STORAGE_DRIVER: "local",
    ASSET_LOCAL_ROOT: storageRoot,
    ASSET_MAX_FILE_SIZE_BYTES: "15728640",
    ASSET_USER_QUOTA_BYTES: "262144000",
    ASSET_SIGNED_URL_TTL_SECONDS: "300",
    ASSET_SIGNING_SECRET:
      "test-asset-signing-secret-abcdefghijklmnopqrstuvwxyz",
    AWS_S3_FORCE_PATH_STYLE: "false",
    AI_DEFAULT_PROVIDER: "gemini",
    GEMINI_API_KEY: "synthetic-gemini-test-key",
    GEMINI_MODEL: "gemini-test-model",
    AI_REQUEST_TIMEOUT_MS: "5000",
    AI_MAX_RETRIES: "2",
    AI_DAILY_REQUEST_LIMIT: "10000",
    AI_DAILY_TOKEN_LIMIT: "10000000",
    JOB_WORKER_ENABLED: "false",
    JOB_WORKER_ID: "vitest-worker",
    JOB_POLL_INTERVAL_MS: "1000",
    JOB_LEASE_SECONDS: "60",
    JOB_MAX_CONCURRENCY: "1",
    JOB_RETENTION_DAYS: "1",
    ENABLE_DEV_ROUTES: "false",
    RESUME_PDF_MAX_PAGES: "50",
    RESUME_PDF_MAX_TEXT_CHARACTERS: "120000",
    RESUME_ANALYSIS_JOB_MAX_ATTEMPTS: "1",
    INTERVIEW_MAX_QUESTIONS_PER_SESSION: "500",
    INTERVIEW_MAX_ANSWER_CHARACTERS: "12000",
    INTERVIEW_AI_JOB_MAX_ATTEMPTS: "1",
    LEARNING_MAX_DOCUMENT_PAGES: "250",
    LEARNING_CHUNK_TARGET_WORDS: "450",
    LEARNING_CHUNK_OVERLAP_WORDS: "50",
    LEARNING_MAX_CHAT_MESSAGE_CHARACTERS: "12000",
    LEARNING_MAX_FLASHCARDS_PER_SET: "100",
    LEARNING_MAX_QUIZ_QUESTIONS: "100",
    LEARNING_AI_JOB_MAX_ATTEMPTS: "1",
    MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER: "true",
  };

  const environmentFile = join(
    runtimeRoot,
    "runtime-environment.json",
  );
  await writeFile(
    environmentFile,
    JSON.stringify(runtimeEnvironment),
    "utf8",
  );

  process.env.CAREER_HUB_TEST_ENV_FILE =
    environmentFile;

  return async () => {
    await replSet.stop();
    await rm(runtimeRoot, {
      recursive: true,
      force: true,
    });
  };
}
