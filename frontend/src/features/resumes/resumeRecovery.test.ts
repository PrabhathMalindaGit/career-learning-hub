import { describe, expect, it } from "vitest";
import { draftFingerprint, resumeContentInputToDraft } from "./resumeDraft";
import {
  RESUME_RECOVERY_FUTURE_SKEW_MS,
  RESUME_RECOVERY_MAX_AGE_MS,
  classifyResumeRecovery,
  createResumeRecoveryKey,
  createResumeRecoveryUserPrefix,
  readResumeRecovery,
  removeObsoleteResumeRecovery,
  removeResumeRecoveriesForUser,
  removeResumeRecoveryExact,
  type ResumeRecoveryEnvelope,
} from "./resumeRecovery";
import type { ResumeContentInput } from "./types";

const userId = "synthetic:user";
const resumeId = "507f1f77bcf86cd799439011";
const baselineVersionId = "507f1f77bcf86cd799439012";
const currentVersionId = "507f1f77bcf86cd799439013";
const stableId = "123e4567-e89b-42d3-a456-426614174000";
const now = Date.UTC(2026, 7, 11, 10, 0, 0);

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  failGet = false;
  failRemove = false;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    if (this.failGet) throw new DOMException("Denied", "SecurityError");
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    if (this.failRemove) throw new DOMException("Denied", "SecurityError");
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function content(fullName = "Recovered Candidate"): ResumeContentInput {
  return {
    basics: { fullName, links: [] },
    experience: [
      {
        id: stableId,
        employer: "Example",
        jobTitle: "",
        isCurrent: false,
        bullets: [],
      },
    ],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function envelope(
  overrides: Partial<ResumeRecoveryEnvelope> = {},
): ResumeRecoveryEnvelope {
  return {
    schemaVersion: 1,
    userId,
    resumeId,
    baselineVersionId,
    baselineVersionNumber: 3,
    content: content(),
    writtenAt: now,
    ...overrides,
  };
}

describe("resume recovery storage contract", () => {
  it("constructs exact encoded per-Resume keys and outgoing-user prefixes", () => {
    expect(createResumeRecoveryKey(userId, resumeId)).toBe(
      "career-learning-hub:resume-recovery:v1:synthetic%3Auser:507f1f77bcf86cd799439011",
    );
    expect(createResumeRecoveryUserPrefix(userId)).toBe(
      "career-learning-hub:resume-recovery:v1:synthetic%3Auser:",
    );
    expect(createResumeRecoveryKey(userId, currentVersionId)).not.toBe(
      createResumeRecoveryKey(userId, resumeId),
    );
  });

  it("reads only a strict, owned, unexpired schemaVersion 1 envelope", () => {
    const storage = new MemoryStorage();
    const key = createResumeRecoveryKey(userId, resumeId);
    storage.setItem(key, JSON.stringify(envelope()));

    expect(readResumeRecovery({ storage, userId, resumeId, now })).toEqual({
      kind: "VALID",
      payload: envelope(),
    });
    expect(storage.getItem(key)).not.toBeNull();
  });

  it.each([
    ["malformed JSON", "{"],
    ["unknown schema", JSON.stringify(envelope({ schemaVersion: 2 as 1 }))],
    ["wrong user", JSON.stringify(envelope({ userId: "another-user" }))],
    ["wrong Resume", JSON.stringify(envelope({ resumeId: currentVersionId }))],
    ["invalid baseline ID", JSON.stringify(envelope({ baselineVersionId: "bad" }))],
    ["invalid display version", JSON.stringify(envelope({ baselineVersionNumber: 0 }))],
    ["extra envelope field", JSON.stringify({ ...envelope(), extra: true })],
    [
      "unknown content field",
      JSON.stringify({
        ...envelope(),
        content: { ...content(), unexpected: true },
      }),
    ],
  ])("rejects and removes %s", (_name, raw) => {
    const storage = new MemoryStorage();
    const key = createResumeRecoveryKey(userId, resumeId);
    storage.setItem(key, raw);

    expect(readResumeRecovery({ storage, userId, resumeId, now })).toEqual({
      kind: "INVALID",
    });
    expect(storage.getItem(key)).toBeNull();
  });

  it("enforces the 24-hour lifetime and five-minute future skew", () => {
    const storage = new MemoryStorage();
    const key = createResumeRecoveryKey(userId, resumeId);

    storage.setItem(
      key,
      JSON.stringify(
        envelope({ writtenAt: now - RESUME_RECOVERY_MAX_AGE_MS }),
      ),
    );
    expect(readResumeRecovery({ storage, userId, resumeId, now }).kind).toBe(
      "VALID",
    );

    storage.setItem(
      key,
      JSON.stringify(
        envelope({ writtenAt: now - RESUME_RECOVERY_MAX_AGE_MS - 1 }),
      ),
    );
    expect(readResumeRecovery({ storage, userId, resumeId, now }).kind).toBe(
      "INVALID",
    );

    storage.setItem(
      key,
      JSON.stringify(
        envelope({ writtenAt: now + RESUME_RECOVERY_FUTURE_SKEW_MS }),
      ),
    );
    expect(readResumeRecovery({ storage, userId, resumeId, now }).kind).toBe(
      "VALID",
    );

    storage.setItem(
      key,
      JSON.stringify(
        envelope({ writtenAt: now + RESUME_RECOVERY_FUTURE_SKEW_MS + 1 }),
      ),
    );
    expect(readResumeRecovery({ storage, userId, resumeId, now }).kind).toBe(
      "INVALID",
    );
  });

  it("classifies content equivalence before authoritative baseline identity", () => {
    const canonicalFingerprint = draftFingerprint(
      resumeContentInputToDraft(content("Canonical Candidate")),
    );

    expect(
      classifyResumeRecovery({
        payload: envelope({
          baselineVersionId,
          content: content("Canonical Candidate"),
        }),
        canonicalVersionId: currentVersionId,
        canonicalFingerprint,
      }).kind,
    ).toBe("CLEAN_OBSOLETE");
    expect(
      classifyResumeRecovery({
        payload: envelope({
          baselineVersionId: currentVersionId,
          content: content("Different Candidate"),
        }),
        canonicalVersionId: currentVersionId,
        canonicalFingerprint,
      }).kind,
    ).toBe("RECOVERY_AVAILABLE");
    expect(
      classifyResumeRecovery({
        payload: envelope({ content: content("Different Candidate") }),
        canonicalVersionId: currentVersionId,
        canonicalFingerprint,
      }).kind,
    ).toBe("STALE_CONFLICTED_RECOVERY");
  });

  it("confirms exact removal and fails closed when storage cannot prove absence", () => {
    const storage = new MemoryStorage();
    const key = createResumeRecoveryKey(userId, resumeId);
    storage.setItem(key, JSON.stringify(envelope()));

    expect(removeResumeRecoveryExact(storage, key)).toBe(true);
    expect(removeResumeRecoveryExact(storage, key)).toBe(true);

    storage.setItem(key, JSON.stringify(envelope()));
    storage.failRemove = true;
    expect(removeResumeRecoveryExact(storage, key)).toBe(false);
  });

  it("does not delete a newer-baseline payload while retrying obsolete cleanup", () => {
    const storage = new MemoryStorage();
    const key = createResumeRecoveryKey(userId, resumeId);
    storage.setItem(
      key,
      JSON.stringify(envelope({ baselineVersionId: currentVersionId })),
    );

    expect(
      removeObsoleteResumeRecovery({
        storage,
        key,
        obsoleteBaselineVersionId: baselineVersionId,
      }),
    ).toBe(true);
    expect(storage.getItem(key)).not.toBeNull();
  });

  it("collects then removes only the exact outgoing-user v1 prefix", () => {
    const storage = new MemoryStorage();
    const outgoingPrefix = createResumeRecoveryUserPrefix(userId);
    const first = `${outgoingPrefix}${resumeId}`;
    const second = `${outgoingPrefix}${currentVersionId}`;
    const otherUser = createResumeRecoveryKey("other-user", resumeId);
    const futureVersion = `career-learning-hub:resume-recovery:v2:${encodeURIComponent(userId)}:${resumeId}`;
    storage.setItem(first, "first");
    storage.setItem(second, "second");
    storage.setItem(otherUser, "other");
    storage.setItem(futureVersion, "future");
    storage.setItem("unrelated", "preserved");

    expect(removeResumeRecoveriesForUser(storage, userId)).toEqual({
      removed: 2,
      failed: false,
    });
    expect(storage.getItem(first)).toBeNull();
    expect(storage.getItem(second)).toBeNull();
    expect(storage.getItem(otherUser)).toBe("other");
    expect(storage.getItem(futureVersion)).toBe("future");
    expect(storage.getItem("unrelated")).toBe("preserved");
  });
});
