import { Decimal128 } from "mongodb";
import { z } from "zod";

export const OPENROUTER_MAX_CATALOGUE_ITEMS = 2_000;
export const OPENROUTER_RANKING_POLICY_VERSION =
  "openrouter-free-ranking-v2";
export const OPENROUTER_PRICING_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export const openRouterActions = [
  "resume-parse",
  "resume-analysis",
  "resume-rewrite",
  "resume-job-comparison",
  "interview-question-generation",
  "interview-question-explanation",
  "interview-answer-feedback",
  "learning-summary",
  "learning-grounded-chat",
  "flashcard-generation",
  "quiz-generation",
] as const;

export type OpenRouterAction = (typeof openRouterActions)[number];

export const openRouterPricingDimensions = [
  "prompt",
  "completion",
  "request",
  "image",
  "web_search",
  "internal_reasoning",
  "input_cache_read",
  "input_cache_write",
] as const;

export type OpenRouterPricingDimension =
  (typeof openRouterPricingDimensions)[number];

const modelIdPattern =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,78}\/[A-Za-z0-9][A-Za-z0-9._:-]{0,78}$/;
const safeTokenPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const exactDecimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const pricingDimensionSet = new Set<string>(openRouterPricingDimensions);
const requiredPricingDimensions = new Set<OpenRouterPricingDimension>([
  "prompt",
  "completion",
  "request",
]);

const modelIdSchema = z
  .string()
  .min(3)
  .max(160)
  .regex(modelIdPattern)
  .refine((value) => !value.includes(".."));
const safeTextSchema = z.string().trim().min(1).max(240);
const supportedParameterSchema = z.string().max(80).regex(safeTokenPattern);
const inputModalitySchema = z.enum(["text", "image", "audio", "file"]);
const outputModalitySchema = z.enum([
  "text",
  "image",
  "audio",
  "embeddings",
]);

const utcClockSchema = z
  .number()
  .int()
  .min(0)
  .max(2359)
  .refine((value) => value % 100 < 60);

const pricingOverrideSchema = z.object({
  min_prompt_tokens: z.number().int().nonnegative().max(2_000_000).optional(),
  utc_start: utcClockSchema.optional(),
  utc_end: utcClockSchema.optional(),
  prompt: z.unknown().optional(),
  completion: z.unknown().optional(),
  request: z.unknown().optional(),
  image: z.unknown().optional(),
  web_search: z.unknown().optional(),
  internal_reasoning: z.unknown().optional(),
  input_cache_read: z.unknown().optional(),
  input_cache_write: z.unknown().optional(),
}).strict().superRefine((value, context) => {
  const hasUtcStart = value.utc_start !== undefined;
  const hasUtcEnd = value.utc_end !== undefined;
  if (hasUtcStart !== hasUtcEnd || (hasUtcStart && value.utc_start === value.utc_end)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "OpenRouter pricing override UTC conditions are invalid.",
    });
  }
  if (value.min_prompt_tokens === undefined && !hasUtcStart) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "OpenRouter pricing override requires a known condition.",
    });
  }
});

const pricingSchema = z.object({
  prompt: z.unknown().optional(),
  completion: z.unknown().optional(),
  request: z.unknown().optional(),
  image: z.unknown().optional(),
  web_search: z.unknown().optional(),
  internal_reasoning: z.unknown().optional(),
  input_cache_read: z.unknown().optional(),
  input_cache_write: z.unknown().optional(),
  overrides: z.array(pricingOverrideSchema).max(64).optional(),
}).strict();

const remoteModelSchema = z.object({
  id: modelIdSchema,
  canonical_slug: modelIdSchema.optional(),
  name: safeTextSchema,
  created: z.number().int().nonnegative().optional(),
  context_length: z.number().int().positive().max(2_000_000),
  architecture: z.object({
    input_modalities: z.array(inputModalitySchema).min(1).max(8),
    output_modalities: z.array(outputModalitySchema).min(1).max(8),
  }),
  top_provider: z.object({
    max_completion_tokens: z.number().int().positive().max(200_000).nullable().optional(),
  }).nullable().optional(),
  supported_parameters: z.array(supportedParameterSchema).max(80),
  pricing: pricingSchema,
});

const remoteCatalogueSchema = z.object({
  data: z.array(remoteModelSchema).min(1).max(OPENROUTER_MAX_CATALOGUE_ITEMS),
  total_count: z.number().int().nonnegative().optional(),
  links: z.object({
    next: z.string().max(2_048).nullable(),
  }).strict().optional(),
}).strict();

export interface OpenRouterFreeClassification {
  eligible: boolean;
  reason?: string;
  pricingObservedAt: Date;
}

export interface NormalizedOpenRouterModel {
  modelId: string;
  canonicalSlug?: string;
  displayName: string;
  createdTimestamp?: number;
  contextLength: number;
  maximumOutputTokens?: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  pricingStrings: Partial<Record<OpenRouterPricingDimension, string>>;
  pricingDecimals: Partial<Record<OpenRouterPricingDimension, Decimal128>>;
  pricingOverrides: NormalizedOpenRouterPricingOverride[];
  freeEligibility: OpenRouterFreeClassification;
  catalogueVersion: number;
  pricingObservedAt: Date;
  disabledAt?: Date;
  missingSince?: Date;
}

export interface NormalizedOpenRouterPricingOverride {
  minPromptTokens?: number;
  utcStart?: number;
  utcEnd?: number;
  pricingStrings: Partial<Record<OpenRouterPricingDimension, string>>;
  pricingDecimals: Partial<Record<OpenRouterPricingDimension, Decimal128>>;
}

export function isValidOpenRouterModelId(value: string): boolean {
  return modelIdSchema.safeParse(value).success;
}

function parseExactDecimal(value: unknown): Decimal128 | undefined {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !exactDecimalPattern.test(value)
  ) {
    return undefined;
  }

  try {
    return Decimal128.fromString(value);
  } catch {
    return undefined;
  }
}

function isExactZero(value: string): boolean {
  return /^0(?:\.0+)?$/.test(value);
}

export function classifyOpenRouterFreePricing(input: {
  modelId: string;
  pricing: Record<string, unknown>;
  applicableDimensions: readonly OpenRouterPricingDimension[];
  pricingOverrides?: readonly NormalizedOpenRouterPricingOverride[];
  maximumInputTokens?: number;
  pricingObservedAt: Date;
  now: Date;
  maximumAgeMs?: number;
}): OpenRouterFreeClassification {
  const maximumAgeMs = input.maximumAgeMs ?? OPENROUTER_PRICING_MAX_AGE_MS;
  if (
    input.now.getTime() - input.pricingObservedAt.getTime() > maximumAgeMs ||
    input.pricingObservedAt.getTime() > input.now.getTime()
  ) {
    return {
      eligible: false,
      reason: "stale_pricing",
      pricingObservedAt: input.pricingObservedAt,
    };
  }

  if (Object.keys(input.pricing).some((dimension) => !pricingDimensionSet.has(dimension))) {
    return {
      eligible: false,
      reason: "unknown_pricing_dimension",
      pricingObservedAt: input.pricingObservedAt,
    };
  }

  const validatePrice = (
    dimension: OpenRouterPricingDimension,
    value: unknown,
  ): OpenRouterFreeClassification | undefined => {
    if (value === undefined && !requiredPricingDimensions.has(dimension)) {
      return undefined;
    }
    if (parseExactDecimal(value) === undefined) {
      return {
        eligible: false,
        reason: `invalid_or_missing_${dimension}`,
        pricingObservedAt: input.pricingObservedAt,
      };
    }
    if (!isExactZero(value as string)) {
      return {
        eligible: false,
        reason: `non_zero_${dimension}`,
        pricingObservedAt: input.pricingObservedAt,
      };
    }
    return undefined;
  };

  for (const dimension of input.applicableDimensions) {
    const failure = validatePrice(dimension, input.pricing[dimension]);
    if (failure) return failure;
  }

  for (const override of input.pricingOverrides ?? []) {
    if (override.minPromptTokens !== undefined) {
      if (input.maximumInputTokens === undefined) {
        return {
          eligible: false,
          reason: "override_applicability_uncertain",
          pricingObservedAt: input.pricingObservedAt,
        };
      }
      if (input.maximumInputTokens <= override.minPromptTokens) continue;
    }
    for (const dimension of input.applicableDimensions) {
      const failure = validatePrice(
        dimension,
        override.pricingStrings[dimension] ?? input.pricing[dimension],
      );
      if (failure) return failure;
    }
  }

  return { eligible: true, pricingObservedAt: input.pricingObservedAt };
}

function normalizePriceValues(pricing: Record<string, unknown>) {
  const pricingStrings: Partial<Record<OpenRouterPricingDimension, string>> = {};
  const pricingDecimals: Partial<Record<OpenRouterPricingDimension, Decimal128>> = {};
  for (const dimension of openRouterPricingDimensions) {
    const value = pricing[dimension];
    if (value === undefined) continue;
    const decimal = parseExactDecimal(value);
    if (!decimal) {
      throw new Error(`OpenRouter ${dimension} pricing is invalid.`);
    }
    pricingStrings[dimension] = value as string;
    pricingDecimals[dimension] = decimal;
  }
  return { pricingStrings, pricingDecimals };
}

function utcClockToMinutes(clock: number): number {
  return Math.floor(clock / 100) * 60 + clock % 100;
}

function validateTimeWindowCoverage(
  overrides: readonly z.infer<typeof pricingOverrideSchema>[],
): void {
  const schedules = new Map<string, Uint8Array>();
  for (const override of overrides) {
    if (override.utc_start === undefined || override.utc_end === undefined) {
      continue;
    }
    const key = override.min_prompt_tokens === undefined
      ? "base"
      : `min:${override.min_prompt_tokens}`;
    const coverage = schedules.get(key) ?? new Uint8Array(24 * 60);
    schedules.set(key, coverage);
    const start = utcClockToMinutes(override.utc_start);
    const end = utcClockToMinutes(override.utc_end);
    const mark = (from: number, to: number) => {
      for (let minute = from; minute < to; minute += 1) {
        coverage[minute] += 1;
      }
    };
    if (start < end) {
      mark(start, end);
    } else {
      mark(start, coverage.length);
      mark(0, end);
    }
  }
  for (const coverage of schedules.values()) {
    if (coverage.some((count) => count !== 1)) {
      throw new Error("OpenRouter UTC pricing overrides must tile one day.");
    }
  }
}

function normalizePricing(pricing: z.infer<typeof pricingSchema>) {
  const { overrides = [], ...basePricing } = pricing;
  validateTimeWindowCoverage(overrides);
  const base = normalizePriceValues(basePricing);
  const pricingOverrides = overrides.map((override) => {
    const {
      min_prompt_tokens: minPromptTokens,
      utc_start: utcStart,
      utc_end: utcEnd,
      ...overridePricing
    } = override;
    return {
      ...(minPromptTokens !== undefined ? { minPromptTokens } : {}),
      ...(utcStart !== undefined ? { utcStart } : {}),
      ...(utcEnd !== undefined ? { utcEnd } : {}),
      ...normalizePriceValues(overridePricing),
    };
  });
  return { ...base, pricingOverrides };
}

export function parseOpenRouterCatalogue(
  value: unknown,
  input: { catalogueVersion: number; observedAt: Date },
): NormalizedOpenRouterModel[] {
  if (!Number.isSafeInteger(input.catalogueVersion) || input.catalogueVersion < 1) {
    throw new Error("OpenRouter catalogue version is invalid.");
  }
  const parsed = remoteCatalogueSchema.parse(value);
  const seen = new Set<string>();

  return parsed.data.map((remote) => {
    if (seen.has(remote.id)) {
      throw new Error("OpenRouter catalogue contains duplicate model IDs.");
    }
    seen.add(remote.id);
    const { pricingStrings, pricingDecimals, pricingOverrides } =
      normalizePricing(remote.pricing);
    const inputModalities = [...new Set(remote.architecture.input_modalities)].sort();
    const outputModalities = [...new Set(remote.architecture.output_modalities)].sort();
    const supportedParameters = [...new Set(remote.supported_parameters)].sort();

    return {
      modelId: remote.id,
      ...(remote.canonical_slug ? { canonicalSlug: remote.canonical_slug } : {}),
      displayName: remote.name,
      ...(remote.created !== undefined ? { createdTimestamp: remote.created } : {}),
      contextLength: remote.context_length,
      ...(remote.top_provider?.max_completion_tokens
        ? { maximumOutputTokens: remote.top_provider.max_completion_tokens }
        : {}),
      inputModalities,
      outputModalities,
      supportedParameters,
      pricingStrings,
      pricingDecimals,
      pricingOverrides,
      freeEligibility: classifyOpenRouterFreePricing({
        modelId: remote.id,
        pricing: pricingStrings,
        applicableDimensions: openRouterPricingDimensions,
        pricingObservedAt: input.observedAt,
        now: input.observedAt,
      }),
      catalogueVersion: input.catalogueVersion,
      pricingObservedAt: input.observedAt,
    };
  });
}

interface OpenRouterActionProfile {
  minimumContextTokens: number;
  maximumInputTokens: number;
  maximumOutputTokens: number;
  requiredInputModalities: readonly ["text"];
  requiredOutputModalities: readonly ["text"];
  requiredParameters: readonly ["max_tokens", "response_format", "structured_outputs"];
  applicablePricingDimensions: readonly OpenRouterPricingDimension[];
  timeoutProfile: {
    ttftMs: number;
    streamIdleMs: number;
    totalMs: number;
  };
  validatorIdentity: string;
  validatorVersion: 1;
  executionDeadlineSeconds: number;
  allowValidationRegeneration: false;
}

function actionProfile(input: {
  minimumContextTokens: number;
  maximumOutputTokens: number;
  timeout: "short" | "chat" | "heavy";
  validatorIdentity: string;
}): OpenRouterActionProfile {
  const timeouts = {
    short: { ttftMs: 8_000, streamIdleMs: 15_000, totalMs: 45_000 },
    chat: { ttftMs: 10_000, streamIdleMs: 20_000, totalMs: 60_000 },
    heavy: { ttftMs: 15_000, streamIdleMs: 30_000, totalMs: 120_000 },
  } as const;
  return {
    minimumContextTokens: input.minimumContextTokens,
    maximumInputTokens:
      input.minimumContextTokens - input.maximumOutputTokens,
    maximumOutputTokens: input.maximumOutputTokens,
    requiredInputModalities: ["text"],
    requiredOutputModalities: ["text"],
    requiredParameters: ["max_tokens", "response_format", "structured_outputs"],
    applicablePricingDimensions: openRouterPricingDimensions,
    timeoutProfile: timeouts[input.timeout],
    validatorIdentity: input.validatorIdentity,
    validatorVersion: 1,
    executionDeadlineSeconds: 900,
    allowValidationRegeneration: false,
  };
}

export const openRouterActionProfiles: Readonly<
  Record<OpenRouterAction, OpenRouterActionProfile>
> = {
  "resume-parse": actionProfile({ minimumContextTokens: 131_072, maximumOutputTokens: 8_192, timeout: "heavy", validatorIdentity: "parsed-resume" }),
  "resume-analysis": actionProfile({ minimumContextTokens: 65_536, maximumOutputTokens: 8_192, timeout: "heavy", validatorIdentity: "resume-analysis" }),
  "resume-rewrite": actionProfile({ minimumContextTokens: 32_768, maximumOutputTokens: 4_096, timeout: "short", validatorIdentity: "resume-rewrite" }),
  "resume-job-comparison": actionProfile({ minimumContextTokens: 65_536, maximumOutputTokens: 4_096, timeout: "heavy", validatorIdentity: "resume-job-comparison" }),
  "interview-question-generation": actionProfile({ minimumContextTokens: 32_768, maximumOutputTokens: 6_144, timeout: "short", validatorIdentity: "interview-question-set" }),
  "interview-question-explanation": actionProfile({ minimumContextTokens: 16_384, maximumOutputTokens: 2_048, timeout: "short", validatorIdentity: "interview-question-explanation" }),
  "interview-answer-feedback": actionProfile({ minimumContextTokens: 32_768, maximumOutputTokens: 4_096, timeout: "short", validatorIdentity: "interview-answer-feedback" }),
  "learning-summary": actionProfile({ minimumContextTokens: 131_072, maximumOutputTokens: 4_096, timeout: "heavy", validatorIdentity: "learning-summary" }),
  "learning-grounded-chat": actionProfile({ minimumContextTokens: 32_768, maximumOutputTokens: 2_048, timeout: "chat", validatorIdentity: "learning-grounded-chat" }),
  "flashcard-generation": actionProfile({ minimumContextTokens: 65_536, maximumOutputTokens: 8_192, timeout: "heavy", validatorIdentity: "flashcard-generation" }),
  "quiz-generation": actionProfile({ minimumContextTokens: 65_536, maximumOutputTokens: 8_192, timeout: "chat", validatorIdentity: "quiz-generation" }),
};

export function isOpenRouterModelEligibleForAction(input: {
  action: OpenRouterAction;
  model: NormalizedOpenRouterModel;
  now: Date;
}): boolean {
  const profile = openRouterActionProfiles[input.action];
  const pricing = classifyOpenRouterFreePricing({
    modelId: input.model.modelId,
    pricing: input.model.pricingStrings,
    applicableDimensions: profile.applicablePricingDimensions,
    pricingOverrides: input.model.pricingOverrides,
    maximumInputTokens: profile.maximumInputTokens,
    pricingObservedAt: input.model.pricingObservedAt,
    now: input.now,
  });
  return Boolean(
    pricing.eligible &&
    !input.model.disabledAt &&
    !input.model.missingSince &&
    input.model.contextLength >= profile.minimumContextTokens &&
    (input.model.maximumOutputTokens ?? 0) >= profile.maximumOutputTokens &&
    profile.requiredInputModalities.every((value) =>
      input.model.inputModalities.includes(value)) &&
    profile.requiredOutputModalities.every((value) =>
      input.model.outputModalities.includes(value)) &&
    profile.requiredParameters.every((value) =>
      input.model.supportedParameters.includes(value))
  );
}

export function rankOpenRouterModelsForAction(input: {
  action: OpenRouterAction;
  models: readonly NormalizedOpenRouterModel[];
  now: Date;
  maximumCandidates?: number;
}) {
  const profile = openRouterActionProfiles[input.action];
  const maximumCandidates = input.maximumCandidates ?? 3;
  if (!Number.isSafeInteger(maximumCandidates) || maximumCandidates < 1 || maximumCandidates > 10) {
    throw new Error("OpenRouter candidate limit is invalid.");
  }

  const eligible = input.models
    .filter((model) => isOpenRouterModelEligibleForAction({
      action: input.action,
      model,
      now: input.now,
    }))
    .sort((left, right) => {
      const leftCapabilitySurplus =
        left.inputModalities.length + left.outputModalities.length + left.supportedParameters.length;
      const rightCapabilitySurplus =
        right.inputModalities.length + right.outputModalities.length + right.supportedParameters.length;
      return (
        leftCapabilitySurplus - rightCapabilitySurplus ||
        left.contextLength - right.contextLength ||
        (left.maximumOutputTokens ?? 0) - (right.maximumOutputTokens ?? 0) ||
        left.modelId.localeCompare(right.modelId)
      );
    });

  const selected = eligible.slice(0, maximumCandidates);
  if (selected.length === 0) {
    throw new Error(`No eligible free OpenRouter model exists for ${input.action}.`);
  }

  return {
    action: input.action,
    modelIds: selected.map((model) => model.modelId),
    catalogueVersion: Math.max(...selected.map((model) => model.catalogueVersion)),
    pricingObservedAt: new Date(
      Math.min(...selected.map((model) => model.pricingObservedAt.getTime())),
    ),
    rankingPolicyVersion: OPENROUTER_RANKING_POLICY_VERSION,
    profile,
  };
}
