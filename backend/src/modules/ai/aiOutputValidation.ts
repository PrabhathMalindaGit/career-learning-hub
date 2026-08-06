import { z } from "zod";
import { AppError } from "../../shared/appError.js";

export function extractStructuredJson(text: string): unknown {
  if (text.length > 2_000_000) {
    throw new AppError(
      502,
      "AI_RESPONSE_TOO_LARGE",
      "The AI provider response exceeded the permitted size.",
      undefined,
      false,
    );
  }

  const trimmed = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstObject = trimmed.indexOf("{");
    const firstArray = trimmed.indexOf("[");
    const starts = [firstObject, firstArray].filter(
      (index) => index >= 0,
    );
    const start =
      starts.length > 0 ? Math.min(...starts) : -1;
    const end = Math.max(
      trimmed.lastIndexOf("}"),
      trimmed.lastIndexOf("]"),
    );

    if (start < 0 || end <= start) {
      throw new AppError(
        502,
        "AI_INVALID_JSON",
        "The AI provider did not return valid JSON.",
        undefined,
        false,
      );
    }

    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      throw new AppError(
        502,
        "AI_INVALID_JSON",
        "The AI provider did not return valid JSON.",
        undefined,
        false,
      );
    }
  }
}

export function validateStructuredAiOutput<
  TSchema extends z.ZodTypeAny,
>(
  text: string,
  schema: TSchema,
): z.output<TSchema> {
  const parsed = schema.safeParse(
    extractStructuredJson(text),
  );

  if (!parsed.success) {
    throw new AppError(
      502,
      "AI_SCHEMA_VALIDATION_FAILED",
      "The AI response did not match the required structure.",
      parsed.error.flatten(),
      false,
    );
  }

  return parsed.data;
}
