import {
  createResumeRecoveryKey,
  type ResumeRecoveryEnvelope,
} from "./resumeRecovery";

export interface ResumeRecoveryWriteCandidate {
  fingerprint: string;
  payload: Omit<ResumeRecoveryEnvelope, "writtenAt">;
}

export interface ResumeRecoveryWriter {
  schedule(candidate: ResumeRecoveryWriteCandidate): void;
  cancelPending(): void;
  flush(options?: { reportFailure?: boolean }): boolean;
  dispose(): void;
}

type RegisteredWriter = ResumeRecoveryWriter & { readonly userId: string };

const activeWriters = new Map<string, Set<RegisteredWriter>>();

function register(writer: RegisteredWriter) {
  const writers = activeWriters.get(writer.userId) ?? new Set();
  writers.add(writer);
  activeWriters.set(writer.userId, writers);
}

function unregister(writer: RegisteredWriter) {
  const writers = activeWriters.get(writer.userId);
  if (!writers) return;
  writers.delete(writer);
  if (writers.size === 0) activeWriters.delete(writer.userId);
}

export function createResumeRecoveryWriter({
  storage,
  userId,
  resumeId,
  now = Date.now,
  delayMs = 500,
  onWriteResult,
}: {
  storage: Pick<Storage, "setItem">;
  userId: string;
  resumeId: string;
  now?: () => number;
  delayMs?: number;
  onWriteResult(result: "success" | "failure"): void;
}): ResumeRecoveryWriter {
  const key = createResumeRecoveryKey(userId, resumeId);
  let latestCandidate: ResumeRecoveryWriteCandidate | undefined;
  let pendingFingerprint: string | undefined;
  let persistedFingerprint: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let disposed = false;
  let failureReported = false;

  const clearTimer = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  };

  const writePending = (reportFailure: boolean): boolean => {
    if (disposed || !latestCandidate || !pendingFingerprint) return true;
    const candidate = latestCandidate;
    try {
      const envelope: ResumeRecoveryEnvelope = {
        ...candidate.payload,
        writtenAt: now(),
      };
      storage.setItem(key, JSON.stringify(envelope));
      persistedFingerprint = candidate.fingerprint;
      pendingFingerprint = undefined;
      latestCandidate = undefined;
      failureReported = false;
      onWriteResult("success");
      return true;
    } catch {
      if (reportFailure && !failureReported) {
        failureReported = true;
        onWriteResult("failure");
      }
      return false;
    }
  };

  const writer: RegisteredWriter = {
    userId,
    schedule(candidate) {
      if (disposed) return;
      if (candidate.fingerprint === persistedFingerprint) {
        clearTimer();
        latestCandidate = undefined;
        pendingFingerprint = undefined;
        return;
      }
      if (
        candidate.fingerprint === pendingFingerprint &&
        timer !== undefined
      ) {
        latestCandidate = candidate;
        return;
      }

      generation += 1;
      const scheduledGeneration = generation;
      clearTimer();
      latestCandidate = candidate;
      pendingFingerprint = candidate.fingerprint;
      timer = setTimeout(() => {
        timer = undefined;
        if (disposed || scheduledGeneration !== generation) return;
        writePending(true);
      }, delayMs);
    },
    cancelPending() {
      generation += 1;
      clearTimer();
      latestCandidate = undefined;
      pendingFingerprint = undefined;
      persistedFingerprint = undefined;
      failureReported = false;
    },
    flush(options) {
      clearTimer();
      return writePending(options?.reportFailure ?? true);
    },
    dispose() {
      if (disposed) return;
      writer.cancelPending();
      disposed = true;
      unregister(writer);
    },
  };

  register(writer);
  return writer;
}

export function invalidateResumeRecoveryWritersForUser(
  userId: string,
): void {
  const writers = activeWriters.get(userId);
  if (!writers) return;
  for (const writer of [...writers]) writer.dispose();
}
