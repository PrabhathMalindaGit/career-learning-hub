import { z } from "zod";
import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { UsageEventModel } from "./usageEvent.model.js";
import { validateStructuredAiOutput } from "./aiOutputValidation.js";
import { toProviderJsonSchema } from "./providerJsonSchema.js";
import {
  estimateTokens,
  reconcileAiTokenUsage,
  reserveAiQuota,
} from "./aiQuota.service.js";
import { GeminiProviderAdapter } from "./providers/gemini.provider.js";
import {
  AiProviderError,
  type AiProviderAdapter,
  type ProviderProgressPhase,
} from "./providers/provider.types.js";
import { authorizeAiJobExecution } from "./aiRouting.service.js";

const providers: Record<string, AiProviderAdapter> = {
  gemini: new GeminiProviderAdapter(),
};

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
  signal?: AbortSignal;
  reportPhase?(
    phase: ProviderProgressPhase | "validating",
  ): void | Promise<void>;
}): Promise<z.output<TSchema>> {
  const routingAuthorization =
    input.jobId
      ? await authorizeAiJobExecution({ jobId: input.jobId })
      : undefined;

  try {
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
  const responseJsonSchema = toProviderJsonSchema(input.schema);
  await reserveAiQuota({
    userId: input.userId,
    estimatedTokens,
  });

  const startedAt = Date.now();
  let model =
    routingAuthorization?.snapshot.directModelId ??
    routingAuthorization?.snapshot.freeModelIds?.[0] ??
    input.model ??
    env.GEMINI_MODEL;
  let actualInputTokens = 0;
  let actualOutputTokens = 0;
  const providerAttempt = 1;

  try {
    await input.reportPhase?.("contacting_provider");
    const result = await provider.generateStructured({
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        responseJsonSchema,
        model: routingAuthorization?.snapshot.directModelId ?? input.model,
        models: routingAuthorization?.snapshot.freeModelIds,
        maximumOutputTokens:
          routingAuthorization?.snapshot.maximumOutputTokens,
        timeoutMs:
          routingAuthorization?.snapshot.totalMs ??
          env.GEMINI_TOTAL_TIMEOUT_MS,
        timeouts: {
          connectMs: Math.min(
            env.GEMINI_CONNECT_TIMEOUT_MS,
            routingAuthorization?.snapshot.totalMs ??
              env.GEMINI_TOTAL_TIMEOUT_MS,
          ),
          firstResponseMs:
            routingAuthorization?.snapshot.ttftMs ??
            env.GEMINI_FIRST_RESPONSE_TIMEOUT_MS,
          idleMs:
            routingAuthorization?.snapshot.streamIdleMs ??
            env.GEMINI_IDLE_TIMEOUT_MS,
          totalMs:
            routingAuthorization?.snapshot.totalMs ??
            env.GEMINI_TOTAL_TIMEOUT_MS,
        },
        signal: input.signal ?? new AbortController().signal,
        onPhase: input.reportPhase,
        credential: routingAuthorization?.credential,
      });

    model = result.model;
    actualInputTokens = result.usage.inputTokens;
    actualOutputTokens = result.usage.outputTokens;
    await input.reportPhase?.("validating");
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
        metadata: {
          ...input.metadata,
          providerAttempt,
          ...(routingAuthorization?.snapshot.provider === "openrouter"
            ? {
                plannedModelListHash: createHash("sha256")
                  .update(routingAuthorization.snapshot.freeModelIds!.join("\n"))
                  .digest("hex"),
                actualModel: result.model,
                freeTier: true,
                catalogueVersion: routingAuthorization.snapshot.catalogueVersion,
                routingProfileVersion:
                  routingAuthorization.snapshot.routingProfileVersion,
                rankingPolicyVersion:
                  routingAuthorization.snapshot.rankingPolicyVersion,
                providerRequestId: result.providerRequestId,
                finishReason: result.finishReason,
                totalTokens:
                  result.usage.totalTokens ??
                  result.usage.inputTokens + result.usage.outputTokens,
                workerAttempt: routingAuthorization.workerAttempt,
                fallbackWithinFreeModels:
                  routingAuthorization.snapshot.freeModelIds!.indexOf(result.model),
              }
            : {}),
        },
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

    await Promise.all([
      reconcileAiTokenUsage({
        userId: input.userId,
        estimatedTokens,
        actualInputTokens,
        actualOutputTokens,
      }),
      UsageEventModel.create({
        userId: input.userId,
        feature: input.feature,
        provider: provider.name,
        model,
        requestCount: 1,
        inputTokens: actualInputTokens,
        outputTokens: actualOutputTokens,
        status: "failure",
        latencyMs: Date.now() - startedAt,
        errorCode,
        jobId: input.jobId,
        metadata: {
          ...input.metadata,
          providerAttempt,
          ...(error instanceof AiProviderError
            ? {
                classification: error.classification,
                retryable: error.retryable,
                ...(error.timeoutPhase
                  ? { timeoutPhase: error.timeoutPhase }
                  : {}),
              }
            : {}),
          ...(routingAuthorization?.snapshot.provider === "openrouter"
            ? {
                plannedModelListHash: createHash("sha256")
                  .update(routingAuthorization.snapshot.freeModelIds!.join("\n"))
                  .digest("hex"),
                freeTier: true,
                catalogueVersion: routingAuthorization.snapshot.catalogueVersion,
                routingProfileVersion:
                  routingAuthorization.snapshot.routingProfileVersion,
                rankingPolicyVersion:
                  routingAuthorization.snapshot.rankingPolicyVersion,
                workerAttempt: routingAuthorization.workerAttempt,
              }
            : {}),
        },
      }),
    ]).catch((loggingError: unknown) => {
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
        undefined,
        error.retryable,
        error.classification,
        error.timeoutPhase,
      );
    }

    throw new AppError(
      502,
      "AI_REQUEST_FAILED",
      "The AI request failed.",
    );
  }
  } finally {
    await routingAuthorization?.release();
  }
}
