import { z } from "zod";

export const authEmailSchema = z.string().trim().email();

export const authPasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72);

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: authEmailSchema,
  password: authPasswordSchema,
});
