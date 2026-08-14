import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  interviewFeedbackRateLimiter,
  interviewGenerationRateLimiter,
} from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  addManualQuestionController,
  createInterviewSessionController,
  getInterviewAttemptController,
  getInterviewQuestionController,
  getInterviewSessionController,
  listInterviewAttemptsController,
  listInterviewQuestionsController,
  listInterviewSessionsController,
  queueAttemptFeedbackController,
  queueQuestionExplanationController,
  queueQuestionGenerationController,
  recordInterviewAttemptController,
  setQuestionNotesController,
  setQuestionPinnedController,
  updateInterviewSessionStatusController,
} from "./interview.controller.js";
import { deleteInterviewSessionController } from "./interviewDeletion.controller.js";
import {
  requireOwnedInterviewAttempt,
  requireOwnedInterviewQuestion,
  requireOwnedInterviewSession,
} from "./interviewOwnership.middleware.js";
import {
  addManualQuestionBodySchema,
  attemptListQuerySchema,
  attemptParamsSchema,
  createSessionBodySchema,
  generateQuestionsBodySchema,
  pinQuestionBodySchema,
  questionListQuerySchema,
  questionNotesBodySchema,
  questionParamsSchema,
  recordAttemptBodySchema,
  sessionIdParamsSchema,
  sessionListQuerySchema,
  updateSessionStatusBodySchema,
} from "./interview.schemas.js";

export const interviewRouter = Router();

interviewRouter.use(authenticate);

interviewRouter.post(
  "/",
  validate({ body: createSessionBodySchema }),
  asyncHandler(createInterviewSessionController),
);

interviewRouter.get(
  "/",
  validate({ query: sessionListQuerySchema }),
  asyncHandler(listInterviewSessionsController),
);

interviewRouter.get(
  "/:sessionId",
  validate({ params: sessionIdParamsSchema }),
  requireOwnedInterviewSession,
  asyncHandler(getInterviewSessionController),
);

interviewRouter.delete(
  "/:sessionId",
  validate({ params: sessionIdParamsSchema }),
  requireOwnedInterviewSession,
  asyncHandler(deleteInterviewSessionController),
);

interviewRouter.patch(
  "/:sessionId/status",
  validate({
    params: sessionIdParamsSchema,
    body: updateSessionStatusBodySchema,
  }),
  requireOwnedInterviewSession,
  asyncHandler(updateInterviewSessionStatusController),
);

interviewRouter.get(
  "/:sessionId/questions",
  validate({
    params: sessionIdParamsSchema,
    query: questionListQuerySchema,
  }),
  requireOwnedInterviewSession,
  asyncHandler(listInterviewQuestionsController),
);

interviewRouter.post(
  "/:sessionId/questions",
  validate({
    params: sessionIdParamsSchema,
    body: addManualQuestionBodySchema,
  }),
  requireOwnedInterviewSession,
  asyncHandler(addManualQuestionController),
);

interviewRouter.post(
  "/:sessionId/questions/generate",
  interviewGenerationRateLimiter,
  validate({
    params: sessionIdParamsSchema,
    body: generateQuestionsBodySchema,
  }),
  requireOwnedInterviewSession,
  asyncHandler(queueQuestionGenerationController),
);

interviewRouter.get(
  "/:sessionId/questions/:questionId",
  validate({ params: questionParamsSchema }),
  requireOwnedInterviewSession,
  requireOwnedInterviewQuestion,
  asyncHandler(getInterviewQuestionController),
);

interviewRouter.patch(
  "/:sessionId/questions/:questionId/pin",
  validate({
    params: questionParamsSchema,
    body: pinQuestionBodySchema,
  }),
  requireOwnedInterviewSession,
  requireOwnedInterviewQuestion,
  asyncHandler(setQuestionPinnedController),
);

interviewRouter.patch(
  "/:sessionId/questions/:questionId/notes",
  validate({
    params: questionParamsSchema,
    body: questionNotesBodySchema,
  }),
  requireOwnedInterviewSession,
  requireOwnedInterviewQuestion,
  asyncHandler(setQuestionNotesController),
);

interviewRouter.post(
  "/:sessionId/questions/:questionId/explanation",
  interviewFeedbackRateLimiter,
  validate({ params: questionParamsSchema }),
  requireOwnedInterviewSession,
  requireOwnedInterviewQuestion,
  asyncHandler(queueQuestionExplanationController),
);

interviewRouter.post(
  "/:sessionId/questions/:questionId/attempts",
  validate({
    params: questionParamsSchema,
    body: recordAttemptBodySchema,
  }),
  requireOwnedInterviewSession,
  requireOwnedInterviewQuestion,
  asyncHandler(recordInterviewAttemptController),
);

interviewRouter.get(
  "/:sessionId/attempts",
  validate({
    params: sessionIdParamsSchema,
    query: attemptListQuerySchema,
  }),
  requireOwnedInterviewSession,
  asyncHandler(listInterviewAttemptsController),
);

interviewRouter.get(
  "/:sessionId/attempts/:attemptId",
  validate({ params: attemptParamsSchema }),
  requireOwnedInterviewSession,
  requireOwnedInterviewAttempt,
  asyncHandler(getInterviewAttemptController),
);

interviewRouter.post(
  "/:sessionId/attempts/:attemptId/feedback",
  interviewFeedbackRateLimiter,
  validate({ params: attemptParamsSchema }),
  requireOwnedInterviewSession,
  requireOwnedInterviewAttempt,
  asyncHandler(queueAttemptFeedbackController),
);
