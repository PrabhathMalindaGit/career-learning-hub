import { z } from "zod";

export const activityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  type: z
    .string()
    .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
    .optional(),
});
