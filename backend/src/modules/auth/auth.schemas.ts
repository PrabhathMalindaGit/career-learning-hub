import { z } from "zod";

const email = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const registerBodySchema = z
  .object({
    email,
    password,
    displayName: z.string().trim().min(2).max(100),
  })
  .strict();

export const loginBodySchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
