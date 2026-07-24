import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import {
  getAiQuotaStatus,
} from "./aiQuota.service.js";
import { generateStructuredOutput } from "./aiGateway.service.js";

const infrastructureTestSchema = z.object({
  status: z.literal("ok"),
  message: z.string().min(1).max(200),
});

export async function getAiUsageController(
  request: Request,
  response: Response,
): Promise<void> {
  const quota = await getAiQuotaStatus(request.auth!.userId);

  response.status(200).json({
    success: true,
    data: {
      configured: Boolean(env.GEMINI_API_KEY),
      provider: env.AI_DEFAULT_PROVIDER,
      model: env.GEMINI_MODEL,
      quota,
    },
  });
}

export async function testStructuredAiController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!env.ENABLE_DEV_ROUTES) {
    throw new AppError(404, "ROUTE_NOT_FOUND", "Route not found.");
  }

  const result = await generateStructuredOutput({
    userId: request.auth!.userId,
    feature: "infrastructure.structured-test",
    systemPrompt:
      "Return only valid JSON matching the requested shape. Do not include markdown.",
    userPrompt:
      'Return exactly: {"status":"ok","message":"AI gateway is operational."}',
    schema: infrastructureTestSchema,
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}
