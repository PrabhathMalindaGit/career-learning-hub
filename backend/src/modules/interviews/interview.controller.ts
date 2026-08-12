import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import { AppError } from "../../shared/appError.js";
import {
  addManualQuestion,
  createInterviewSession,
  listInterviewAttempts,
  listInterviewQuestions,
  listInterviewSessions,
  recordInterviewAttempt,
  serializeQuestionDetail,
  setQuestionNotes,
  setQuestionPinned,
  updateInterviewSessionStatus,
} from "./interview.service.js";
import { resolveInterviewResumeVersion } from "./interviewAi.service.js";

export async function createInterviewSessionController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await createInterviewSession({
    userId: request.auth!.userId,
    title: request.body.title,
    sourceResumeId: request.body.sourceResumeId,
    sourceResumeVersionId:
      request.body.sourceResumeVersionId,
    targetRole: request.body.targetRole,
    experienceLevel: request.body.experienceLevel,
    focusTopics: request.body.focusTopics,
    skillGaps: request.body.skillGaps,
    jobDescription: request.body.jobDescription,
    mode: request.body.mode,
    manualQuestions: request.body.manualQuestions,
  });

  response.status(201).json({
    success: true,
    data: result,
  });
}

export async function listInterviewSessionsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listInterviewSessions(
    request.auth!.userId,
    request.query as unknown as {
      page: number;
      limit: number;
      status?: "active" | "completed" | "archived";
    },
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getInterviewSessionController(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json({
    success: true,
    data: {
      session: request.interviewSession,
    },
  });
}

export async function updateInterviewSessionStatusController(
  request: Request,
  response: Response,
): Promise<void> {
  const session = await updateInterviewSessionStatus({
    session: request.interviewSession!,
    status: request.body.status,
  });

  response.status(200).json({
    success: true,
    data: { session },
  });
}

export async function addManualQuestionController(
  request: Request,
  response: Response,
): Promise<void> {
  const question = await addManualQuestion({
    session: request.interviewSession!,
    userId: request.auth!.userId,
    question: request.body,
  });

  response.status(201).json({
    success: true,
    data: { question },
  });
}

export async function listInterviewQuestionsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listInterviewQuestions(
    request.interviewSession!,
    request.auth!.userId,
    request.query as unknown as {
      page: number;
      limit: number;
      pinned?: boolean;
      difficulty?: "easy" | "medium" | "hard";
      category?: string;
    },
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getInterviewQuestionController(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json({
    success: true,
    data: {
      question: serializeQuestionDetail(
        request.interviewQuestion!,
        request.interviewSession!.mode === "study" ||
          Boolean(request.interviewQuestion!.explanation),
      ),
    },
  });
}

export async function setQuestionPinnedController(
  request: Request,
  response: Response,
): Promise<void> {
  const question = await setQuestionPinned({
    question: request.interviewQuestion!,
    isPinned: request.body.isPinned,
  });

  response.status(200).json({
    success: true,
    data: {
      question: serializeQuestionDetail(
          question,
          request.interviewSession!.mode === "study" ||
            Boolean(question.explanation),
        ),
    },
  });
}

export async function setQuestionNotesController(
  request: Request,
  response: Response,
): Promise<void> {
  const question = await setQuestionNotes({
    question: request.interviewQuestion!,
    notes: request.body.notes,
  });

  response.status(200).json({
    success: true,
    data: {
      question: serializeQuestionDetail(
          question,
          request.interviewSession!.mode === "study" ||
            Boolean(question.explanation),
        ),
    },
  });
}

export async function queueQuestionGenerationController(
  request: Request,
  response: Response,
): Promise<void> {
  const remainingCapacity =
    env.INTERVIEW_MAX_QUESTIONS_PER_SESSION -
    request.interviewSession!.questionCount;

  if (request.body.count > remainingCapacity) {
    throw new AppError(
      409,
      "INTERVIEW_QUESTION_CAPACITY_EXCEEDED",
      `Only ${Math.max(0, remainingCapacity)} additional question(s) can be added.`,
    );
  }

  const selectedVersion = await resolveInterviewResumeVersion({
    userId: request.auth!.userId,
    interviewSession: request.interviewSession!,
    requestedVersionId: request.body.resumeVersionId,
  });

  const job = await enqueueJob({
    type: "interview.questions.generate",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      sessionId: request.interviewSession!._id.toString(),
      resumeVersionId: selectedVersion?._id.toString(),
      count: request.body.count,
      categories: request.body.categories,
      difficultyMix: request.body.difficultyMix,
    },
    maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "interview.questions.generate",
      request.auth!.userId,
      request.interviewSession!._id.toString(),
      request.body.requestId,
    ].join(":"),
  });

  response.status(202).json({
    success: true,
    data: {
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function queueQuestionExplanationController(
  request: Request,
  response: Response,
): Promise<void> {
  const question = request.interviewQuestion!;

  if (question.explanation) {
    response.status(200).json({
      success: true,
      data: {
        question: serializeQuestionDetail(question),
        alreadyAvailable: true,
      },
    });
    return;
  }

  const job = await enqueueJob({
    type: "interview.question.explain",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      sessionId: request.interviewSession!._id.toString(),
      questionId: question._id.toString(),
    },
    maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "interview.question.explain",
      request.auth!.userId,
      question._id.toString(),
    ].join(":"),
  });

  question.explanationJobId = job._id;
  await question.save();

  response.status(202).json({
    success: true,
    data: {
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}

export async function recordInterviewAttemptController(
  request: Request,
  response: Response,
): Promise<void> {
  const attempt = await recordInterviewAttempt({
    userId: request.auth!.userId,
    session: request.interviewSession!,
    question: request.interviewQuestion!,
    answerText: request.body.answerText,
  });

  response.status(201).json({
    success: true,
    data: { attempt },
  });
}

export async function listInterviewAttemptsController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await listInterviewAttempts(
    request.interviewSession!,
    request.auth!.userId,
    request.query as unknown as {
      page: number;
      limit: number;
      questionId?: string;
      status?: string;
    },
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function getInterviewAttemptController(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json({
    success: true,
    data: {
      attempt: request.interviewAttempt,
    },
  });
}

export async function queueAttemptFeedbackController(
  request: Request,
  response: Response,
): Promise<void> {
  const attempt = request.interviewAttempt!;

  if (attempt.feedback) {
    response.status(200).json({
      success: true,
      data: {
        attempt,
        alreadyAvailable: true,
      },
    });
    return;
  }

  if (attempt.answerText!.length > env.INTERVIEW_MAX_ANSWER_CHARACTERS) {
    throw new AppError(
      413,
      "INTERVIEW_ANSWER_TOO_LONG",
      "The recorded answer exceeds the feedback limit.",
    );
  }

  const job = await enqueueJob({
    type: "interview.attempt.feedback",
    userId: request.auth!.userId,
    payload: {
      userId: request.auth!.userId,
      sessionId: request.interviewSession!._id.toString(),
      attemptId: attempt._id.toString(),
    },
    maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
    idempotencyKey: [
      "interview.attempt.feedback",
      request.auth!.userId,
      attempt._id.toString(),
    ].join(":"),
  });

  attempt.feedbackJobId = job._id;
  attempt.status = "feedback-queued";
  attempt.feedbackError = undefined;
  await attempt.save();

  response.status(202).json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      job: {
        id: job._id.toString(),
        type: job.type,
        status: job.status,
      },
    },
  });
}
