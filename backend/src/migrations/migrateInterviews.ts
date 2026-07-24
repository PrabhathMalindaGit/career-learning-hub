import { InterviewQuestionModel } from "../modules/interviews/interviewQuestion.model.js";
import { createQuestionFingerprint } from "../modules/interviews/interview.fingerprint.js";
import { InterviewSessionModel } from "../modules/interviews/interviewSession.model.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import { resolveMigratedUserId } from "./migration.lookup.js";
import type {
  MigrationContext,
  MigrationDefinition,
} from "./migration.types.js";
import {
  asBoolean,
  asDate,
  asString,
  asStringArray,
  firstDefined,
  legacyIdOf,
  optionalString,
  readImportRecords,
  sha256,
  type UnknownRecord,
} from "./migration.utils.js";

interface QuestionCandidate {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
}

interface SessionCandidate {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
  questions: QuestionCandidate[];
}

function objectRecords(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is UnknownRecord =>
          Boolean(entry) &&
          typeof entry === "object" &&
          !Array.isArray(entry),
      )
    : [];
}

function sessionIdForQuestion(
  question: UnknownRecord,
  recordIndex: number,
): string {
  const explicit = asString(
    firstDefined(question, [
      "sessionId",
      "interviewSessionId",
      "interviewId",
      "setId",
      "questionSetId",
    ]),
  );

  if (explicit) return explicit;

  const userReference = asString(
    firstDefined(question, [
      "userId",
      "ownerId",
      "createdBy",
      "user._id",
    ]),
  );
  const role =
    asString(
      firstDefined(question, [
        "targetRole",
        "role",
        "jobRole",
      ]),
    ) || "general";

  return `standalone:${userReference || "unknown"}:${role}`;
}

function difficultyFor(
  record: UnknownRecord,
): "easy" | "medium" | "hard" {
  const value = asString(
    firstDefined(record, ["difficulty", "level"]),
  ).toLowerCase();

  if (value === "easy" || value === "hard") return value;
  return "medium";
}

function modeFor(
  record: UnknownRecord,
): "study" | "written-practice" | "mock-interview" {
  const value = asString(
    firstDefined(record, ["mode", "sessionType", "type"]),
  );

  if (
    value === "study" ||
    value === "written-practice" ||
    value === "mock-interview"
  ) {
    return value;
  }

  return "study";
}

async function loadSessions(
  context: MigrationContext,
): Promise<Map<string, SessionCandidate>> {
  const project = "interview-prep-ai" as const;
  const sessions = new Map<string, SessionCandidate>();
  const sessionPath = context.sourcePath(
    project,
    "interviewSessions",
  );
  const questionPath = context.sourcePath(
    project,
    "interviewQuestions",
  );

  if (sessionPath) {
    try {
      const records = await readImportRecords(sessionPath);
      context.increment("filesRead");
      context.increment("recordsRead", records.length);

      records.forEach((record, recordIndex) => {
        const legacyId = legacyIdOf(
          record,
          `interview-session-${recordIndex}`,
        );
        const embedded = objectRecords(
          firstDefined(record, [
            "questions",
            "questionSet",
            "items",
          ]),
        ).map((question, questionIndex) => ({
          legacyId: legacyIdOf(
            question,
            `${legacyId}:question:${questionIndex}`,
          ),
          record: {
            ...question,
            userId:
              question.userId ??
              record.userId ??
              record.ownerId,
          },
          recordIndex: questionIndex,
        }));

        sessions.set(legacyId, {
          legacyId,
          record,
          recordIndex,
          questions: embedded,
        });
      });
    } catch (error) {
      context.addIssue({
        severity: "error",
        code: "MIGRATION_INTERVIEW_SESSION_FILE_INVALID",
        message: `${sessionPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        sourceProject: project,
        entityType: "interview-session",
      });
    }
  }

  if (questionPath) {
    try {
      const records = await readImportRecords(questionPath);
      context.increment("filesRead");
      context.increment("recordsRead", records.length);

      records.forEach((record, recordIndex) => {
        const sessionLegacyId = sessionIdForQuestion(
          record,
          recordIndex,
        );
        const current =
          sessions.get(sessionLegacyId) ??
          {
            legacyId: sessionLegacyId,
            record: {
              _id: sessionLegacyId,
              userId: firstDefined(record, [
                "userId",
                "ownerId",
                "createdBy",
              ]),
              title:
                asString(
                  firstDefined(record, [
                    "sessionTitle",
                    "title",
                  ]),
                ) || "Imported Interview Questions",
              targetRole:
                asString(
                  firstDefined(record, [
                    "targetRole",
                    "role",
                    "jobRole",
                  ]),
                ) || "General Interview",
            },
            recordIndex,
            questions: [],
          };

        current.questions.push({
          legacyId: legacyIdOf(
            record,
            `${sessionLegacyId}:question:${recordIndex}`,
          ),
          record,
          recordIndex,
        });
        sessions.set(sessionLegacyId, current);
      });
    } catch (error) {
      context.addIssue({
        severity: "error",
        code: "MIGRATION_INTERVIEW_QUESTION_FILE_INVALID",
        message: `${questionPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        sourceProject: project,
        entityType: "interview-question",
      });
    }
  }

  return sessions;
}

export const migrateInterviews: MigrationDefinition = {
  name: "interviews",

  async run(context: MigrationContext): Promise<void> {
    const project = "interview-prep-ai" as const;
    const sessions = await loadSessions(context);

    for (const sessionCandidate of sessions.values()) {
      const userSource =
        sessionCandidate.record ??
        sessionCandidate.questions[0]?.record;
      const userId = await resolveMigratedUserId({
        context,
        project,
        record: userSource,
        fallbackLegacyId: sessionCandidate.legacyId,
        recordIndex: sessionCandidate.recordIndex,
      });
      if (!userId) continue;

      const normalizedQuestions = sessionCandidate.questions
        .map((candidate) => {
          const question = asString(
            firstDefined(candidate.record, [
              "question",
              "prompt",
              "text",
              "title",
            ]),
          );

          if (question.length < 5) {
            context.addIssue({
              severity: "warning",
              code: "MIGRATION_INTERVIEW_QUESTION_SKIPPED",
              message:
                "An interview question was skipped because its text is missing or too short.",
              sourceProject: project,
              entityType: "interview-question",
              legacyId: candidate.legacyId,
              recordIndex: candidate.recordIndex,
            });
            context.increment("skipped");
            return undefined;
          }

          return {
            ...candidate,
            question,
            fingerprint: createQuestionFingerprint(question),
            category:
              asString(
                firstDefined(candidate.record, [
                  "category",
                  "topic",
                  "type",
                ]),
              ).slice(0, 120) || "General",
            difficulty: difficultyFor(candidate.record),
            source:
              asString(candidate.record.source) ===
              "ai-generated"
                ? ("ai-generated" as const)
                : ("manual" as const),
            modelAnswer: optionalString(
              firstDefined(candidate.record, [
                "modelAnswer",
                "sampleAnswer",
                "answer",
                "suggestedAnswer",
              ]),
            ),
            explanation: optionalString(
              firstDefined(candidate.record, [
                "explanation",
                "reasoning",
              ]),
            ),
            explanationKeyPoints: asStringArray(
              firstDefined(candidate.record, [
                "explanationKeyPoints",
                "keyPoints",
                "tips",
              ]),
            ).slice(0, 20),
            isPinned: asBoolean(
              firstDefined(candidate.record, [
                "isPinned",
                "pinned",
                "favorite",
              ]),
            ),
            userNotes: optionalString(
              firstDefined(candidate.record, [
                "userNotes",
                "notes",
              ]),
            ),
          };
        })
        .filter(
          (
            value,
          ): value is NonNullable<typeof value> =>
            Boolean(value),
        );

      const uniqueByFingerprint = new Map<
        string,
        (typeof normalizedQuestions)[number]
      >();
      const duplicateTargets = new Map<string, string>();

      for (const question of normalizedQuestions) {
        const existing = uniqueByFingerprint.get(
          question.fingerprint,
        );
        if (existing) {
          duplicateTargets.set(
            question.legacyId,
            existing.legacyId,
          );
          context.addIssue({
            severity: "warning",
            code: "MIGRATION_DUPLICATE_INTERVIEW_QUESTION",
            message:
              "A duplicate interview question will map to the first matching question in the session.",
            sourceProject: project,
            entityType: "interview-question",
            legacyId: question.legacyId,
          });
          context.increment("skipped");
        } else {
          uniqueByFingerprint.set(
            question.fingerprint,
            question,
          );
        }
      }

      const uniqueQuestions = [...uniqueByFingerprint.values()];
      const targetSessionId =
        (await context.resolveMapping({
          sourceProject: project,
          entityType: "interview-session",
          legacyId: sessionCandidate.legacyId,
        })) ??
        context.virtualTargetId({
          sourceProject: project,
          entityType: "interview-session",
          legacyId: sessionCandidate.legacyId,
        });

      try {
        await new InterviewSessionModel({
          _id: targetSessionId,
          userId,
          title:
            asString(
              firstDefined(sessionCandidate.record, [
                "title",
                "name",
                "sessionTitle",
              ]),
            ).slice(0, 160) || "Imported Interview Session",
          targetRole:
            asString(
              firstDefined(sessionCandidate.record, [
                "targetRole",
                "role",
                "jobRole",
              ]),
            ).slice(0, 200) || "General Interview",
          experienceLevel:
            asString(
              firstDefined(sessionCandidate.record, [
                "experienceLevel",
                "seniority",
                "level",
              ]),
            ).slice(0, 100) || "Unspecified",
          focusTopics: asStringArray(
            firstDefined(sessionCandidate.record, [
              "focusTopics",
              "topics",
              "skills",
            ]),
          ).slice(0, 50),
          skillGaps: asStringArray(
            firstDefined(sessionCandidate.record, [
              "skillGaps",
              "gaps",
              "weaknesses",
            ]),
          ).slice(0, 50),
          jobDescription: optionalString(
            firstDefined(sessionCandidate.record, [
              "jobDescription",
              "description",
            ]),
          ),
          mode: modeFor(sessionCandidate.record),
          status:
            asString(sessionCandidate.record.status) ===
            "completed"
              ? "completed"
              : asString(sessionCandidate.record.status) ===
                  "archived"
                ? "archived"
                : "active",
          questionCount: uniqueQuestions.length,
        }).validate();

        for (const question of uniqueQuestions) {
          await new InterviewQuestionModel({
            _id: context.virtualTargetId({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: question.legacyId,
            }),
            userId,
            sessionId: targetSessionId,
            source: question.source,
            category: question.category,
            difficulty: question.difficulty,
            question: question.question,
            questionFingerprint: question.fingerprint,
            modelAnswer: question.modelAnswer,
            explanation: question.explanation,
            explanationKeyPoints:
              question.explanationKeyPoints,
            isPinned: question.isPinned,
            userNotes: question.userNotes,
          }).validate();
        }

        context.increment("recordsValid");
      } catch (error) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_INTERVIEW_VALIDATION_FAILED",
          message:
            error instanceof Error ? error.message : String(error),
          sourceProject: project,
          entityType: "interview-session",
          legacyId: sessionCandidate.legacyId,
        });
        continue;
      }

      const existingSession = context.canReadTarget
        ? await InterviewSessionModel.findOne({
            _id: targetSessionId,
            userId,
          })
            .select("_id")
            .lean()
        : null;

      context.increment(
        existingSession
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
          entityType: "interview-session",
          legacyId: sessionCandidate.legacyId,
          targetModel: "InterviewSession",
          targetId: targetSessionId,
          sourceChecksum: sha256(sessionCandidate.record),
          metadata: {
            questionCount: uniqueQuestions.length,
          },
        });

        for (const question of uniqueQuestions) {
          await context.rememberMapping({
            sourceProject: project,
            entityType: "interview-question",
            legacyId: question.legacyId,
            targetModel: "InterviewQuestion",
            targetId: context.virtualTargetId({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: question.legacyId,
            }),
            sourceChecksum: sha256(question.record),
            metadata: {
              sessionLegacyId: sessionCandidate.legacyId,
            },
          });
        }

        for (const [duplicateId, originalId] of duplicateTargets) {
          await context.rememberMapping({
            sourceProject: project,
            entityType: "interview-question",
            legacyId: duplicateId,
            targetModel: "InterviewQuestion",
            targetId: context.virtualTargetId({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: originalId,
            }),
            sourceChecksum: sha256(
              normalizedQuestions.find(
                (question) =>
                  question.legacyId === duplicateId,
              )?.record ?? {},
            ),
            metadata: {
              duplicateOfLegacyId: originalId,
              sessionLegacyId: sessionCandidate.legacyId,
            },
          });
        }
        continue;
      }

      await withMongoTransaction(async (session) => {
        const existing = await InterviewSessionModel.exists({
          _id: targetSessionId,
          userId,
        }).session(session);

        if (!existing) {
          const now = new Date();
          const status =
            asString(sessionCandidate.record.status) ===
            "completed"
              ? "completed"
              : asString(sessionCandidate.record.status) ===
                  "archived"
                ? "archived"
                : "active";

          await InterviewSessionModel.collection.insertOne(
            {
              _id: targetSessionId,
              userId,
              title:
                asString(
                  firstDefined(sessionCandidate.record, [
                    "title",
                    "name",
                    "sessionTitle",
                  ]),
                ).slice(0, 160) ||
                "Imported Interview Session",
              targetRole:
                asString(
                  firstDefined(sessionCandidate.record, [
                    "targetRole",
                    "role",
                    "jobRole",
                  ]),
                ).slice(0, 200) || "General Interview",
              experienceLevel:
                asString(
                  firstDefined(sessionCandidate.record, [
                    "experienceLevel",
                    "seniority",
                    "level",
                  ]),
                ).slice(0, 100) || "Unspecified",
              focusTopics: asStringArray(
                firstDefined(sessionCandidate.record, [
                  "focusTopics",
                  "topics",
                  "skills",
                ]),
              ).slice(0, 50),
              skillGaps: asStringArray(
                firstDefined(sessionCandidate.record, [
                  "skillGaps",
                  "gaps",
                  "weaknesses",
                ]),
              ).slice(0, 50),
              jobDescription: optionalString(
                firstDefined(sessionCandidate.record, [
                  "jobDescription",
                  "description",
                ]),
              ),
              mode: modeFor(sessionCandidate.record),
              status,
              questionCount: uniqueQuestions.length,
              completedAt:
                status === "completed"
                  ? asDate(
                      firstDefined(sessionCandidate.record, [
                        "completedAt",
                        "updatedAt",
                      ]),
                    ) ?? now
                  : undefined,
              createdAt:
                asDate(sessionCandidate.record.createdAt) ?? now,
              updatedAt:
                asDate(sessionCandidate.record.updatedAt) ?? now,
            },
            { session },
          );
        }

        for (const question of uniqueQuestions) {
          const targetQuestionId =
            (await context.resolveMapping({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: question.legacyId,
            })) ??
            context.virtualTargetId({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: question.legacyId,
            });

          await InterviewQuestionModel.updateOne(
            {
              sessionId: targetSessionId,
              questionFingerprint: question.fingerprint,
            },
            {
              $setOnInsert: {
                _id: targetQuestionId,
                userId,
                sessionId: targetSessionId,
                source: question.source,
                category: question.category,
                difficulty: question.difficulty,
                question: question.question,
                questionFingerprint: question.fingerprint,
                modelAnswer: question.modelAnswer,
                explanation: question.explanation,
                explanationKeyPoints:
                  question.explanationKeyPoints,
                isPinned: question.isPinned,
                userNotes: question.userNotes,
                createdAt:
                  asDate(question.record.createdAt) ??
                  new Date(),
                updatedAt:
                  asDate(question.record.updatedAt) ??
                  new Date(),
              },
            },
            { upsert: true, session },
          );

          const storedQuestion =
            await InterviewQuestionModel.findOne({
              sessionId: targetSessionId,
              questionFingerprint: question.fingerprint,
            })
              .select("_id")
              .session(session)
              .lean();

          if (!storedQuestion) {
            throw new Error(
              "An interview question could not be resolved after upsert.",
            );
          }

          await context.rememberMapping({
            sourceProject: project,
            entityType: "interview-question",
            legacyId: question.legacyId,
            targetModel: "InterviewQuestion",
            targetId: storedQuestion._id,
            sourceChecksum: sha256(question.record),
            metadata: {
              sessionLegacyId: sessionCandidate.legacyId,
            },
            session,
          });
        }

        const storedQuestionCount =
          await InterviewQuestionModel.countDocuments({
            userId,
            sessionId: targetSessionId,
          }).session(session);

        await InterviewSessionModel.updateOne(
          {
            _id: targetSessionId,
            userId,
          },
          {
            $set: {
              questionCount: storedQuestionCount,
              updatedAt: new Date(),
            },
          },
          { session },
        );

        for (const [duplicateId, originalId] of duplicateTargets) {
          const originalTarget =
            await context.resolveMapping({
              sourceProject: project,
              entityType: "interview-question",
              legacyId: originalId,
            });
          if (!originalTarget) {
            throw new Error(
              `Duplicate question target missing for ${duplicateId}.`,
            );
          }

          const duplicateRecord = normalizedQuestions.find(
            (question) => question.legacyId === duplicateId,
          );

          await context.rememberMapping({
            sourceProject: project,
            entityType: "interview-question",
            legacyId: duplicateId,
            targetModel: "InterviewQuestion",
            targetId: originalTarget,
            sourceChecksum: sha256(
              duplicateRecord?.record ?? {},
            ),
            metadata: {
              duplicateOfLegacyId: originalId,
              sessionLegacyId: sessionCandidate.legacyId,
            },
            session,
          });
        }

        await context.rememberMapping({
          sourceProject: project,
          entityType: "interview-session",
          legacyId: sessionCandidate.legacyId,
          targetModel: "InterviewSession",
          targetId: targetSessionId,
          sourceChecksum: sha256(sessionCandidate.record),
          metadata: {
            questionCount: uniqueQuestions.length,
          },
          session,
        });
      });
    }
  },
};
