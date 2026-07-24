import { env } from "../../config/env.js";

interface RuntimeReadinessState {
  storageReady: boolean;
  jobsReady: boolean;
  shuttingDown: boolean;
  startedAt: Date;
}

const state: RuntimeReadinessState = {
  storageReady: false,
  jobsReady: !env.JOB_WORKER_ENABLED,
  shuttingDown: false,
  startedAt: new Date(),
};

export function markStorageReady(): void {
  state.storageReady = true;
}

export function markJobSystemReady(): void {
  state.jobsReady = true;
}

export function markShuttingDown(): void {
  state.shuttingDown = true;
}

export function resetRuntimeReadinessForTests(): void {
  state.storageReady = false;
  state.jobsReady = !env.JOB_WORKER_ENABLED;
  state.shuttingDown = false;
}

export function getRuntimeReadiness() {
  return {
    ...state,
    startedAt: new Date(state.startedAt),
  };
}
