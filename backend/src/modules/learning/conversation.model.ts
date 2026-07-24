import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface Conversation {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  title: string;
  messageCount: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationDocument =
  HydratedDocument<Conversation>;

const conversationSchema = new Schema<Conversation>(
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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    messageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastMessageAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

conversationSchema.index({
  userId: 1,
  documentId: 1,
  lastMessageAt: -1,
  createdAt: -1,
});

export const ConversationModel = model<Conversation>(
  "Conversation",
  conversationSchema,
);
