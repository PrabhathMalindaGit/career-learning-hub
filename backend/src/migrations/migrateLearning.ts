import { Types } from "mongoose";
import { AssetModel } from "../modules/assets/asset.model.js";
import { FlashcardModel } from "../modules/learning/flashcard.model.js";
import { FlashcardSetModel } from "../modules/learning/flashcardSet.model.js";
import { LearningDocumentModel } from "../modules/learning/learningDocument.model.js";
import { QuizModel } from "../modules/learning/quiz.model.js";
import { QuizQuestionModel } from "../modules/learning/quizQuestion.model.js";
import { withMongoTransaction } from "../shared/mongoTransaction.js";
import { resolveMigratedUserId } from "./migration.lookup.js";
import type {
  MigrationContext,
  MigrationDefinition,
} from "./migration.types.js";
import {
  asDate,
  asNumber,
  asString,
  asStringArray,
  firstDefined,
  legacyIdOf,
  optionalString,
  readImportRecords,
  sha256,
  stableUuid,
  type UnknownRecord,
} from "./migration.utils.js";

interface LegacyDocument {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
}

interface LegacyFlashcard {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
}

interface LegacyFlashcardSet {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
  cards: LegacyFlashcard[];
}

interface LegacyQuizQuestion {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
}

interface LegacyQuiz {
  legacyId: string;
  record: UnknownRecord;
  recordIndex: number;
  questions: LegacyQuizQuestion[];
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

function referencedDocumentId(
  record: UnknownRecord,
  fallback: string,
): string {
  return (
    asString(
      firstDefined(record, [
        "documentId",
        "learningDocumentId",
        "sourceDocumentId",
        "document._id",
        "document.id",
      ]),
    ) || fallback
  );
}

function flashcardSetId(
  record: UnknownRecord,
  index: number,
): string {
  return (
    asString(
      firstDefined(record, [
        "setId",
        "flashcardSetId",
        "collectionId",
      ]),
    ) || `standalone-flashcard-set-${index}`
  );
}

function quizIdForQuestion(
  record: UnknownRecord,
  index: number,
): string {
  return (
    asString(
      firstDefined(record, [
        "quizId",
        "assessmentId",
        "setId",
      ]),
    ) || `standalone-quiz-${index}`
  );
}

async function loadLearningInput(
  context: MigrationContext,
): Promise<{
  documents: Map<string, LegacyDocument>;
  flashcardSets: Map<string, LegacyFlashcardSet>;
  quizzes: Map<string, LegacyQuiz>;
}> {
  const project = "ai-learning-assistant" as const;
  const documents = new Map<string, LegacyDocument>();
  const flashcardSets = new Map<string, LegacyFlashcardSet>();
  const quizzes = new Map<string, LegacyQuiz>();

  const load = async (
    key:
      | "learningDocuments"
      | "flashcardSets"
      | "flashcards"
      | "quizzes",
  ): Promise<UnknownRecord[]> => {
    const filePath = context.sourcePath(project, key);
    if (!filePath) return [];

    try {
      const records = await readImportRecords(filePath);
      context.increment("filesRead");
      context.increment("recordsRead", records.length);
      return records;
    } catch (error) {
      context.addIssue({
        severity: "error",
        code: "MIGRATION_LEARNING_FILE_INVALID",
        message: `${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        sourceProject: project,
        entityType:
          key === "learningDocuments"
            ? "learning-document"
            : key.startsWith("flashcard")
              ? "flashcard-set"
              : "quiz",
      });
      return [];
    }
  };

  const documentRecords = await load("learningDocuments");
  documentRecords.forEach((record, recordIndex) => {
    const legacyId = legacyIdOf(
      record,
      `learning-document-${recordIndex}`,
    );
    documents.set(legacyId, { legacyId, record, recordIndex });
  });

  const setRecords = await load("flashcardSets");
  setRecords.forEach((record, recordIndex) => {
    const legacyId = legacyIdOf(
      record,
      `flashcard-set-${recordIndex}`,
    );
    const embeddedCards = objectRecords(
      firstDefined(record, [
        "cards",
        "flashcards",
        "items",
      ]),
    ).map((card, cardIndex) => ({
      legacyId: legacyIdOf(
        card,
        `${legacyId}:card:${cardIndex}`,
      ),
      record: {
        ...card,
        userId: card.userId ?? record.userId,
        documentId:
          card.documentId ??
          firstDefined(record, [
            "documentId",
            "learningDocumentId",
          ]),
      },
      recordIndex: cardIndex,
    }));

    flashcardSets.set(legacyId, {
      legacyId,
      record,
      recordIndex,
      cards: embeddedCards,
    });
  });

  const cardRecords = await load("flashcards");
  cardRecords.forEach((record, recordIndex) => {
    const setId = flashcardSetId(record, recordIndex);
    const set =
      flashcardSets.get(setId) ??
      {
        legacyId: setId,
        record: {
          _id: setId,
          userId: firstDefined(record, [
            "userId",
            "ownerId",
          ]),
          documentId: referencedDocumentId(
            record,
            `legacy-document:${setId}`,
          ),
          title: "Imported Flashcards",
        },
        recordIndex,
        cards: [],
      };

    set.cards.push({
      legacyId: legacyIdOf(
        record,
        `${setId}:card:${recordIndex}`,
      ),
      record,
      recordIndex,
    });
    flashcardSets.set(setId, set);
  });

  const quizRecords = await load("quizzes");
  quizRecords.forEach((record, recordIndex) => {
    const legacyId = legacyIdOf(
      record,
      `quiz-${recordIndex}`,
    );
    const embeddedQuestions = objectRecords(
      firstDefined(record, [
        "questions",
        "items",
        "quizQuestions",
      ]),
    ).map((question, questionIndex) => ({
      legacyId: legacyIdOf(
        question,
        `${legacyId}:question:${questionIndex}`,
      ),
      record: {
        ...question,
        userId: question.userId ?? record.userId,
        documentId:
          question.documentId ??
          firstDefined(record, [
            "documentId",
            "learningDocumentId",
          ]),
      },
      recordIndex: questionIndex,
    }));

    quizzes.set(legacyId, {
      legacyId,
      record,
      recordIndex,
      questions: embeddedQuestions,
    });
  });

  for (const set of flashcardSets.values()) {
    const documentId = referencedDocumentId(
      set.record,
      `legacy-document:${set.legacyId}`,
    );
    const ownership = firstDefined(set.record, [
      "userId",
      "ownerId",
      "createdBy",
      "user",
      "user._id",
    ]);
    const existingDocument = documents.get(documentId);

    if (!existingDocument) {
      documents.set(documentId, {
        legacyId: documentId,
        record: {
          _id: documentId,
          userId: ownership,
          title:
            asString(set.record.documentTitle) ||
            "Imported Learning Material",
          originalFilename: "legacy-source-unavailable.pdf",
        },
        recordIndex: set.recordIndex,
      });
    } else if (
      !firstDefined(existingDocument.record, [
        "userId",
        "ownerId",
        "createdBy",
        "user",
        "user._id",
      ]) &&
      ownership
    ) {
      existingDocument.record.userId = ownership;
    }
  }

  for (const quiz of quizzes.values()) {
    const documentId = referencedDocumentId(
      quiz.record,
      `legacy-document:${quiz.legacyId}`,
    );
    const ownership = firstDefined(quiz.record, [
      "userId",
      "ownerId",
      "createdBy",
      "user",
      "user._id",
    ]);
    const existingDocument = documents.get(documentId);

    if (!existingDocument) {
      documents.set(documentId, {
        legacyId: documentId,
        record: {
          _id: documentId,
          userId: ownership,
          title:
            asString(quiz.record.documentTitle) ||
            "Imported Learning Material",
          originalFilename: "legacy-source-unavailable.pdf",
        },
        recordIndex: quiz.recordIndex,
      });
    } else if (
      !firstDefined(existingDocument.record, [
        "userId",
        "ownerId",
        "createdBy",
        "user",
        "user._id",
      ]) &&
      ownership
    ) {
      existingDocument.record.userId = ownership;
    }
  }

  return { documents, flashcardSets, quizzes };
}

async function ensureLearningDocument(input: {
  context: MigrationContext;
  document: LegacyDocument;
}): Promise<{
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
} | undefined> {
  const project = "ai-learning-assistant" as const;
  const userId = await resolveMigratedUserId({
    context: input.context,
    project,
    record: input.document.record,
    fallbackLegacyId: input.document.legacyId,
    recordIndex: input.document.recordIndex,
  });
  if (!userId) return undefined;

  const mappedDocumentId = await input.context.resolveMapping({
    sourceProject: project,
    entityType: "learning-document",
    legacyId: input.document.legacyId,
  });
  const documentId =
    mappedDocumentId ??
    input.context.virtualTargetId({
      sourceProject: project,
      entityType: "learning-document",
      legacyId: input.document.legacyId,
    });
  const assetLegacyId = `${input.document.legacyId}:asset`;
  const mappedAssetId = await input.context.resolveMapping({
    sourceProject: project,
    entityType: "asset",
    legacyId: assetLegacyId,
  });
  const assetId =
    mappedAssetId ??
    input.context.virtualTargetId({
      sourceProject: project,
      entityType: "asset",
      legacyId: assetLegacyId,
    });

  const existing = input.context.canReadTarget
    ? await LearningDocumentModel.findOne({
        _id: documentId,
        userId,
      })
        .select("_id")
        .lean()
    : null;

  input.context.increment(
    existing
      ? input.context.isExecute
        ? "reused"
        : "plannedReuses"
      : input.context.isExecute
        ? "created"
        : "plannedCreates",
  );

  if (!input.context.isExecute) {
    await input.context.rememberMapping({
      sourceProject: project,
      entityType: "asset",
      legacyId: assetLegacyId,
      targetModel: "Asset",
      targetId: assetId,
      sourceChecksum: sha256(input.document.record),
      metadata: {
        placeholder: true,
        sourceFileAvailable: false,
      },
    });
    await input.context.rememberMapping({
      sourceProject: project,
      entityType: "learning-document",
      legacyId: input.document.legacyId,
      targetModel: "LearningDocument",
      targetId: documentId,
      sourceChecksum: sha256(input.document.record),
      metadata: {
        placeholderAssetId: assetId.toString(),
      },
    });
    return { userId, documentId };
  }

  await withMongoTransaction(async (session) => {
    const assetExists = await AssetModel.exists({
      _id: assetId,
      userId,
    }).session(session);

    if (!assetExists) {
      const now = new Date();
      await AssetModel.collection.insertOne(
        {
          _id: assetId,
          userId,
          purpose: "learning-document",
          storageProvider: "local",
          storageKey: `migration/${project}/${assetId.toString()}/source-unavailable.pdf`,
          originalFilename:
            asString(
              firstDefined(input.document.record, [
                "originalFilename",
                "filename",
                "fileName",
                "title",
              ]),
            ).slice(0, 255) ||
            "legacy-source-unavailable.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1,
          checksumSha256: sha256(input.document.record),
          status: "deleted",
          metadata: {
            migrationPlaceholder: true,
            sourceFileAvailable: false,
            legacyDocumentId: input.document.legacyId,
          },
          deletedAt: now,
          createdAt:
            asDate(input.document.record.createdAt) ?? now,
          updatedAt:
            asDate(input.document.record.updatedAt) ?? now,
        },
        { session },
      );
    }

    const documentExists =
      await LearningDocumentModel.exists({
        _id: documentId,
        userId,
      }).session(session);

    if (!documentExists) {
      const now = new Date();
      await LearningDocumentModel.collection.insertOne(
        {
          _id: documentId,
          userId,
          assetId,
          title:
            asString(
              firstDefined(input.document.record, [
                "title",
                "name",
                "documentName",
              ]),
            ).slice(0, 200) ||
            "Imported Learning Material",
          originalFilename:
            asString(
              firstDefined(input.document.record, [
                "originalFilename",
                "filename",
                "fileName",
              ]),
            ).slice(0, 255) ||
            "legacy-source-unavailable.pdf",
          mimeType: "application/pdf",
          status: "ready",
          pageCount: Math.max(
            0,
            asNumber(
              firstDefined(input.document.record, [
                "pageCount",
                "pages",
              ]),
            ),
          ),
          chunkCount: 0,
          summary: optionalString(
            firstDefined(input.document.record, [
              "summary",
              "generatedSummary",
            ]),
          ),
          summaryKeyPoints: asStringArray(
            firstDefined(input.document.record, [
              "summaryKeyPoints",
              "keyPoints",
            ]),
          ).slice(0, 30),
          processedAt:
            asDate(
              firstDefined(input.document.record, [
                "processedAt",
                "updatedAt",
              ]),
            ) ?? now,
          createdAt:
            asDate(input.document.record.createdAt) ?? now,
          updatedAt:
            asDate(input.document.record.updatedAt) ?? now,
        },
        { session },
      );
    }

    await input.context.rememberMapping({
      sourceProject: project,
      entityType: "asset",
      legacyId: assetLegacyId,
      targetModel: "Asset",
      targetId: assetId,
      sourceChecksum: sha256(input.document.record),
      metadata: {
        placeholder: true,
        sourceFileAvailable: false,
      },
      session,
    });
    await input.context.rememberMapping({
      sourceProject: project,
      entityType: "learning-document",
      legacyId: input.document.legacyId,
      targetModel: "LearningDocument",
      targetId: documentId,
      sourceChecksum: sha256(input.document.record),
      metadata: {
        placeholderAssetId: assetId.toString(),
      },
      session,
    });
  });

  return { userId, documentId };
}

function normalizeQuizQuestion(input: {
  record: UnknownRecord;
  legacyId: string;
  index: number;
}) {
  const prompt = asString(
    firstDefined(input.record, [
      "prompt",
      "question",
      "text",
      "title",
    ]),
  );
  const choices = asStringArray(
    firstDefined(input.record, [
      "choices",
      "options",
      "answers",
    ]),
  ).slice(0, 8);

  let correctChoiceIndex = asNumber(
    firstDefined(input.record, [
      "correctChoiceIndex",
      "correctAnswerIndex",
      "answerIndex",
    ]),
    -1,
  );

  if (correctChoiceIndex < 0) {
    const answerText = asString(
      firstDefined(input.record, [
        "correctAnswer",
        "answer",
      ]),
    );
    correctChoiceIndex = choices.findIndex(
      (choice) =>
        choice.trim().toLocaleLowerCase() ===
        answerText.trim().toLocaleLowerCase(),
    );
  }

  if (
    prompt.length < 1 ||
    choices.length < 2 ||
    new Set(
      choices.map((choice) => choice.toLocaleLowerCase()),
    ).size !== choices.length ||
    correctChoiceIndex < 0 ||
    correctChoiceIndex >= choices.length
  ) {
    return undefined;
  }

  return {
    legacyId: input.legacyId,
    record: input.record,
    questionIndex: input.index,
    prompt,
    choices,
    correctChoiceIndex,
    explanation:
      asString(
        firstDefined(input.record, [
          "explanation",
          "reason",
          "feedback",
        ]),
      ) || "Imported legacy answer key.",
    sourcePages: asStringArray(
      firstDefined(input.record, [
        "sourcePages",
        "pages",
      ]),
    )
      .map(Number)
      .filter(
        (page) => Number.isInteger(page) && page >= 1,
      )
      .slice(0, 50),
  };
}

export const migrateLearning: MigrationDefinition = {
  name: "learning",

  async run(context: MigrationContext): Promise<void> {
    const project = "ai-learning-assistant" as const;
    const input = await loadLearningInput(context);
    const documentTargets = new Map<
      string,
      { userId: Types.ObjectId; documentId: Types.ObjectId }
    >();

    for (const document of input.documents.values()) {
      const target = await ensureLearningDocument({
        context,
        document,
      });
      if (target) {
        documentTargets.set(document.legacyId, target);
        context.increment("recordsValid");
      }
    }

    for (const set of input.flashcardSets.values()) {
      const documentLegacyId = referencedDocumentId(
        set.record,
        `legacy-document:${set.legacyId}`,
      );
      const target = documentTargets.get(documentLegacyId);
      if (!target) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_FLASHCARD_DOCUMENT_MAPPING_MISSING",
          message:
            "A flashcard set does not resolve to a migrated learning document.",
          sourceProject: project,
          entityType: "flashcard-set",
          legacyId: set.legacyId,
        });
        continue;
      }

      const validCards = set.cards
        .map((card, index) => {
          const front = asString(
            firstDefined(card.record, [
              "front",
              "question",
              "term",
              "prompt",
            ]),
          );
          const back = asString(
            firstDefined(card.record, [
              "back",
              "answer",
              "definition",
              "response",
            ]),
          );

          if (!front || !back) {
            context.addIssue({
              severity: "warning",
              code: "MIGRATION_FLASHCARD_SKIPPED",
              message:
                "A flashcard was skipped because its front or back is missing.",
              sourceProject: project,
              entityType: "flashcard",
              legacyId: card.legacyId,
            });
            context.increment("skipped");
            return undefined;
          }

          return {
            ...card,
            cardIndex: index,
            front,
            back,
            sourcePages: asStringArray(
              firstDefined(card.record, [
                "sourcePages",
                "pages",
              ]),
            )
              .map(Number)
              .filter(
                (page) =>
                  Number.isInteger(page) && page >= 1,
              )
              .slice(0, 50),
          };
        })
        .filter(
          (
            value,
          ): value is NonNullable<typeof value> =>
            Boolean(value),
        );

      const setId =
        (await context.resolveMapping({
          sourceProject: project,
          entityType: "flashcard-set",
          legacyId: set.legacyId,
        })) ??
        context.virtualTargetId({
          sourceProject: project,
          entityType: "flashcard-set",
          legacyId: set.legacyId,
        });

      try {
        await new FlashcardSetModel({
          _id: setId,
          userId: target.userId,
          documentId: target.documentId,
          requestId: stableUuid(
            project,
            "flashcard-set",
            set.legacyId,
          ),
          title:
            asString(
              firstDefined(set.record, [
                "title",
                "name",
              ]),
            ).slice(0, 200) || "Imported Flashcards",
          status: "ready",
          cardCount: validCards.length,
        }).validate();

        for (const card of validCards) {
          await new FlashcardModel({
            _id: context.virtualTargetId({
              sourceProject: project,
              entityType: "flashcard",
              legacyId: card.legacyId,
            }),
            userId: target.userId,
            documentId: target.documentId,
            setId,
            cardIndex: card.cardIndex,
            front: card.front,
            back: card.back,
            sourceChunkIds: [],
            sourcePages: card.sourcePages,
          }).validate();
        }
        context.increment("recordsValid");
      } catch (error) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_FLASHCARD_VALIDATION_FAILED",
          message:
            error instanceof Error ? error.message : String(error),
          sourceProject: project,
          entityType: "flashcard-set",
          legacyId: set.legacyId,
        });
        continue;
      }

      const setExists = context.canReadTarget
        ? await FlashcardSetModel.exists({
            _id: setId,
            userId: target.userId,
          })
        : null;
      context.increment(
        setExists
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
          entityType: "flashcard-set",
          legacyId: set.legacyId,
          targetModel: "FlashcardSet",
          targetId: setId,
          sourceChecksum: sha256(set.record),
          metadata: { cardCount: validCards.length },
        });

        for (const card of validCards) {
          await context.rememberMapping({
            sourceProject: project,
            entityType: "flashcard",
            legacyId: card.legacyId,
            targetModel: "Flashcard",
            targetId: context.virtualTargetId({
              sourceProject: project,
              entityType: "flashcard",
              legacyId: card.legacyId,
            }),
            sourceChecksum: sha256(card.record),
            metadata: {
              setLegacyId: set.legacyId,
              cardIndex: card.cardIndex,
            },
          });
        }
        continue;
      }

      await withMongoTransaction(async (session) => {
        await FlashcardSetModel.updateOne(
          { _id: setId, userId: target.userId },
          {
            $setOnInsert: {
              _id: setId,
              userId: target.userId,
              documentId: target.documentId,
              requestId: stableUuid(
                project,
                "flashcard-set",
                set.legacyId,
              ),
              title:
                asString(
                  firstDefined(set.record, [
                    "title",
                    "name",
                  ]),
                ).slice(0, 200) ||
                "Imported Flashcards",
              status: "ready",
              cardCount: validCards.length,
              createdAt:
                asDate(set.record.createdAt) ?? new Date(),
              updatedAt:
                asDate(set.record.updatedAt) ?? new Date(),
            },
          },
          { upsert: true, session },
        );

        for (const card of validCards) {
          const cardId =
            (await context.resolveMapping({
              sourceProject: project,
              entityType: "flashcard",
              legacyId: card.legacyId,
            })) ??
            context.virtualTargetId({
              sourceProject: project,
              entityType: "flashcard",
              legacyId: card.legacyId,
            });

          await FlashcardModel.updateOne(
            {
              setId,
              cardIndex: card.cardIndex,
            },
            {
              $setOnInsert: {
                _id: cardId,
                userId: target.userId,
                documentId: target.documentId,
                setId,
                cardIndex: card.cardIndex,
                front: card.front,
                back: card.back,
                sourceChunkIds: [],
                sourcePages: card.sourcePages,
                createdAt:
                  asDate(card.record.createdAt) ??
                  new Date(),
                updatedAt:
                  asDate(card.record.updatedAt) ??
                  new Date(),
              },
            },
            { upsert: true, session },
          );

          const stored = await FlashcardModel.findOne({
            setId,
            cardIndex: card.cardIndex,
          })
            .select("_id")
            .session(session)
            .lean();

          if (!stored) {
            throw new Error(
              "A migrated flashcard could not be resolved.",
            );
          }

          await context.rememberMapping({
            sourceProject: project,
            entityType: "flashcard",
            legacyId: card.legacyId,
            targetModel: "Flashcard",
            targetId: stored._id,
            sourceChecksum: sha256(card.record),
            metadata: {
              setLegacyId: set.legacyId,
              cardIndex: card.cardIndex,
            },
            session,
          });
        }

        await context.rememberMapping({
          sourceProject: project,
          entityType: "flashcard-set",
          legacyId: set.legacyId,
          targetModel: "FlashcardSet",
          targetId: setId,
          sourceChecksum: sha256(set.record),
          metadata: { cardCount: validCards.length },
          session,
        });
      });
    }

    for (const quiz of input.quizzes.values()) {
      const documentLegacyId = referencedDocumentId(
        quiz.record,
        `legacy-document:${quiz.legacyId}`,
      );
      const target = documentTargets.get(documentLegacyId);
      if (!target) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_QUIZ_DOCUMENT_MAPPING_MISSING",
          message:
            "A quiz does not resolve to a migrated learning document.",
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        });
        continue;
      }

      const questions = quiz.questions
        .map((question, index) =>
          normalizeQuizQuestion({
            record: question.record,
            legacyId: question.legacyId,
            index,
          }),
        )
        .filter(
          (
            question,
          ): question is NonNullable<typeof question> =>
            Boolean(question),
        );

      if (questions.length !== quiz.questions.length) {
        context.addIssue({
          severity: "warning",
          code: "MIGRATION_INVALID_QUIZ_QUESTIONS_SKIPPED",
          message:
            "One or more legacy quiz questions were skipped because choices or answer keys were invalid.",
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        });
        context.increment(
          "skipped",
          quiz.questions.length - questions.length,
        );
      }

      if (questions.length === 0) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_QUIZ_HAS_NO_VALID_QUESTIONS",
          message:
            "A legacy quiz contains no valid migratable questions.",
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        });
        continue;
      }

      const quizId =
        (await context.resolveMapping({
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        })) ??
        context.virtualTargetId({
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        });

      try {
        await new QuizModel({
          _id: quizId,
          userId: target.userId,
          documentId: target.documentId,
          requestId: stableUuid(
            project,
            "quiz",
            quiz.legacyId,
          ),
          title:
            asString(
              firstDefined(quiz.record, ["title", "name"]),
            ).slice(0, 200) || "Imported Quiz",
          status: "ready",
          questionCount: questions.length,
        }).validate();

        for (const question of questions) {
          await new QuizQuestionModel({
            _id: context.virtualTargetId({
              sourceProject: project,
              entityType: "quiz-question",
              legacyId: question.legacyId,
            }),
            userId: target.userId,
            documentId: target.documentId,
            quizId,
            questionIndex: question.questionIndex,
            prompt: question.prompt,
            choices: question.choices,
            correctChoiceIndex:
              question.correctChoiceIndex,
            explanation: question.explanation,
            sourceChunkIds: [],
            sourcePages: question.sourcePages,
          }).validate();
        }
        context.increment("recordsValid");
      } catch (error) {
        context.addIssue({
          severity: "error",
          code: "MIGRATION_QUIZ_VALIDATION_FAILED",
          message:
            error instanceof Error ? error.message : String(error),
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
        });
        continue;
      }

      const quizExists = context.canReadTarget
        ? await QuizModel.exists({
            _id: quizId,
            userId: target.userId,
          })
        : null;
      context.increment(
        quizExists
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
          entityType: "quiz",
          legacyId: quiz.legacyId,
          targetModel: "Quiz",
          targetId: quizId,
          sourceChecksum: sha256(quiz.record),
          metadata: { questionCount: questions.length },
        });

        for (const question of questions) {
          await context.rememberMapping({
            sourceProject: project,
            entityType: "quiz-question",
            legacyId: question.legacyId,
            targetModel: "QuizQuestion",
            targetId: context.virtualTargetId({
              sourceProject: project,
              entityType: "quiz-question",
              legacyId: question.legacyId,
            }),
            sourceChecksum: sha256(question.record),
            metadata: {
              quizLegacyId: quiz.legacyId,
              questionIndex: question.questionIndex,
            },
          });
        }
        continue;
      }

      await withMongoTransaction(async (session) => {
        await QuizModel.updateOne(
          { _id: quizId, userId: target.userId },
          {
            $setOnInsert: {
              _id: quizId,
              userId: target.userId,
              documentId: target.documentId,
              requestId: stableUuid(
                project,
                "quiz",
                quiz.legacyId,
              ),
              title:
                asString(
                  firstDefined(quiz.record, [
                    "title",
                    "name",
                  ]),
                ).slice(0, 200) || "Imported Quiz",
              status: "ready",
              questionCount: questions.length,
              createdAt:
                asDate(quiz.record.createdAt) ?? new Date(),
              updatedAt:
                asDate(quiz.record.updatedAt) ?? new Date(),
            },
          },
          { upsert: true, session },
        );

        for (const question of questions) {
          const questionId =
            (await context.resolveMapping({
              sourceProject: project,
              entityType: "quiz-question",
              legacyId: question.legacyId,
            })) ??
            context.virtualTargetId({
              sourceProject: project,
              entityType: "quiz-question",
              legacyId: question.legacyId,
            });

          await QuizQuestionModel.updateOne(
            {
              quizId,
              questionIndex: question.questionIndex,
            },
            {
              $setOnInsert: {
                _id: questionId,
                userId: target.userId,
                documentId: target.documentId,
                quizId,
                questionIndex: question.questionIndex,
                prompt: question.prompt,
                choices: question.choices,
                correctChoiceIndex:
                  question.correctChoiceIndex,
                explanation: question.explanation,
                sourceChunkIds: [],
                sourcePages: question.sourcePages,
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

          const stored = await QuizQuestionModel.findOne({
            quizId,
            questionIndex: question.questionIndex,
          })
            .select("_id")
            .session(session)
            .lean();

          if (!stored) {
            throw new Error(
              "A migrated quiz question could not be resolved.",
            );
          }

          await context.rememberMapping({
            sourceProject: project,
            entityType: "quiz-question",
            legacyId: question.legacyId,
            targetModel: "QuizQuestion",
            targetId: stored._id,
            sourceChecksum: sha256(question.record),
            metadata: {
              quizLegacyId: quiz.legacyId,
              questionIndex: question.questionIndex,
            },
            session,
          });
        }

        await context.rememberMapping({
          sourceProject: project,
          entityType: "quiz",
          legacyId: quiz.legacyId,
          targetModel: "Quiz",
          targetId: quizId,
          sourceChecksum: sha256(quiz.record),
          metadata: { questionCount: questions.length },
          session,
        });
      });
    }
  },
};
