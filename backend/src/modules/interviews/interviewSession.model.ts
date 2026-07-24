import { Schema, Types, model, type HydratedDocument } from "mongoose";

export const interviewModes = [
  "study",
  "written-practice",
  "mock-interview",
] as const;

export const interviewSessionStatuses = [
  "active",
  "completed",
  "archived",
] as const;

export type InterviewMode = (typeof interviewModes)[number];
export type InterviewSessionStatus =
  (typeof interviewSessionStatuses)[number];

export interface InterviewSession {
  userId: Types.ObjectId;
  title: string;
  sourceResumeId?: Types.ObjectId;
  sourceResumeVersionId?: Types.ObjectId;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  jobDescription?: string;
  mode: InterviewMode;
  status: InterviewSessionStatus;
  questionCount: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewSessionDocument =
  HydratedDocument<InterviewSession>;

const interviewSessionSchema = new Schema<InterviewSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 160,
    },
    sourceResumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
    },
    sourceResumeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeVersion",
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    experienceLevel: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    focusTopics: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    skillGaps: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    jobDescription: {
      type: String,
      trim: true,
      maxlength: 30_000,
    },
    mode: {
      type: String,
      enum: interviewModes,
      required: true,
      default: "study",
    },
    status: {
      type: String,
      enum: interviewSessionStatuses,
      required: true,
      default: "active",
    },
    questionCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

interviewSessionSchema.index({ userId: 1, updatedAt: -1 });
interviewSessionSchema.index({
  userId: 1,
  status: 1,
  updatedAt: -1,
});
interviewSessionSchema.index({
  userId: 1,
  sourceResumeVersionId: 1,
  createdAt: -1,
});

export const InterviewSessionModel = model<InterviewSession>(
  "InterviewSession",
  interviewSessionSchema,
);
