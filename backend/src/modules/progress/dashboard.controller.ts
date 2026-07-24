import type { Request, Response } from "express";
import {
  getDashboardOverview,
  listDashboardActivity,
} from "./dashboard.service.js";

type OverviewQuery = {
  windowDays: number;
  trendLimit: number;
  activityLimit: number;
  recentDocumentLimit: number;
};

export async function getDashboardOverviewController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await getDashboardOverview({
    userId: request.auth!.userId,
    ...(request.query as unknown as OverviewQuery),
    includeActivity: true,
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getProgressSnapshotController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await getDashboardOverview({
    userId: request.auth!.userId,
    ...(request.query as unknown as OverviewQuery),
    includeActivity: false,
  });

  const { recentActivity: _recentActivity, ...progress } = result;

  response.status(200).json({
    success: true,
    data: progress,
  });
}

export async function listDashboardActivityController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listDashboardActivity({
    userId: request.auth!.userId,
    ...(request.query as unknown as {
      page: number;
      limit: number;
      type?: string;
      origin?: "api" | "worker" | "system";
      resourceType?: string;
    }),
  });

  response.status(200).json({
    success: true,
    data: result,
  });
}
