import { Schema, Types, model, type HydratedDocument } from "mongoose";

export const assetPurposes = [
  "avatar",
  "resume-import",
  "resume-export",
  "resume-thumbnail",
  "learning-document",
  "interview-audio",
  "other",
] as const;

export type AssetPurpose = (typeof assetPurposes)[number];
export type AssetStatus = "temporary" | "active" | "deleted";
export type StorageProvider = "local" | "s3";

export interface Asset {
  userId: Types.ObjectId;
  purpose: AssetPurpose;
  storageProvider: StorageProvider;
  storageKey: string;
  originalFilename?: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  status: AssetStatus;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetDocument = HydratedDocument<Asset>;

const assetSchema = new Schema<Asset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: assetPurposes,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ["local", "s3"],
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      immutable: true,
      maxlength: 1_000,
    },
    originalFilename: {
      type: String,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 150,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    checksumSha256: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    status: {
      type: String,
      enum: ["temporary", "active", "deleted"],
      required: true,
      default: "active",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    expiresAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assetSchema.index({ userId: 1, status: 1, createdAt: -1 });
assetSchema.index({ userId: 1, purpose: 1, createdAt: -1 });
assetSchema.index({ checksumSha256: 1 });
assetSchema.index(
  { storageProvider: 1, storageKey: 1 },
  { unique: true, name: "asset_storage_key_unique" },
);
assetSchema.index({ status: 1, expiresAt: 1 });

export const AssetModel = model<Asset>("Asset", assetSchema);
