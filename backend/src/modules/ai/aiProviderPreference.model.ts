import { Schema, model, type Types } from "mongoose";
import {
  aiExecutionStates,
  type AiExecutionState,
} from "./aiProvider.types.js";

export type AiCredentialSource =
  | "none"
  | "user-managed"
  | "administrator-managed";

export interface AiProviderPreference {
  userId: Types.ObjectId;
  activeProvider: AiExecutionState;
  credentialSource: AiCredentialSource;
  activeCredentialId?: Types.ObjectId;
  activeCredentialSecretVersion?: number;
  administratorCredentialPolicyVersion?: number;
  routingProfileId?: Types.ObjectId;
  routingProfileVersion?: number;
  revision: number;
  disabledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiProviderPreferenceSchema = new Schema<AiProviderPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    activeProvider: {
      type: String,
      enum: aiExecutionStates,
      required: true,
      default: "disabled",
    },
    credentialSource: {
      type: String,
      enum: ["none", "user-managed", "administrator-managed"],
      required: true,
      default: "none",
    },
    activeCredentialId: {
      type: Schema.Types.ObjectId,
      ref: "AiCredential",
    },
    activeCredentialSecretVersion: { type: Number, min: 1 },
    administratorCredentialPolicyVersion: { type: Number, min: 1 },
    routingProfileId: {
      type: Schema.Types.ObjectId,
      ref: "AiRoutingProfile",
    },
    routingProfileVersion: { type: Number, min: 1 },
    revision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    disabledReason: {
      type: String,
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

aiProviderPreferenceSchema.index(
  { userId: 1 },
  { unique: true, name: "ai_provider_preference_user_unique" },
);
aiProviderPreferenceSchema.index(
  { activeProvider: 1, updatedAt: -1 },
  { name: "ai_provider_preference_active_provider" },
);

aiProviderPreferenceSchema.pre("validate", function validateActiveState() {
  if (this.activeProvider === "disabled") {
    if (
      this.credentialSource !== "none" ||
      this.activeCredentialId ||
      this.activeCredentialSecretVersion ||
      this.administratorCredentialPolicyVersion
    ) {
      throw new Error("Disabled AI preferences cannot reference a credential.");
    }
    return;
  }

  if (!this.routingProfileId || !this.routingProfileVersion) {
    throw new Error("Callable AI preferences require a routing profile.");
  }
  if (
    this.credentialSource === "user-managed" &&
    this.activeCredentialId &&
    this.activeCredentialSecretVersion &&
    !this.administratorCredentialPolicyVersion
  ) {
    return;
  }
  if (
    this.credentialSource === "administrator-managed" &&
    this.administratorCredentialPolicyVersion &&
    !this.activeCredentialId &&
    !this.activeCredentialSecretVersion
  ) {
    return;
  }

  throw new Error("Callable AI preferences require one valid credential source.");
});

export const AiProviderPreferenceModel = model<AiProviderPreference>(
  "AiProviderPreference",
  aiProviderPreferenceSchema,
);
