import { Schema, model } from "mongoose";
import type {
  NormalizedOpenRouterPricingOverride,
  OpenRouterPricingDimension,
} from "./openRouterCatalogue.js";

export interface OpenRouterModelCatalogue {
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
  pricingDecimals: Partial<Record<OpenRouterPricingDimension, unknown>>;
  pricingOverrides: Array<Omit<
    NormalizedOpenRouterPricingOverride,
    "pricingDecimals"
  > & { pricingDecimals: Partial<Record<OpenRouterPricingDimension, unknown>> }>;
  freeStructuredTextEligible: boolean;
  freeEligibilityReason?: string;
  catalogueVersion: number;
  pricingObservedAt: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  missingSince?: Date;
  disabledAt?: Date;
  disableReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenRouterCatalogueState {
  _id: "openrouter";
  currentVersion: number;
  lastAttemptAt?: Date;
  lastSuccessAt?: Date;
  pricingObservedAt?: Date;
  itemCount: number;
  freshness: "fresh" | "stale" | "unavailable";
  etag?: string;
  refreshLeaseOwner?: string;
  refreshLeaseExpiresAt?: Date;
  lastFailure?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pricingStringSchema = new Schema(
  {
    prompt: String,
    completion: String,
    request: String,
    image: String,
    web_search: String,
    internal_reasoning: String,
    input_cache_read: String,
    input_cache_write: String,
  },
  { _id: false, strict: "throw" },
);

const pricingDecimalSchema = new Schema(
  {
    prompt: Schema.Types.Decimal128,
    completion: Schema.Types.Decimal128,
    request: Schema.Types.Decimal128,
    image: Schema.Types.Decimal128,
    web_search: Schema.Types.Decimal128,
    internal_reasoning: Schema.Types.Decimal128,
    input_cache_read: Schema.Types.Decimal128,
    input_cache_write: Schema.Types.Decimal128,
  },
  { _id: false, strict: "throw" },
);

const pricingOverridePersistenceSchema = new Schema(
  {
    minPromptTokens: { type: Number, min: 0, max: 2_000_000 },
    utcStart: { type: Number, min: 0, max: 2359 },
    utcEnd: { type: Number, min: 0, max: 2359 },
    pricingStrings: { type: pricingStringSchema, required: true },
    pricingDecimals: { type: pricingDecimalSchema, required: true },
  },
  { _id: false, strict: "throw" },
);

const openRouterModelCatalogueSchema = new Schema<OpenRouterModelCatalogue>(
  {
    modelId: { type: String, required: true, immutable: true, maxlength: 160 },
    canonicalSlug: { type: String, maxlength: 160 },
    displayName: { type: String, required: true, maxlength: 240 },
    createdTimestamp: { type: Number, min: 0 },
    contextLength: { type: Number, required: true, min: 1, max: 2_000_000 },
    maximumOutputTokens: { type: Number, min: 1, max: 200_000 },
    inputModalities: { type: [String], required: true },
    outputModalities: { type: [String], required: true },
    supportedParameters: { type: [String], required: true },
    pricingStrings: { type: pricingStringSchema, required: true },
    pricingDecimals: { type: pricingDecimalSchema, required: true },
    pricingOverrides: {
      type: [pricingOverridePersistenceSchema],
      required: true,
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length <= 64,
        message: "OpenRouter pricing overrides must remain bounded.",
      },
    },
    freeStructuredTextEligible: { type: Boolean, required: true },
    freeEligibilityReason: { type: String, maxlength: 120 },
    catalogueVersion: { type: Number, required: true, min: 1 },
    pricingObservedAt: { type: Date, required: true },
    firstSeenAt: { type: Date, required: true, immutable: true },
    lastSeenAt: { type: Date, required: true },
    missingSince: Date,
    disabledAt: Date,
    disableReason: {
      type: String,
      maxlength: 120,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

openRouterModelCatalogueSchema.index(
  { modelId: 1 },
  { unique: true, name: "openrouter_model_id_unique" },
);
openRouterModelCatalogueSchema.index(
  { catalogueVersion: 1, modelId: 1 },
  { name: "openrouter_catalogue_version_model" },
);
openRouterModelCatalogueSchema.index(
  { freeStructuredTextEligible: 1, contextLength: 1, maximumOutputTokens: 1 },
  { name: "openrouter_free_structured_text" },
);
openRouterModelCatalogueSchema.index(
  { missingSince: 1, disabledAt: 1 },
  { name: "openrouter_missing_disabled" },
);

const openRouterCatalogueStateSchema = new Schema<OpenRouterCatalogueState>(
  {
    _id: { type: String, enum: ["openrouter"], required: true },
    currentVersion: { type: Number, required: true, min: 0, default: 0 },
    lastAttemptAt: Date,
    lastSuccessAt: Date,
    pricingObservedAt: Date,
    itemCount: { type: Number, required: true, min: 0, default: 0 },
    freshness: {
      type: String,
      enum: ["fresh", "stale", "unavailable"],
      required: true,
      default: "unavailable",
    },
    etag: { type: String, maxlength: 240 },
    refreshLeaseOwner: {
      type: String,
      maxlength: 120,
      match: /^[A-Za-z0-9._:-]+$/,
    },
    refreshLeaseExpiresAt: Date,
    lastFailure: {
      type: String,
      maxlength: 120,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

openRouterCatalogueStateSchema.index(
  { refreshLeaseExpiresAt: 1, refreshLeaseOwner: 1 },
  { name: "openrouter_refresh_lease" },
);

export const OpenRouterModelCatalogueModel = model<OpenRouterModelCatalogue>(
  "OpenRouterModelCatalogue",
  openRouterModelCatalogueSchema,
);

export const OpenRouterCatalogueStateModel = model<OpenRouterCatalogueState>(
  "OpenRouterCatalogueState",
  openRouterCatalogueStateSchema,
);
