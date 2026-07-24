import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { UserModel } from "../modules/users/user.model.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import type { SourceProject } from "./migrationMap.model.js";
import type {
  MigrationContext,
  MigrationDefinition,
} from "./migration.types.js";
import {
  asBoolean,
  asDate,
  asString,
  firstDefined,
  legacyIdOf,
  normalizeEmail,
  readImportRecords,
  redactEmail,
  sha256,
  type UnknownRecord,
} from "./migration.utils.js";

interface LegacyUserCandidate {
  project: SourceProject;
  legacyId: string;
  recordIndex: number;
  record: UnknownRecord;
  email: string;
  displayName: string;
  passwordHash?: string;
  emailVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const bcryptHashPattern =
  /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function displayNameFor(
  record: UnknownRecord,
  email: string,
): string {
  const selected = asString(
    firstDefined(record, [
      "profile.displayName",
      "displayName",
      "fullName",
      "name",
      "username",
    ]),
  );
  const fallback = email.split("@")[0] || "Imported User";
  const value = selected || fallback;

  return value.length >= 2
    ? value.slice(0, 100)
    : `User ${value}`.slice(0, 100);
}

function passwordHashFor(record: UnknownRecord): string | undefined {
  for (const path of [
    "passwordHash",
    "password",
    "hashedPassword",
    "auth.passwordHash",
  ]) {
    const value = asString(firstDefined(record, [path]));
    if (bcryptHashPattern.test(value)) return value;
  }

  return undefined;
}

function verifiedAtFor(record: UnknownRecord): Date | undefined {
  const explicit = asDate(
    firstDefined(record, [
      "emailVerifiedAt",
      "verifiedAt",
      "emailVerification.verifiedAt",
    ]),
  );
  if (explicit) return explicit;

  return asBoolean(
    firstDefined(record, [
      "isEmailVerified",
      "emailVerified",
      "verified",
    ]),
  )
    ? asDate(firstDefined(record, ["updatedAt", "createdAt"])) ??
        new Date(0)
    : undefined;
}

function chooseDisplayName(
  candidates: LegacyUserCandidate[],
): string {
  return [...candidates]
    .sort(
      (left, right) =>
        right.displayName.length - left.displayName.length,
    )[0].displayName;
}

async function createResetHash(): Promise<string> {
  return bcrypt.hash(
    randomBytes(48).toString("base64url"),
    env.BCRYPT_ROUNDS,
  );
}

async function loadCandidates(
  context: MigrationContext,
): Promise<LegacyUserCandidate[]> {
  const candidates: LegacyUserCandidate[] = [];
  const seenLegacyUsers = new Map<
    string,
    { email: string; checksum: string }
  >();

  for (const project of [
    "ai-learning-assistant",
    "ai-resume-analyser",
    "interview-prep-ai",
    "resume-builder",
  ] as const) {
    const filePath = context.sourcePath(project, "users");
    if (!filePath) continue;

    let records: UnknownRecord[];
    try {
      records = await readImportRecords(filePath);
      context.increment("filesRead");
      context.increment("recordsRead", records.length);
    } catch (error) {
      context.addIssue({
        severity: "error",
        code: "MIGRATION_USER_FILE_INVALID",
        message: `${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        sourceProject: project,
        entityType: "user",
      });
      continue;
    }

    records.forEach((record, recordIndex) => {
      const legacyId = legacyIdOf(
        record,
        `${project}-user-${recordIndex}`,
      );
      const rawEmail = asString(
        firstDefined(record, [
          "email",
          "profile.email",
          "user.email",
        ]),
      );
      const email = normalizeEmail(rawEmail);
      const sourceKey = `${project}\u001f${legacyId}`;
      const recordChecksum = sha256(record);
      const previous = seenLegacyUsers.get(sourceKey);

      if (previous) {
        if (
          previous.email === email &&
          previous.checksum === recordChecksum
        ) {
          context.addIssue({
            severity: "warning",
            code: "MIGRATION_DUPLICATE_LEGACY_USER_RECORD",
            message:
              "An exact duplicate legacy user record was ignored.",
            sourceProject: project,
            entityType: "user",
            legacyId,
            recordIndex,
          });
          context.increment("skipped");
          return;
        }

        context.addIssue({
          severity: "error",
          code: "MIGRATION_DUPLICATE_LEGACY_USER_ID",
          message:
            "The same legacy user ID appears with conflicting source data.",
          sourceProject: project,
          entityType: "user",
          legacyId,
          recordIndex,
        });
        return;
      }

      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 320
      ) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_USER_EMAIL_INVALID",
          message:
            "A legacy user has a missing or invalid email address.",
          sourceProject: project,
          entityType: "user",
          legacyId,
          recordIndex,
        });
        return;
      }

      seenLegacyUsers.set(sourceKey, {
        email,
        checksum: recordChecksum,
      });
      candidates.push({
        project,
        legacyId,
        recordIndex,
        record,
        email,
        displayName: displayNameFor(record, email),
        passwordHash: passwordHashFor(record),
        emailVerifiedAt: verifiedAtFor(record),
        createdAt: asDate(record.createdAt),
        updatedAt: asDate(record.updatedAt),
      });
      context.increment("recordsValid");
    });
  }

  return candidates;
}

export const migrateUsers: MigrationDefinition = {
  name: "users",

  async run(context: MigrationContext): Promise<void> {
    const candidates = await loadCandidates(context);
    const byEmail = new Map<string, LegacyUserCandidate[]>();

    for (const candidate of candidates) {
      const group = byEmail.get(candidate.email) ?? [];
      group.push(candidate);
      byEmail.set(candidate.email, group);
    }

    for (const [email, group] of byEmail) {
      const mappedIds = new Set<string>();

      for (const candidate of group) {
        const mapped = await context.resolveMapping({
          sourceProject: candidate.project,
          entityType: "user",
          legacyId: candidate.legacyId,
        });
        if (mapped) mappedIds.add(mapped.toString());
      }

      if (mappedIds.size > 1) {
        context.increment("conflicts");
        context.addIssue({
          severity: "error",
          code: "MIGRATION_DUPLICATE_EMAIL_MAPPING_CONFLICT",
          message: `Legacy users for ${redactEmail(
            email,
          )} already map to different unified users.`,
          entityType: "user",
        });
        continue;
      }

      let targetId =
        mappedIds.size === 1
          ? new Types.ObjectId([...mappedIds][0])
          : undefined;

      let existingUser = targetId
        ? await UserModel.findById(targetId).select("_id email").lean()
        : context.canReadTarget
          ? await UserModel.findOne({ email })
              .select("_id email")
              .lean()
          : null;

      if (targetId && !existingUser && context.canReadTarget) {
        context.increment("conflicts");
        context.addIssue({
          severity: "error",
          code: "MIGRATION_MAPPED_USER_MISSING",
          message: `The mapped target user for ${redactEmail(
            email,
          )} does not exist.`,
          entityType: "user",
        });
        continue;
      }

      if (!targetId) {
        targetId =
          existingUser?._id ??
          context.virtualTargetId({
            sourceProject: group[0].project,
            entityType: "user",
            legacyId: `email:${email}`,
          });
      }

      const validHashes = [
        ...new Set(
          group
            .map((candidate) => candidate.passwordHash)
            .filter((value): value is string => Boolean(value)),
        ),
      ];
      const passwordResetRequired =
        !existingUser && validHashes.length !== 1;

      if (passwordResetRequired) {
        context.addIssue({
          severity: "warning",
          code:
            validHashes.length > 1
              ? "MIGRATION_USER_PASSWORD_HASH_CONFLICT"
              : "MIGRATION_USER_PASSWORD_RESET_REQUIRED",
          message:
            validHashes.length > 1
              ? `Conflicting password hashes for ${redactEmail(
                  email,
                )}; a reset-only password will be installed.`
              : `No compatible bcrypt hash for ${redactEmail(
                  email,
                )}; a reset-only password will be installed.`,
          entityType: "user",
        });
      }

      if (existingUser) {
        context.increment(
          context.isExecute ? "reused" : "plannedReuses",
        );
      } else {
        context.increment(
          context.isExecute ? "created" : "plannedCreates",
        );
      }

      if (!context.isExecute) {
        for (const candidate of group) {
          await context.rememberMapping({
            sourceProject: candidate.project,
            entityType: "user",
            legacyId: candidate.legacyId,
            targetModel: "User",
            targetId,
            sourceChecksum: sha256(candidate.record),
            metadata: {
              normalizedEmail: email,
              duplicateEmailGroupSize: group.length,
              passwordResetRequired,
            },
          });
        }
        continue;
      }

      await withMongoTransaction(async (session) => {
        let userId = existingUser?._id;

        if (!userId) {
          const raceExisting = await UserModel.findOne({ email })
            .select("_id")
            .session(session)
            .lean();

          if (raceExisting) {
            userId = raceExisting._id;
            context.increment("reused");
            context.increment("created", -1);
          } else {
            userId = new Types.ObjectId();
            const createdDates = group
              .map((candidate) => candidate.createdAt)
              .filter((value): value is Date => Boolean(value));
            const updatedDates = group
              .map((candidate) => candidate.updatedAt)
              .filter((value): value is Date => Boolean(value));
            const emailVerifiedDates = group
              .map((candidate) => candidate.emailVerifiedAt)
              .filter((value): value is Date => Boolean(value));

            await UserModel.collection.insertOne(
              {
                _id: userId,
                email,
                passwordHash:
                  validHashes.length === 1
                    ? validHashes[0]
                    : await createResetHash(),
                profile: {
                  displayName: chooseDisplayName(group),
                },
                roles: ["user"],
                accountStatus: "active",
                emailVerifiedAt:
                  emailVerifiedDates.sort(
                    (left, right) =>
                      left.getTime() - right.getTime(),
                  )[0],
                createdAt:
                  createdDates.sort(
                    (left, right) =>
                      left.getTime() - right.getTime(),
                  )[0] ?? new Date(),
                updatedAt:
                  updatedDates.sort(
                    (left, right) =>
                      right.getTime() - left.getTime(),
                  )[0] ?? new Date(),
              },
              { session },
            );
          }
        }

        for (const candidate of group) {
          await context.rememberMapping({
            sourceProject: candidate.project,
            entityType: "user",
            legacyId: candidate.legacyId,
            targetModel: "User",
            targetId: userId,
            sourceChecksum: sha256(candidate.record),
            metadata: {
              normalizedEmail: email,
              duplicateEmailGroupSize: group.length,
              passwordResetRequired,
            },
            session,
          });
        }

        targetId = userId;
      });
    }
  },
};
