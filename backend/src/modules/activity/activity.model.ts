import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface ActivityEvent {
  userId?: Types.ObjectId;
  type: string;
  resourceType?: string;
  resourceId?: string;
  origin: "api" | "worker" | "system";
  metadata?: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityEventDocument = HydratedDocument<ActivityEvent>;

const activityEventSchema = new Schema<ActivityEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    },
    resourceType: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    resourceId: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    origin: {
      type: String,
      enum: ["api", "worker", "system"],
      default: "api",
    },
    metadata: Schema.Types.Mixed,
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

activityEventSchema.index({ userId: 1, occurredAt: -1 });
activityEventSchema.index({ userId: 1, origin: 1, occurredAt: -1 });
activityEventSchema.index({
  userId: 1,
  resourceType: 1,
  occurredAt: -1,
});
activityEventSchema.index({ type: 1, occurredAt: -1 });
activityEventSchema.index({
  resourceType: 1,
  resourceId: 1,
  occurredAt: -1,
});

export const ActivityEventModel = model<ActivityEvent>(
  "ActivityEvent",
  activityEventSchema,
);
