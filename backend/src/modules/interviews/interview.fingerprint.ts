import { createHash } from "node:crypto";

export function normalizeQuestionText(question: string): string {
  return question
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createQuestionFingerprint(
  question: string,
): string {
  return createHash("sha256")
    .update(normalizeQuestionText(question))
    .digest("hex");
}
