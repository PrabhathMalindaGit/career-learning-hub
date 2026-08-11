import { ApiError } from "../../api/apiClient";
import { parseResumeRecoveryContent } from "./resumeContracts";
import {
  draftFingerprint,
  resumeContentInputToDraft,
} from "./resumeDraft";
import type { ResumeContentInput } from "./types";

export const RESUME_RECOVERY_SCHEMA_VERSION = 1 as const;
export const RESUME_RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
export const RESUME_RECOVERY_FUTURE_SKEW_MS = 5 * 60 * 1_000;

const RESUME_RECOVERY_NAMESPACE =
  "career-learning-hub:resume-recovery:v1:";
const objectIdPattern = /^[a-f\d]{24}$/i;
const envelopeKeys = [
  "schemaVersion",
  "userId",
  "resumeId",
  "baselineVersionId",
  "baselineVersionNumber",
  "content",
  "writtenAt",
] as const;

export interface ResumeRecoveryEnvelope {
  schemaVersion: typeof RESUME_RECOVERY_SCHEMA_VERSION;
  userId: string;
  resumeId: string;
  baselineVersionId: string;
  baselineVersionNumber: number;
  content: ResumeContentInput;
  writtenAt: number;
}

export type ResumeRecoveryReadResult =
  | { kind: "NONE" }
  | { kind: "INVALID" }
  | { kind: "VALID"; payload: ResumeRecoveryEnvelope };

export type ResumeRecoveryClassification =
  | { kind: "CLEAN_OBSOLETE"; payload: ResumeRecoveryEnvelope }
  | { kind: "RECOVERY_AVAILABLE"; payload: ResumeRecoveryEnvelope }
  | {
      kind: "STALE_CONFLICTED_RECOVERY";
      payload: ResumeRecoveryEnvelope;
    };

type RecoveryStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "key" | "length"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExactEnvelope(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const allowed = new Set<string>(envelopeKeys);
  return (
    envelopeKeys.every((key) => key in value) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function validIdentity(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum;
}

function parseEnvelope(
  value: unknown,
  expectedUserId: string,
  expectedResumeId: string,
  now: number,
): ResumeRecoveryEnvelope | undefined {
  if (!isExactEnvelope(value)) return undefined;
  if (value.schemaVersion !== RESUME_RECOVERY_SCHEMA_VERSION) return undefined;
  if (
    !validIdentity(value.userId, 256) ||
    value.userId !== expectedUserId ||
    !validIdentity(value.resumeId, 128) ||
    value.resumeId !== expectedResumeId ||
    !objectIdPattern.test(value.resumeId) ||
    !validIdentity(value.baselineVersionId, 128) ||
    !objectIdPattern.test(value.baselineVersionId) ||
    !Number.isSafeInteger(value.baselineVersionNumber) ||
    (value.baselineVersionNumber as number) < 1 ||
    !Number.isSafeInteger(value.writtenAt) ||
    (value.writtenAt as number) < 0 ||
    (value.writtenAt as number) < now - RESUME_RECOVERY_MAX_AGE_MS ||
    (value.writtenAt as number) > now + RESUME_RECOVERY_FUTURE_SKEW_MS
  ) {
    return undefined;
  }

  try {
    return {
      schemaVersion: RESUME_RECOVERY_SCHEMA_VERSION,
      userId: value.userId,
      resumeId: value.resumeId,
      baselineVersionId: value.baselineVersionId,
      baselineVersionNumber: value.baselineVersionNumber as number,
      content: parseResumeRecoveryContent(value.content),
      writtenAt: value.writtenAt as number,
    };
  } catch (error) {
    if (error instanceof ApiError) return undefined;
    return undefined;
  }
}

export function createResumeRecoveryUserPrefix(userId: string): string {
  return `${RESUME_RECOVERY_NAMESPACE}${encodeURIComponent(userId)}:`;
}

export function createResumeRecoveryKey(
  userId: string,
  resumeId: string,
): string {
  return `${createResumeRecoveryUserPrefix(userId)}${encodeURIComponent(resumeId)}`;
}

export function removeResumeRecoveryExact(
  storage: Pick<Storage, "getItem" | "removeItem">,
  key: string,
): boolean {
  try {
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch {
    return false;
  }
}

export function readResumeRecovery({
  storage,
  userId,
  resumeId,
  now = Date.now(),
}: {
  storage: Pick<Storage, "getItem" | "removeItem">;
  userId: string;
  resumeId: string;
  now?: number;
}): ResumeRecoveryReadResult {
  const key = createResumeRecoveryKey(userId, resumeId);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { kind: "INVALID" };
  }
  if (raw === null) return { kind: "NONE" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    removeResumeRecoveryExact(storage, key);
    return { kind: "INVALID" };
  }

  const payload = parseEnvelope(parsed, userId, resumeId, now);
  if (!payload) {
    removeResumeRecoveryExact(storage, key);
    return { kind: "INVALID" };
  }
  return { kind: "VALID", payload };
}

export function classifyResumeRecovery({
  payload,
  canonicalVersionId,
  canonicalFingerprint,
}: {
  payload: ResumeRecoveryEnvelope;
  canonicalVersionId: string;
  canonicalFingerprint: string;
}): ResumeRecoveryClassification {
  const recoveryFingerprint = draftFingerprint(
    resumeContentInputToDraft(payload.content),
  );
  if (recoveryFingerprint === canonicalFingerprint) {
    return { kind: "CLEAN_OBSOLETE", payload };
  }
  if (payload.baselineVersionId === canonicalVersionId) {
    return { kind: "RECOVERY_AVAILABLE", payload };
  }
  return { kind: "STALE_CONFLICTED_RECOVERY", payload };
}

export function removeObsoleteResumeRecovery({
  storage,
  key,
  obsoleteBaselineVersionId,
}: {
  storage: Pick<Storage, "getItem" | "removeItem">;
  key: string;
  obsoleteBaselineVersionId: string;
}): boolean {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return true;
    const parsed = JSON.parse(raw) as unknown;
    if (
      isRecord(parsed) &&
      typeof parsed.baselineVersionId === "string" &&
      parsed.baselineVersionId !== obsoleteBaselineVersionId
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return removeResumeRecoveryExact(storage, key);
}

export function removeResumeRecoveriesForUser(
  storage: RecoveryStorage,
  userId: string,
): { removed: number; failed: boolean } {
  const prefix = createResumeRecoveryUserPrefix(userId);
  const matchingKeys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) matchingKeys.push(key);
    }
  } catch {
    return { removed: 0, failed: true };
  }

  let removed = 0;
  let failed = false;
  for (const key of matchingKeys) {
    if (removeResumeRecoveryExact(storage, key)) {
      removed += 1;
    } else {
      failed = true;
    }
  }
  return { removed, failed };
}
