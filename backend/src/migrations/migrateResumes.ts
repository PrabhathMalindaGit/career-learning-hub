import { Types } from "mongoose";
import { ResumeModel } from "../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../modules/resumes/resumeVersion.model.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import type { SourceProject } from "./migrationMap.model.js";
import { resolveMigratedUserId } from "./migration.lookup.js";
import type {
  MigrationContext,
  MigrationDefinition,
} from "./migration.types.js";
import {
  normalizeResumeContent,
  normalizeResumeDesign,
  sourceForProject,
} from "./resumeMigration.adapter.js";
import {
  asDate,
  asNumber,
  asString,
  firstDefined,
  legacyIdOf,
  readImportRecords,
  sha256,
  type UnknownRecord,
} from "./migration.utils.js";

interface VersionCandidate {
  legacyId: string;
  record: UnknownRecord;
  versionNumber: number;
  createdAt?: Date;
  updatedAt?: Date;
}

function versionCandidates(
  resumeRecord: UnknownRecord,
  legacyResumeId: string,
): VersionCandidate[] {
  const rawVersions = firstDefined(resumeRecord, [
    "versions",
    "resumeVersions",
    "history",
  ]);

  const records = Array.isArray(rawVersions)
    ? rawVersions.filter(
        (entry): entry is UnknownRecord =>
          Boolean(entry) &&
          typeof entry === "object" &&
          !Array.isArray(entry),
      )
    : [resumeRecord];

  return records
    .map((record, index) => ({
      legacyId: legacyIdOf(
        record,
        `${legacyResumeId}:version:${index + 1}`,
      ),
      record,
      versionNumber: Math.max(
        1,
        asNumber(
          firstDefined(record, [
            "versionNumber",
            "version",
            "number",
          ]),
          index + 1,
        ),
      ),
      createdAt: asDate(record.createdAt),
      updatedAt: asDate(record.updatedAt),
    }))
    .sort(
      (left, right) =>
        left.versionNumber - right.versionNumber ||
        (left.createdAt?.getTime() ?? 0) -
          (right.createdAt?.getTime() ?? 0),
    )
    .map((candidate, index) => ({
      ...candidate,
      versionNumber: index + 1,
    }));
}

async function migrateProject(
  context: MigrationContext,
  project: Extract<
    SourceProject,
    "ai-resume-analyser" | "resume-builder"
  >,
): Promise<void> {
  const filePath = context.sourcePath(project, "resumes");
  if (!filePath) return;

  let records: UnknownRecord[];
  try {
    records = await readImportRecords(filePath);
    context.increment("filesRead");
    context.increment("recordsRead", records.length);
  } catch (error) {
    context.addIssue({
      severity: "error",
      code: "MIGRATION_RESUME_FILE_INVALID",
      message: `${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      sourceProject: project,
      entityType: "resume",
    });
    return;
  }

  for (const [recordIndex, record] of records.entries()) {
    const legacyResumeId = legacyIdOf(
      record,
      `${project}-resume-${recordIndex}`,
    );
    const userId = await resolveMigratedUserId({
      context,
      project,
      record,
      fallbackLegacyId: legacyResumeId,
      recordIndex,
    });
    if (!userId) continue;

    const versions = versionCandidates(record, legacyResumeId);

    try {
      for (const version of versions) {
        const content = normalizeResumeContent({
          project,
          legacyResumeId,
          record: version.record,
        });

        await new ResumeVersionModel({
          _id: context.virtualTargetId({
            sourceProject: project,
            entityType: "resume-version",
            legacyId: version.legacyId,
          }),
          userId,
          resumeId: context.virtualTargetId({
            sourceProject: project,
            entityType: "resume",
            legacyId: legacyResumeId,
          }),
          versionNumber: version.versionNumber,
          source: sourceForProject(project, version.record),
          content,
        }).validate();
      }
      context.increment("recordsValid");
    } catch (error) {
      context.addIssue({
        severity: "error",
        code: "MIGRATION_RESUME_VALIDATION_FAILED",
        message:
          error instanceof Error ? error.message : String(error),
        sourceProject: project,
        entityType: "resume",
        legacyId: legacyResumeId,
        recordIndex,
      });
      continue;
    }

    const mappedResumeId = await context.resolveMapping({
      sourceProject: project,
      entityType: "resume",
      legacyId: legacyResumeId,
    });
    const targetResumeId =
      mappedResumeId ??
      context.virtualTargetId({
        sourceProject: project,
        entityType: "resume",
        legacyId: legacyResumeId,
      });

    const existingResume =
      context.canReadTarget && mappedResumeId
        ? await ResumeModel.findOne({
            _id: mappedResumeId,
            userId,
          })
            .select("_id latestVersionNumber")
            .lean()
        : null;

    context.increment(
      existingResume
        ? context.isExecute
          ? "reused"
          : "plannedReuses"
        : context.isExecute
          ? "created"
          : "plannedCreates",
    );

    if (!context.isExecute) {
      await context.rememberMapping({
        sourceProject: project,
        entityType: "resume",
        legacyId: legacyResumeId,
        targetModel: "Resume",
        targetId: targetResumeId,
        sourceChecksum: sha256(record),
        metadata: {
          versionCount: versions.length,
        },
      });

      for (const version of versions) {
        await context.rememberMapping({
          sourceProject: project,
          entityType: "resume-version",
          legacyId: version.legacyId,
          targetModel: "ResumeVersion",
          targetId: context.virtualTargetId({
            sourceProject: project,
            entityType: "resume-version",
            legacyId: version.legacyId,
          }),
          sourceChecksum: sha256(version.record),
          metadata: {
            resumeLegacyId: legacyResumeId,
            versionNumber: version.versionNumber,
          },
        });
      }
      continue;
    }

    await withMongoTransaction(async (session) => {
      const existing = await ResumeModel.findOne({
        _id: targetResumeId,
        userId,
      })
        .session(session)
        .lean();

      if (!existing) {
        const now = new Date();
        await ResumeModel.collection.insertOne(
          {
            _id: targetResumeId,
            userId,
            title:
              asString(
                firstDefined(record, [
                  "title",
                  "name",
                  "resumeName",
                ]),
              ).slice(0, 120) || "Imported Resume",
            status:
              asString(record.status) === "archived"
                ? "archived"
                : "active",
            latestVersionNumber: 0,
            design: normalizeResumeDesign(record),
            createdAt: asDate(record.createdAt) ?? now,
            updatedAt: asDate(record.updatedAt) ?? now,
          },
          { session },
        );
      }

      let parentVersionId: Types.ObjectId | undefined;
      let latestVersionId: Types.ObjectId | undefined;

      for (const version of versions) {
        const mappedVersionId = await context.resolveMapping({
          sourceProject: project,
          entityType: "resume-version",
          legacyId: version.legacyId,
        });
        let targetVersionId =
          mappedVersionId ??
          context.virtualTargetId({
            sourceProject: project,
            entityType: "resume-version",
            legacyId: version.legacyId,
          });

        const existingVersion = await ResumeVersionModel.findOne({
          userId,
          resumeId: targetResumeId,
          $or: [
            { _id: targetVersionId },
            { versionNumber: version.versionNumber },
          ],
        })
          .select("_id")
          .session(session)
          .lean();

        if (existingVersion) {
          targetVersionId = existingVersion._id;
        } else {
          const now = new Date();
          await ResumeVersionModel.collection.insertOne(
            {
              _id: targetVersionId,
              userId,
              resumeId: targetResumeId,
              versionNumber: version.versionNumber,
              parentVersionId,
              source: sourceForProject(
                project,
                version.record,
              ),
              content: normalizeResumeContent({
                project,
                legacyResumeId,
                record: version.record,
              }),
              changeSummary: "Imported from legacy project",
              createdAt: version.createdAt ?? now,
              updatedAt: version.updatedAt ?? now,
            },
            { session },
          );
        }

        await context.rememberMapping({
          sourceProject: project,
          entityType: "resume-version",
          legacyId: version.legacyId,
          targetModel: "ResumeVersion",
          targetId: targetVersionId,
          sourceChecksum: sha256(version.record),
          metadata: {
            resumeLegacyId: legacyResumeId,
            versionNumber: version.versionNumber,
          },
          session,
        });

        parentVersionId = targetVersionId;
        latestVersionId = targetVersionId;
      }

      await ResumeModel.updateOne(
        {
          _id: targetResumeId,
          userId,
        },
        {
          $set: {
            currentVersionId: latestVersionId,
            latestVersionNumber: versions.length,
            updatedAt: asDate(record.updatedAt) ?? new Date(),
          },
        },
        { session },
      );

      await context.rememberMapping({
        sourceProject: project,
        entityType: "resume",
        legacyId: legacyResumeId,
        targetModel: "Resume",
        targetId: targetResumeId,
        sourceChecksum: sha256(record),
        metadata: {
          versionCount: versions.length,
        },
        session,
      });
    });
  }
}

export const migrateResumes: MigrationDefinition = {
  name: "resumes",

  async run(context: MigrationContext): Promise<void> {
    await migrateProject(context, "resume-builder");
    await migrateProject(context, "ai-resume-analyser");
  },
};
