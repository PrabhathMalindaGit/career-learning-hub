import { Schema, Types, model } from "mongoose";

export interface UsageEvent {
  userId: Types.ObjectId;
  feature: string;
  provider: string;
  model: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
  status: "success" | "failure";
  latencyMs: number;
  errorCode?: string;
  jobId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const usageEventSchema = new Schema<UsageEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    provider: {
      type: String,
      required: true,
      maxlength: 60,
    },
    model: {
      type: String,
      required: true,
      maxlength: 120,
    },
    requestCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    inputTokens: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    outputTokens: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedCostUsd: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    errorCode: {
      type: String,
      maxlength: 120,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

usageEventSchema.index({ userId: 1, createdAt: -1 });
usageEventSchema.index({ userId: 1, feature: 1, createdAt: -1 });
usageEventSchema.index({ provider: 1, model: 1, createdAt: -1 });

export const UsageEventModel = model<UsageEvent>(
  "UsageEvent",
  usageEventSchema,
);
