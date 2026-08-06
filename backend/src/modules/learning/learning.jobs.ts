import { z } from "zod";
import { registerJobHandler } from "../../jobs/job.registry.js";
import {
  generateFlashcards,
  generateQuiz,
} from "./learningAssessment.service.js";
import {
  generateDocumentChatResponse,
} from "./learningChat.service.js";
import {
  cascadeDeleteLearningDocument,
} from "./learningDocument.service.js";
import {
  processLearningDocument,
} from "./documentProcessing.service.js";
import {
  assertLearningDocumentWorkAvailable,
} from "./learningDocumentWorkFence.js";

let registered = false;

export function registerLearningJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerJobHandler(
    "learning.document.process",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      documentId: z.string().regex(/^[a-f\d]{24}$/i),
      assetId: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    async (payload, context) => {
      await assertLearningDocumentWorkAvailable({
        userId: payload.userId,
        documentId: payload.documentId,
        allowedStatuses: [
          "uploaded",
          "processing",
          "failed",
          "ready",
        ],
      });
      await context.reportProgress(5);
      const result = await processLearningDocument({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  registerJobHandler(
    "learning.document.delete",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      documentId: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const result = await cascadeDeleteLearningDocument({
        ...payload,
        jobId: context.jobId,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  registerJobHandler(
    "learning.chat.respond",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      documentId: z.string().regex(/^[a-f\d]{24}$/i),
      conversationId: z.string().regex(/^[a-f\d]{24}$/i),
      userMessageId: z.string().regex(/^[a-f\d]{24}$/i),
    }),
    async (payload, context) => {
      await assertLearningDocumentWorkAvailable({
        userId: payload.userId,
        documentId: payload.documentId,
        allowedStatuses: ["ready"],
      });
      await context.reportProgress(10);
      const result = await generateDocumentChatResponse({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  registerJobHandler(
    "learning.flashcards.generate",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      documentId: z.string().regex(/^[a-f\d]{24}$/i),
      setId: z.string().regex(/^[a-f\d]{24}$/i),
      count: z.number().int().min(1).max(100),
      focus: z.string().max(500).optional(),
    }),
    async (payload, context) => {
      await assertLearningDocumentWorkAvailable({
        userId: payload.userId,
        documentId: payload.documentId,
        allowedStatuses: ["ready"],
      });
      await context.reportProgress(10);
      const result = await generateFlashcards({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  registerJobHandler(
    "learning.quiz.generate",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      documentId: z.string().regex(/^[a-f\d]{24}$/i),
      quizId: z.string().regex(/^[a-f\d]{24}$/i),
      questionCount: z.number().int().min(1).max(100),
      focus: z.string().max(500).optional(),
    }),
    async (payload, context) => {
      await assertLearningDocumentWorkAvailable({
        userId: payload.userId,
        documentId: payload.documentId,
        allowedStatuses: ["ready"],
      });
      await context.reportProgress(10);
      const result = await generateQuiz({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );
}
