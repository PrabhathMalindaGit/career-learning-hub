export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
}

export interface ProviderStructuredRequest {
  systemPrompt: string;
  userPrompt: string;
  responseJsonSchema: Record<string, unknown>;
  model?: string;
  models?: readonly string[];
  maximumOutputTokens?: number;
  timeoutMs?: number;
  signal: AbortSignal;
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
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
