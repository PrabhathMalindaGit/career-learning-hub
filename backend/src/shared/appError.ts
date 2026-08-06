export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly retryable?: boolean,
    public readonly classification?: string,
    public readonly timeoutPhase?: string,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, AppError);
  }
}
