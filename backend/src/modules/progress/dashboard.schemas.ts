import { z } from "zod";

export const dashboardOverviewQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(7).max(365).default(30),
  trendLimit: z.coerce.number().int().min(3).max(30).default(12),
  activityLimit: z.coerce.number().int().min(1).max(50).default(15),
  recentDocumentLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(6),
});

export const dashboardActivityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  type: z
    .string()
    .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
    .optional(),
  origin: z.enum(["api", "worker", "system"]).optional(),
  resourceType: z.string().trim().min(1).max(100).optional(),
});
