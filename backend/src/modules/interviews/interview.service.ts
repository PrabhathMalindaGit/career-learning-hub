import type { ClientSession } from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { recordActivitySafely } from "../activity/activity.service.js";
import {
  getOwnedResumeVersion,
  requireOwnedResume,
} from "../resumes/resume.service.js";
import {
  InterviewAttemptModel,
  type InterviewAttemptDocument,
} from "./interviewAttempt.model.js";
import { createQuestionFingerprint } from "./interview.fingerprint.js";
import {
  InterviewQuestionModel,
  type InterviewDifficulty,
  type InterviewQuestionDocument,
} from "./interviewQuestion.model.js";
import {
  InterviewSessionModel,
  type InterviewMode,
  type InterviewSessionDocument,
  type InterviewSessionStatus,
} from "./interviewSession.model.js";

export interface ManualQuestionInput {
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  modelAnswer?: string;
}

function assertUniqueQuestionInputs(
  questions: ManualQuestionInput[],
): Array<ManualQuestionInput & { questionFingerprint: string }> {
  const fingerprints = new Set<string>();

  return questions.map((question) => {
    const questionFingerprint = createQuestionFingerprint(
      question.question,
    );

    if (fingerprints.has(questionFingerprint)) {
      throw new AppError(
        409,
        "DUPLICATE_INTERVIEW_QUESTION",
        "The submitted question set contains duplicates.",
      );
    }

    fingerprints.add(questionFingerprint);
    return { ...question, questionFingerprint };
  });
}

async function validateResumeSource(input: {
  userId: string;
  sourceResumeId?: string;
  sourceResumeVersionId?: string;
}): Promise<void> {
  if (!input.sourceResumeId) return;

  await requireOwnedResume(input.userId, input.sourceResumeId);

  if (input.sourceResumeVersionId) {
    await getOwnedResumeVersion(
      input.userId,
      input.sourceResumeId,
      input.sourceResumeVersionId,
    );
  }
}

export async function createInterviewSession(input: {
  userId: string;
  title: string;
  sourceResumeId?: string;
  sourceResumeVersionId?: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  jobDescription?: string;
  mode: InterviewMode;
  manualQuestions: ManualQuestionInput[];
}): Promise<{
  session: InterviewSessionDocument;
  questions: InterviewQuestionDocument[];
}> {
  await validateResumeSource(input);

  if (
    input.manualQuestions.length >
    env.INTERVIEW_MAX_QUESTIONS_PER_SESSION
  ) {
    throw new AppError(
      400,
      "INTERVIEW_QUESTION_LIMIT_EXCEEDED",
      "The initial question set exceeds the session limit.",
    );
  }

  const manualQuestions = assertUniqueQuestionInputs(
    input.manualQuestions,
  );

  const result = await withMongoTransaction(async (session) => {
    const [interviewSession] = await InterviewSessionModel.create(
      [
        {
          userId: input.userId,
          title: input.title,
          sourceResumeId: input.sourceResumeId,
          sourceResumeVersionId: input.sourceResumeVersionId,
          targetRole: input.targetRole,
          experienceLevel: input.experienceLevel,
          focusTopics: input.focusTopics,
          skillGaps: input.skillGaps,
          jobDescription: input.jobDescription,
          mode: input.mode,
          questionCount: manualQuestions.length,
        },
      ],
      { session },
    );

    const questions =
      manualQuestions.length === 0
        ? []
        : await InterviewQuestionModel.create(
            manualQuestions.map((question) => ({
              userId: input.userId,
              sessionId: interviewSession._id,
              source: "manual",
              category: question.category,
              difficulty: question.difficulty,
              question: question.question,
              questionFingerprint: question.questionFingerprint,
              modelAnswer: question.modelAnswer,
            })),
            { session },
          );

    return {
      session: interviewSession,
      questions,
    };
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "interview.session.created",
    resourceType: "interview-session",
    resourceId: result.session._id.toString(),
    metadata: {
      mode: result.session.mode,
      initialQuestionCount: result.questions.length,
      sourceResumeVersionId: input.sourceResumeVersionId,
    },
  });

  return result;
}

export async function listInterviewSessions(
  userId: string,
  input: {
    page: number;
    limit: number;
    status?: InterviewSessionStatus;
  },
) {
  const filter: Record<string, unknown> = { userId };
  if (input.status) filter.status = input.status;

  const [sessions, total] = await Promise.all([
    InterviewSessionModel.find(filter)
      .select(
        "title targetRole experienceLevel focusTopics skillGaps mode status questionCount sourceResumeId sourceResumeVersionId completedAt createdAt updatedAt",
      )
      .sort({ updatedAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    InterviewSessionModel.countDocuments(filter),
  ]);

  return {
    sessions,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function requireOwnedSession(
  userId: string,
  sessionId: string,
  mongoSession?: ClientSession,
): Promise<InterviewSessionDocument> {
  const query = InterviewSessionModel.findOne({
    _id: sessionId,
    userId,
  });

  if (mongoSession) query.session(mongoSession);
  const session = await query;

  if (!session) {
    throw new AppError(
      404,
      "INTERVIEW_SESSION_NOT_FOUND",
      "Interview session not found.",
    );
  }

  return session;
}

export async function updateInterviewSessionStatus(input: {
  session: InterviewSessionDocument;
  status: InterviewSessionStatus;
}): Promise<InterviewSessionDocument> {
  const previousStatus = input.session.status;
  input.session.status = input.status;
  input.session.completedAt =
    input.status === "completed" ? new Date() : undefined;

  await input.session.save();

  if (
    previousStatus !== "completed" &&
    input.status === "completed"
  ) {
    await recordActivitySafely({
      userId: input.session.userId.toString(),
      type: "interview.session.completed",
      resourceType: "interview-session",
      resourceId: input.session._id.toString(),
      metadata: {
        questionCount: input.session.questionCount,
      },
    });
  }

  return input.session;
}

export async function addManualQuestion(input: {
  session: InterviewSessionDocument;
  userId: string;
  question: ManualQuestionInput;
}): Promise<InterviewQuestionDocument> {
  if (input.session.status === "archived") {
    throw new AppError(
      409,
      "INTERVIEW_SESSION_ARCHIVED",
      "Questions cannot be added to an archived session.",
    );
  }

  const questionFingerprint = createQuestionFingerprint(
    input.question.question,
  );

  try {
    const result = await withMongoTransaction(async (mongoSession) => {
      const reserved = await InterviewSessionModel.findOneAndUpdate(
        {
          _id: input.session._id,
          userId: input.userId,
          questionCount: {
            $lt: env.INTERVIEW_MAX_QUESTIONS_PER_SESSION,
          },
        },
        {
          $inc: { questionCount: 1 },
        },
        {
          new: true,
          session: mongoSession,
        },
      );

      if (!reserved) {
        throw new AppError(
          409,
          "INTERVIEW_QUESTION_LIMIT_REACHED",
          "The interview session question limit has been reached.",
        );
      }

      const [created] = await InterviewQuestionModel.create(
        [
          {
            userId: input.userId,
            sessionId: input.session._id,
            source: "manual",
            category: input.question.category,
            difficulty: input.question.difficulty,
            question: input.question.question,
            questionFingerprint,
            modelAnswer: input.question.modelAnswer,
          },
        ],
        { session: mongoSession },
      );

      return created;
    });

    await recordActivitySafely({
      userId: input.userId,
      type: "interview.question.created",
      resourceType: "interview-question",
      resourceId: result._id.toString(),
      metadata: {
        sessionId: input.session._id.toString(),
        source: "manual",
      },
    });

    return result;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        409,
        "DUPLICATE_INTERVIEW_QUESTION",
        "This question already exists in the session.",
      );
    }

    throw error;
  }
}

export async function listInterviewQuestions(
  session: InterviewSessionDocument,
  userId: string,
  input: {
    page: number;
    limit: number;
    pinned?: boolean;
    difficulty?: InterviewDifficulty;
    category?: string;
  },
) {
  const filter: Record<string, unknown> = {
    userId,
    sessionId: session._id,
  };

  if (input.pinned !== undefined) {
    filter.isPinned = input.pinned;
  }
  if (input.difficulty) {
    filter.difficulty = input.difficulty;
  }
  if (input.category) {
    filter.category = input.category;
  }

  const [questions, total] = await Promise.all([
    InterviewQuestionModel.find(filter)
      .select(
        "-modelAnswer -explanation -explanationKeyPoints -questionFingerprint",
      )
      .sort({ isPinned: -1, createdAt: 1, _id: 1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    InterviewQuestionModel.countDocuments(filter),
  ]);

  return {
    questions,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export function serializeQuestionDetail(
  question: InterviewQuestionDocument,
  revealAnswers = false,
) {
  const value = question.toObject() as Record<string, unknown>;
  delete value.questionFingerprint;

  if (!revealAnswers) {
    delete value.modelAnswer;
    delete value.explanation;
    delete value.explanationKeyPoints;
  }

  return value;
}

export async function setQuestionPinned(input: {
  question: InterviewQuestionDocument;
  isPinned: boolean;
}): Promise<InterviewQuestionDocument> {
  input.question.isPinned = input.isPinned;
  await input.question.save();
  return input.question;
}

export async function setQuestionNotes(input: {
  question: InterviewQuestionDocument;
  notes: string;
}): Promise<InterviewQuestionDocument> {
  input.question.userNotes = input.notes || undefined;
  await input.question.save();
  return input.question;
}

export async function recordInterviewAttempt(input: {
  userId: string;
  session: InterviewSessionDocument;
  question: InterviewQuestionDocument;
  answerText: string;
}): Promise<InterviewAttemptDocument> {
  if (
    input.answerText.length >
    env.INTERVIEW_MAX_ANSWER_CHARACTERS
  ) {
    throw new AppError(
      413,
      "INTERVIEW_ANSWER_TOO_LONG",
      `The answer exceeds the ${env.INTERVIEW_MAX_ANSWER_CHARACTERS}-character limit.`,
    );
  }

  const attempt = await InterviewAttemptModel.create({
    userId: input.userId,
    sessionId: input.session._id,
    questionId: input.question._id,
    answerText: input.answerText,
    status: "recorded",
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "interview.attempt.recorded",
    resourceType: "interview-attempt",
    resourceId: attempt._id.toString(),
    metadata: {
      sessionId: input.session._id.toString(),
      questionId: input.question._id.toString(),
    },
  });

  return attempt;
}

export async function listInterviewAttempts(
  session: InterviewSessionDocument,
  userId: string,
  input: {
    page: number;
    limit: number;
    questionId?: string;
    status?: string;
  },
) {
  const filter: Record<string, unknown> = {
    userId,
    sessionId: session._id,
  };

  if (input.questionId) {
    filter.questionId = input.questionId;
  }
  if (input.status) {
    filter.status = input.status;
  }

  const [attempts, total] = await Promise.all([
    InterviewAttemptModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    InterviewAttemptModel.countDocuments(filter),
  ]);

  return {
    attempts,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}
