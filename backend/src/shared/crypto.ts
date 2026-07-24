import { createHash, createHmac, randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIpAddress(ipAddress: string | undefined): string | undefined {
  if (!ipAddress) return undefined;

  return createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(ipAddress)
    .digest("hex");
}

export function createSessionFamilyId(): string {
  return randomUUID();
}
