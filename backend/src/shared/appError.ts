export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly retryable?: boolean,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, AppError);
  }
}
