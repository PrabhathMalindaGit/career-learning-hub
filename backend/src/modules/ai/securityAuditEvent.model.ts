import { Schema, model, type Types } from "mongoose";
import { aiExecutionStates, type AiExecutionState } from "./aiProvider.types.js";

export const securityAuditActions = [
  "credential.saved",
  "credential.replaced",
  "credential.tested",
  "credential.deleted",
  "provider.activated",
  "ai.disabled",
  "activation.conflict",
  "credential.decryption-failed",
  "routing.stale-rejected",
  "execution-lease.acquisition-failed",
  "execution-lease.release-failed",
] as const;

export interface SecurityAuditEvent {
  actorUserId: Types.ObjectId;
  subjectUserId: Types.ObjectId;
  actorRole?: "user" | "admin" | "system";
  action: (typeof securityAuditActions)[number];
  provider?: AiExecutionState;
  credentialSecretVersion?: number;
  preferenceRevision?: number;
  routingProfileVersion?: number;
  requestId?: string;
  outcome: "success" | "failure" | "conflict" | "pending";
  normalizedReason?: string;
  sourceIpHash?: string;
  userAgentHash?: string;
  occurredAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const securityAuditEventSchema = new Schema<SecurityAuditEvent>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, enum: ["user", "admin", "system"] },
    action: { type: String, enum: securityAuditActions, required: true },
    provider: { type: String, enum: aiExecutionStates },
    credentialSecretVersion: { type: Number, min: 1 },
    preferenceRevision: { type: Number, min: 0 },
    routingProfileVersion: { type: Number, min: 1 },
    requestId: {
      type: String,
      trim: true,
      maxlength: 120,
      match: /^[A-Za-z0-9._:-]+$/,
    },
    outcome: {
      type: String,
      enum: ["success", "failure", "conflict", "pending"],
      required: true,
    },
    normalizedReason: {
      type: String,
      trim: true,
      maxlength: 120,
      match: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    },
    sourceIpHash: { type: String, match: /^[a-f0-9]{64}$/ },
    userAgentHash: { type: String, match: /^[a-f0-9]{64}$/ },
    occurredAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

securityAuditEventSchema.index(
  { subjectUserId: 1, occurredAt: -1 },
  { name: "security_audit_subject_time" },
);
securityAuditEventSchema.index(
  { actorUserId: 1, occurredAt: -1 },
  { name: "security_audit_actor_time" },
);
securityAuditEventSchema.index(
  { action: 1, occurredAt: -1 },
  { name: "security_audit_action_time" },
);
securityAuditEventSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "security_audit_expiry_ttl" },
);

export const SecurityAuditEventModel = model<SecurityAuditEvent>(
  "SecurityAuditEvent",
  securityAuditEventSchema,
);
