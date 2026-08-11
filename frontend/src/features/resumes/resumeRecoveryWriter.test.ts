import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResumeRecoveryKey } from "./resumeRecovery";
import {
  createResumeRecoveryWriter,
  invalidateResumeRecoveryWritersForUser,
  type ResumeRecoveryWriteCandidate,
} from "./resumeRecoveryWriter";
import type { ResumeContentInput } from "./types";

const userId = "writer-user";
const otherUserId = "other-user";
const resumeId = "507f1f77bcf86cd799439011";
const baselineVersionId = "507f1f77bcf86cd799439012";

class RecordingStorage implements Storage {
  readonly values = new Map<string, string>();
  readonly writes: Array<{ key: string; value: string }> = [];
  failWrites = false;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException("Denied", "SecurityError");
    this.values.set(key, value);
    this.writes.push({ key, value });
  }
}

function content(fullName: string): ResumeContentInput {
  return {
    basics: { fullName, links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function candidate(
  fingerprint: string,
  fullName = fingerprint,
): ResumeRecoveryWriteCandidate {
  return {
    fingerprint,
    payload: {
      schemaVersion: 1,
      userId,
      resumeId,
      baselineVersionId,
      baselineVersionNumber: 2,
      content: content(fullName),
    },
  };
}

describe("Resume recovery writer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collapses rapid edits and writes the latest candidate after 500 ms", () => {
    const storage = new RecordingStorage();
    let now = 1_000;
    const onWriteResult = vi.fn();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      now: () => now,
      onWriteResult,
    });

    writer.schedule(candidate("first", "First Candidate"));
    vi.advanceTimersByTime(300);
    writer.schedule(candidate("latest", "Latest Candidate"));
    vi.advanceTimersByTime(499);
    expect(storage.writes).toHaveLength(0);

    now = 2_000;
    vi.advanceTimersByTime(1);

    expect(storage.writes).toHaveLength(1);
    expect(storage.writes[0]?.key).toBe(
      createResumeRecoveryKey(userId, resumeId),
    );
    expect(JSON.parse(storage.writes[0]!.value)).toEqual({
      ...candidate("latest", "Latest Candidate").payload,
      writtenAt: 2_000,
    });
    expect(storage.writes[0]?.value).not.toContain("fingerprint");
    expect(onWriteResult).toHaveBeenCalledTimes(1);
    expect(onWriteResult).toHaveBeenCalledWith("success");
  });

  it("does not refresh writtenAt after a successful debounce", () => {
    const storage = new RecordingStorage();
    let now = 5_000;
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      now: () => now,
      onWriteResult: vi.fn(),
    });
    writer.schedule(candidate("one"));
    vi.advanceTimersByTime(500);
    now = 9_000;

    expect(writer.flush()).toBe(true);
    expect(storage.writes).toHaveLength(1);
    expect(JSON.parse(storage.writes[0]!.value).writtenAt).toBe(5_000);
  });

  it("flushes only the latest still-pending candidate synchronously", () => {
    const storage = new RecordingStorage();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      now: () => 7_000,
      onWriteResult: vi.fn(),
    });
    writer.schedule(candidate("first"));
    writer.schedule(candidate("latest"));

    expect(writer.flush()).toBe(true);
    expect(storage.writes).toHaveLength(1);
    expect(JSON.parse(storage.writes[0]!.value).content.basics.fullName).toBe(
      "latest",
    );
    vi.runAllTimers();
    expect(storage.writes).toHaveLength(1);
  });

  it("cancelPending invalidates old callbacks but permits a future generation", () => {
    const storage = new RecordingStorage();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult: vi.fn(),
    });
    writer.schedule(candidate("discarded"));
    writer.cancelPending();

    expect(writer.flush()).toBe(true);
    vi.runAllTimers();
    expect(storage.writes).toHaveLength(0);

    writer.schedule(candidate("future"));
    vi.advanceTimersByTime(500);
    expect(storage.writes).toHaveLength(1);
    expect(JSON.parse(storage.writes[0]!.value).content.basics.fullName).toBe(
      "future",
    );
  });

  it("dispose unregisters and prevents route-switch callbacks without deleting storage", () => {
    const storage = new RecordingStorage();
    const key = createResumeRecoveryKey(userId, resumeId);
    storage.setItem(key, "existing recovery");
    storage.writes.length = 0;
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult: vi.fn(),
    });
    writer.schedule(candidate("old Resume"));
    writer.dispose();
    vi.runAllTimers();
    writer.schedule(candidate("ignored"));
    vi.runAllTimers();

    expect(storage.writes).toHaveLength(0);
    expect(storage.getItem(key)).toBe("existing recovery");
  });

  it("outgoing-user invalidation cancels only matching active writers", () => {
    const storage = new RecordingStorage();
    const first = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult: vi.fn(),
    });
    const second = createResumeRecoveryWriter({
      storage,
      userId: otherUserId,
      resumeId,
      onWriteResult: vi.fn(),
    });
    first.schedule(candidate("outgoing"));
    second.schedule({
      ...candidate("retained"),
      payload: { ...candidate("retained").payload, userId: otherUserId },
    });

    invalidateResumeRecoveryWritersForUser(userId);
    vi.advanceTimersByTime(500);

    expect(storage.getItem(createResumeRecoveryKey(userId, resumeId))).toBeNull();
    expect(
      storage.getItem(createResumeRecoveryKey(otherUserId, resumeId)),
    ).not.toBeNull();
    first.dispose();
    second.dispose();
  });

  it("outgoing-user invalidation permanently fences matching writers", () => {
    const storage = new RecordingStorage();
    const outgoingWriter = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult: vi.fn(),
    });
    const otherUserWriter = createResumeRecoveryWriter({
      storage,
      userId: otherUserId,
      resumeId,
      onWriteResult: vi.fn(),
    });

    outgoingWriter.schedule(candidate("outgoing-before-invalidation"));
    invalidateResumeRecoveryWritersForUser(userId);
    outgoingWriter.schedule(candidate("outgoing-after-invalidation"));
    otherUserWriter.schedule({
      ...candidate("other-user-after-invalidation"),
      payload: {
        ...candidate("other-user-after-invalidation").payload,
        userId: otherUserId,
      },
    });
    vi.advanceTimersByTime(500);

    expect(storage.getItem(createResumeRecoveryKey(userId, resumeId))).toBeNull();
    expect(
      storage.getItem(createResumeRecoveryKey(otherUserId, resumeId)),
    ).not.toBeNull();
    outgoingWriter.dispose();
    otherUserWriter.dispose();
  });

  it("reports one failure episode, retains pending work, and resets after success", () => {
    const storage = new RecordingStorage();
    const onWriteResult = vi.fn();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult,
    });
    storage.failWrites = true;
    writer.schedule(candidate("first failure"));
    vi.advanceTimersByTime(500);
    writer.schedule(candidate("second failure"));
    vi.advanceTimersByTime(500);
    expect(onWriteResult.mock.calls).toEqual([["failure"]]);

    storage.failWrites = false;
    expect(writer.flush()).toBe(true);
    expect(onWriteResult.mock.calls).toEqual([["failure"], ["success"]]);

    storage.failWrites = true;
    writer.schedule(candidate("new episode"));
    vi.advanceTimersByTime(500);
    expect(onWriteResult.mock.calls).toEqual([
      ["failure"],
      ["success"],
      ["failure"],
    ]);
  });

  it("suppresses lifecycle failure reporting when requested", () => {
    const storage = new RecordingStorage();
    storage.failWrites = true;
    const onWriteResult = vi.fn();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult,
    });
    writer.schedule(candidate("pending"));

    expect(writer.flush({ reportFailure: false })).toBe(false);
    expect(onWriteResult).not.toHaveBeenCalled();
  });

  it("cancelPending resets only this writer's failure episode", () => {
    const storage = new RecordingStorage();
    storage.failWrites = true;
    const onWriteResult = vi.fn();
    const writer = createResumeRecoveryWriter({
      storage,
      userId,
      resumeId,
      onWriteResult,
    });
    writer.schedule(candidate("first"));
    vi.advanceTimersByTime(500);
    writer.cancelPending();
    writer.schedule(candidate("after reset"));
    vi.advanceTimersByTime(500);

    expect(onWriteResult.mock.calls).toEqual([["failure"], ["failure"]]);
  });
});
