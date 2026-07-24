import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface DocumentChunk {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  text: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentChunkDocument =
  HydratedDocument<DocumentChunk>;

const documentChunkSchema = new Schema<DocumentChunk>(
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
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    pageStart: {
      type: Number,
      required: true,
      min: 1,
    },
    pageEnd: {
      type: Number,
      required: true,
      min: 1,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30_000,
    },
    wordCount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentChunkSchema.index(
  { documentId: 1, chunkIndex: 1 },
  {
    unique: true,
    name: "document_chunk_document_index_unique",
  },
);
documentChunkSchema.index({
  userId: 1,
  documentId: 1,
  chunkIndex: 1,
});
documentChunkSchema.index({
  documentId: 1,
  pageStart: 1,
  pageEnd: 1,
});

export const DocumentChunkModel = model<DocumentChunk>(
  "DocumentChunk",
  documentChunkSchema,
);
