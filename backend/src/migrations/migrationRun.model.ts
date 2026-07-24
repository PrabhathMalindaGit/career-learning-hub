import { Schema, model, type HydratedDocument } from "mongoose";

export interface MigrationRun {
  runId: string;
  migration: string;
  mode: "execute";
  status: "running" | "completed" | "failed";
  manifestPath: string;
  manifestHash: string;
  sourceBundleHash: string;
  approvedDryRunReport?: string;
  startedAt: Date;
  completedAt?: Date;
  stats: Record<string, number>;
  errorSummary?: string;
  reportPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MigrationRunDocument =
  HydratedDocument<MigrationRun>;

const migrationRunSchema = new Schema<MigrationRun>(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    migration: {
      type: String,
      required: true,
      maxlength: 100,
    },
    mode: {
      type: String,
      enum: ["execute"],
      required: true,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      required: true,
    },
    manifestPath: {
      type: String,
      required: true,
      maxlength: 2_000,
    },
    manifestHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    sourceBundleHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    approvedDryRunReport: {
      type: String,
      maxlength: 2_000,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: Date,
    stats: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    errorSummary: {
      type: String,
      maxlength: 4_000,
    },
    reportPath: {
      type: String,
      maxlength: 2_000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

migrationRunSchema.index({ status: 1, startedAt: -1 });
migrationRunSchema.index({ manifestHash: 1, startedAt: -1 });

export const MigrationRunModel = model<MigrationRun>(
  "MigrationRun",
  migrationRunSchema,
);
