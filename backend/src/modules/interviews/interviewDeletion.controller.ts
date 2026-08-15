import type { Request, Response } from "express";
import { deleteInterviewSession } from "./interviewDeletion.service.js";

type InterviewSessionIdParams = {
  sessionId: string;
};

export async function deleteInterviewSessionController(
  request: Request<InterviewSessionIdParams>,
  response: Response,
): Promise<void> {
  await deleteInterviewSession({
    userId: request.auth!.userId,
    sessionId: request.params.sessionId,
  });

  response.status(204).send();
}
