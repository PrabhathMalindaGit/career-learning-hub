import { z } from "zod";

export const jobIdParamsSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const infrastructureTestJobBodySchema = z
  .object({
    message: z.string().trim().min(1).max(500),
  })
  .strict();
