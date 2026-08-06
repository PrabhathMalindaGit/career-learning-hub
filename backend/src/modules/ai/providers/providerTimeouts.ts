import {
  AiProviderError,
  type AiTimeoutPhase,
  type ProviderProgressPhase,
  type ProviderTimeoutProfile,
} from "./provider.types.js";

const defaultMaximumResponseBytes = 2 * 1024 * 1024;

export interface ProviderSignalScope {
  readonly signal: AbortSignal;
  markResponseHeaders(): void;
  markResponseChunk(): void;
  failure(): AiProviderError;
  cleanup(): void;
}

export function composeProviderSignal(input: {
  parentSignal: AbortSignal;
  timeouts: ProviderTimeoutProfile;
}): ProviderSignalScope {
  const controller = new AbortController();
  let timeoutPhase: AiTimeoutPhase | undefined;
  let cancelled = false;
  let connectionTimer: NodeJS.Timeout | undefined;
  let firstResponseTimer: NodeJS.Timeout | undefined;
  let idleTimer: NodeJS.Timeout | undefined;
  let totalTimer: NodeJS.Timeout | undefined;

  const abortForTimeout = (phase: AiTimeoutPhase) => {
    if (controller.signal.aborted) return;
    timeoutPhase = phase;
    controller.abort();
  };

  const abortForParent = () => {
    if (controller.signal.aborted) return;
    cancelled = true;
    controller.abort(input.parentSignal.reason);
  };

  input.parentSignal.addEventListener("abort", abortForParent, { once: true });
  if (input.parentSignal.aborted) abortForParent();

  if (!controller.signal.aborted) {
    connectionTimer = setTimeout(
      () => abortForTimeout("connection"),
      input.timeouts.connectMs,
    );
    totalTimer = setTimeout(
      () => abortForTimeout("total"),
      input.timeouts.totalMs,
    );
  }

  const clearTimer = (timer: NodeJS.Timeout | undefined) => {
    if (timer) clearTimeout(timer);
  };

  return {
    signal: controller.signal,
    markResponseHeaders() {
      clearTimer(connectionTimer);
      connectionTimer = undefined;
      if (controller.signal.aborted) return;
      firstResponseTimer = setTimeout(
        () => abortForTimeout("first_response"),
        input.timeouts.firstResponseMs,
      );
    },
    markResponseChunk() {
      clearTimer(firstResponseTimer);
      firstResponseTimer = undefined;
      clearTimer(idleTimer);
      if (controller.signal.aborted) return;
      idleTimer = setTimeout(
        () => abortForTimeout("idle"),
        input.timeouts.idleMs,
      );
    },
    failure() {
      if (
        input.parentSignal.aborted &&
        input.parentSignal.reason === "job_attempt_timeout"
      ) {
        return new AiProviderError({
          code: "AI_JOB_ATTEMPT_TIMEOUT",
          classification: "CANCELLED",
          retryable: false,
          statusCode: 504,
          safeMessage: "The AI job attempt took too long.",
          timeoutPhase: "job_attempt",
        });
      }
      if (cancelled || (input.parentSignal.aborted && !timeoutPhase)) {
        return new AiProviderError({
          code: "AI_REQUEST_CANCELLED",
          classification: "CANCELLED",
          retryable: false,
          safeMessage: "The AI request was cancelled.",
        });
      }

      return new AiProviderError({
        code: "AI_TIMEOUT",
        classification: "RETRYABLE_PROVIDER_TIMEOUT",
        retryable: true,
        statusCode: 504,
        safeMessage: "The AI provider took too long to respond.",
        timeoutPhase: timeoutPhase ?? "total",
      });
    },
    cleanup() {
      clearTimer(connectionTimer);
      clearTimer(firstResponseTimer);
      clearTimer(idleTimer);
      clearTimer(totalTimer);
      input.parentSignal.removeEventListener("abort", abortForParent);
    },
  };
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (signal.aborted) throw signal.reason;

  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    reader.read().then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

export async function readProviderResponseBody(
  response: Response,
  input: {
    scope: ProviderSignalScope;
    onPhase?(phase: ProviderProgressPhase): void | Promise<void>;
    maximumBytes?: number;
  },
): Promise<string> {
  const maximumBytes = input.maximumBytes ?? defaultMaximumResponseBytes;
  await input.onPhase?.("waiting_for_first_response");

  if (!response.body) {
    input.scope.markResponseChunk();
    await input.onPhase?.("receiving_response");
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let receivedBytes = 0;
  let receivingReported = false;

  try {
    while (true) {
      const chunk = await readChunk(reader, input.scope.signal);
      if (chunk.done) break;

      input.scope.markResponseChunk();
      if (!receivingReported) {
        receivingReported = true;
        await input.onPhase?.("receiving_response");
      }
      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > maximumBytes) {
        throw new AiProviderError({
          code: "AI_RESPONSE_TOO_LARGE",
          classification: "NON_RETRYABLE_OUTPUT_VALIDATION",
          retryable: false,
          statusCode: 502,
          safeMessage: "The AI provider returned an invalid response.",
        });
      }
      parts.push(decoder.decode(chunk.value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join("");
  } catch (error) {
    if (input.scope.signal.aborted) throw input.scope.failure();
    throw error;
  } finally {
    if (input.scope.signal.aborted) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}
