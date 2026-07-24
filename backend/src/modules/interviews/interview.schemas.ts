import { z } from "zod";
import {
  interviewDifficulties,
} from "./interviewQuestion.model.js";
import {
  interviewModes,
  interviewSessionStatuses,
} from "./interviewSession.model.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const conciseList = z
  .array(z.string().trim().min(1).max(120))
  .max(50)
  .default([]);

export const sessionIdParamsSchema = z.object({
  sessionId: objectId,
});

export const questionParamsSchema = sessionIdParamsSchema.extend({
  questionId: objectId,
});

export const attemptParamsSchema = sessionIdParamsSchema.extend({
  attemptId: objectId,
});

export const manualQuestionInputSchema = z
  .object({
    category: z.string().trim().min(1).max(120),
    difficulty: z.enum(interviewDifficulties),
    question: z.string().trim().min(5).max(2_000),
    modelAnswer: z.string().trim().max(12_000).optional(),
  })
  .strict();

export const createSessionBodySchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    sourceResumeId: objectId.optional(),
    sourceResumeVersionId: objectId.optional(),
    targetRole: z.string().trim().min(2).max(200),
    experienceLevel: z.string().trim().min(1).max(100),
    focusTopics: conciseList,
    skillGaps: conciseList,
    jobDescription: z.string().trim().max(30_000).optional(),
    mode: z.enum(interviewModes).default("study"),
    manualQuestions: z
      .array(manualQuestionInputSchema)
      .max(100)
      .default([]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sourceResumeVersionId && !value.sourceResumeId) {
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
    status: z.enum(interviewSessionStatuses),
  })
  .strict();

export const addManualQuestionBodySchema =
  manualQuestionInputSchema;

export const questionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  pinned: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
  difficulty: z.enum(interviewDifficulties).optional(),
  category: z.string().trim().max(120).optional(),
});

export const sessionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(interviewSessionStatuses).optional(),
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
    count: z.coerce.number().int().min(1).max(20).default(10),
    categories: conciseList,
    difficultyMix: z
      .object({
        easy: z.number().int().min(0).max(20),
        medium: z.number().int().min(0).max(20),
        hard: z.number().int().min(0).max(20),
      })
      .strict()
      .optional(),
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
        message: "Difficulty counts must add up to count.",
      });
    }
  });

export const recordAttemptBodySchema = z
  .object({
    answerText: z.string().trim().min(1).max(50_000),
  })
  .strict();

export const attemptListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export const generatedQuestionSetSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            category: z.string().trim().min(1).max(120),
            difficulty: z.enum(interviewDifficulties),
            question: z.string().trim().min(5).max(2_000),
            modelAnswer: z.string().trim().min(1).max(12_000),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

export const questionExplanationResultSchema = z
  .object({
    explanation: z.string().trim().min(1).max(12_000),
    keyPoints: z
      .array(z.string().trim().min(1).max(1_000))
      .min(1)
      .max(20),
    modelAnswer: z.string().trim().min(1).max(12_000),
  })
  .strict();

export const attemptFeedbackResultSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    summary: z.string().trim().min(1).max(2_000),
    strengths: z
      .array(z.string().trim().min(1).max(1_000))
      .max(20)
      .default([]),
    improvements: z
      .array(z.string().trim().min(1).max(1_000))
      .max(20)
      .default([]),
    suggestedAnswerOutline: z
      .array(z.string().trim().min(1).max(1_000))
      .max(20)
      .default([]),
  })
  .strict();
