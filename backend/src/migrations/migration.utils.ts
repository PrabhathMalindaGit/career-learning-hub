import { createHash, randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Types } from "mongoose";
import type { SourceProject } from "./migrationMap.model.js";

const MAX_IMPORT_FILE_BYTES = 512 * 1024 * 1024;

export type UnknownRecord = Record<string, unknown>;

export function sha256(value: unknown): string {
  const serialized =
    typeof value === "string"
      ? value
      : JSON.stringify(sortObject(value));
  return createHash("sha256").update(serialized).digest("hex");
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortObject(entry)]),
    );
  }

  return value;
}

export function stableUuid(...parts: string[]): string {
  const hex = createHash("sha256")
    .update(parts.join("\u001f"))
    .digest("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

export function deterministicObjectId(...parts: string[]): Types.ObjectId {
  return new Types.ObjectId(
    createHash("sha256")
      .update(parts.join("\u001f"))
      .digest("hex")
      .slice(0, 24),
  );
}

export function migrationRunId(): string {
  return `migration-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
}

export function normalizeEmail(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

export function redactEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export function asString(
  value: unknown,
  fallback = "",
): string {
  if (typeof value === "string") return value.trim();
  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return fallback;
}

export function optionalString(value: unknown): string | undefined {
  const parsed = asString(value);
  return parsed.length > 0 ? parsed : undefined;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asString(entry))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function asBoolean(
  value: unknown,
  fallback = false,
): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    if (["true", "1", "yes"].includes(value.toLowerCase())) {
      return true;
    }
    if (["false", "0", "no"].includes(value.toLowerCase())) {
      return false;
    }
  }
  return fallback;
}

export function asNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed =
    typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return undefined;
}

export function legacyIdOf(
  record: UnknownRecord,
  fallback: string,
): string {
  for (const key of [
    "_id",
    "id",
    "legacyId",
    "uuid",
    "userId",
    "resumeId",
    "documentId",
    "sessionId",
  ]) {
    const value = record[key];
    const parsed = unwrapScalar(value);
    if (parsed) return parsed;
  }

  return fallback;
}

export function pick(
  record: UnknownRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

export function nested(
  value: unknown,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      return (current as UnknownRecord)[segment];
    }, value);
}

export function firstDefined(
  record: UnknownRecord,
  paths: string[],
): unknown {
  for (const path of paths) {
    const value = nested(record, path);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

export function unwrapScalar(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    if (typeof record.$oid === "string") return record.$oid;
    if (typeof record.$uuid === "string") return record.$uuid;
  }
  return undefined;
}

export function unwrapExtendedJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(unwrapExtendedJson);
  }

  if (value && typeof value === "object") {
    const record = value as UnknownRecord;

    if (
      Object.keys(record).length === 1 &&
      typeof record.$oid === "string"
    ) {
      return record.$oid;
    }

    if (
      Object.keys(record).length === 1 &&
      record.$date !== undefined
    ) {
      const dateValue = unwrapExtendedJson(record.$date);
      return typeof dateValue === "string" ||
        typeof dateValue === "number"
        ? dateValue
        : record.$date;
    }

    if (
      Object.keys(record).length === 1 &&
      record.$numberLong !== undefined
    ) {
      return Number(record.$numberLong);
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [
        key,
        unwrapExtendedJson(entry),
      ]),
    );
  }

  return value;
}

function recordsFromParsed(value: unknown): UnknownRecord[] {
  const unwrapped = unwrapExtendedJson(value);

  if (Array.isArray(unwrapped)) {
    return unwrapped.filter(
      (entry): entry is UnknownRecord =>
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
    );
  }

  if (unwrapped && typeof unwrapped === "object") {
    const record = unwrapped as UnknownRecord;

    for (const key of [
      "records",
      "data",
      "items",
      "users",
      "resumes",
      "sessions",
      "questions",
      "documents",
      "flashcards",
      "flashcardSets",
      "quizzes",
      "attempts",
    ]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (entry): entry is UnknownRecord =>
            Boolean(entry) &&
            typeof entry === "object" &&
            !Array.isArray(entry),
        );
      }
    }

    const arrayValues = Object.values(record).filter(Array.isArray);
    if (arrayValues.length === 1) {
      return (arrayValues[0] as unknown[]).filter(
        (entry): entry is UnknownRecord =>
          Boolean(entry) &&
          typeof entry === "object" &&
          !Array.isArray(entry),
      );
    }

    return [record];
  }

  throw new Error("The import file does not contain object records.");
}

export async function readImportRecords(
  absolutePath: string,
): Promise<UnknownRecord[]> {
  const filePath = resolve(absolutePath);
  const fileStat = await stat(filePath);

  if (!fileStat.isFile()) {
    throw new Error(`Migration input is not a file: ${filePath}`);
  }

  if (fileStat.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      `Migration input exceeds ${MAX_IMPORT_FILE_BYTES} bytes: ${filePath}`,
    );
  }

  const raw = await readFile(filePath, "utf8");
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (filePath.endsWith(".ndjson") || filePath.endsWith(".jsonl")) {
    return trimmed
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line, index) => {
        try {
          const value = unwrapExtendedJson(JSON.parse(line));
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Record is not an object.");
          }
          return value as UnknownRecord;
        } catch (error) {
          throw new Error(
            `Invalid NDJSON at line ${index + 1}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      });
  }

  return recordsFromParsed(JSON.parse(trimmed));
}

export function sourceKey(
  project: SourceProject,
  entityType: string,
  legacyId: string,
): string {
  return `${project}\u001f${entityType}\u001f${legacyId}`;
}

export function safeMetadata(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > 12 * 1024) {
    return { truncated: true };
  }
  return value;
}
