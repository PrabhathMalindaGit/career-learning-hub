import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { UsageEventModel } from "./usageEvent.model.js";
import { validateStructuredAiOutput } from "./aiOutputValidation.js";
import {
  estimateTokens,
  reconcileAiTokenUsage,
  reserveAiQuota,
} from "./aiQuota.service.js";
import { GeminiProviderAdapter } from "./providers/gemini.provider.js";
import {
  AiProviderError,
  type AiProviderAdapter,
} from "./providers/provider.types.js";

const providers: Record<string, AiProviderAdapter> = {
  gemini: new GeminiProviderAdapter(),
};

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function executeWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= env.AI_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.AI_REQUEST_TIMEOUT_MS,
    );

    try {
      return await operation(controller.signal);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof AiProviderError && error.retryable;

      if (!retryable || attempt >= env.AI_MAX_RETRIES) {
        throw error;
      }

      const backoff = Math.min(
        5_000,
        250 * 2 ** attempt + Math.floor(Math.random() * 200),
      );
      await delay(backoff);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

export async function generateStructuredOutput<
  TSchema extends z.ZodTypeAny,
>(input: {
  userId: string;
  feature: string;
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
  provider?: string;
  model?: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
}): Promise<z.output<TSchema>> {
  const providerName = input.provider ?? env.AI_DEFAULT_PROVIDER;
  const provider = providers[providerName];

  if (!provider) {
    throw new AppError(
      500,
      "AI_PROVIDER_NOT_FOUND",
      `AI provider ${providerName} is not registered.`,
    );
  }

  const estimatedTokens = estimateTokens(
    `${input.systemPrompt}\n${input.userPrompt}`,
  );
  await reserveAiQuota({
    userId: input.userId,
    estimatedTokens,
  });

  const startedAt = Date.now();
  let model = input.model ?? env.GEMINI_MODEL;

  try {
    const result = await executeWithRetry((signal) =>
      provider.generateStructured({
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        model: input.model,
        signal,
      }),
    );

    model = result.model;
    const parsed = validateStructuredAiOutput(
      result.text,
      input.schema,
    );

    await Promise.all([
      reconcileAiTokenUsage({
        userId: input.userId,
        estimatedTokens,
        actualInputTokens: result.usage.inputTokens,
        actualOutputTokens: result.usage.outputTokens,
      }),
      UsageEventModel.create({
        userId: input.userId,
        feature: input.feature,
        provider: provider.name,
        model: result.model,
        requestCount: 1,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        status: "success",
        latencyMs: Date.now() - startedAt,
        jobId: input.jobId,
        metadata: input.metadata,
      }),
    ]);

    return parsed;
  } catch (error) {
    const errorCode =
      error instanceof AppError
        ? error.code
        : error instanceof AiProviderError
          ? error.code
          : "AI_UNKNOWN_ERROR";

    await UsageEventModel.create({
      userId: input.userId,
      feature: input.feature,
      provider: provider.name,
      model,
      requestCount: 1,
      inputTokens: 0,
      outputTokens: 0,
      status: "failure",
      latencyMs: Date.now() - startedAt,
      errorCode,
      jobId: input.jobId,
      metadata: input.metadata,
    }).catch((loggingError: unknown) => {
      logger.error("ai.usage-log.failed", {
        feature: input.feature,
        ...serializeErrorForLog(loggingError),
      });
    });

    if (error instanceof AppError) throw error;
    if (error instanceof AiProviderError) {
      throw new AppError(
        error.statusCode ?? 502,
        error.code,
        error.message,
      );
    }

    throw new AppError(
      502,
      "AI_REQUEST_FAILED",
      "The AI request failed.",
    );
  }
}
