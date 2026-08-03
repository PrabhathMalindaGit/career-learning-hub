import { Schema, model, type Types } from "mongoose";

export interface AiMutationReceipt {
  userId: Types.ObjectId;
  operation: string;
  keyHash: string;
  state: "pending" | "completed";
  statusCode?: number;
  response?: unknown;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiMutationReceiptSchema = new Schema<AiMutationReceipt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    operation: {
      type: String,
      required: true,
      maxlength: 160,
      match: /^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/,
      immutable: true,
    },
    keyHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
    },
    state: {
      type: String,
      enum: ["pending", "completed"],
      required: true,
      default: "pending",
    },
    statusCode: { type: Number, min: 200, max: 299 },
    response: Schema.Types.Mixed,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

aiMutationReceiptSchema.index(
  { userId: 1, operation: 1, keyHash: 1 },
  { unique: true, name: "ai_mutation_receipt_owner_operation_key_unique" },
);
aiMutationReceiptSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ai_mutation_receipt_expiry_ttl" },
);

export const AiMutationReceiptModel = model<AiMutationReceipt>(
  "AiMutationReceipt",
  aiMutationReceiptSchema,
);
