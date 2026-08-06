import {
  Schema,
  model,
  type Query,
  type Types,
} from "mongoose";
import { aiProviderIds, type AiProviderId } from "./aiProvider.types.js";

export const aiCredentialStates = [
  "configured",
  "valid",
  "invalid",
  "deleting",
  "deleted",
] as const;

export type AiCredentialState = (typeof aiCredentialStates)[number];
export type AiCredentialConnectionStatus =
  | "untested"
  | "validating"
  | "valid"
  | "invalid"
  | "unavailable";

export interface AiCredential {
  userId: Types.ObjectId;
  provider: AiProviderId;
  label: string;
  maskedSuffix?: string;
  secretVersion: number;
  state: AiCredentialState;
  connectionStatus: AiCredentialConnectionStatus;
  lastValidatedAt?: Date;
  lastValidationError?: string;
  encryptedSecret?: {
    ciphertext: string;
    nonce: string;
    authTag: string;
    keyVersion: number;
    aadVersion: 1;
  };
  replacedAt?: Date;
  deletedAt?: Date;
  revision: number;
  leaseEpoch: number;
  createdAt: Date;
  updatedAt: Date;
}

const encryptedSecretSchema = new Schema<
  NonNullable<AiCredential["encryptedSecret"]>
>(
  {
    ciphertext: { type: String, required: true },
    nonce: { type: String, required: true },
    authTag: { type: String, required: true },
    keyVersion: { type: Number, required: true, min: 1 },
    aadVersion: { type: Number, enum: [1], required: true },
  },
  { _id: false, strict: "throw" },
);

const aiCredentialSchema = new Schema<AiCredential>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    provider: {
      type: String,
      enum: aiProviderIds,
      required: true,
      immutable: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    maskedSuffix: {
      type: String,
      minlength: 4,
      maxlength: 12,
    },
    secretVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    state: {
      type: String,
      enum: aiCredentialStates,
      required: true,
      default: "configured",
    },
    connectionStatus: {
      type: String,
      enum: ["untested", "validating", "valid", "invalid", "unavailable"],
      required: true,
      default: "untested",
    },
    lastValidatedAt: Date,
    lastValidationError: {
      type: String,
      maxlength: 240,
    },
    encryptedSecret: {
      type: encryptedSecretSchema,
      required: false,
      select: false,
    },
    replacedAt: Date,
    deletedAt: Date,
    revision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    leaseEpoch: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

aiCredentialSchema.index(
  { userId: 1, provider: 1 },
  {
    unique: true,
    name: "ai_credential_owner_provider_live_unique",
    partialFilterExpression: { deletedAt: null },
  },
);
aiCredentialSchema.index(
  { userId: 1, state: 1, updatedAt: -1 },
  { name: "ai_credential_owner_state" },
);
aiCredentialSchema.index(
  { "encryptedSecret.keyVersion": 1, state: 1 },
  { name: "ai_credential_key_rotation" },
);

const allowedTransitions: Readonly<Record<
  AiCredentialState,
  readonly AiCredentialState[]
>> = {
  configured: ["configured", "valid", "invalid", "deleting"],
  valid: ["valid", "invalid", "configured", "deleting"],
  invalid: ["invalid", "valid", "configured", "deleting"],
  deleting: ["deleting", "deleted"],
  deleted: ["deleted"],
};

function requestedState(update: unknown): AiCredentialState | undefined {
  if (!update || typeof update !== "object") return undefined;
  const record = update as Record<string, unknown>;
  const set = record.$set;
  const state =
    typeof set === "object" && set !== null
      ? (set as Record<string, unknown>).state
      : record.state;
  return typeof state === "string" &&
    (aiCredentialStates as readonly string[]).includes(state)
    ? state as AiCredentialState
    : undefined;
}

async function enforceQueryStateTransition(
  this: Query<unknown, AiCredential>,
): Promise<void> {
  const nextState = requestedState(this.getUpdate());
  if (!nextState) return;

  const current = await this.model
    .findOne(this.getFilter())
    .select("state")
    .session(this.getOptions().session ?? null)
    .lean<{ state: AiCredentialState }>();
  if (
    current &&
    !allowedTransitions[current.state].includes(nextState)
  ) {
    throw new Error("Invalid AI credential state transition.");
  }
}

aiCredentialSchema.pre(
  ["updateOne", "findOneAndUpdate"],
  enforceQueryStateTransition,
);
aiCredentialSchema.pre("updateMany", function rejectBulkStateTransition() {
  if (requestedState(this.getUpdate())) {
    throw new Error("Invalid AI credential state transition.");
  }
});

aiCredentialSchema.pre("validate", function validateSecretLifecycle() {
  if (this.state === "deleted") {
    if (this.encryptedSecret || !this.deletedAt) {
      throw new Error("Deleted AI credentials cannot retain encrypted material.");
    }
    return;
  }

  if (!this.encryptedSecret || !this.maskedSuffix || this.deletedAt) {
    throw new Error("Live AI credentials require encrypted material.");
  }
});

export const AiCredentialModel = model<AiCredential>(
  "AiCredential",
  aiCredentialSchema,
);
