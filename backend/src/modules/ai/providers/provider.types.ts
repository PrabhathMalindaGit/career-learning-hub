export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
}

export const aiProviderFailureClassifications = [
  "RETRYABLE_RATE_LIMIT",
  "RETRYABLE_PROVIDER_UNAVAILABLE",
  "RETRYABLE_PROVIDER_TIMEOUT",
  "RETRYABLE_NETWORK",
  "NON_RETRYABLE_AUTHENTICATION",
  "NON_RETRYABLE_CONFIGURATION",
  "NON_RETRYABLE_REQUEST",
  "NON_RETRYABLE_CONTENT_POLICY",
  "NON_RETRYABLE_OUTPUT_VALIDATION",
  "CANCELLED",
  "UNKNOWN_PROVIDER_FAILURE",
] as const;

export type AiProviderFailureClassification =
  (typeof aiProviderFailureClassifications)[number];

export type AiTimeoutPhase =
  | "connection"
  | "first_response"
  | "idle"
  | "total"
  | "job_attempt";

export type ProviderProgressPhase =
  | "contacting_provider"
  | "waiting_for_first_response"
  | "receiving_response";

export interface ProviderTimeoutProfile {
  connectMs: number;
  firstResponseMs: number;
  idleMs: number;
  totalMs: number;
}

export interface ProviderStructuredRequest {
  systemPrompt: string;
  userPrompt: string;
  responseJsonSchema: Record<string, unknown>;
  model?: string;
  models?: readonly string[];
  maximumOutputTokens?: number;
  timeoutMs?: number;
  timeouts?: ProviderTimeoutProfile;
  signal: AbortSignal;
  onPhase?(phase: ProviderProgressPhase): void | Promise<void>;
  credential?: ProviderCredentialHandle;
}

export interface ProviderCredentialHandle {
  read(): string;
}

export interface ProviderStructuredResponse {
  text: string;
  model: string;
  usage: ProviderUsage;
  providerRequestId?: string;
  finishReason?: string;
}

export interface AiProviderAdapter {
  readonly name: string;
  generateStructured(
    request: ProviderStructuredRequest,
  ): Promise<ProviderStructuredResponse>;
}

export class AiProviderError extends Error {
  readonly code: string;
  readonly classification: AiProviderFailureClassification;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly timeoutPhase?: AiTimeoutPhase;

  constructor(input: {
    code: string;
    classification: AiProviderFailureClassification;
    retryable: boolean;
    safeMessage: string;
    statusCode?: number;
    timeoutPhase?: AiTimeoutPhase;
  });
  constructor(
    message: string,
    code: string,
    retryable: boolean,
    statusCode?: number,
  );
  constructor(
    inputOrMessage:
      | string
      | {
          code: string;
          classification: AiProviderFailureClassification;
          retryable: boolean;
          safeMessage: string;
          statusCode?: number;
          timeoutPhase?: AiTimeoutPhase;
        },
    legacyCode?: string,
    legacyRetryable?: boolean,
    legacyStatusCode?: number,
  ) {
    const input =
      typeof inputOrMessage === "string"
        ? {
            code: legacyCode ?? "AI_PROVIDER_FAILURE",
            classification: legacyRetryable
              ? ("UNKNOWN_PROVIDER_FAILURE" as const)
              : ("NON_RETRYABLE_REQUEST" as const),
            retryable: legacyRetryable ?? false,
            safeMessage: inputOrMessage,
            statusCode: legacyStatusCode,
          }
        : inputOrMessage;

    super(input.safeMessage);
    this.name = "AiProviderError";
    this.code = input.code;
    this.classification = input.classification;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
    this.timeoutPhase = input.timeoutPhase;
  }
}
