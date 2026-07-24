import { AppError } from "../../shared/appError.js";
import { logger, serializeErrorForLog } from "../../shared/logger.js";
import { ActivityEventModel } from "./activity.model.js";

export async function recordActivity(input: {
  userId?: string;
  type: string;
  resourceType?: string;
  resourceId?: string;
  origin?: "api" | "worker" | "system";
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(input.type)) {
    throw new AppError(
      500,
      "INVALID_ACTIVITY_TYPE",
      "The activity event type is invalid.",
    );
  }

  if (input.metadata) {
    const bytes = Buffer.byteLength(JSON.stringify(input.metadata), "utf8");
    if (bytes > 16 * 1024) {
      throw new AppError(
        500,
        "ACTIVITY_METADATA_TOO_LARGE",
        "Activity metadata exceeds the 16 KB limit.",
      );
    }
  }

  await ActivityEventModel.create({
    userId: input.userId,
    type: input.type,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    origin: input.origin ?? "api",
    metadata: input.metadata,
    occurredAt: input.occurredAt ?? new Date(),
  });
}

export async function listUserActivity(
  userId: string,
  input: {
    page: number;
    limit: number;
    type?: string;
  },
) {
  const filter: Record<string, unknown> = { userId };
  if (input.type) filter.type = input.type;

  const [events, total] = await Promise.all([
    ActivityEventModel.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    ActivityEventModel.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}


export async function recordActivitySafely(
  input: Parameters<typeof recordActivity>[0],
): Promise<void> {
  try {
    await recordActivity(input);
  } catch (error) {
    logger.error("activity.record.failed", {
      activityType: input.type,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      ...serializeErrorForLog(error),
    });
  }
}
