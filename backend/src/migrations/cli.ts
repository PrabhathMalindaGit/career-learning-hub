import "dotenv/config";
import mongoose from "mongoose";
import {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";
import {
  hashMigrationSourceBundle,
  loadMigrationManifest,
} from "./migration.manifest.js";
import { CoreMigrationRunner } from "./migration.runner.js";
import type {
  MigrationMode,
  MigrationName,
} from "./migration.types.js";
import { migrateInterviews } from "./migrateInterviews.js";
import { migrateLearning } from "./migrateLearning.js";
import { migrateResumes } from "./migrateResumes.js";
import { migrateUsers } from "./migrateUsers.js";

interface CliOptions {
  mode: MigrationMode;
  migration: MigrationName;
  manifestPath: string;
  reportDirectory: string;
  approvedDryRunReport?: string;
  skipApprovedReport: boolean;
  continueOnError: boolean;
}

function argumentMap(): Map<string, string | true> {
  const values = new Map<string, string | true>();

  for (const argument of process.argv.slice(2)) {
    if (!argument.startsWith("--")) continue;

    const [rawKey, ...rest] = argument.slice(2).split("=");
    values.set(
      rawKey,
      rest.length > 0 ? rest.join("=") : true,
    );
  }

  return values;
}

function valueOf(
  args: Map<string, string | true>,
  key: string,
  fallback?: string,
): string | undefined {
  const value = args.get(key);
  return typeof value === "string" ? value : fallback;
}

function booleanOf(
  args: Map<string, string | true>,
  key: string,
): boolean {
  const value = args.get(key);
  return value === true || value === "true";
}

function parseOptions(): CliOptions {
  const args = argumentMap();
  const mode = valueOf(args, "mode", "validate");
  const migration = valueOf(args, "migration", "all");
  const manifestPath = valueOf(args, "manifest");

  if (
    mode !== "validate" &&
    mode !== "dry-run" &&
    mode !== "execute"
  ) {
    throw new Error(
      "--mode must be validate, dry-run, or execute.",
    );
  }

  if (
    migration !== "users" &&
    migration !== "resumes" &&
    migration !== "interviews" &&
    migration !== "learning" &&
    migration !== "all"
  ) {
    throw new Error(
      "--migration must be users, resumes, interviews, learning, or all.",
    );
  }

  if (!manifestPath) {
    throw new Error("--manifest is required.");
  }

  return {
    mode,
    migration,
    manifestPath,
    reportDirectory:
      valueOf(args, "report-dir", "./migration-reports") ??
      "./migration-reports",
    approvedDryRunReport: valueOf(
      args,
      "approved-report",
    ),
    skipApprovedReport: booleanOf(
      args,
      "skip-approved-report",
    ),
    continueOnError: booleanOf(
      args,
      "continue-on-error",
    ),
  };
}

async function validateTransactionSupport(
  runner: CoreMigrationRunner,
): Promise<void> {
  const database = mongoose.connection.db;
  if (!database) {
    runner.addIssue({
      severity: "error",
      code: "MIGRATION_DATABASE_UNAVAILABLE",
      message: "The target MongoDB database is unavailable.",
    });
    return;
  }

  const hello = (await database.admin().command({
    hello: 1,
  })) as {
    setName?: string;
    msg?: string;
  };
  const supportsTransactions =
    Boolean(hello.setName) || hello.msg === "isdbgrid";

  if (!supportsTransactions) {
    runner.addIssue({
      severity: "error",
      code: "MIGRATION_TRANSACTIONS_UNAVAILABLE",
      message:
        "The target must be a MongoDB replica set or sharded cluster because execute mode uses transactions.",
    });
  }
}

async function main(): Promise<void> {
  const options = parseOptions();
  const loaded = await loadMigrationManifest(
    options.manifestPath,
  );
  const sourceBundleHash = await hashMigrationSourceBundle({
    manifest: loaded.manifest,
    inputRoot: loaded.inputRoot,
  });

  const runner = new CoreMigrationRunner({
    mode: options.mode,
    migration: options.migration,
    manifest: loaded.manifest,
    manifestPath: loaded.absolutePath,
    manifestRaw: loaded.raw,
    sourceBundleHash,
    inputRoot: loaded.inputRoot,
    reportDirectory: options.reportDirectory,
    approvedDryRunReport:
      options.approvedDryRunReport,
    skipApprovedReport: options.skipApprovedReport,
    continueOnError: options.continueOnError,
  });

  const configuredFileCount = Object.values(
    loaded.manifest.projects,
  ).reduce(
    (total, files) =>
      total +
      Object.values(files ?? {}).filter(
        (value) => typeof value === "string",
      ).length,
    0,
  );

  if (configuredFileCount === 0) {
    runner.addIssue({
      severity: "error",
      code: "MIGRATION_MANIFEST_EMPTY",
      message:
        "The migration manifest does not reference any source export files.",
    });
  }

  let connected = false;

  try {
    if (options.mode !== "validate") {
      await connectDatabase({
        autoIndex: false,
        autoCreate: false,
      });
      connected = true;
      await validateTransactionSupport(runner);
    }

    const { report, reportPath } = await runner.run([
      migrateUsers,
      migrateResumes,
      migrateInterviews,
      migrateLearning,
    ]);

    console.log(
      JSON.stringify(
        {
          runId: report.runId,
          mode: report.mode,
          migration: report.migration,
          reportPath,
          executionAllowed: report.executionAllowed,
          stats: report.stats,
        },
        null,
        2,
      ),
    );

    if (!report.executionAllowed) {
      process.exitCode = 2;
    }
  } finally {
    if (connected) {
      await disconnectDatabase();
    }
  }
}

main().catch(async (error) => {
  console.error(
    "Migration failed:",
    error instanceof Error ? error.message : error,
  );

  if (mongoose.connection.readyState !== 0) {
    await disconnectDatabase().catch(() => undefined);
  }

  process.exit(1);
});
