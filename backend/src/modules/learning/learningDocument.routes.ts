import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  learningAiRateLimiter,
  learningUploadRateLimiter,
} from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  deleteLearningConversationController,
} from "./learningChildDeletion.controller.js";
import {
  createConversationController,
  createFlashcardSetController,
  createQuizController,
  deleteLearningDocumentController,
  getLearningDocumentController,
  getLearningDocumentSourceController,
  listConversationMessagesController,
  listConversationsController,
  listDocumentChunksController,
  listLearningDocumentsController,
  sendConversationMessageController,
  uploadLearningDocumentController,
  learningPdfUpload,
} from "./learning.controller.js";
import {
  requireOwnedConversation,
  requireOwnedLearningDocument,
} from "./learningOwnership.middleware.js";
import {
  conversationParamsSchema,
  createConversationBodySchema,
  documentListQuerySchema,
  documentParamsSchema,
  generateFlashcardsBodySchema,
  generateQuizBodySchema,
  paginatedQuerySchema,
  sendChatMessageBodySchema,
  uploadLearningDocumentBodySchema,
} from "./learning.schemas.js";

export const learningDocumentRouter = Router();

learningDocumentRouter.use(authenticate);

learningDocumentRouter.post(
  "/upload",
  learningUploadRateLimiter,
  learningPdfUpload,
  validate({ body: uploadLearningDocumentBodySchema }),
  asyncHandler(uploadLearningDocumentController),
);

learningDocumentRouter.get(
  "/",
  validate({ query: documentListQuerySchema }),
  asyncHandler(listLearningDocumentsController),
);

learningDocumentRouter.get(
  "/:documentId",
  validate({ params: documentParamsSchema }),
  requireOwnedLearningDocument,
  asyncHandler(getLearningDocumentController),
);

learningDocumentRouter.get(
  "/:documentId/source",
  validate({ params: documentParamsSchema }),
  requireOwnedLearningDocument,
  asyncHandler(getLearningDocumentSourceController),
);

learningDocumentRouter.get(
  "/:documentId/chunks",
  validate({
    params: documentParamsSchema,
    query: paginatedQuerySchema,
  }),
  requireOwnedLearningDocument,
  asyncHandler(listDocumentChunksController),
);

learningDocumentRouter.delete(
  "/:documentId",
  validate({ params: documentParamsSchema }),
  requireOwnedLearningDocument,
  asyncHandler(deleteLearningDocumentController),
);

learningDocumentRouter.post(
  "/:documentId/conversations",
  validate({
    params: documentParamsSchema,
    body: createConversationBodySchema,
  }),
  requireOwnedLearningDocument,
  asyncHandler(createConversationController),
);

learningDocumentRouter.get(
  "/:documentId/conversations",
  validate({
    params: documentParamsSchema,
    query: paginatedQuerySchema,
  }),
  requireOwnedLearningDocument,
  asyncHandler(listConversationsController),
);

learningDocumentRouter.delete(
  "/:documentId/conversations/:conversationId",
  validate({ params: conversationParamsSchema }),
  requireOwnedLearningDocument,
  requireOwnedConversation,
  asyncHandler(deleteLearningConversationController),
);

learningDocumentRouter.get(
  "/:documentId/conversations/:conversationId/messages",
  validate({
    params: conversationParamsSchema,
    query: paginatedQuerySchema,
  }),
  requireOwnedLearningDocument,
  requireOwnedConversation,
  asyncHandler(listConversationMessagesController),
);

learningDocumentRouter.post(
  "/:documentId/conversations/:conversationId/messages",
  learningAiRateLimiter,
  validate({
    params: conversationParamsSchema,
    body: sendChatMessageBodySchema,
  }),
  requireOwnedLearningDocument,
  requireOwnedConversation,
  asyncHandler(sendConversationMessageController),
);

learningDocumentRouter.post(
  "/:documentId/flashcard-sets",
  learningAiRateLimiter,
  validate({
    params: documentParamsSchema,
    body: generateFlashcardsBodySchema,
  }),
  requireOwnedLearningDocument,
  asyncHandler(createFlashcardSetController),
);

learningDocumentRouter.post(
  "/:documentId/quizzes",
  learningAiRateLimiter,
  validate({
    params: documentParamsSchema,
    body: generateQuizBodySchema,
  }),
  requireOwnedLearningDocument,
  asyncHandler(createQuizController),
);
