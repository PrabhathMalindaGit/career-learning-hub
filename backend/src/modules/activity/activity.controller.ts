import type { Request, Response } from "express";
import { listUserActivity } from "./activity.service.js";

export async function listActivityController(
  request: Request,
  response: Response,
): Promise<void> {
  const query = request.query as unknown as {
    page: number;
    limit: number;
    type?: string;
  };

  const result = await listUserActivity(
    request.auth!.userId,
    query,
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}
