import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Types } from "mongoose";
import { MigrationMapModel } from "./migrationMap.model.js";
import type {
  MigrationEntityType,
  SourceProject,
} from "./migrationMap.model.js";
import { MigrationRunModel } from "./migrationRun.model.js";
import type {
  MapEntityInput,
  MigrationContext,
  MigrationDefinition,
  MigrationIssue,
  MigrationMode,
  MigrationName,
  MigrationReport,
  MigrationStats,
} from "./migration.types.js";
import type { MigrationManifest } from "./migration.manifest.js";
import {
  deterministicObjectId,
  migrationRunId,
  safeMetadata,
  sourceKey,
} from "./migration.utils.js";

interface RunnerOptions {
  mode: MigrationMode;
  migration: MigrationName;
  manifest: MigrationManifest;
  manifestPath: string;
  manifestRaw: string;
  sourceBundleHash: string;
  inputRoot: string;
  reportDirectory: string;
  approvedDryRunReport?: string;
  skipApprovedReport?: boolean;
  continueOnError?: boolean;
}

function emptyStats(): MigrationStats {
  return {
    filesRead: 0,
    recordsRead: 0,
    recordsValid: 0,
    plannedCreates: 0,
    plannedReuses: 0,
    created: 0,
    reused: 0,
    mapped: 0,
    skipped: 0,
    conflicts: 0,
    warnings: 0,
    errors: 0,
  };
}

async function validateApprovedReport(input: {
  reportPath: string;
  manifestHash: string;
  sourceBundleHash: string;
  migration: MigrationName;
}): Promise<void> {
  const raw = await readFile(resolve(input.reportPath), "utf8");
  const report = JSON.parse(raw) as Partial<MigrationReport>;

  if (report.mode !== "dry-run") {
    throw new Error("The approved report must come from dry-run mode.");
  }

  if (report.manifestHash !== input.manifestHash) {
    throw new Error(
      "The dry-run report was produced from a different manifest.",
    );
  }

  if (report.sourceBundleHash !== input.sourceBundleHash) {
    throw new Error(
      "One or more source export files changed after the approved dry run.",
    );
  }

  if (report.migration !== input.migration) {
    throw new Error(
      "The dry-run report targets a different migration selection.",
    );
  }

  if ((report.stats?.errors ?? 1) > 0 || !report.executionAllowed) {
    throw new Error(
      "The dry-run report contains blocking errors or is not execution-approved.",
    );
  }
}

export class CoreMigrationRunner implements MigrationContext {
  readonly runId = migrationRunId();
  readonly mode: MigrationMode;
  readonly migration: MigrationName;
  readonly manifest: MigrationManifest;
  readonly manifestPath: string;
  readonly manifestHash: string;
  readonly sourceBundleHash: string;
  readonly inputRoot: string;
  readonly stats = emptyStats();
  readonly issues: MigrationIssue[] = [];
  readonly isExecute: boolean;
  readonly canReadTarget: boolean;

  private readonly reportDirectory: string;
  private readonly approvedDryRunReport?: string;
  private readonly skipApprovedReport: boolean;
  private readonly continueOnError: boolean;
  private readonly virtualMappings = new Map<string, Types.ObjectId>();

  constructor(options: RunnerOptions) {
    this.mode = options.mode;
    this.migration = options.migration;
    this.manifest = options.manifest;
    this.manifestPath = options.manifestPath;
    this.manifestHash = createHash("sha256")
      .update(options.manifestRaw)
      .digest("hex");
    this.sourceBundleHash = options.sourceBundleHash;
    this.inputRoot = options.inputRoot;
    this.reportDirectory = resolve(options.reportDirectory);
    this.approvedDryRunReport = options.approvedDryRunReport;
    this.skipApprovedReport = options.skipApprovedReport ?? false;
    this.continueOnError = options.continueOnError ?? false;
    this.isExecute = this.mode === "execute";
    this.canReadTarget = this.mode !== "validate";
  }

  addIssue(issue: MigrationIssue): void {
    this.issues.push(issue);
    if (issue.severity === "error") {
      this.stats.errors += 1;
    } else {
      this.stats.warnings += 1;
    }
  }

  increment(
    key: keyof MigrationStats,
    amount = 1,
  ): void {
    this.stats[key] += amount;
  }

  sourcePath(
    project: SourceProject,
    key: string,
  ): string | undefined {
    const projectFiles = this.manifest.projects[project];
    const relativePath = projectFiles?.[
      key as keyof typeof projectFiles
    ];

    return typeof relativePath === "string"
      ? resolve(this.inputRoot, relativePath)
      : undefined;
  }

  virtualTargetId(input: {
    sourceProject: SourceProject;
    entityType: MigrationEntityType;
    legacyId: string;
  }): Types.ObjectId {
    return deterministicObjectId(
      this.manifestHash,
      input.sourceProject,
      input.entityType,
      input.legacyId,
    );
  }

  async resolveMapping(input: {
    sourceProject: SourceProject;
    entityType: MigrationEntityType;
    legacyId: string;
  }): Promise<Types.ObjectId | undefined> {
    const key = sourceKey(
      input.sourceProject,
      input.entityType,
      input.legacyId,
    );
    const virtual = this.virtualMappings.get(key);
    if (virtual) return virtual;

    if (!this.canReadTarget) return undefined;

    const mapping = await MigrationMapModel.findOne({
      sourceProject: input.sourceProject,
      entityType: input.entityType,
      legacyId: input.legacyId,
    })
      .select("targetId")
      .lean();

    if (mapping?.targetId) {
      this.virtualMappings.set(key, mapping.targetId);
      return mapping.targetId;
    }

    return undefined;
  }

  async rememberMapping(input: MapEntityInput): Promise<void> {
    const key = sourceKey(
      input.sourceProject,
      input.entityType,
      input.legacyId,
    );
    this.virtualMappings.set(key, input.targetId);

    if (!this.isExecute) {
      if (this.canReadTarget) {
        const existing = await MigrationMapModel.findOne({
          sourceProject: input.sourceProject,
          entityType: input.entityType,
          legacyId: input.legacyId,
        })
          .select("targetId sourceChecksum")
          .lean();

        if (
          existing &&
          existing.targetId.toString() !== input.targetId.toString()
        ) {
          throw new Error(
            `Dry-run mapping conflict for ${input.sourceProject}/${input.entityType}/${input.legacyId}.`,
          );
        }

        if (
          existing &&
          existing.sourceChecksum !== input.sourceChecksum
        ) {
          throw new Error(
            `Dry-run detected changed source data for ${input.sourceProject}/${input.entityType}/${input.legacyId}.`,
          );
        }
      }

      this.stats.mapped += 1;
      return;
    }

    const update = {
      $setOnInsert: {
        runId: this.runId,
        sourceProject: input.sourceProject,
        entityType: input.entityType,
        legacyId: input.legacyId,
        targetModel: input.targetModel,
        targetId: input.targetId,
        sourceChecksum: input.sourceChecksum,
        metadata: safeMetadata(input.metadata),
        migratedAt: new Date(),
      },
    };

    const result = await MigrationMapModel.updateOne(
      {
        sourceProject: input.sourceProject,
        entityType: input.entityType,
        legacyId: input.legacyId,
      },
      update,
      {
        upsert: true,
        session: input.session,
      },
    );

    if (result.upsertedCount === 0) {
      const existing = await MigrationMapModel.findOne({
        sourceProject: input.sourceProject,
        entityType: input.entityType,
        legacyId: input.legacyId,
      })
        .select("targetId sourceChecksum")
        .session(input.session ?? null)
        .lean();

      if (
        !existing ||
        existing.targetId.toString() !== input.targetId.toString()
      ) {
        throw new Error(
          `Migration mapping conflict for ${input.sourceProject}/${input.entityType}/${input.legacyId}.`,
        );
      }

      if (existing.sourceChecksum !== input.sourceChecksum) {
        throw new Error(
          `The source record changed after it was mapped: ${input.sourceProject}/${input.entityType}/${input.legacyId}. Remove or explicitly reconcile the existing MigrationMap before retrying.`,
        );
      }
    }

    this.stats.mapped += 1;
  }

  private selectedDefinitions(
    definitions: MigrationDefinition[],
  ): MigrationDefinition[] {
    if (this.migration === "all") return definitions;
    return definitions.filter(
      (definition) => definition.name === this.migration,
    );
  }

  private async prepareExecution(): Promise<void> {
    if (!this.isExecute) return;

    if (process.env.NODE_ENV === "production") {
      if (process.env.MIGRATION_PRODUCTION_CONFIRMATION !== "I_UNDERSTAND") {
        throw new Error(
          "Production migration requires MIGRATION_PRODUCTION_CONFIRMATION=I_UNDERSTAND.",
        );
      }
    }

    if (!this.skipApprovedReport) {
      if (!this.approvedDryRunReport) {
        throw new Error(
          "Execute mode requires --approved-report from a successful dry run.",
        );
      }

      await validateApprovedReport({
        reportPath: this.approvedDryRunReport,
        manifestHash: this.manifestHash,
        sourceBundleHash: this.sourceBundleHash,
        migration: this.migration,
      });
    }

    await MigrationMapModel.createIndexes();
    await MigrationRunModel.createIndexes();

    await MigrationRunModel.create({
      runId: this.runId,
      migration: this.migration,
      mode: "execute",
      status: "running",
      manifestPath: this.manifestPath,
      manifestHash: this.manifestHash,
      sourceBundleHash: this.sourceBundleHash,
      approvedDryRunReport: this.approvedDryRunReport,
      startedAt: new Date(),
      stats: this.stats,
    });
  }

  private async finishExecution(input: {
    status: "completed" | "failed";
    reportPath: string;
    errorSummary?: string;
  }): Promise<void> {
    if (!this.isExecute) return;

    await MigrationRunModel.updateOne(
      { runId: this.runId },
      {
        $set: {
          status: input.status,
          completedAt: new Date(),
          stats: this.stats,
          reportPath: input.reportPath,
          errorSummary: input.errorSummary,
        },
      },
    );
  }

  async run(
    definitions: MigrationDefinition[],
  ): Promise<{
    report: MigrationReport;
    reportPath: string;
  }> {
    const startedAt = new Date();
    await mkdir(this.reportDirectory, { recursive: true });

    let thrown: unknown;

    try {
      if (this.isExecute && this.stats.errors > 0) {
        throw new Error(
          "Execute mode was blocked by staging validation errors.",
        );
      }

      await this.prepareExecution();

      for (const definition of this.selectedDefinitions(definitions)) {
        try {
          await definition.run(this);
        } catch (error) {
          this.addIssue({
            severity: "error",
            code: "MIGRATION_PHASE_FAILED",
            message: `${definition.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });

          if (!this.continueOnError) throw error;
        }
      }
    } catch (error) {
      thrown = error;

      if (
        !this.issues.some(
          (issue) =>
            issue.code === "MIGRATION_PREPARATION_FAILED" ||
            issue.code === "MIGRATION_PHASE_FAILED",
        )
      ) {
        this.addIssue({
          severity: "error",
          code: "MIGRATION_PREPARATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    const completedAt = new Date();
    const executionAllowed = this.stats.errors === 0;
    const report: MigrationReport = {
      version: 1,
      runId: this.runId,
      migration: this.migration,
      mode: this.mode,
      manifestPath: this.manifestPath,
      manifestHash: this.manifestHash,
      sourceBundleHash: this.sourceBundleHash,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      approvedDryRunReport: this.approvedDryRunReport,
      stats: this.stats,
      issues: this.issues,
      executionAllowed,
    };

    const reportPath = resolve(
      this.reportDirectory,
      `${this.runId}-${this.mode}-${this.migration}.json`,
    );
    await writeFile(
      reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );

    await this.finishExecution({
      status: thrown || !executionAllowed ? "failed" : "completed",
      reportPath,
      errorSummary: thrown
        ? thrown instanceof Error
          ? thrown.message
          : String(thrown)
        : undefined,
    });

    if (thrown) throw thrown;

    return { report, reportPath };
  }
}
