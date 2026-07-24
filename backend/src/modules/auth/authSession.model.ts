import {
  Schema,
  Types,
  model,
  type HydratedDocument,
} from "mongoose";

export interface AuthSession {
  userId: Types.ObjectId;
  familyId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddressHash?: string;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date;
  revokeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthSessionDocument = HydratedDocument<AuthSession>;

const authSessionSchema = new Schema<AuthSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    familyId: {
      type: String,
      required: true,
      immutable: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
    ipAddressHash: String,
    expiresAt: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    revokedAt: Date,
    revokeReason: {
      type: String,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

authSessionSchema.index(
  { refreshTokenHash: 1 },
  {
    unique: true,
    name: "auth_sessions_refresh_hash_unique",
  },
);
authSessionSchema.index({
  userId: 1,
  revokedAt: 1,
  expiresAt: -1,
});
authSessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: "auth_sessions_expiry_ttl",
  },
);

export const AuthSessionModel = model<AuthSession>(
  "AuthSession",
  authSessionSchema,
);
