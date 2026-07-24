import { Schema, Types, model, type HydratedDocument } from "mongoose";
import { resumeContentMongooseSchema } from "./resumeContent.schema.js";
import type { ResumeContent, ResumeSource } from "./resume.types.js";

export interface ResumeVersion {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  versionNumber: number;
  parentVersionId?: Types.ObjectId;
  source: ResumeSource;
  sourceAssetId?: Types.ObjectId;
  content: ResumeContent;
  changeSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeVersionDocument = HydratedDocument<ResumeVersion>;

const resumeVersionSchema = new Schema<ResumeVersion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    versionNumber: { type: Number, required: true, min: 1 },
    parentVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion" },
    source: {
      type: String,
      enum: ["manual", "pdf-import", "ai-rewrite", "duplicate"],
      required: true,
    },
    sourceAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
    content: { type: resumeContentMongooseSchema, required: true },
    changeSummary: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

resumeVersionSchema.index(
  { resumeId: 1, versionNumber: 1 },
  { unique: true, name: "resume_version_number_unique" },
);
resumeVersionSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });
resumeVersionSchema.index(
  { userId: 1, sourceAssetId: 1 },
  {
    unique: true,
    sparse: true,
    name: "resume_source_asset_unique",
  },
);

export const ResumeVersionModel = model<ResumeVersion>(
  "ResumeVersion",
  resumeVersionSchema,
);
