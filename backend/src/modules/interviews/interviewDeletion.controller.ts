import type { Request, Response } from "express";
import { deleteInterviewSession } from "./interviewDeletion.service.js";

export async function deleteInterviewSessionController(
  request: Request,
  response: Response,
): Promise<void> {
  await deleteInterviewSession({
    userId: request.auth!.userId,
    sessionId: request.params.sessionId,
  });

  response.status(204).send();
}
