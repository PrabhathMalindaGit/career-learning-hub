const { randomBytes } = require("node:crypto");
const { spawn } = require("node:child_process");
const {
  mkdir,
  rm,
  writeFile,
} = require("node:fs/promises");
const path = require("node:path");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const repoRoot = path.resolve(__dirname, "../..");
const runtimeRoot = "/private/tmp/career-learning-hub-phase14/runtime";
const runtimeFile = path.join(runtimeRoot, "runtime.json");
const storageRoot = path.join(runtimeRoot, "storage");
const children = new Set();
let replSet;
let stopping = false;

function runtimeSecret(label) {
  return `${label}-${randomBytes(32).toString("hex")}`;
}

function spawnService(command, args, environment) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...environment,
    },
    stdio: ["ignore", "inherit", "inherit"],
  });
  children.add(child);
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (!stopping && code !== 0) {
      console.error(
        `Phase 14 service exited unexpectedly (${code ?? signal}).`,
      );
      void stop(1);
    }
  });
  return child;
}

async function waitFor(url, label) {
  const deadline = Date.now() + 90_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`${label} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `${label} did not become ready: ${
      lastError instanceof Error ? lastError.message : "unknown error"
    }`,
  );
}

async function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  await Promise.all(
    [...children].map(
      (child) =>
        new Promise((resolve) => {
          child.once("exit", resolve);
          setTimeout(() => {
            if (!child.killed) child.kill("SIGKILL");
            resolve();
          }, 5_000).unref();
        }),
    ),
  );
  if (replSet) await replSet.stop();
  await rm(runtimeRoot, { recursive: true, force: true });
  process.exit(exitCode);
}

async function main() {
  await rm(runtimeRoot, { recursive: true, force: true });
  await mkdir(storageRoot, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER = "true";
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const mongoUri = replSet.getUri("career_learning_hub_phase14");
  await writeFile(
    runtimeFile,
    JSON.stringify({ mongoUri, storageRoot }),
    { mode: 0o600 },
  );

  const backendEnvironment = {
    NODE_ENV: "test",
    PORT: "8000",
    MONGODB_URI: mongoUri,
    CLIENT_ORIGINS: "http://127.0.0.1:4173",
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
    JWT_ACCESS_SECRET: runtimeSecret("access"),
    JWT_REFRESH_SECRET: runtimeSecret("refresh"),
    ACCESS_TOKEN_TTL_MINUTES: "15",
    REFRESH_TOKEN_TTL_DAYS: "1",
    REFRESH_COOKIE_NAME: "clh_phase14_refresh",
    BCRYPT_ROUNDS: "10",
    API_PUBLIC_ORIGIN: "http://127.0.0.1:8000",
    ASSET_STORAGE_DRIVER: "local",
    ASSET_LOCAL_ROOT: storageRoot,
    ASSET_MAX_FILE_SIZE_BYTES: "15728640",
    ASSET_USER_QUOTA_BYTES: "262144000",
    ASSET_SIGNED_URL_TTL_SECONDS: "300",
    ASSET_SIGNING_SECRET: runtimeSecret("asset"),
    AWS_S3_FORCE_PATH_STYLE: "false",
    AI_DEFAULT_PROVIDER: "gemini",
    GEMINI_MODEL: "phase14-provider-disabled",
    AI_REQUEST_TIMEOUT_MS: "1000",
    AI_MAX_RETRIES: "0",
    AI_DAILY_REQUEST_LIMIT: "10000",
    AI_DAILY_TOKEN_LIMIT: "10000000",
    JOB_WORKER_ENABLED: "false",
    JOB_WORKER_ID: "phase14-e2e",
    JOB_POLL_INTERVAL_MS: "250",
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
  };

  spawnService(
    path.join(repoRoot, "node_modules/.bin/tsx"),
    ["backend/src/server.ts"],
    backendEnvironment,
  );
  await waitFor(
    "http://127.0.0.1:8000/api/v1/health/ready",
    "backend",
  );

  spawnService(
    path.join(repoRoot, "node_modules/.bin/vite"),
    [
      "frontend",
      "--host",
      "127.0.0.1",
      "--port",
      "4173",
      "--strictPort",
    ],
    {
      VITE_API_URL: "http://127.0.0.1:8000/api/v1",
    },
  );
  await waitFor("http://127.0.0.1:4173/login", "frontend");
  console.log("Phase 14 services ready.");
}

process.once("SIGTERM", () => void stop(0));
process.once("SIGINT", () => void stop(0));
process.once("uncaughtException", (error) => {
  console.error(error);
  void stop(1);
});
process.once("unhandledRejection", (error) => {
  console.error(error);
  void stop(1);
});

void main().catch((error) => {
  console.error(error);
  void stop(1);
});
