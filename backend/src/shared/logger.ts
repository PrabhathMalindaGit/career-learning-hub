import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

interface RequestLogContext {
  requestId?: string;
}

const requestLogContext =
  new AsyncLocalStorage<RequestLogContext>();

const levelOrder: Record<Exclude<LogLevel, "silent">, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const sensitiveKeyPattern =
  /(?:authorization|cookie|password|passphrase|secret|token|api[-_]?key|session|credential|resume(?:content)?|rawtext|documenttext|jobdescription|basics|experience|education|phone|mobile|address|content|prompt|answer)/i;

const emailPattern =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const keyPattern =
  /\b(?:sk|AIza|ghp|xox[baprs])[-_A-Za-z0-9]{12,}\b/g;

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.toLowerCase();
  if (
    value === "silent" ||
    value === "error" ||
    value === "warn" ||
    value === "info" ||
    value === "debug"
  ) {
    return value;
  }

  return process.env.NODE_ENV === "test" ? "silent" : "info";
}

function sanitizeText(value: string): string {
  const redacted = value
    .replace(bearerPattern, "Bearer [REDACTED]")
    .replace(jwtPattern, "[REDACTED_JWT]")
    .replace(keyPattern, "[REDACTED_KEY]")
    .replace(emailPattern, "[REDACTED_EMAIL]");

  return redacted.length > 1_000
    ? `${redacted.slice(0, 1_000)}…[TRUNCATED]`
    : redacted;
}

export function sanitizeForLog(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 5) return "[MAX_DEPTH]";

  if (typeof value === "string") return sanitizeText(value);
  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") return "[FUNCTION]";
  if (typeof value !== "object") return String(value);

  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) {
    return `[BUFFER:${value.byteLength}]`;
  }

  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((entry) =>
        sanitizeForLog(entry, depth + 1, seen),
      );
  }

  const entries = Object.entries(
    value as Record<string, unknown>,
  ).slice(0, 50);

  return Object.fromEntries(
    entries.map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key)
        ? "[REDACTED]"
        : sanitizeForLog(entry, depth + 1, seen),
    ]),
  );
}

export function serializeErrorForLog(
  error: unknown,
): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return {
      errorType: typeof error,
    };
  }

  const record = error as Error & {
    code?: unknown;
    statusCode?: unknown;
  };
  const authoredError =
    typeof record.code === "string" ||
    typeof record.statusCode === "number";
  const fingerprint = createHash("sha256")
    .update(error.stack ?? `${error.name}:${error.message}`)
    .digest("hex")
    .slice(0, 16);

  return {
    errorName: error.name,
    errorCode:
      typeof record.code === "string" ||
      typeof record.code === "number"
        ? record.code
        : undefined,
    statusCode:
      typeof record.statusCode === "number"
        ? record.statusCode
        : undefined,
    errorFingerprint: fingerprint,
    ...(authoredError &&
    process.env.NODE_ENV !== "production"
      ? {
          errorMessage: sanitizeText(error.message),
        }
      : {}),
  };
}

function shouldLog(
  level: Exclude<LogLevel, "silent">,
): boolean {
  const configured = configuredLevel();
  if (configured === "silent") return false;
  return levelOrder[level] <= levelOrder[configured];
}

function emit(
  level: Exclude<LogLevel, "silent">,
  event: string,
  data?: Record<string, unknown>,
): void {
  if (!shouldLog(level)) return;

  const context = requestLogContext.getStore();
  const payload = sanitizeForLog({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "career-learning-hub-api",
    ...(context?.requestId
      ? { requestId: context.requestId }
      : {}),
    ...(data ?? {}),
  });

  const line = `${JSON.stringify(payload)}\n`;
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  error(event: string, data?: Record<string, unknown>) {
    emit("error", event, data);
  },
  warn(event: string, data?: Record<string, unknown>) {
    emit("warn", event, data);
  },
  info(event: string, data?: Record<string, unknown>) {
    emit("info", event, data);
  },
  debug(event: string, data?: Record<string, unknown>) {
    emit("debug", event, data);
  },
};

export function runWithRequestLogContext<T>(
  context: RequestLogContext,
  callback: () => T,
): T {
  return requestLogContext.run(context, callback);
}
