import type {
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
} from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../shared/appError.js";
import {
  logger,
  serializeErrorForLog,
} from "../shared/logger.js";

interface PublicError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "body" in error
  );
}

function normalizeError(error: unknown): PublicError {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: error.flatten(),
    };
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof multer.MulterError) {
    return {
      statusCode:
        error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      code:
        error.code === "LIMIT_FILE_SIZE"
          ? "UPLOAD_TOO_LARGE"
          : "UPLOAD_REJECTED",
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "The uploaded file exceeds the permitted size."
          : "The uploaded file could not be accepted.",
    };
  }

  if (isMalformedJson(error)) {
    return {
      statusCode: 400,
      code: "INVALID_JSON",
      message: "The request body contains invalid JSON.",
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 413
  ) {
    return {
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message:
        "The request body exceeds the permitted size.",
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 415
  ) {
    return {
      statusCode: 415,
      code: "UNSUPPORTED_CONTENT_ENCODING",
      message:
        "The request content encoding is not supported.",
    };
  }

  if (isDuplicateKeyError(error)) {
    return {
      statusCode: 409,
      code: "DUPLICATE_RESOURCE",
      message:
        "A resource with that value already exists.",
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "CastError"
  ) {
    return {
      statusCode: 400,
      code: "INVALID_IDENTIFIER",
      message: "A supplied resource identifier is invalid.",
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
  };
}

function sendPublicError(
  request: Request,
  response: Response,
  error: PublicError,
): void {
  const canExposeDetails =
    error.details !== undefined &&
    (error.statusCode < 500 ||
      process.env.NODE_ENV !== "production");

  response.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      requestId: request.requestId,
      ...(canExposeDetails
        ? { details: error.details }
        : {}),
    },
  });
}

export const notFoundHandler: RequestHandler = (
  request,
  _response,
  next,
) => {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${request.method} ${request.path} was not found.`,
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const publicError = normalizeError(error);
  const logData = {
    method: request.method,
    path: request.path,
    statusCode: publicError.statusCode,
    errorCode: publicError.code,
    userId: request.auth?.userId,
    ...serializeErrorForLog(error),
  };

  if (publicError.statusCode >= 500) {
    logger.error("http.request.failed", logData);
  } else if (
    publicError.statusCode === 401 ||
    publicError.statusCode === 403 ||
    publicError.statusCode === 429
  ) {
    logger.warn("http.request.rejected", logData);
  } else {
    logger.debug("http.request.invalid", logData);
  }

  sendPublicError(request, response, publicError);
};
