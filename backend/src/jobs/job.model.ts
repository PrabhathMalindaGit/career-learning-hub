import { Schema, Types, model } from "mongoose";

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

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
  result?: unknown;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  idempotencyKey?: string;
  completedAt?: Date;
  failedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
      stack: {
        type: String,
        maxlength: 8_000,
      },
    },
    idempotencyKey: {
      type: String,
      maxlength: 255,
    },
    completedAt: Date,
    failedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
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
