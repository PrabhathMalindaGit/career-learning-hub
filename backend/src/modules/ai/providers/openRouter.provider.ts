import { createHash } from "node:crypto";
import { isValidOpenRouterModelId } from "../openRouterCatalogue.js";
import {
  AiProviderError,
  type AiProviderAdapter,
  type ProviderStructuredRequest,
  type ProviderStructuredResponse,
} from "./provider.types.js";

export const OPENROUTER_CHAT_COMPLETIONS_ENDPOINT =
  "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MAX_RESPONSE_BYTES = 1_000_000;
const OPENROUTER_MAX_REQUEST_BYTES = 1_000_000;
const requestIdPattern = /^[A-Za-z0-9._:-]{1,120}$/;

interface OpenRouterErrorBody {
  error?: {
    code?: number;
    metadata?: { error_type?: string };
  };
}

interface OpenRouterSuccessBody extends OpenRouterErrorBody {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string | null;
    error?: OpenRouterErrorBody["error"];
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function safeRequestId(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  if (requestIdPattern.test(value)) return value;
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function normalizedError(input: {
  status: number;
  errorType?: string;
}): AiProviderError {
  const byType: Readonly<Record<string, [string, boolean, number]>> = {
    authentication: ["invalid_credentials", false, 401],
    permission_denied: ["permission_denied", false, 403],
    payment_required: ["quota_exhausted", false, 402],
    rate_limit_exceeded: ["rate_limited", true, 429],
    provider_overloaded: ["provider_overloaded", true, 503],
    provider_unavailable: ["model_unavailable", true, 502],
    timeout: ["request_timeout", true, 504],
    context_length_exceeded: ["context_too_large", false, 400],
    invalid_request: ["invalid_request", false, 400],
    invalid_prompt: ["invalid_request", false, 400],
    not_found: ["model_not_found", false, 404],
    content_policy_violation: ["content_blocked", false, 400],
    refusal: ["content_blocked", false, 400],
  };
  const byStatus: Readonly<Record<number, [string, boolean]>> = {
    400: ["invalid_request", false],
    401: ["invalid_credentials", false],
    402: ["quota_exhausted", false],
    403: ["permission_denied", false],
    404: ["model_not_found", false],
    408: ["request_timeout", true],
    429: ["rate_limited", true],
    500: ["unknown_provider_error", true],
    502: ["model_unavailable", true],
    503: ["provider_overloaded", true],
    504: ["request_timeout", true],
  };
  const typed = input.errorType ? byType[input.errorType] : undefined;
  const [code, retryable, statusCode] = typed
    ? typed
    : [...(byStatus[input.status] ?? ["unknown_provider_error", input.status >= 500]), input.status] as [string, boolean, number];
  return new AiProviderError(
    "The OpenRouter request failed.",
    code,
    retryable,
    statusCode,
  );
}

async function readBoundedBody(response: Response): Promise<string> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > OPENROUTER_MAX_RESPONSE_BYTES) {
    throw new AiProviderError(
      "OpenRouter returned an invalid provider response.",
      "invalid_provider_output",
      false,
      502,
    );
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > OPENROUTER_MAX_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new AiProviderError(
        "OpenRouter returned an invalid provider response.",
        "invalid_provider_output",
        false,
        502,
      );
    }
    chunks.push(value);
  }
  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function nonnegativeInteger(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

export class OpenRouterProviderAdapter implements AiProviderAdapter {
  readonly name = "openrouter";

  async generateStructured(
    request: ProviderStructuredRequest,
  ): Promise<ProviderStructuredResponse> {
    const models = request.models ? [...request.models] : [];
    if (
      models.length === 0 ||
      models.length > 10 ||
      new Set(models).size !== models.length ||
      models.some((model) =>
        !isValidOpenRouterModelId(model) ||
        model === "openrouter/auto" ||
        model === "openrouter/free")
    ) {
      throw new AiProviderError(
        "The OpenRouter model plan is invalid.",
        "routing_configuration_invalid",
        false,
        409,
      );
    }
    if (!request.credential) {
      throw new AiProviderError(
        "OpenRouter is not configured.",
        "provider_not_available",
        false,
        503,
      );
    }
    const maximumOutputTokens = request.maximumOutputTokens;
    if (
      !Number.isSafeInteger(maximumOutputTokens) ||
      Number(maximumOutputTokens) < 1 ||
      Number(maximumOutputTokens) > 200_000
    ) {
      throw new AiProviderError(
        "The OpenRouter output limit is invalid.",
        "routing_configuration_invalid",
        false,
        409,
      );
    }

    const body = JSON.stringify({
      models,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      stream: false,
      max_tokens: maximumOutputTokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "career_learning_hub_response",
          strict: true,
          schema: request.responseJsonSchema,
        },
      },
      provider: { require_parameters: true },
    });
    if (Buffer.byteLength(body, "utf8") > OPENROUTER_MAX_REQUEST_BYTES) {
      throw new AiProviderError(
        "The OpenRouter request is too large.",
        "invalid_request",
        false,
        413,
      );
    }

    const timeoutController = new AbortController();
    const timeout = setTimeout(
      () => timeoutController.abort(),
      Math.min(Math.max(request.timeoutMs ?? 30_000, 1_000), 120_000),
    );
    timeout.unref();
    const signal = AbortSignal.any([request.signal, timeoutController.signal]);

    let response: Response;
    try {
      response = await fetch(OPENROUTER_CHAT_COMPLETIONS_ENDPOINT, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${request.credential.read()}`,
          "Content-Type": "application/json",
        },
        body,
      });
    } catch {
      if (request.signal.aborted || timeoutController.signal.aborted) {
        throw new AiProviderError(
          "The OpenRouter request timed out.",
          "request_timeout",
          true,
          504,
        );
      }
      throw new AiProviderError(
        "The OpenRouter network request failed.",
        "network_error",
        true,
        503,
      );
    } finally {
      clearTimeout(timeout);
    }

    const rawBody = await readBoundedBody(response);
    let parsed: OpenRouterSuccessBody;
    try {
      parsed = JSON.parse(rawBody) as OpenRouterSuccessBody;
    } catch {
      throw new AiProviderError(
        "OpenRouter returned an invalid provider response.",
        "invalid_provider_output",
        false,
        502,
      );
    }

    const embeddedError = parsed.error ?? parsed.choices?.[0]?.error;
    if (!response.ok || embeddedError) {
      throw normalizedError({
        status: response.ok
          ? nonnegativeInteger(embeddedError?.code) || 500
          : response.status,
        errorType: embeddedError?.metadata?.error_type,
      });
    }

    const actualModel = parsed.model;
    const text = parsed.choices?.[0]?.message?.content;
    if (
      typeof actualModel !== "string" ||
      !models.includes(actualModel) ||
      typeof text !== "string" ||
      text.length === 0 ||
      Buffer.byteLength(text, "utf8") > OPENROUTER_MAX_RESPONSE_BYTES
    ) {
      throw new AiProviderError(
        "OpenRouter returned an invalid provider response.",
        "invalid_provider_output",
        false,
        502,
      );
    }

    const inputTokens = nonnegativeInteger(parsed.usage?.prompt_tokens);
    const outputTokens = nonnegativeInteger(parsed.usage?.completion_tokens);
    return {
      text,
      model: actualModel,
      ...(safeRequestId(parsed.id)
        ? { providerRequestId: safeRequestId(parsed.id) }
        : {}),
      ...(typeof parsed.choices?.[0]?.finish_reason === "string"
        ? { finishReason: parsed.choices[0].finish_reason.slice(0, 40) }
        : {}),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens:
          nonnegativeInteger(parsed.usage?.total_tokens) ||
          inputTokens + outputTokens,
      },
    };
  }
}
