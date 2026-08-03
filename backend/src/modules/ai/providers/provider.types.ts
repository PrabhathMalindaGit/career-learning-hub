export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ProviderStructuredRequest {
  systemPrompt: string;
  userPrompt: string;
  responseJsonSchema: Record<string, unknown>;
  model?: string;
  signal: AbortSignal;
}

export interface ProviderStructuredResponse {
  text: string;
  model: string;
  usage: ProviderUsage;
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
