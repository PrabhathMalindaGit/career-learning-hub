import { Schema, Types, model, type HydratedDocument } from "mongoose";

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
