import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  getQuizAttemptController,
  listAllQuizAttemptsController,
  getQuizController,
  listQuizAttemptsController,
  listQuizzesController,
  submitQuizController,
} from "./learning.controller.js";
import {
  requireOwnedQuiz,
  requireOwnedQuizAttempt,
} from "./learningOwnership.middleware.js";
import {
  assessmentListQuerySchema,
  paginatedQuerySchema,
  quizAttemptParamsSchema,
  quizHistoryQuerySchema,
  quizParamsSchema,
  submitQuizBodySchema,
} from "./learning.schemas.js";

export const quizRouter = Router();

quizRouter.use(authenticate);

quizRouter.get(
  "/",
  validate({ query: assessmentListQuerySchema }),
  asyncHandler(listQuizzesController),
);

quizRouter.get(
  "/history",
  validate({ query: quizHistoryQuerySchema }),
  asyncHandler(listAllQuizAttemptsController),
);

quizRouter.get(
  "/:quizId",
  validate({ params: quizParamsSchema }),
  requireOwnedQuiz,
  asyncHandler(getQuizController),
);

quizRouter.post(
  "/:quizId/attempts",
  validate({
    params: quizParamsSchema,
    body: submitQuizBodySchema,
  }),
  requireOwnedQuiz,
  asyncHandler(submitQuizController),
);

quizRouter.get(
  "/:quizId/attempts",
  validate({
    params: quizParamsSchema,
    query: paginatedQuerySchema,
  }),
  requireOwnedQuiz,
  asyncHandler(listQuizAttemptsController),
);

quizRouter.get(
  "/:quizId/attempts/:attemptId",
  validate({ params: quizAttemptParamsSchema }),
  requireOwnedQuiz,
  requireOwnedQuizAttempt,
  asyncHandler(getQuizAttemptController),
);
