import { Schema, Types, model, type HydratedDocument } from "mongoose";
import {
  interviewQuestionTypes,
  type InterviewMultipleChoiceStorage,
  type InterviewQuestionType,
} from "./interviewQuestion.types.js";

export const interviewDifficulties = [
  "easy",
  "medium",
  "hard",
] as const;

export type InterviewDifficulty =
  (typeof interviewDifficulties)[number];

export interface InterviewQuestion {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  source: "manual" | "ai-generated";
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  questionFingerprint: string;
  questionType?: InterviewQuestionType;
  multipleChoice?: InterviewMultipleChoiceStorage;
  modelAnswer?: string;
  explanation?: string;
  explanationKeyPoints: string[];
  explanationJobId?: Types.ObjectId;
  generationJobId?: Types.ObjectId;
  isPinned: boolean;
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewQuestionDocument =
  HydratedDocument<InterviewQuestion>;

const multipleChoiceOptionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      maxlength: 64,
      immutable: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
      immutable: true,
    },
  },
  {
    _id: false,
  },
);

const multipleChoiceSchema = new Schema(
  {
    options: {
      type: [multipleChoiceOptionSchema],
      required: true,
      immutable: true,
      validate: {
        validator: (value: unknown[]) =>
          value.length >= 2 && value.length <= 8,
        message: "Multiple Choice requires 2–8 options.",
      },
    },
    correctOptionId: {
      type: String,
      required: true,
      maxlength: 64,
      immutable: true,
    },
  },
  {
    _id: false,
  },
);

const interviewQuestionSchema = new Schema<InterviewQuestion>(
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
    source: {
      type: String,
      enum: ["manual", "ai-generated"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    difficulty: {
      type: String,
      enum: interviewDifficulties,
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2_000,
      immutable: true,
    },
    questionFingerprint: {
      type: String,
      required: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/,
    },
    questionType: {
      type: String,
      enum: interviewQuestionTypes,
      immutable: true,
    },
    multipleChoice: {
      type: multipleChoiceSchema,
      immutable: true,
    },
    modelAnswer: {
      type: String,
      trim: true,
      maxlength: 12_000,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 12_000,
    },
    explanationKeyPoints: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    explanationJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    generationJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    isPinned: {
      type: Boolean,
      required: true,
      default: false,
    },
    userNotes: {
      type: String,
      trim: true,
      maxlength: 8_000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

interviewQuestionSchema.index(
  { sessionId: 1, questionFingerprint: 1 },
  {
    unique: true,
    name: "interview_question_session_fingerprint_unique",
  },
);

interviewQuestionSchema.index({
  userId: 1,
  sessionId: 1,
  isPinned: -1,
  createdAt: -1,
});

interviewQuestionSchema.index({
  generationJobId: 1,
  createdAt: 1,
});

interviewQuestionSchema.index(
  { explanationJobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "interview_question_explanation_job_unique",
  },
);

export const InterviewQuestionModel = model<InterviewQuestion>(
  "InterviewQuestion",
  interviewQuestionSchema,
);
