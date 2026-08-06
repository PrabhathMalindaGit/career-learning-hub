import { z } from "zod";
import { registerJobHandler } from "../../jobs/job.registry.js";
import {
  generateAttemptFeedback,
  generateInterviewQuestions,
  generateQuestionExplanation,
} from "./interviewAi.service.js";

let registered = false;

export function registerInterviewJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerJobHandler(
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

  registerJobHandler(
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

  registerJobHandler(
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
