import { env } from "../../../config/env.js";
import {
  AiProviderError,
  type AiProviderAdapter,
  type ProviderStructuredRequest,
  type ProviderStructuredResponse,
} from "./provider.types.js";
import {
  composeProviderSignal,
  readProviderResponseBody,
} from "./providerTimeouts.js";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
  promptFeedback?: {
    blockReason?: string;
  };
}

function providerHttpError(
  response: Response,
  body: GeminiResponse,
): AiProviderError {
  const code = body.error?.status ?? "GEMINI_API_ERROR";
  const statusCode = response.status;
  const contentPolicyFailure =
    /(?:safety|blocked|content[_ -]?policy)/i.test(code) ||
    Boolean(body.promptFeedback?.blockReason);

  if (contentPolicyFailure) {
    return new AiProviderError({
      code,
      classification: "NON_RETRYABLE_CONTENT_POLICY",
      retryable: false,
      statusCode,
      safeMessage: "The AI provider could not process this content.",
    });
  }
  if (statusCode === 401 || statusCode === 403) {
    return new AiProviderError({
      code,
      classification: "NON_RETRYABLE_AUTHENTICATION",
      retryable: false,
      statusCode,
      safeMessage: "The AI provider is not authorized.",
    });
  }
  if (statusCode === 404) {
    return new AiProviderError({
      code,
      classification: "NON_RETRYABLE_CONFIGURATION",
      retryable: false,
      statusCode,
      safeMessage: "The configured AI model is unavailable.",
    });
  }
  if (statusCode === 408 || statusCode === 504) {
    return new AiProviderError({
      code,
      classification: "RETRYABLE_PROVIDER_TIMEOUT",
      retryable: true,
      statusCode,
      safeMessage: "The AI provider took too long to respond.",
    });
  }
  if (statusCode === 429) {
    return new AiProviderError({
      code,
      classification: "RETRYABLE_RATE_LIMIT",
      retryable: true,
      statusCode,
      safeMessage: "Too many AI requests are being processed.",
    });
  }
  if (statusCode >= 500) {
    return new AiProviderError({
      code,
      classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
      retryable: true,
      statusCode,
      safeMessage: "The AI provider is temporarily unavailable.",
    });
  }

  return new AiProviderError({
    code,
    classification: "NON_RETRYABLE_REQUEST",
    retryable: false,
    statusCode,
    safeMessage: "The AI request could not be processed.",
  });
}

export class GeminiProviderAdapter implements AiProviderAdapter {
  readonly name = "gemini";

  async generateStructured(
    request: ProviderStructuredRequest,
  ): Promise<ProviderStructuredResponse> {
    const apiKey = request.credential?.read() ?? env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiProviderError({
        code: "GEMINI_NOT_CONFIGURED",
        classification: "NON_RETRYABLE_CONFIGURATION",
        retryable: false,
        statusCode: 503,
        safeMessage: "The AI provider is not configured.",
      });
    }

    const model = request.model ?? env.GEMINI_MODEL;
    const generationConfig: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseJsonSchema: request.responseJsonSchema,
    };

    if (!/^gemini-3(?:[.-]|$)/i.test(model)) {
      generationConfig.temperature = 0.2;
    }

    const endpoint = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent`,
    );
    endpoint.searchParams.set("key", apiKey);

    const timeouts = request.timeouts ?? {
      connectMs: env.GEMINI_CONNECT_TIMEOUT_MS,
      firstResponseMs: env.GEMINI_FIRST_RESPONSE_TIMEOUT_MS,
      idleMs: env.GEMINI_IDLE_TIMEOUT_MS,
      totalMs: request.timeoutMs ?? env.GEMINI_TOTAL_TIMEOUT_MS,
    };
    const timeoutScope = composeProviderSignal({
      parentSignal: request.signal,
      timeouts,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: timeoutScope.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig,
        }),
      });
      timeoutScope.markResponseHeaders();
      const responseText = await readProviderResponseBody(response, {
        scope: timeoutScope,
        onPhase: request.onPhase,
      });
      if (!response.ok) {
        let errorBody: GeminiResponse = {};
        try {
          errorBody = JSON.parse(responseText) as GeminiResponse;
        } catch {
          // The HTTP status remains authoritative for safe error classification.
        }
        throw providerHttpError(response, errorBody);
      }
      let body: GeminiResponse;
      try {
        body = JSON.parse(responseText) as GeminiResponse;
      } catch {
        throw new AiProviderError({
          code: "AI_INVALID_PROVIDER_RESPONSE",
          classification: "NON_RETRYABLE_OUTPUT_VALIDATION",
          retryable: false,
          statusCode: 502,
          safeMessage: "The AI provider returned an invalid response.",
        });
      }

      if (body.promptFeedback?.blockReason) {
        throw providerHttpError(
          new Response(null, { status: 400 }),
          body,
        );
      }

      const text = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!text) {
        throw new AiProviderError({
          code: "AI_EMPTY_RESPONSE",
          classification: "NON_RETRYABLE_OUTPUT_VALIDATION",
          retryable: false,
          statusCode: 502,
          safeMessage: "The AI provider returned an invalid response.",
        });
      }

      return {
        text,
        model,
        usage: {
          inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (timeoutScope.signal.aborted) throw timeoutScope.failure();
      throw new AiProviderError({
        code: "AI_NETWORK_ERROR",
        classification: "RETRYABLE_NETWORK",
        retryable: true,
        statusCode: 503,
        safeMessage: "The AI provider is temporarily unavailable.",
      });
    } finally {
      timeoutScope.cleanup();
    }
  }
}
