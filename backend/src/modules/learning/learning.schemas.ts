import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const documentParamsSchema = z.object({
  documentId: objectId,
});

export const conversationParamsSchema =
  documentParamsSchema.extend({
    conversationId: objectId,
  });

export const flashcardSetParamsSchema = z.object({
  setId: objectId,
});

export const quizParamsSchema = z.object({
  quizId: objectId,
});

export const quizAttemptParamsSchema = quizParamsSchema.extend({
  attemptId: objectId,
});

export const documentListQuerySchema = pageQuery.extend({
  status: z
    .enum(["uploaded", "processing", "ready", "failed", "deleting"])
    .optional(),
});

export const paginatedQuerySchema = pageQuery;

export const quizHistoryQuerySchema = pageQuery.extend({
  documentId: objectId.optional(),
});

export const assessmentListQuerySchema = pageQuery.extend({
  documentId: objectId.optional(),
});

export const uploadLearningDocumentBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
  })
  .strict();

export const createConversationBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
  })
  .strict();

export const sendChatMessageBodySchema = z
  .object({
    requestId: z.string().uuid(),
    content: z.string().trim().min(1).max(50_000),
  })
  .strict();

export const generateFlashcardsBodySchema = z
  .object({
    requestId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    count: z.coerce.number().int().min(1).max(100),
    focus: z.string().trim().max(500).optional(),
  })
  .strict();

export const generateQuizBodySchema = z
  .object({
    requestId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    questionCount: z.coerce.number().int().min(1).max(100),
    focus: z.string().trim().max(500).optional(),
  })
  .strict();

export const submitQuizBodySchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionIndex: z.number().int().min(0),
            selectedChoiceIndex: z.number().int().min(0).max(7),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict()
  .superRefine((value, context) => {
    const indexes = value.answers.map(
      (answer) => answer.questionIndex,
    );

    if (new Set(indexes).size !== indexes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers"],
        message:
          "Exactly one answer is permitted for each question index.",
      });
    }
  });

export const documentSummaryResultSchema = z
  .object({
    summary: z.string().trim().min(1).max(20_000),
    keyPoints: z
      .array(z.string().trim().min(1).max(2_000))
      .min(1)
      .max(30),
  })
  .strict();

export const documentChatResultSchema = z
  .object({
    answer: z.string().trim().min(1).max(20_000),
    citedChunkIndexes: z
      .array(z.number().int().min(0))
      .max(20)
      .default([]),
  })
  .strict();

export const flashcardGenerationResultSchema = z
  .object({
    cards: z
      .array(
        z
          .object({
            cardIndex: z.number().int().min(0),
            front: z.string().trim().min(1).max(3_000),
            back: z.string().trim().min(1).max(8_000),
            sourceChunkIndexes: z
              .array(z.number().int().min(0))
              .max(20)
              .default([]),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const indexes = value.cards.map((card) => card.cardIndex);
    if (new Set(indexes).size !== indexes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cards"],
        message: "Flashcard indexes must be unique.",
      });
    }
  });

export const quizGenerationResultSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            questionIndex: z.number().int().min(0),
            prompt: z.string().trim().min(1).max(4_000),
            choices: z
              .array(z.string().trim().min(1).max(2_000))
              .min(2)
              .max(8),
            correctChoiceIndex: z.number().int().min(0).max(7),
            explanation: z
              .string()
              .trim()
              .min(1)
              .max(8_000),
            sourceChunkIndexes: z
              .array(z.number().int().min(0))
              .max(20)
              .default([]),
          })
          .strict()
          .superRefine((question, context) => {
            if (
              question.correctChoiceIndex >=
              question.choices.length
            ) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["correctChoiceIndex"],
                message:
                  "The correct choice index must reference an existing choice.",
              });
            }

            const normalized = question.choices.map((choice) =>
              choice.toLocaleLowerCase(),
            );
            if (new Set(normalized).size !== normalized.length) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["choices"],
                message: "Answer choices must be unique.",
              });
            }
          }),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const indexes = value.questions.map(
      (question) => question.questionIndex,
    );
    if (new Set(indexes).size !== indexes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions"],
        message: "Quiz question indexes must be unique.",
      });
    }
  });
