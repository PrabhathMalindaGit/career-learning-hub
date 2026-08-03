import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  aiActivationRateLimiter,
  aiCredentialMutationRateLimiter,
  aiCredentialTestRateLimiter,
  aiProviderReadRateLimiter,
} from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  getAiUsageController,
  testStructuredAiController,
} from "./ai.controller.js";
import {
  activateProviderController,
  deleteCredentialController,
  getRoutingController,
  listProvidersController,
  putCredentialController,
  testCredentialController,
} from "./aiProvider.controller.js";
import {
  activationBodySchema,
  aiProviderParamsSchema,
  credentialBodySchema,
  credentialTestBodySchema,
  emptyAiMutationBodySchema,
} from "./aiProvider.schemas.js";
import {
  requireAiIdempotencyKey,
  requireAiMutationOrigin,
  requireAiRevision,
} from "./aiRequestGuards.js";

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.get(
  "/providers",
  aiProviderReadRateLimiter,
  asyncHandler(listProvidersController),
);
aiRouter.get(
  "/routing",
  aiProviderReadRateLimiter,
  asyncHandler(getRoutingController),
);
aiRouter.put(
  "/providers/:provider/credential",
  aiCredentialMutationRateLimiter,
  requireAiMutationOrigin,
  requireAiIdempotencyKey,
  validate({ params: aiProviderParamsSchema, body: credentialBodySchema }),
  asyncHandler(putCredentialController),
);
aiRouter.post(
  "/providers/:provider/test",
  aiCredentialTestRateLimiter,
  requireAiMutationOrigin,
  requireAiIdempotencyKey,
  validate({ params: aiProviderParamsSchema, body: credentialTestBodySchema }),
  asyncHandler(testCredentialController),
);
aiRouter.patch(
  "/providers/:provider/activate",
  aiActivationRateLimiter,
  requireAiMutationOrigin,
  requireAiIdempotencyKey,
  requireAiRevision,
  validate({ params: aiProviderParamsSchema, body: activationBodySchema }),
  asyncHandler(activateProviderController),
);
aiRouter.delete(
  "/providers/:provider/credential",
  aiCredentialMutationRateLimiter,
  requireAiMutationOrigin,
  requireAiIdempotencyKey,
  requireAiRevision,
  validate({ params: aiProviderParamsSchema, body: emptyAiMutationBodySchema }),
  asyncHandler(deleteCredentialController),
);
aiRouter.get("/usage", asyncHandler(getAiUsageController));
aiRouter.post(
  "/structured-test",
  asyncHandler(testStructuredAiController),
);
