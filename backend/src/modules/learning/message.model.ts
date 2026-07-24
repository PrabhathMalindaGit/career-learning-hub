import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface Message {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  clientRequestId?: string;
  responseJobId?: Types.ObjectId;
  replyToMessageId?: Types.ObjectId;
  sourceChunkIds: Types.ObjectId[];
  sourcePages: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<Message>;

const messageSchema = new Schema<Message>(
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
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50_000,
    },
    clientRequestId: {
      type: String,
      maxlength: 100,
    },
    responseJobId: {
      type: Schema.Types.ObjectId,
      ref: "JobRecord",
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    sourceChunkIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "DocumentChunk" }],
      default: [],
      validate: {
        validator: (value: Types.ObjectId[]) => value.length <= 20,
        message: "A message can reference at most 20 chunks.",
      },
    },
    sourcePages: {
      type: [{ type: Number, min: 1 }],
      default: [],
      validate: {
        validator: (value: number[]) => value.length <= 100,
        message: "A message can reference at most 100 pages.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

messageSchema.index({
  userId: 1,
  conversationId: 1,
  createdAt: 1,
  _id: 1,
});
messageSchema.index(
  { conversationId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $type: "string" },
    },
    name: "message_conversation_client_request_unique",
  },
);
messageSchema.index(
  { responseJobId: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: {
      responseJobId: { $type: "objectId" },
    },
    name: "message_response_job_role_unique",
  },
);

export const MessageModel = model<Message>(
  "Message",
  messageSchema,
);
