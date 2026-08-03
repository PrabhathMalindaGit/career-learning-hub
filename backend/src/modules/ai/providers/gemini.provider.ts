import { env } from "../../../config/env.js";
import {
  AiProviderError,
  type AiProviderAdapter,
  type ProviderStructuredRequest,
  type ProviderStructuredResponse,
} from "./provider.types.js";

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
}

export class GeminiProviderAdapter implements AiProviderAdapter {
  readonly name = "gemini";

  async generateStructured(
    request: ProviderStructuredRequest,
  ): Promise<ProviderStructuredResponse> {
    if (!env.GEMINI_API_KEY) {
      throw new AiProviderError(
        "Gemini is not configured.",
        "GEMINI_NOT_CONFIGURED",
        false,
        503,
      );
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
    endpoint.searchParams.set("key", env.GEMINI_API_KEY);

    let response: globalThis.Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        signal: request.signal,
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
    } catch (error) {
      if (request.signal.aborted) {
        throw new AiProviderError(
          "Gemini request timed out.",
          "AI_TIMEOUT",
          true,
          504,
        );
      }

      throw new AiProviderError(
        error instanceof Error ? error.message : "Gemini request failed.",
        "AI_NETWORK_ERROR",
        true,
        503,
      );
    }

    const body = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      throw new AiProviderError(
        `Gemini returned HTTP ${response.status}.`,
        body.error?.status ?? "GEMINI_API_ERROR",
        retryable,
        response.status,
      );
    }

    const text = body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new AiProviderError(
        "Gemini returned an empty structured response.",
        "AI_EMPTY_RESPONSE",
        true,
        502,
      );
    }

    return {
      text,
      model,
      usage: {
        inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
