import type { Request, Response } from "express";
import {
  getLivenessStatus,
  getReadinessStatus,
} from "./health.service.js";

export function getLivenessController(
  _request: Request,
  response: Response,
): void {
  response.setHeader("Cache-Control", "no-store");
  const result = getLivenessStatus();
  response
    .status(result.live ? 200 : 503)
    .json({ success: result.live, data: result });
}

export async function getReadinessController(
  _request: Request,
  response: Response,
): Promise<void> {
  response.setHeader("Cache-Control", "no-store");
  const result = await getReadinessStatus();
  response
    .status(result.ready ? 200 : 503)
    .json({ success: result.ready, data: result });
}
