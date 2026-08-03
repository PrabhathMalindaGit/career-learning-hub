import { z } from "zod";
import { aiExecutionStates } from "./aiProvider.types.js";

export const aiRoutingActions = [
  "resume-parse",
  "resume-analysis",
  "resume-rewrite",
  "resume-job-comparison",
  "interview-question-generation",
  "interview-question-explanation",
  "interview-answer-feedback",
  "learning-summary",
  "learning-grounded-chat",
  "flashcard-generation",
  "quiz-generation",
] as const;

export type AiRoutingAction = (typeof aiRoutingActions)[number];

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const modelIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/);
const openRouterModelIdSchema = z
  .string()
  .min(3)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,78}\/[A-Za-z0-9][A-Za-z0-9._:-]{0,78}$/)
  .refine((value) => !value.includes(".."));

export const aiRoutingSnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  snapshotVersion: z.literal(1),
  userId: objectIdSchema,
  action: z.enum(aiRoutingActions),
  provider: z.enum(aiExecutionStates),
  mode: z.enum(["direct", "openrouter", "disabled"]),
  preferenceRevision: z.number().int().min(0),
  routingProfileId: objectIdSchema,
  routingProfileVersion: z.number().int().positive(),
  credentialSource: z.enum([
    "none",
    "user-managed",
    "administrator-managed",
  ]),
  credentialId: objectIdSchema.optional(),
  credentialSecretVersion: z.number().int().positive().optional(),
  administratorCredentialPolicyVersion: z.number().int().positive().optional(),
  directModelId: modelIdSchema.optional(),
  rankingPolicyVersion: z.string().min(1).max(120).optional(),
  catalogueVersion: z.number().int().positive().optional(),
  pricingObservedAt: z.coerce.date().optional(),
  freeModelIds: z.array(openRouterModelIdSchema).min(1).max(10).optional(),
  paidFallbackAllowed: z.literal(false).optional(),
  maximumInputTokens: z.number().int().positive().max(2_000_000),
  maximumOutputTokens: z.number().int().positive().max(200_000),
  ttftMs: z.number().int().positive().max(120_000),
  streamIdleMs: z.number().int().positive().max(120_000),
  totalMs: z.number().int().positive().max(300_000),
  executeBefore: z.coerce.date(),
  createdAt: z.coerce.date(),
}).strict().superRefine((value, context) => {
  if (value.mode === "disabled") {
    if (
      value.provider !== "disabled" ||
      value.credentialSource !== "none" ||
      value.credentialId ||
      value.credentialSecretVersion ||
      value.administratorCredentialPolicyVersion ||
      value.directModelId ||
      value.rankingPolicyVersion ||
      value.catalogueVersion ||
      value.pricingObservedAt ||
      value.freeModelIds ||
      value.paidFallbackAllowed !== undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Disabled routing snapshots cannot reference execution material.",
      });
    }
    return;
  }

  if (value.mode === "openrouter") {
    if (
      value.provider === "openrouter" &&
      value.credentialSource === "user-managed" &&
      value.credentialId &&
      value.credentialSecretVersion &&
      value.rankingPolicyVersion &&
      value.catalogueVersion &&
      value.pricingObservedAt &&
      value.freeModelIds &&
      value.paidFallbackAllowed === false &&
      !value.directModelId &&
      !value.administratorCredentialPolicyVersion
    ) {
      return;
    }
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "OpenRouter snapshots require one frozen free-only model plan.",
    });
    return;
  }

  if (value.provider === "disabled" || !value.directModelId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Direct routing snapshots require a provider and model.",
    });
  }
  if (
    value.credentialSource === "user-managed" &&
    value.credentialId &&
    value.credentialSecretVersion &&
    !value.administratorCredentialPolicyVersion
  ) {
    return;
  }
  if (
    value.credentialSource === "administrator-managed" &&
    value.administratorCredentialPolicyVersion &&
    !value.credentialId &&
    !value.credentialSecretVersion
  ) {
    return;
  }
  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Direct routing snapshots require one credential source.",
  });
});

export type AiRoutingSnapshot = z.infer<typeof aiRoutingSnapshotSchema>;

const jobActionMap: Readonly<Record<string, AiRoutingAction>> = {
  "resume.import-pdf": "resume-parse",
  "resume.analyze": "resume-analysis",
  "interview.questions.generate": "interview-question-generation",
  "interview.question.explain": "interview-question-explanation",
  "interview.attempt.feedback": "interview-answer-feedback",
  "learning.document.process": "learning-summary",
  "learning.chat.respond": "learning-grounded-chat",
  "learning.flashcards.generate": "flashcard-generation",
  "learning.quiz.generate": "quiz-generation",
};

export function aiActionForJobType(type: string): AiRoutingAction | undefined {
  return jobActionMap[type];
}
