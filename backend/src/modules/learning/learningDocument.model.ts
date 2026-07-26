import { Schema, Types, model, type HydratedDocument } from "mongoose";

export const learningDocumentStatuses = [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleting",
] as const;

export type LearningDocumentStatus =
  (typeof learningDocumentStatuses)[number];

export const maximumLearningDocumentWorkFence =
  Number.MAX_SAFE_INTEGER;

export interface LearningDocument {
  userId: Types.ObjectId;
  assetId: Types.ObjectId;
  title: string;
  originalFilename: string;
  mimeType: "application/pdf";
  status: LearningDocumentStatus;
  pageCount: number;
  chunkCount: number;
  summary?: string;
  summaryKeyPoints: string[];
  processingJobId?: Types.ObjectId;
  deletionJobId?: Types.ObjectId;
  workFence: number;
  processingError?: {
    code: string;
    message: string;
  };
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LearningDocumentDocument =
  HydratedDocument<LearningDocument>;

const learningDocumentSchema = new Schema<LearningDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      enum: ["application/pdf"],
      required: true,
    },
    status: {
      type: String,
      enum: learningDocumentStatuses,
      required: true,
      default: "uploaded",
    },
    pageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    chunkCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 20_000,
    },
    summaryKeyPoints: {
      type: [{ type: String, trim: true, maxlength: 2_000 }],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 30,
        message: "A document summary can contain at most 30 key points.",
      },
    },
    processingJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    deletionJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    workFence: {
      type: Number,
      required: true,
      min: 0,
      max: maximumLearningDocumentWorkFence,
      default: 0,
    },
    processingError: {
      code: { type: String, maxlength: 120 },
      message: { type: String, maxlength: 2_000 },
    },
    processedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

learningDocumentSchema.index({ userId: 1, updatedAt: -1 });
learningDocumentSchema.index({
  userId: 1,
  status: 1,
  updatedAt: -1,
});
learningDocumentSchema.index(
  { userId: 1, assetId: 1 },
  {
    unique: true,
    name: "learning_document_user_asset_unique",
  },
);
learningDocumentSchema.index(
  { processingJobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "learning_document_processing_job_unique",
  },
);
learningDocumentSchema.index(
  { deletionJobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "learning_document_deletion_job_unique",
  },
);

export const LearningDocumentModel = model<LearningDocument>(
  "LearningDocument",
  learningDocumentSchema,
);
