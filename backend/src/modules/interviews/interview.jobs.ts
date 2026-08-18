import { z } from "zod";
import { registerJobHandler } from "../../jobs/job.registry.js";
import {
  generateAttemptFeedback,
  generateInterviewQuestions,
  generateQuestionExplanation,
} from "./interviewAi.service.js";
import {
  interviewQuestionTypeCountsSchema,
  interviewQuestionTypeSchema,
} from "./interview.schemas.js";

let registered = false;

// Features 4.4, 4.11, and 4.12 — Interview AI job boundary.
// Registers question-generation, explanation, and non-MCQ feedback work while
// preserving the shared polling/cancel/retry execution model.
export function registerInterviewJobHandlers(): void {
  if (registered) return;
  registered = true;

  // Feature 4.4 — Durable Interview AI question-generation job.
  // =========================================================
  // FIND: GENERATE QUESTIONS BACKEND
  // DOES: Generates and persists validated questions for an owned Interview session.
  // UI: InterviewSessionWorkspace.tsx -> FIND: GENERATE QUESTIONS
  // =========================================================
  registerJobHandler(
    // Feature 4.4 BACKEND — Interview question-generation job.
    "interview.questions.generate",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      sessionId: z.string().regex(/^[a-f\d]{24}$/i),
      resumeVersionId: z
        .string()
        .regex(/^[a-f\d]{24}$/i)
        .optional(),
      count: z.number().int().min(1).max(20),
      categories: z
        .array(z.string().min(1).max(120))
        .max(50),
      difficultyMix: z
        .object({
          easy: z.number().int().min(0).max(20),
          medium: z.number().int().min(0).max(20),
          hard: z.number().int().min(0).max(20),
        })
        .strict()
        .optional(),
      questionTypes: z
        .array(interviewQuestionTypeSchema)
        .min(1)
        .max(6),
      typeCounts:
        interviewQuestionTypeCountsSchema,
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const result = await generateInterviewQuestions({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  // Feature 4.11 — Durable selected-question explanation job.
  // =========================================================
  // FIND: REQUEST EXPLANATION BACKEND
  // DOES: Generates validated guidance for the selected owned question.
  // UI: InterviewSessionWorkspace.tsx -> FIND: REQUEST EXPLANATION
  // =========================================================
  registerJobHandler(
    // Feature 4.11 BACKEND — Interview explanation job.
    "interview.question.explain",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      sessionId: z.string().regex(/^[a-f\d]{24}$/i),
      questionId: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    async (payload, context) => {
      await context.reportProgress(15);
      const result = await generateQuestionExplanation({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  // Feature 4.12 — Durable non-MCQ practice-feedback job.
  // =========================================================
  // FIND: REQUEST FEEDBACK BACKEND
  // DOES: Generates validated feedback for an owned saved attempt.
  // UI: InterviewSessionWorkspace.tsx -> FIND: REQUEST FEEDBACK
  // =========================================================
  registerJobHandler(
    // Feature 4.12 BACKEND — Interview feedback job.
    "interview.attempt.feedback",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      sessionId: z.string().regex(/^[a-f\d]{24}$/i),
      attemptId: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const result = await generateAttemptFeedback({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );
}
