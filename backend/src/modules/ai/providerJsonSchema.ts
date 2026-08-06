import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AppError } from "../../shared/appError.js";

export type ProviderJsonSchema = Record<string, unknown>;

const geminiSchemaKeywords = new Set([
  "type",
  "properties",
  "items",
  "required",
  "enum",
  "additionalProperties",
  "anyOf",
  "oneOf",
  "nullable",
]);

function toGeminiCompatibleSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toGeminiCompatibleSchema);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const entries = Object.entries(source)
    .filter(([key]) => geminiSchemaKeywords.has(key))
    .map(([key, nestedValue]) => {
      if (
        key === "properties" &&
        typeof nestedValue === "object" &&
        nestedValue !== null &&
        !Array.isArray(nestedValue)
      ) {
        return [
          key,
          Object.fromEntries(
            Object.entries(nestedValue).map(
              ([propertyName, propertySchema]) => [
                propertyName,
                toGeminiCompatibleSchema(propertySchema),
              ],
            ),
          ),
        ];
      }

      return [key, toGeminiCompatibleSchema(nestedValue)];
    });
  const compatible = Object.fromEntries(entries) as Record<
    string,
    unknown
  >;

  if (source.const !== undefined && compatible.enum === undefined) {
    compatible.enum = [source.const];
  }

  return compatible;
}

export function toProviderJsonSchema(
  schema: ZodTypeAny,
): ProviderJsonSchema {
  const converted = zodToJsonSchema(schema, {
    target: "jsonSchema7",
    $refStrategy: "none",
    effectStrategy: "input",
  });

  if (
    typeof converted !== "object" ||
    converted === null ||
    Array.isArray(converted)
  ) {
    throw new AppError(
      500,
      "AI_RESPONSE_SCHEMA_UNSUPPORTED",
      "The AI response schema could not be converted for the provider.",
      undefined,
      false,
    );
  }

  const {
    $schema: _schemaDialect,
    definitions: _definitions,
    ...providerSchema
  } = converted;
  const compatibleSchema = toGeminiCompatibleSchema(
    providerSchema,
  );

  if (
    typeof compatibleSchema !== "object" ||
    compatibleSchema === null ||
    Array.isArray(compatibleSchema) ||
    !("type" in compatibleSchema) ||
    compatibleSchema.type !== "object"
  ) {
    throw new AppError(
      500,
      "AI_RESPONSE_SCHEMA_UNSUPPORTED",
      "The AI response schema must describe an object.",
      undefined,
      false,
    );
  }

  return compatibleSchema as ProviderJsonSchema;
}
