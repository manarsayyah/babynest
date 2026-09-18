import { z } from "zod"

/**
 * Shared registration schema — the single source of truth for both the
 * `/api/auth/register` route (the authoritative check) and the Register
 * form's client-side pre-validation, so the rules and messages never drift
 * apart between the two.
 */
export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name must be at most 50 characters."),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name must be at most 50 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export type RegisterInput = z.infer<typeof registerSchema>
