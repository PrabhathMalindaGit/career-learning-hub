import { Schema, Types, model } from "mongoose";

export interface AiQuotaCounter {
  userId: Types.ObjectId;
  dateKey: string;
  requestCount: number;
  tokenCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiQuotaCounterSchema = new Schema<AiQuotaCounter>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    requestCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tokenCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

aiQuotaCounterSchema.index(
  { userId: 1, dateKey: 1 },
  { unique: true, name: "ai_quota_user_day_unique" },
);
aiQuotaCounterSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ai_quota_expiry_ttl" },
);

export const AiQuotaCounterModel = model<AiQuotaCounter>(
  "AiQuotaCounter",
  aiQuotaCounterSchema,
);
