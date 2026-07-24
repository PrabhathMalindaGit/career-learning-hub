import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface FlashcardSet {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  requestId: string;
  title: string;
  status: "generating" | "ready" | "failed";
  cardCount: number;
  generationJobId?: Types.ObjectId;
  generationError?: {
    code: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type FlashcardSetDocument =
  HydratedDocument<FlashcardSet>;

const flashcardSetSchema = new Schema<FlashcardSet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "LearningDocument",
      required: true,
    },
    requestId: {
      type: String,
      required: true,
      immutable: true,
      match: /^[0-9a-f-]{36}$/i,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["generating", "ready", "failed"],
      required: true,
      default: "generating",
    },
    cardCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    generationJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    generationError: {
      code: { type: String, maxlength: 120 },
      message: { type: String, maxlength: 2_000 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

flashcardSetSchema.index({
  userId: 1,
  documentId: 1,
  createdAt: -1,
});
flashcardSetSchema.index(
  { userId: 1, documentId: 1, requestId: 1 },
  {
    unique: true,
    name: "flashcard_set_request_unique",
  },
);
flashcardSetSchema.index(
  { generationJobId: 1 },
  {
    unique: true,
    sparse: true,
    name: "flashcard_set_generation_job_unique",
  },
);

export const FlashcardSetModel = model<FlashcardSet>(
  "FlashcardSet",
  flashcardSetSchema,
);
