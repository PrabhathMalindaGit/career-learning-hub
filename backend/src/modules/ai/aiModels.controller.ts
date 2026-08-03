import type { Request, Response } from "express";
import {
  listSafeOpenRouterModels,
  refreshOpenRouterCatalogue,
} from "./openRouterCatalogue.service.js";
import type { OpenRouterAction } from "./openRouterCatalogue.js";
import { recordAudit, withAiIdempotency } from "./aiProvider.service.js";
import { readAiIdempotencyKey } from "./aiRequestGuards.js";

export async function listAiModelsController(
  request: Request,
  response: Response,
): Promise<void> {
  const data = await listSafeOpenRouterModels({
    action: request.query.action as OpenRouterAction,
  });
  response.status(200).json({ success: true, data });
}

export async function refreshAiModelsController(
  request: Request,
  response: Response,
): Promise<void> {
  const userId = request.auth!.userId;
  const result = await withAiIdempotency({
    userId,
    operation: "catalogue.refresh:openrouter",
    idempotencyKey: readAiIdempotencyKey(request),
    execute: async () => {
      const context = {
        requestId: request.requestId,
        sourceIp: request.ip,
        userAgent: request.get("user-agent"),
        actorRole: "admin" as const,
      };
      await recordAudit({
        userId,
        action: "catalogue.refresh-requested",
        provider: "openrouter",
        outcome: "pending",
        context,
      });
      const refresh = await refreshOpenRouterCatalogue({
        ownerId: `admin:${userId}`,
      });
      await recordAudit({
        userId,
        action: "catalogue.refresh-completed",
        provider: "openrouter",
        outcome: refresh.status === "refreshed" ? "success" : "failure",
        normalizedReason:
          refresh.status === "failed" ? refresh.failure : undefined,
        context,
      });
      return { statusCode: 200, value: { refresh } };
    },
  });
  response.status(result.statusCode).json({
    success: true,
    data: result.value,
  });
}
