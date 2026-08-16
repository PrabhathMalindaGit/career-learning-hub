import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../shared/appError.js";

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

// Feature 7.7 — Request validation boundary.
// Rejects malformed validated inputs before feature handlers persist or queue work.
export function validate(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    const errors: Record<string, unknown> = {};

    for (const key of ["body", "params", "query"] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(request[key]);
      if (!result.success) {
        errors[key] = {
          ...result.error.flatten(),
          issues: result.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        };
      } else if (key === "query") {
        Object.defineProperty(request, "query", {
          value: result.data,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      } else {
        (request as unknown as Record<string, unknown>)[key] = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed.",
          errors,
        ),
      );
      return;
    }

    next();
  };
}
