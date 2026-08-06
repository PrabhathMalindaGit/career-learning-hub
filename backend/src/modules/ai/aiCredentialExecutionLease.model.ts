import { Schema, model, type Types } from "mongoose";

export interface AiCredentialExecutionLease {
  credentialId: Types.ObjectId;
  credentialSecretVersion: number;
  routingSnapshotId: string;
  jobId: Types.ObjectId;
  attemptId: string;
  workerId: string;
  state: "active" | "released" | "expired";
  acquiredAt: Date;
  heartbeatAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiCredentialExecutionLeaseSchema =
  new Schema<AiCredentialExecutionLease>(
    {
      credentialId: {
        type: Schema.Types.ObjectId,
        ref: "AiCredential",
        required: true,
        immutable: true,
      },
      credentialSecretVersion: {
        type: Number,
        required: true,
        min: 1,
        immutable: true,
      },
      routingSnapshotId: {
        type: String,
        required: true,
        maxlength: 120,
        match: /^[A-Za-z0-9._:-]+$/,
        immutable: true,
      },
      jobId: {
        type: Schema.Types.ObjectId,
        ref: "JobRecord",
        required: true,
        immutable: true,
      },
      attemptId: {
        type: String,
        required: true,
        maxlength: 180,
        match: /^[A-Za-z0-9._:-]+$/,
        immutable: true,
      },
      workerId: {
        type: String,
        required: true,
        maxlength: 120,
        immutable: true,
      },
      state: {
        type: String,
        enum: ["active", "released", "expired"],
        required: true,
        default: "active",
      },
      acquiredAt: { type: Date, required: true, default: Date.now },
      heartbeatAt: { type: Date, required: true, default: Date.now },
      expiresAt: { type: Date, required: true },
    },
    { timestamps: true, versionKey: false, strict: "throw" },
  );

aiCredentialExecutionLeaseSchema.index(
  { attemptId: 1 },
  { unique: true, name: "ai_credential_lease_attempt_unique" },
);
aiCredentialExecutionLeaseSchema.index(
  { credentialId: 1, state: 1 },
  { name: "ai_credential_lease_credential_state" },
);
aiCredentialExecutionLeaseSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ai_credential_lease_expiry_ttl" },
);

export const AiCredentialExecutionLeaseModel =
  model<AiCredentialExecutionLease>(
    "AiCredentialExecutionLease",
    aiCredentialExecutionLeaseSchema,
  );
