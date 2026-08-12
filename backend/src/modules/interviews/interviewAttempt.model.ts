import { Schema, Types, model, type HydratedDocument } from "mongoose";
import {
  interviewQuestionTypes,
  type TypedInterviewAnswer,
} from "./interviewQuestion.types.js";

export const interviewAttemptStatuses = [
  "recorded",
  "feedback-queued",
  "feedback-processing",
  "feedback-completed",
  "feedback-failed",
] as const;

export type InterviewAttemptStatus =
  (typeof interviewAttemptStatuses)[number];

export interface InterviewAttempt {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  questionId: Types.ObjectId;
  answerText?: string;
  answer?: TypedInterviewAnswer;
  evaluation?: {
    kind: "multiple-choice";
    score: 0 | 100;
    correct: boolean;
  };
  status: InterviewAttemptStatus;
  feedbackJobId?: Types.ObjectId;
  feedback?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    suggestedAnswerOutline: string[];
    promptVersion: string;
    provider: string;
    model: string;
    completedAt: Date;
  };
  feedbackError?: {
    code: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewAttemptDocument =
  HydratedDocument<InterviewAttempt>;

const typedAnswerSchema = new Schema(
  {
    type: {
      type: String,
      enum: interviewQuestionTypes,
      required: true,
      immutable: true,
    },
    selectedOptionId: {
      type: String,
      trim: true,
      maxlength: 64,
      immutable: true,
    },
    text: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 50_000,
      immutable: true,
    },
  },
  {
    _id: false,
  },
);

const evaluationSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["multiple-choice"],
      required: true,
      immutable: true,
    },
    score: {
      type: Number,
      enum: [0, 100],
      required: true,
      immutable: true,
    },
    correct: {
      type: Boolean,
      required: true,
      immutable: true,
    },
  },
  {
    _id: false,
  },
);

const feedbackSchema = new Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 2_000,
    },
    strengths: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    improvements: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    suggestedAnswerOutline: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    promptVersion: {
      type: String,
      required: true,
      maxlength: 100,
    },
    provider: {
      type: String,
      required: true,
      maxlength: 60,
    },
    model: {
      type: String,
      required: true,
      maxlength: 120,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const interviewAttemptSchema = new Schema<InterviewAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
    },
    answerText: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 50_000,
      immutable: true,
    },
    answer: {
      type: typedAnswerSchema,
      immutable: true,
    },
    evaluation: {
      type: evaluationSchema,
      immutable: true,
    },
    status: {
      type: String,
      enum: interviewAttemptStatuses,
      required: true,
      default: "recorded",
    },
    feedbackJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    feedback: feedbackSchema,
    feedbackError: {
      code: {
        type: String,
        maxlength: 120,
      },
      message: {
        type: String,
        maxlength: 2_000,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

interviewAttemptSchema.index({
  userId: 1,
  sessionId: 1,
  createdAt: -1,
});

interviewAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

interviewAttemptSchema.index({
  userId: 1,
  "feedback.completedAt": -1,
});

interviewAttemptSchema.index({
  userId: 1,
  questionId: 1,
  createdAt: -1,
});

interviewAttemptSchema.index(
  { feedbackJobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "interview_attempt_feedback_job_unique",
  },
);

export const InterviewAttemptModel = model<InterviewAttempt>(
  "InterviewAttempt",
  interviewAttemptSchema,
);
