import { Schema, Types, model, type HydratedDocument } from "mongoose";
import type { ResumeDesign } from "./resume.types.js";

export interface Resume {
  userId: Types.ObjectId;
  title: string;
  status: "draft" | "active" | "archived";
  currentVersionId?: Types.ObjectId;
  latestVersionNumber: number;
  design: ResumeDesign;
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeDocument = HydratedDocument<Resume>;

const resumeSchema = new Schema<Resume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      required: true,
    },
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeVersion",
    },
    latestVersionNumber: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    design: {
      templateId: { type: String, required: true, default: "ats-classic", maxlength: 100 },
      colorPaletteId: { type: String, required: true, default: "slate", maxlength: 100 },
      pageSize: { type: String, enum: ["A4", "LETTER"], required: true, default: "A4" },
      fontFamily: { type: String, maxlength: 100, default: "Inter" },
      showProfilePhoto: { type: Boolean, required: true, default: false },
    },
  },
  { timestamps: true, versionKey: false },
);

resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const ResumeModel = model<Resume>("Resume", resumeSchema);
