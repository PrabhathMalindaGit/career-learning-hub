import { Schema, model, type Types } from "mongoose";
import { openRouterActions, type OpenRouterAction } from "./openRouterCatalogue.js";

export interface OpenRouterRoutingActionProfile {
  action: OpenRouterAction;
  freeModelIds: string[];
  catalogueVersion: number;
  pricingObservedAt: Date;
  rankingPolicyVersion: string;
  timeoutProfile: {
    ttftMs: number;
    streamIdleMs: number;
    totalMs: number;
  };
  maximumInputTokens: number;
  maximumOutputTokens: number;
  validatorIdentity: string;
  validatorVersion: number;
  executionDeadlineSeconds: number;
  allowValidationRegeneration: false;
  paidFallbackAllowed: false;
}

export interface AiRoutingProfile {
  userId: Types.ObjectId;
  version: number;
  status: "active" | "retired";
  activeMarker?: "active";
  policyVersion: number;
  geminiDirect: {
    directModelId: string;
    timeoutProfile: {
      ttftMs: number;
      streamIdleMs: number;
      totalMs: number;
    };
    maximumInputTokens: number;
    maximumOutputTokens: number;
    validatorIdentity: string;
    validatorVersion: number;
    executionDeadlineSeconds: number;
    maximumCostMicrousd: 0;
  };
  openRouterActions?: OpenRouterRoutingActionProfile[];
  createdAt: Date;
  updatedAt: Date;
}

const timeoutProfileSchema = new Schema<
  AiRoutingProfile["geminiDirect"]["timeoutProfile"]
>(
  {
    ttftMs: { type: Number, required: true, min: 1_000, max: 120_000 },
    streamIdleMs: { type: Number, required: true, min: 1_000, max: 120_000 },
    totalMs: { type: Number, required: true, min: 1_000, max: 300_000 },
  },
  { _id: false, strict: "throw" },
);

const geminiDirectProfileSchema = new Schema<AiRoutingProfile["geminiDirect"]>(
  {
    directModelId: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
      match: /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/,
    },
    timeoutProfile: { type: timeoutProfileSchema, required: true },
    maximumInputTokens: { type: Number, required: true, min: 1, max: 2_000_000 },
    maximumOutputTokens: { type: Number, required: true, min: 1, max: 200_000 },
    validatorIdentity: {
      type: String,
      required: true,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
      maxlength: 120,
    },
    validatorVersion: { type: Number, required: true, min: 1 },
    executionDeadlineSeconds: {
      type: Number,
      required: true,
      min: 30,
      max: 86_400,
    },
    maximumCostMicrousd: { type: Number, enum: [0], required: true, default: 0 },
  },
  { _id: false, strict: "throw" },
);

const openRouterActionProfileSchema = new Schema<OpenRouterRoutingActionProfile>(
  {
    action: { type: String, enum: openRouterActions, required: true },
    freeModelIds: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length >= 1 && value.length <= 10,
        message: "OpenRouter profiles require a bounded free model list.",
      },
    },
    catalogueVersion: { type: Number, required: true, min: 1 },
    pricingObservedAt: { type: Date, required: true },
    rankingPolicyVersion: { type: String, required: true, maxlength: 120 },
    timeoutProfile: { type: timeoutProfileSchema, required: true },
    maximumInputTokens: { type: Number, required: true, min: 1, max: 2_000_000 },
    maximumOutputTokens: { type: Number, required: true, min: 1, max: 200_000 },
    validatorIdentity: { type: String, required: true, maxlength: 120 },
    validatorVersion: { type: Number, required: true, min: 1 },
    executionDeadlineSeconds: {
      type: Number,
      required: true,
      min: 30,
      max: 86_400,
    },
    allowValidationRegeneration: {
      type: Boolean,
      required: true,
      validate: (value: boolean) => value === false,
    } as never,
    paidFallbackAllowed: {
      type: Boolean,
      required: true,
      validate: (value: boolean) => value === false,
    } as never,
  },
  { _id: false, strict: "throw" },
);

const aiRoutingProfileSchema = new Schema<AiRoutingProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    version: { type: Number, required: true, min: 1, immutable: true },
    status: {
      type: String,
      enum: ["active", "retired"],
      required: true,
    },
    activeMarker: { type: String, enum: ["active"] },
    policyVersion: { type: Number, required: true, min: 1, immutable: true },
    geminiDirect: {
      type: geminiDirectProfileSchema,
      required: true,
      immutable: true,
    },
    openRouterActions: {
      type: [openRouterActionProfileSchema],
      required: false,
      default: undefined,
      validate: {
        validator: (value: OpenRouterRoutingActionProfile[] | undefined) =>
          value === undefined ||
          (value.length === openRouterActions.length &&
            new Set(value.map((entry) => entry.action)).size === openRouterActions.length),
        message: "OpenRouter routing profiles require all authorized actions exactly once.",
      },
      immutable: true,
    },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

aiRoutingProfileSchema.index(
  { userId: 1, version: 1 },
  { unique: true, name: "ai_routing_profile_owner_version_unique" },
);
aiRoutingProfileSchema.index(
  { userId: 1, activeMarker: 1 },
  {
    unique: true,
    name: "ai_routing_profile_owner_active_unique",
    partialFilterExpression: { activeMarker: "active" },
  },
);
aiRoutingProfileSchema.index(
  { status: 1, updatedAt: -1 },
  { name: "ai_routing_profile_status" },
);

aiRoutingProfileSchema.pre("validate", function validateActiveMarker() {
  if (
    (this.status === "active" && this.activeMarker !== "active") ||
    (this.status === "retired" && this.activeMarker !== undefined)
  ) {
    throw new Error("AI routing profile status and active marker disagree.");
  }
});

aiRoutingProfileSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"],
  function rejectPublishedContentUpdate() {
    const update = this.getUpdate();
    if (!update || typeof update !== "object") return;

    const record = update as Record<string, unknown>;
    const allowedSetKeys = new Set(["status", "activeMarker", "updatedAt"]);
    const allowedUnsetKeys = new Set(["activeMarker"]);
    const directKeys = Object.keys(record).filter(
      (key) => !key.startsWith("$"),
    );
    const setKeys =
      record.$set && typeof record.$set === "object"
        ? Object.keys(record.$set as Record<string, unknown>)
        : [];
    const unsetKeys =
      record.$unset && typeof record.$unset === "object"
        ? Object.keys(record.$unset as Record<string, unknown>)
        : [];
    const setOnInsertKeys =
      record.$setOnInsert && typeof record.$setOnInsert === "object"
        ? Object.keys(record.$setOnInsert as Record<string, unknown>)
        : [];
    const otherOperators = Object.keys(record).filter(
      (key) =>
        key.startsWith("$") &&
        key !== "$set" &&
        key !== "$unset" &&
        key !== "$setOnInsert",
    );

    if (
      directKeys.length > 0 ||
      setKeys.some((key) => !allowedSetKeys.has(key)) ||
      unsetKeys.some((key) => !allowedUnsetKeys.has(key)) ||
      setOnInsertKeys.some((key) => key !== "createdAt") ||
      otherOperators.length > 0
    ) {
      throw new Error("Published AI routing profiles are immutable.");
    }
  },
);

export const AiRoutingProfileModel = model<AiRoutingProfile>(
  "AiRoutingProfile",
  aiRoutingProfileSchema,
);
