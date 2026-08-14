import { randomUUID } from "node:crypto";
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
  effectiveInterviewQuestionType,
  type InterviewMultipleChoiceStorage,
  type InterviewQuestionType,
  type TypedInterviewAnswer,
} from "./interviewQuestion.types.js";
import {
  InterviewSessionModel,
  type InterviewMode,
  type InterviewSessionDocument,
  type InterviewSessionStatus,
} from "./interviewSession.model.js";

export type ManualQuestionInput =
  | {
      questionType: "multiple-choice";
      category: string;
      difficulty: InterviewDifficulty;
      question: string;
      multipleChoice: {
        options: string[];
        correctOptionIndex: number;
      };
    }
  | {
      questionType: "coding";
      category: string;
      difficulty: InterviewDifficulty;
      question: string;
      starterCode?: string;
      modelAnswer?: string;
    }
  | {
      questionType: Exclude<
        InterviewQuestionType,
        "multiple-choice" | "coding"
      >;
      category: string;
      difficulty: InterviewDifficulty;
      question: string;
      modelAnswer?: string;
    };

export type RecordInterviewAttemptInput =
  | { answerText: string }
  | { answer: TypedInterviewAnswer };

function canonicalizeManualQuestion(
  question: ManualQuestionInput,
): {
  questionType: InterviewQuestionType;
  starterCode?: string;
  modelAnswer?: string;
  multipleChoice?: InterviewMultipleChoiceStorage;
} {
  if (
    question.questionType === "multiple-choice"
  ) {
    const options =
      question.multipleChoice.options.map(
        (text) => ({
          id: randomUUID(),
          text,
        }),
      );

    const correctOption =
      options[
        question.multipleChoice
          .correctOptionIndex
      ];

    if (!correctOption) {
      throw new AppError(
        400,
        "INTERVIEW_MCQ_CORRECT_OPTION_INVALID",
        "The correct option must reference an existing Multiple Choice option.",
      );
    }

    return {
      questionType: question.questionType,
      multipleChoice: {
        options,
        correctOptionId: correctOption.id,
      },
    };
  }

  if (question.questionType === "coding") {
    return {
      questionType: question.questionType,
      ...(question.starterCode
        ? { starterCode: question.starterCode }
        : {}),
      modelAnswer: question.modelAnswer,
    };
  }

  return {
    questionType: question.questionType,
    modelAnswer: question.modelAnswer,
  };
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
              ...canonicalizeManualQuestion(question),
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
            ...canonicalizeManualQuestion(
              input.question,
            ),
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
        "-modelAnswer -explanation -explanationKeyPoints -questionFingerprint -starterCode",
      )
      .sort({ isPinned: -1, createdAt: 1, _id: 1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    InterviewQuestionModel.countDocuments(filter),
  ]);

  return {
    questions: questions.map((question) =>
      serializeQuestionSummary(question),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export interface PublicMultipleChoiceQuestion {
  options: Array<{
    id: string;
    text: string;
  }>;
}

function interviewQuestionRecord(
  question:
    | InterviewQuestionDocument
    | Record<string, unknown>,
): Record<string, unknown> {
  if (
    "toObject" in question &&
    typeof question.toObject === "function"
  ) {
    return (
      question as InterviewQuestionDocument
    ).toObject<Record<string, unknown>>();
  }

  return question as Record<string, unknown>;
}

export function serializeQuestionSummary(
  question:
    | InterviewQuestionDocument
    | Record<string, unknown>,
): Record<string, unknown> {
  const value = interviewQuestionRecord(question);

  const questionType = effectiveInterviewQuestionType({
    questionType: value.questionType as
      | InterviewQuestionType
      | undefined,
  });

  const result: Record<string, unknown> = {
    _id: value._id,
    sessionId: value.sessionId,
    source: value.source,
    category: value.category,
    difficulty: value.difficulty,
    question: value.question,
    questionType,
    isPinned: value.isPinned,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };

  if (value.userNotes !== undefined) {
    result.userNotes = value.userNotes;
  }

  if (questionType === "multiple-choice") {
    const multipleChoice = value.multipleChoice as
      | {
          options?: Array<{
            id?: unknown;
            text?: unknown;
          }>;
        }
      | undefined;

    result.multipleChoice = {
      options: (multipleChoice?.options ?? []).map(
        (option) => ({
          id: String(option.id ?? ""),
          text: String(option.text ?? ""),
        }),
      ),
    } satisfies PublicMultipleChoiceQuestion;
  }

  return result;
}

export function serializeQuestionDetail(
  question: InterviewQuestionDocument,
  revealStudyMaterial = false,
): Record<string, unknown> {
  const value = interviewQuestionRecord(question);
  const result = serializeQuestionSummary(value);

  if (
    result.questionType === "coding" &&
    value.starterCode !== undefined
  ) {
    result.starterCode = value.starterCode;
  }

  if (!revealStudyMaterial) {
    return result;
  }

  if (result.questionType === "multiple-choice") {
    if (value.explanation !== undefined) {
      result.explanation = value.explanation;
      result.explanationKeyPoints =
        value.explanationKeyPoints ?? [];
    }

    return result;
  }

  if (value.modelAnswer !== undefined) {
    result.modelAnswer = value.modelAnswer;
  }

  if (value.explanation !== undefined) {
    result.explanation = value.explanation;
  }

  result.explanationKeyPoints =
    value.explanationKeyPoints ?? [];

  return result;
}

function interviewAttemptRecord(
  attempt:
    | InterviewAttemptDocument
    | Record<string, unknown>,
): Record<string, unknown> {
  if (
    "toObject" in attempt &&
    typeof attempt.toObject === "function"
  ) {
    return (
      attempt as InterviewAttemptDocument
    ).toObject<Record<string, unknown>>();
  }

  return attempt as Record<string, unknown>;
}

function correctOptionIdForQuestion(
  question:
    | InterviewQuestionDocument
    | Record<string, unknown>
    | undefined,
): string | undefined {
  if (!question) return undefined;

  const value = interviewQuestionRecord(question);
  const questionType = effectiveInterviewQuestionType({
    questionType: value.questionType as
      | InterviewQuestionType
      | undefined,
  });

  if (questionType !== "multiple-choice") {
    return undefined;
  }

  const multipleChoice = value.multipleChoice as
    | {
        options?: Array<{ id?: unknown }>;
        correctOptionId?: unknown;
      }
    | undefined;

  if (
    typeof multipleChoice?.correctOptionId !== "string" ||
    !multipleChoice.options?.some(
      (option) =>
        String(option.id ?? "") ===
        multipleChoice.correctOptionId,
    )
  ) {
    return undefined;
  }

  return multipleChoice.correctOptionId;
}

export function serializeInterviewAttempt(input: {
  attempt:
    | InterviewAttemptDocument
    | Record<string, unknown>;
  question?:
    | InterviewQuestionDocument
    | Record<string, unknown>;
  revealCorrectOption: boolean;
}): Record<string, unknown> {
  const value = interviewAttemptRecord(input.attempt);

  const result: Record<string, unknown> = {
    _id: value._id,
    userId: value.userId,
    sessionId: value.sessionId,
    questionId: value.questionId,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };

  if (value.answerText !== undefined) {
    result.answerText = value.answerText;
  }

  if (value.answer !== undefined) {
    result.answer = value.answer;
  }

  if (value.evaluation !== undefined) {
    const evaluation = value.evaluation as {
      kind?: unknown;
      score?: unknown;
      correct?: unknown;
    };

    const publicEvaluation: Record<string, unknown> = {
      kind: evaluation.kind,
      score: evaluation.score,
      correct: evaluation.correct,
    };

    if (
      input.revealCorrectOption &&
      input.question &&
      String(
        interviewQuestionRecord(input.question)._id ?? "",
      ) === String(value.questionId ?? "")
    ) {
      const correctOptionId =
        correctOptionIdForQuestion(input.question);

      if (correctOptionId) {
        publicEvaluation.correctOptionId =
          correctOptionId;
      }
    }

    result.evaluation = publicEvaluation;
  }

  if (value.feedbackJobId !== undefined) {
    result.feedbackJobId = value.feedbackJobId;
  }

  if (value.feedback !== undefined) {
    result.feedback = value.feedback;
  }

  if (value.feedbackError !== undefined) {
    result.feedbackError = value.feedbackError;
  }

  return result;
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

function assertAnswerWithinLimit(answer: string): void {
  if (
    answer.length >
    env.INTERVIEW_MAX_ANSWER_CHARACTERS
  ) {
    throw new AppError(
      413,
      "INTERVIEW_ANSWER_TOO_LONG",
      `The answer exceeds the ${env.INTERVIEW_MAX_ANSWER_CHARACTERS}-character limit.`,
    );
  }
}

function rejectAttemptTypeMismatch(): never {
  throw new AppError(
    409,
    "INTERVIEW_ATTEMPT_TYPE_MISMATCH",
    "The submitted answer does not match this interview question type.",
  );
}

export async function recordInterviewAttempt(input: {
  userId: string;
  session: InterviewSessionDocument;
  question: InterviewQuestionDocument;
  submission: RecordInterviewAttemptInput;
}): Promise<InterviewAttemptDocument> {
  const effectiveType = effectiveInterviewQuestionType(
    input.question,
  );

  let answerFields:
    | { answerText: string }
    | {
        answer: TypedInterviewAnswer;
        evaluation?: {
          kind: "multiple-choice";
          score: 0 | 100;
          correct: boolean;
        };
      };

  if (effectiveType === "legacy-open-response") {
    if (!("answerText" in input.submission)) {
      rejectAttemptTypeMismatch();
    }

    assertAnswerWithinLimit(
      input.submission.answerText,
    );
    answerFields = {
      answerText: input.submission.answerText,
    };
  } else {
    if (!("answer" in input.submission)) {
      rejectAttemptTypeMismatch();
    }

    const answer = input.submission.answer;

    if (answer.type !== effectiveType) {
      rejectAttemptTypeMismatch();
    }

    if (answer.type === "multiple-choice") {
      const multipleChoice =
        input.question.multipleChoice;

      if (
        !multipleChoice ||
        !multipleChoice.options.some(
          (option) =>
            option.id ===
            multipleChoice.correctOptionId,
        )
      ) {
        throw new AppError(
          409,
          "INTERVIEW_MCQ_CONFIGURATION_INVALID",
          "This Multiple Choice question is not configured correctly.",
        );
      }

      const selectedOption =
        multipleChoice.options.find(
          (option) =>
            option.id === answer.selectedOptionId,
        );

      if (!selectedOption) {
        throw new AppError(
          400,
          "INTERVIEW_MCQ_OPTION_INVALID",
          "Select one of the available Multiple Choice options.",
        );
      }

      const correct =
        selectedOption.id ===
        multipleChoice.correctOptionId;

      answerFields = {
        answer,
        evaluation: {
          kind: "multiple-choice",
          score: correct ? 100 : 0,
          correct,
        },
      };
    } else {
      assertAnswerWithinLimit(answer.text);
      answerFields = { answer };
    }
  }

  const attempt = await InterviewAttemptModel.create({
    userId: input.userId,
    sessionId: input.session._id,
    questionId: input.question._id,
    ...answerFields,
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

  const questionIds = [
    ...new Set(
      attempts.map((attempt) =>
        String(attempt.questionId),
      ),
    ),
  ];

  const questions =
    questionIds.length === 0
      ? []
      : await InterviewQuestionModel.find({
          _id: { $in: questionIds },
          userId,
          sessionId: session._id,
        }).lean();

  const questionById = new Map(
    questions.map((question) => [
      String(question._id),
      question,
    ]),
  );

  return {
    attempts: attempts.map((attempt) =>
      serializeInterviewAttempt({
        attempt,
        question: questionById.get(
          String(attempt.questionId),
        ),
        revealCorrectOption: true,
      }),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}
