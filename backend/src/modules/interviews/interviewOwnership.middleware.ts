import type { RequestHandler } from "express";
import { AppError } from "../../shared/appError.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { InterviewAttemptModel } from "./interviewAttempt.model.js";
import { InterviewQuestionModel } from "./interviewQuestion.model.js";
import { InterviewSessionModel } from "./interviewSession.model.js";

// Feature 7.2 — Interview ownership boundary: session/question/attempt IDs are bound to request.auth.userId.
export const requireOwnedInterviewSession: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const session = await InterviewSessionModel.findOne({
      _id: request.params.sessionId,
      userId: request.auth!.userId,
    });

    if (!session) {
      throw new AppError(
        404,
        "INTERVIEW_SESSION_NOT_FOUND",
        "Interview session not found.",
      );
    }

    request.interviewSession = session;
    next();
  });

export const requireOwnedInterviewQuestion: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const question = await InterviewQuestionModel.findOne({
      _id: request.params.questionId,
      sessionId: request.params.sessionId,
      userId: request.auth!.userId,
    });

    if (!question) {
      throw new AppError(
        404,
        "INTERVIEW_QUESTION_NOT_FOUND",
        "Interview question not found.",
      );
    }

    request.interviewQuestion = question;
    next();
  });

export const requireOwnedInterviewAttempt: RequestHandler =
  asyncHandler(async (request, _response, next) => {
    const attempt = await InterviewAttemptModel.findOne({
      _id: request.params.attemptId,
      sessionId: request.params.sessionId,
      userId: request.auth!.userId,
    });

    if (!attempt) {
      throw new AppError(
        404,
        "INTERVIEW_ATTEMPT_NOT_FOUND",
        "Interview attempt not found.",
      );
    }

    request.interviewAttempt = attempt;
    next();
  });
