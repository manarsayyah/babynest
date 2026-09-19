import { z } from "zod"

export const CUSTOMER_STATUSES = ["active", "inactive"] as const

/**
 * What an admin may change on a customer account: name, email, and whether the
 * account is active. `role`, `password`, `deletedAt` and every other field are
 * deliberately absent — unknown keys in the body are stripped by zod, so a
 * forged `role`/`userId`/`password` can never reach the database.
 */
export const updateCustomerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(50, "First name must be at most 50 characters.").optional(),
    lastName: z.string().trim().min(1, "Last name is required.").max(50, "Last name must be at most 50 characters.").optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").optional(),
    status: z.enum(CUSTOMER_STATUSES).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  })

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
