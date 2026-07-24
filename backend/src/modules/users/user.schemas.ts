import { z } from "zod";

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().trim().min(2).max(100).optional(),
    headline: z.string().trim().max(160).optional(),
    timezone: z.string().trim().max(100).optional(),
    locale: z.string().trim().max(20).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile property is required.",
  });

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z
      .string()
      .min(12)
      .max(128)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/),
  })
  .strict()
  .refine(
    ({ currentPassword, newPassword }) =>
      currentPassword !== newPassword,
    {
      message: "The new password must differ from the current password.",
      path: ["newPassword"],
    },
  );
