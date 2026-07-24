import type { ClientSession, Types } from "mongoose";
import type {
  MigrationEntityType,
  SourceProject,
} from "./migrationMap.model.js";
import type {
  MigrationManifest,
  ProjectSourceFiles,
} from "./migration.manifest.js";

export type MigrationMode = "validate" | "dry-run" | "execute";
export type MigrationName =
  | "users"
  | "resumes"
  | "interviews"
  | "learning"
  | "all";

export interface MigrationIssue {
  severity: "warning" | "error";
  code: string;
  message: string;
  sourceProject?: SourceProject;
  entityType?: MigrationEntityType;
  legacyId?: string;
  recordIndex?: number;
}

export interface MigrationStats {
  filesRead: number;
  recordsRead: number;
  recordsValid: number;
  plannedCreates: number;
  plannedReuses: number;
  created: number;
  reused: number;
  mapped: number;
  skipped: number;
  conflicts: number;
  warnings: number;
  errors: number;
}

export interface MigrationReport {
  version: 1;
  runId: string;
  migration: MigrationName;
  mode: MigrationMode;
  manifestPath: string;
  manifestHash: string;
  sourceBundleHash: string;
  startedAt: string;
  completedAt: string;
  approvedDryRunReport?: string;
  stats: MigrationStats;
  issues: MigrationIssue[];
  executionAllowed: boolean;
}

export interface MapEntityInput {
  sourceProject: SourceProject;
  entityType: MigrationEntityType;
  legacyId: string;
  targetModel: string;
  targetId: Types.ObjectId;
  sourceChecksum: string;
  metadata?: Record<string, unknown>;
  session?: ClientSession;
}

export interface MigrationContext {
  readonly runId: string;
  readonly mode: MigrationMode;
  readonly migration: MigrationName;
  readonly manifest: MigrationManifest;
  readonly manifestPath: string;
  readonly manifestHash: string;
  readonly sourceBundleHash: string;
  readonly inputRoot: string;
  readonly stats: MigrationStats;
  readonly issues: MigrationIssue[];
  readonly isExecute: boolean;
  readonly canReadTarget: boolean;
  addIssue(issue: MigrationIssue): void;
  increment(
    key: keyof MigrationStats,
    amount?: number,
  ): void;
  sourcePath(
    project: SourceProject,
    key: keyof ProjectSourceFiles,
  ): string | undefined;
  resolveMapping(input: {
    sourceProject: SourceProject;
    entityType: MigrationEntityType;
    legacyId: string;
  }): Promise<Types.ObjectId | undefined>;
  rememberMapping(input: MapEntityInput): Promise<void>;
  virtualTargetId(input: {
    sourceProject: SourceProject;
    entityType: MigrationEntityType;
    legacyId: string;
  }): Types.ObjectId;
}

export interface MigrationDefinition {
  name: Exclude<MigrationName, "all">;
  run(context: MigrationContext): Promise<void>;
}
