import { Types } from "mongoose";
import { UserModel } from "../modules/users/user.model.js";
import type { MigrationContext } from "./migration.types.js";
import type { SourceProject } from "./migrationMap.model.js";
import {
  asString,
  firstDefined,
  legacyIdOf,
  normalizeEmail,
  type UnknownRecord,
} from "./migration.utils.js";

export async function resolveMigratedUserId(input: {
  context: MigrationContext;
  project: SourceProject;
  record: UnknownRecord;
  fallbackLegacyId: string;
  recordIndex?: number;
}): Promise<Types.ObjectId | undefined> {
  const legacyUserId = asString(
    firstDefined(input.record, [
      "userId",
      "ownerId",
      "createdBy",
      "user",
      "user._id",
      "user.id",
    ]),
  );

  if (legacyUserId) {
    const mapped = await input.context.resolveMapping({
      sourceProject: input.project,
      entityType: "user",
      legacyId: legacyUserId,
    });

    if (mapped) return mapped;

    if (!input.context.canReadTarget) {
      input.context.addIssue({
        severity: "warning",
        code: "MIGRATION_USER_DEPENDENCY_NOT_STAGED",
        message:
          "User ownership was validated structurally only; run the users migration in the same dry run before execution.",
        sourceProject: input.project,
        entityType: "user",
        legacyId: legacyUserId,
        recordIndex: input.recordIndex,
      });

      return input.context.virtualTargetId({
        sourceProject: input.project,
        entityType: "user",
        legacyId: legacyUserId,
      });
    }
  }

  const emailValue = asString(
    firstDefined(input.record, [
      "email",
      "userEmail",
      "ownerEmail",
      "user.email",
    ]),
  );

  if (emailValue && input.context.canReadTarget) {
    const email = normalizeEmail(emailValue);
    const user = await UserModel.findOne({ email })
      .select("_id")
      .lean();

    if (user) return user._id;
  }

  input.context.addIssue({
    severity: "error",
    code: "MIGRATION_USER_MAPPING_MISSING",
    message:
      "A source record does not resolve to a migrated unified user.",
    sourceProject: input.project,
    entityType: "user",
    legacyId:
      legacyUserId ||
      legacyIdOf(input.record, input.fallbackLegacyId),
    recordIndex: input.recordIndex,
  });

  return undefined;
}
