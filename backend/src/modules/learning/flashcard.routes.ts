import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  deleteLearningFlashcardSetController,
} from "./learningChildDeletion.controller.js";
import {
  getFlashcardSetController,
  listFlashcardsController,
  listFlashcardSetsController,
} from "./learning.controller.js";
import {
  requireOwnedFlashcardSet,
} from "./learningOwnership.middleware.js";
import {
  assessmentListQuerySchema,
  flashcardSetParamsSchema,
  paginatedQuerySchema,
} from "./learning.schemas.js";

export const flashcardSetRouter = Router();

flashcardSetRouter.use(authenticate);

flashcardSetRouter.get(
  "/",
  validate({ query: assessmentListQuerySchema }),
  asyncHandler(listFlashcardSetsController),
);

flashcardSetRouter.get(
  "/:setId",
  validate({ params: flashcardSetParamsSchema }),
  requireOwnedFlashcardSet,
  asyncHandler(getFlashcardSetController),
);

flashcardSetRouter.delete(
  "/:setId",
  validate({ params: flashcardSetParamsSchema }),
  requireOwnedFlashcardSet,
  asyncHandler(deleteLearningFlashcardSetController),
);

flashcardSetRouter.get(
  "/:setId/cards",
  validate({
    params: flashcardSetParamsSchema,
    query: paginatedQuerySchema,
  }),
  requireOwnedFlashcardSet,
  asyncHandler(listFlashcardsController),
);
