import { z } from "zod";
import { assetPurposes } from "./asset.model.js";

export const assetIdParamsSchema = z.object({
  assetId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid asset identifier."),
});

export const uploadAssetBodySchema = z
  .object({
    purpose: z.enum(assetPurposes),
    temporary: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    expiresInSeconds: z.coerce
      .number()
      .int()
      .min(60)
      .max(24 * 60 * 60)
      .optional(),
  })
  .strict();

export const signedUrlBodySchema = z
  .object({
    expiresInSeconds: z.coerce.number().int().min(30).max(3600).optional(),
  })
  .strict();

export const signedDownloadQuerySchema = z.object({
  expires: z.coerce.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});
