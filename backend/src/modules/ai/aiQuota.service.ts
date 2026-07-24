import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { AiQuotaCounterModel } from "./aiQuota.model.js";

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function quotaExpiry(date = new Date()): Date {
  const expiry = new Date(date);
  expiry.setUTCDate(expiry.getUTCDate() + 8);
  expiry.setUTCHours(0, 0, 0, 0);
  return expiry;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function reserveAiQuota(input: {
  userId: string;
  estimatedTokens: number;
}): Promise<void> {
  const dateKey = utcDateKey();

  try {
    const counter = await AiQuotaCounterModel.findOneAndUpdate(
      {
        userId: input.userId,
        dateKey,
        requestCount: { $lt: env.AI_DAILY_REQUEST_LIMIT },
        tokenCount: {
          $lte: env.AI_DAILY_TOKEN_LIMIT - input.estimatedTokens,
        },
      },
      {
        $inc: {
          requestCount: 1,
          tokenCount: input.estimatedTokens,
        },
        $setOnInsert: {
          expiresAt: quotaExpiry(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!counter) {
      throw new AppError(
        429,
        "AI_QUOTA_EXCEEDED",
        "The daily AI usage quota has been reached.",
      );
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        429,
        "AI_QUOTA_EXCEEDED",
        "The daily AI usage quota has been reached.",
      );
    }
    throw error;
  }
}

export async function reconcileAiTokenUsage(input: {
  userId: string;
  estimatedTokens: number;
  actualInputTokens: number;
  actualOutputTokens: number;
}): Promise<void> {
  const actualTotal = input.actualInputTokens + input.actualOutputTokens;
  const adjustment = actualTotal - input.estimatedTokens;

  if (adjustment === 0) return;

  await AiQuotaCounterModel.updateOne(
    {
      userId: input.userId,
      dateKey: utcDateKey(),
    },
    {
      $inc: {
        tokenCount: adjustment,
      },
    },
  );
}

export async function getAiQuotaStatus(userId: string) {
  const counter = await AiQuotaCounterModel.findOne({
    userId,
    dateKey: utcDateKey(),
  }).lean();

  const requestCount = counter?.requestCount ?? 0;
  const tokenCount = Math.max(0, counter?.tokenCount ?? 0);

  return {
    requests: {
      used: requestCount,
      limit: env.AI_DAILY_REQUEST_LIMIT,
      remaining: Math.max(0, env.AI_DAILY_REQUEST_LIMIT - requestCount),
    },
    tokens: {
      used: tokenCount,
      limit: env.AI_DAILY_TOKEN_LIMIT,
      remaining: Math.max(0, env.AI_DAILY_TOKEN_LIMIT - tokenCount),
    },
  };
}
