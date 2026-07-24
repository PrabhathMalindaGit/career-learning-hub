import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface Flashcard {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  setId: Types.ObjectId;
  cardIndex: number;
  front: string;
  back: string;
  sourceChunkIds: Types.ObjectId[];
  sourcePages: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type FlashcardDocument = HydratedDocument<Flashcard>;

const flashcardSchema = new Schema<Flashcard>(
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
    setId: {
      type: Schema.Types.ObjectId,
      ref: "FlashcardSet",
      required: true,
    },
    cardIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    front: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 3_000,
    },
    back: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 8_000,
    },
    sourceChunkIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "DocumentChunk" }],
      default: [],
      validate: {
        validator: (value: Types.ObjectId[]) => value.length <= 20,
        message: "A flashcard can reference at most 20 chunks.",
      },
    },
    sourcePages: {
      type: [{ type: Number, min: 1 }],
      default: [],
      validate: {
        validator: (value: number[]) => value.length <= 50,
        message: "A flashcard can reference at most 50 pages.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

flashcardSchema.index(
  { setId: 1, cardIndex: 1 },
  {
    unique: true,
    name: "flashcard_set_index_unique",
  },
);
flashcardSchema.index({
  userId: 1,
  documentId: 1,
  setId: 1,
  cardIndex: 1,
});

export const FlashcardModel = model<Flashcard>(
  "Flashcard",
  flashcardSchema,
);
