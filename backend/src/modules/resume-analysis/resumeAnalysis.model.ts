import { randomUUID } from "node:crypto";
import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface ResumeAnalysisSuggestion {
  id: string;
  bulletId: string;
  originalText: string;
  rewrittenText: string;
  rationale: string;
  verificationRequired: boolean;
}

export interface ResumeAnalysis {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  resumeVersionId: Types.ObjectId;
  jobId?: Types.ObjectId;
  target: {
    role: string;
    company?: string;
    jobDescription?: string;
  };
  scoringVersion: string;
  promptVersion: string;
  provider: string;
  model: string;
  scoreBreakdown: {
    keywordMatch: number;
    clarity: number;
    evidence: number;
    formatting: number;
  };
  totalScore: number;
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
  strengths: Array<{
    title: string;
    detail: string;
  }>;
  missingKeywords: string[];
  suggestions: ResumeAnalysisSuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeAnalysisDocument = HydratedDocument<ResumeAnalysis>;

const suggestionSchema = new Schema<ResumeAnalysisSuggestion>(
  {
    id: {
      type: String,
      required: true,
      default: () => randomUUID(),
      immutable: true,
    },
    bulletId: { type: String, required: true, immutable: true },
    originalText: { type: String, required: true, maxlength: 2_000 },
    rewrittenText: { type: String, required: true, maxlength: 2_000 },
    rationale: { type: String, required: true, maxlength: 1_000 },
    verificationRequired: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const issueSchema = new Schema(
  {
    code: { type: String, required: true, maxlength: 120 },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    message: { type: String, required: true, maxlength: 1_000 },
  },
  { _id: false },
);

const strengthSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    detail: { type: String, required: true, maxlength: 1_000 },
  },
  { _id: false },
);

const resumeAnalysisSchema = new Schema<ResumeAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    resumeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeVersion",
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    target: {
      role: { type: String, required: true, trim: true, maxlength: 200 },
      company: { type: String, trim: true, maxlength: 200 },
      jobDescription: { type: String, trim: true, maxlength: 30_000 },
    },
    scoringVersion: {
      type: String,
      required: true,
      default: "resume-readiness-v1",
      maxlength: 100,
    },
    promptVersion: {
      type: String,
      required: true,
      default: "resume-analysis-prompt-v1",
      maxlength: 100,
    },
    provider: { type: String, required: true, maxlength: 60 },
    model: { type: String, required: true, maxlength: 120 },
    scoreBreakdown: {
      keywordMatch: { type: Number, required: true, min: 0, max: 25 },
      clarity: { type: Number, required: true, min: 0, max: 25 },
      evidence: { type: Number, required: true, min: 0, max: 25 },
      formatting: { type: Number, required: true, min: 0, max: 25 },
    },
    totalScore: { type: Number, required: true, min: 0, max: 100 },
    issues: { type: [issueSchema], default: [] },
    strengths: { type: [strengthSchema], default: [] },
    missingKeywords: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    suggestions: { type: [suggestionSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

resumeAnalysisSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
resumeAnalysisSchema.index({
  userId: 1,
  resumeVersionId: 1,
  createdAt: -1,
});
resumeAnalysisSchema.index(
  { jobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "resume_analysis_job_unique",
  },
);

export const ResumeAnalysisModel = model<ResumeAnalysis>(
  "ResumeAnalysis",
  resumeAnalysisSchema,
);
