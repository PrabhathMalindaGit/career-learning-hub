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

// Features 5.2 and 5.7–5.9 — Learning background-job boundary.
// Registers document processing and grounded AI generation work used by chat,
// flashcards, and quizzes through the shared durable-job execution model.
export function registerLearningJobHandlers(): void {
  if (registered) return;
  registered = true;

  // Feature 5.2 — Durable uploaded-document processing job.
  registerJobHandler(
    // Feature 5.2 BACKEND — Learning document-processing job.
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

  // Feature 5.10 — Durable Learning document delete/cascade job.
  registerJobHandler(
    // Feature 5.10 BACKEND — Learning document deletion job.
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

  // Feature 5.7 — Grounded Chat durable-response boundary.
  // Feature 5.7.2 — Process the persisted question request.
  // Feature 5.7.3 — Persist validated source-page references with the answer.
  registerJobHandler(
    // Feature 5.7.2 BACKEND — Grounded Chat response job.
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

  // Feature 5.8 — Flashcard background-work boundary.
  // Feature 5.8.1 — Durable flashcard-generation job.
  registerJobHandler(
    // Feature 5.8.1 BACKEND — Flashcard-generation job.
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

  // Feature 5.9 — Quiz background-work boundary.
  // Feature 5.9.1 — Durable quiz-generation job.
  registerJobHandler(
    // Feature 5.9.1 BACKEND — Quiz-generation job.
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
