import { z } from "zod";
import { aiExecutionStates } from "./aiProvider.types.js";
import { openRouterActions } from "./openRouterCatalogue.js";

export const aiProviderParamsSchema = z.object({
  provider: z.enum(aiExecutionStates),
}).strict();

export const credentialBodySchema = z.object({
  apiKey: z
    .string()
    .min(8)
    .max(512)
    .refine((value) => value === value.trim()),
  label: z.string().trim().min(1).max(80).optional(),
}).strict();

export const credentialTestBodySchema = z.object({
  credentialVersion: z.number().int().positive(),
}).strict();

export const activationBodySchema = z.object({
  credentialSource: z
    .enum(["user-managed", "administrator-managed"])
    .optional(),
  routingProfileVersion: z.number().int().positive().optional(),
}).strict();

export const emptyAiMutationBodySchema = z.object({}).strict().default({});

export const aiModelsQuerySchema = z.object({
  provider: z.literal("openrouter"),
  action: z.enum(openRouterActions),
}).strict();

export const aiModelsRefreshBodySchema = z.object({
  provider: z.literal("openrouter"),
}).strict();
