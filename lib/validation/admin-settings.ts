import { z } from "zod"

/**
 * Change-password body. Only the two passwords are ever read — the account being changed always comes from the
 * verified server session, never from the request. bcrypt only uses the first 72 bytes of a password, so a longer
 * one would be silently truncated; it is rejected instead.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200, "Current password is too long."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(72, "New password must be at most 72 characters."),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password.",
    path: ["newPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
