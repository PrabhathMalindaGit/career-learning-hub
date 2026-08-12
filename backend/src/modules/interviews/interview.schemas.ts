import { z } from "zod";
import {
  interviewDifficulties,
} from "./interviewQuestion.model.js";
import {
  interviewQuestionTypes,
} from "./interviewQuestion.types.js";
import {
  interviewModes,
  interviewSessionStatuses,
} from "./interviewSession.model.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

const conciseList = z
  .array(z.string().trim().min(1).max(120))
  .max(50)
  .default([]);

export const interviewQuestionTypeSchema = z.enum(
  interviewQuestionTypes,
);

export const interviewQuestionTypeCountsSchema = z
  .object({
    "multiple-choice": z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
    "short-answer": z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
    coding: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
    behavioral: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
    "scenario-based": z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
    "technical-explanation": z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional(),
  })
  .strict();

export const typedInterviewAnswerSchema =
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("multiple-choice"),
        selectedOptionId: z
          .string()
          .trim()
          .min(1)
          .max(64),
      })
      .strict(),
    z
      .object({
        type: z.literal("short-answer"),
        text: z
          .string()
          .trim()
          .min(1)
          .max(50_000),
      })
      .strict(),
    z
      .object({
        type: z.literal("coding"),
        text: z
          .string()
          .trim()
          .min(1)
          .max(50_000),
      })
      .strict(),
    z
      .object({
        type: z.literal("behavioral"),
        text: z
          .string()
          .trim()
          .min(1)
          .max(50_000),
      })
      .strict(),
    z
      .object({
        type: z.literal("scenario-based"),
        text: z
          .string()
          .trim()
          .min(1)
          .max(50_000),
      })
      .strict(),
    z
      .object({
        type: z.literal(
          "technical-explanation",
        ),
        text: z
          .string()
          .trim()
          .min(1)
          .max(50_000),
      })
      .strict(),
  ]);

export const sessionIdParamsSchema = z.object({
  sessionId: objectId,
});

export const questionParamsSchema =
  sessionIdParamsSchema.extend({
    questionId: objectId,
  });

export const attemptParamsSchema =
  sessionIdParamsSchema.extend({
    attemptId: objectId,
  });

const manualQuestionCommonShape = {
  category: z.string().trim().min(1).max(120),
  difficulty: z.enum(interviewDifficulties),
  question: z.string().trim().min(5).max(2_000),
};

const manualMultipleChoiceSchema = z
  .object({
    options: z
      .array(
        z.string().trim().min(1).max(500),
      )
      .min(2)
      .max(8),
    correctOptionIndex: z.number().int().min(0),
  })
  .strict();

const manualQuestionBaseSchema =
  z.discriminatedUnion("questionType", [
    z
      .object({
        questionType: z.literal(
          "multiple-choice",
        ),
        ...manualQuestionCommonShape,
        multipleChoice:
          manualMultipleChoiceSchema,
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "short-answer",
        ),
        ...manualQuestionCommonShape,
        modelAnswer: z
          .string()
          .trim()
          .max(12_000)
          .optional(),
      })
      .strict(),
    z
      .object({
        questionType: z.literal("coding"),
        ...manualQuestionCommonShape,
        modelAnswer: z
          .string()
          .trim()
          .max(12_000)
          .optional(),
      })
      .strict(),
    z
      .object({
        questionType: z.literal("behavioral"),
        ...manualQuestionCommonShape,
        modelAnswer: z
          .string()
          .trim()
          .max(12_000)
          .optional(),
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "scenario-based",
        ),
        ...manualQuestionCommonShape,
        modelAnswer: z
          .string()
          .trim()
          .max(12_000)
          .optional(),
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "technical-explanation",
        ),
        ...manualQuestionCommonShape,
        modelAnswer: z
          .string()
          .trim()
          .max(12_000)
          .optional(),
      })
      .strict(),
  ]);

export const manualQuestionInputSchema =
  manualQuestionBaseSchema.superRefine(
    (value, context) => {
      if (
        value.questionType !==
        "multiple-choice"
      ) {
        return;
      }

      const unique = new Set(
        value.multipleChoice.options,
      );

      if (
        unique.size !==
        value.multipleChoice.options.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "multipleChoice",
            "options",
          ],
          message:
            "Multiple Choice options must be distinct.",
        });
      }

      if (
        value.multipleChoice.correctOptionIndex >=
        value.multipleChoice.options.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "multipleChoice",
            "correctOptionIndex",
          ],
          message:
            "The correct option index must reference an existing option.",
        });
      }
    },
  );

export const createSessionBodySchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    sourceResumeId: objectId.optional(),
    sourceResumeVersionId: objectId.optional(),
    targetRole: z
      .string()
      .trim()
      .min(2)
      .max(200),
    experienceLevel: z
      .string()
      .trim()
      .min(1)
      .max(100),
    focusTopics: conciseList,
    skillGaps: conciseList,
    jobDescription: z
      .string()
      .trim()
      .max(30_000)
      .optional(),
    mode: z
      .enum(interviewModes)
      .default("study"),
    manualQuestions: z
      .array(manualQuestionInputSchema)
      .max(100)
      .default([]),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.sourceResumeVersionId &&
      !value.sourceResumeId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceResumeId"],
        message:
          "sourceResumeId is required when sourceResumeVersionId is provided.",
      });
    }
  });

export const updateSessionStatusBodySchema = z
  .object({
    status: z.enum(
      interviewSessionStatuses,
    ),
  })
  .strict();

export const addManualQuestionBodySchema =
  manualQuestionInputSchema;

export const questionListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  pinned: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined
        ? undefined
        : value === "true",
    ),
  difficulty: z
    .enum(interviewDifficulties)
    .optional(),
  category: z
    .string()
    .trim()
    .max(120)
    .optional(),
});

export const sessionListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  status: z
    .enum(interviewSessionStatuses)
    .optional(),
});

export const pinQuestionBodySchema = z
  .object({
    isPinned: z.boolean(),
  })
  .strict();

export const questionNotesBodySchema = z
  .object({
    notes: z.string().trim().max(8_000),
  })
  .strict();

export const generateQuestionsBodySchema = z
  .object({
    requestId: z.string().uuid(),
    resumeVersionId: objectId.optional(),
    count: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10),
    categories: conciseList,
    difficultyMix: z
      .object({
        easy: z
          .number()
          .int()
          .min(0)
          .max(20),
        medium: z
          .number()
          .int()
          .min(0)
          .max(20),
        hard: z
          .number()
          .int()
          .min(0)
          .max(20),
      })
      .strict()
      .optional(),
    questionTypes: z
      .array(interviewQuestionTypeSchema)
      .min(1)
      .max(6),
    typeCounts:
      interviewQuestionTypeCountsSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.difficultyMix &&
      value.difficultyMix.easy +
        value.difficultyMix.medium +
        value.difficultyMix.hard !==
        value.count
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["difficultyMix"],
        message:
          "Difficulty counts must add up to count.",
      });
    }

    if (
      new Set(value.questionTypes).size !==
      value.questionTypes.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionTypes"],
        message:
          "Question types must be unique.",
      });
    }

    if (value.typeCounts) {
      let total = 0;

      for (const questionType of
        interviewQuestionTypes) {
        const count =
          value.typeCounts[questionType];

        if (count === undefined) {
          continue;
        }

        if (
          !value.questionTypes.includes(
            questionType,
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "typeCounts",
              questionType,
            ],
            message:
              "Counts may only reference selected question types.",
          });
        }

        total += count;
      }

      if (total !== value.count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["typeCounts"],
          message:
            "Question type counts must add up to count.",
        });
      }
    }
  });

export const recordAttemptBodySchema = z.union([
  z
    .object({
      answerText: z
        .string()
        .trim()
        .min(1)
        .max(50_000),
    })
    .strict(),
  z
    .object({
      answer: typedInterviewAnswerSchema,
    })
    .strict(),
]);

export const attemptListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  questionId: objectId.optional(),
  status: z
    .enum([
      "recorded",
      "feedback-queued",
      "feedback-processing",
      "feedback-completed",
      "feedback-failed",
    ])
    .optional(),
});

const generatedCommonShape = {
  category: z.string().trim().min(1).max(120),
  difficulty: z.enum(interviewDifficulties),
  question: z
    .string()
    .trim()
    .min(5)
    .max(2_000),
  modelAnswer: z
    .string()
    .trim()
    .min(1)
    .max(12_000),
};

const generatedQuestionSchema =
  z.discriminatedUnion("questionType", [
    z
      .object({
        questionType: z.literal(
          "multiple-choice",
        ),
        ...generatedCommonShape,
        options: z
          .array(
            z
              .string()
              .trim()
              .min(1)
              .max(500),
          )
          .min(2)
          .max(8),
        correctOptionIndex: z
          .number()
          .int()
          .min(0)
          .max(7),
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "short-answer",
        ),
        ...generatedCommonShape,
      })
      .strict(),
    z
      .object({
        questionType: z.literal("coding"),
        ...generatedCommonShape,
      })
      .strict(),
    z
      .object({
        questionType: z.literal("behavioral"),
        ...generatedCommonShape,
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "scenario-based",
        ),
        ...generatedCommonShape,
      })
      .strict(),
    z
      .object({
        questionType: z.literal(
          "technical-explanation",
        ),
        ...generatedCommonShape,
      })
      .strict(),
  ]);

export const generatedQuestionSetSchema = z
  .object({
    questions: z
      .array(generatedQuestionSchema)
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((value, context) => {
    value.questions.forEach(
      (question, index) => {
        if (
          question.questionType !==
          "multiple-choice"
        ) {
          return;
        }

        if (
          new Set(question.options).size !==
          question.options.length
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "questions",
              index,
              "options",
            ],
            message:
              "Multiple Choice options must be distinct.",
          });
        }

        if (
          question.correctOptionIndex >=
          question.options.length
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "questions",
              index,
              "correctOptionIndex",
            ],
            message:
              "The correct option index must reference an existing option.",
          });
        }
      },
    );
  });

export const questionExplanationResultSchema = z
  .object({
    explanation: z
      .string()
      .trim()
      .min(1)
      .max(12_000),
    keyPoints: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1_000),
      )
      .min(1)
      .max(20),
    modelAnswer: z
      .string()
      .trim()
      .min(1)
      .max(12_000),
  })
  .strict();

export const attemptFeedbackResultSchema = z
  .object({
    score: z
      .number()
      .int()
      .min(0)
      .max(100),
    summary: z
      .string()
      .trim()
      .min(1)
      .max(2_000),
    strengths: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1_000),
      )
      .max(20)
      .default([]),
    improvements: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1_000),
      )
      .max(20)
      .default([]),
    suggestedAnswerOutline: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1_000),
      )
      .max(20)
      .default([]),
  })
  .strict();
