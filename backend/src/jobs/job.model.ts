import { Schema, Types, model } from "mongoose";
import {
  aiRoutingActions,
  aiRoutingSnapshotSchema,
  type AiRoutingSnapshot,
} from "../modules/ai/aiRoutingSnapshot.js";
import { aiExecutionStates } from "../modules/ai/aiProvider.types.js";
import { aiProviderFailureClassifications } from "../modules/ai/providers/provider.types.js";

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export const jobPhases = [
  "queued",
  "preparing",
  "contacting_provider",
  "waiting_for_first_response",
  "receiving_response",
  "validating",
  "persisting",
  "retry_scheduled",
  "completed",
  "failed",
  "cancelled",
] as const;

export type JobPhase = (typeof jobPhases)[number];

export interface JobExecutionIdentity {
  jobId: string;
  executionId: string;
  attempt: number;
}

export interface JobRecord {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  type: string;
  payload: unknown;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedAt?: Date;
  lockExpiresAt?: Date;
  lockedBy?: string;
  progress: number;
  phase: JobPhase;
  phaseSequence: number;
  executionId?: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    classification?: (typeof aiProviderFailureClassifications)[number];
    retryable?: boolean;
    timeoutPhase?:
      | "connection"
      | "first_response"
      | "idle"
      | "total"
      | "job_attempt";
  };
  idempotencyKey?: string;
  retryOfJobId?: Types.ObjectId;
  rootJobId?: Types.ObjectId;
  aiRoutingSnapshot?: AiRoutingSnapshot;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: "user_requested" | "work_invalidated";
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiRoutingSnapshotMongooseSchema = new Schema<AiRoutingSnapshot>(
  {
    snapshotId: { type: String, required: true, immutable: true },
    snapshotVersion: { type: Number, enum: [1], required: true, immutable: true },
    userId: { type: String, required: true, immutable: true },
    action: { type: String, enum: aiRoutingActions, required: true, immutable: true },
    provider: { type: String, enum: aiExecutionStates, required: true, immutable: true },
    mode: { type: String, enum: ["direct", "openrouter", "disabled"], required: true, immutable: true },
    preferenceRevision: { type: Number, required: true, min: 0, immutable: true },
    routingProfileId: { type: String, required: true, immutable: true },
    routingProfileVersion: { type: Number, required: true, min: 1, immutable: true },
    credentialSource: {
      type: String,
      enum: ["none", "user-managed", "administrator-managed"],
      required: true,
      immutable: true,
    },
    credentialId: { type: String, immutable: true },
    credentialSecretVersion: { type: Number, min: 1, immutable: true },
    administratorCredentialPolicyVersion: { type: Number, min: 1, immutable: true },
    directModelId: { type: String, immutable: true },
    rankingPolicyVersion: { type: String, immutable: true },
    catalogueVersion: { type: Number, min: 1, immutable: true },
    pricingObservedAt: { type: Date, immutable: true },
    freeModelIds: { type: [String], immutable: true, default: undefined },
    paidFallbackAllowed: { type: Boolean, immutable: true } as never,
    maximumInputTokens: { type: Number, required: true, min: 1, immutable: true },
    maximumOutputTokens: { type: Number, required: true, min: 1, immutable: true },
    ttftMs: { type: Number, required: true, min: 1, immutable: true },
    streamIdleMs: { type: Number, required: true, min: 1, immutable: true },
    totalMs: { type: Number, required: true, min: 1, immutable: true },
    executeBefore: { type: Date, required: true, immutable: true },
    createdAt: { type: Date, required: true, immutable: true },
  },
  { _id: false, strict: "throw" },
);

const jobRecordSchema = new Schema<JobRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
      required: true,
    },
    priority: {
      type: Number,
      min: -100,
      max: 100,
      default: 0,
    },
    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      min: 1,
      max: 10,
      default: 3,
    },
    runAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lockedAt: Date,
    lockExpiresAt: Date,
    lockedBy: {
      type: String,
      maxlength: 120,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    phase: {
      type: String,
      enum: jobPhases,
      default: "queued",
      required: true,
    },
    phaseSequence: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
    executionId: {
      type: String,
      maxlength: 36,
    },
    result: Schema.Types.Mixed,
    error: {
      code: {
        type: String,
        maxlength: 120,
      },
      message: {
        type: String,
        maxlength: 2_000,
      },
      classification: {
        type: String,
        enum: aiProviderFailureClassifications,
      },
      retryable: Boolean,
      timeoutPhase: {
        type: String,
        enum: [
          "connection",
          "first_response",
          "idle",
          "total",
          "job_attempt",
        ],
      },
    },
    idempotencyKey: {
      type: String,
      maxlength: 255,
    },
    retryOfJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
      index: true,
    },
    rootJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
      index: true,
    },
    aiRoutingSnapshot: {
      type: aiRoutingSnapshotMongooseSchema,
      required: false,
      immutable: true,
    },
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    cancellationReason: {
      type: String,
      enum: ["user_requested", "work_invalidated"],
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobRecordSchema.pre("validate", function validateAiRoutingSnapshot() {
  if (this.aiRoutingSnapshot) {
    const snapshot = this.aiRoutingSnapshot as AiRoutingSnapshot & {
      toObject?: () => unknown;
    };
    aiRoutingSnapshotSchema.parse(
      typeof snapshot.toObject === "function"
        ? snapshot.toObject()
        : snapshot,
    );
  }
});

jobRecordSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  function rejectRoutingSnapshotUpdate() {
    const update = this.getUpdate();
    if (!update || typeof update !== "object") return;
    const record = update as Record<string, unknown>;
    const keys = [
      ...Object.keys(record).filter((key) => !key.startsWith("$")),
      ...Object.values(record)
        .filter((value): value is Record<string, unknown> =>
          Boolean(value) && typeof value === "object" && !Array.isArray(value),
        )
        .flatMap((value) => Object.keys(value)),
    ];
    if (keys.some((key) => key === "aiRoutingSnapshot" || key.startsWith("aiRoutingSnapshot."))) {
      throw new Error("AI routing snapshots are immutable.");
    }
  },
);

jobRecordSchema.index({
  status: 1,
  runAt: 1,
  priority: -1,
  createdAt: 1,
});
jobRecordSchema.index({ userId: 1, createdAt: -1 });
jobRecordSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    sparse: true,
    name: "jobs_idempotency_unique",
  },
);
jobRecordSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: "jobs_retention_ttl",
  },
);

export const JobRecordModel = model<JobRecord>(
  "JobRecord",
  jobRecordSchema,
);
