import { Schema, Types, model, type HydratedDocument } from "mongoose";

export const sourceProjects = [
  "ai-learning-assistant",
  "ai-resume-analyser",
  "interview-prep-ai",
  "resume-builder",
] as const;

export const migrationEntityTypes = [
  "user",
  "asset",
  "resume",
  "resume-version",
  "interview-session",
  "interview-question",
  "learning-document",
  "flashcard-set",
  "flashcard",
  "quiz",
  "quiz-question",
  "quiz-attempt",
] as const;

export type SourceProject = (typeof sourceProjects)[number];
export type MigrationEntityType =
  (typeof migrationEntityTypes)[number];

export interface MigrationMap {
  runId: string;
  sourceProject: SourceProject;
  entityType: MigrationEntityType;
  legacyId: string;
  targetModel: string;
  targetId: Types.ObjectId;
  sourceChecksum: string;
  metadata?: Record<string, unknown>;
  migratedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MigrationMapDocument =
  HydratedDocument<MigrationMap>;

const migrationMapSchema = new Schema<MigrationMap>(
  {
    runId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    sourceProject: {
      type: String,
      enum: sourceProjects,
      required: true,
    },
    entityType: {
      type: String,
      enum: migrationEntityTypes,
      required: true,
    },
    legacyId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    targetModel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sourceChecksum: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    metadata: Schema.Types.Mixed,
    migratedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

migrationMapSchema.index(
  {
    sourceProject: 1,
    entityType: 1,
    legacyId: 1,
  },
  {
    unique: true,
    name: "migration_map_legacy_entity_unique",
  },
);
migrationMapSchema.index({
  targetModel: 1,
  targetId: 1,
});
migrationMapSchema.index({ runId: 1, createdAt: 1 });

export const MigrationMapModel = model<MigrationMap>(
  "MigrationMap",
  migrationMapSchema,
);
