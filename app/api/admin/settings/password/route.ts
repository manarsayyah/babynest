import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { changePasswordSchema } from "@/lib/validation/admin-settings"

/** Same bcrypt cost factor as registration and the admin seed script. */
const SALT_ROUNDS = 12

/**
 * PATCH /api/admin/settings/password — admin only. Changes the signed-in admin's OWN password.
 * The account is taken from the verified server session (a `userId`/`role` in the body is never read), the
 * current password must be correct, and the hash is never returned. Existing sign-in sessions are JWTs and stay
 * valid until they expire — Auth.js is not modified here.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const admin = await User.findOne({ _id: session.user.id, role: "admin", deletedAt: null })
    if (!admin) return notFound()

    const matches = await bcrypt.compare(parsed.data.currentPassword, admin.password)
    if (!matches) {
      return badRequest("Current password is incorrect.", { currentPassword: ["Current password is incorrect."] })
    }

    admin.password = await bcrypt.hash(parsed.data.newPassword, SALT_ROUNDS)
    await admin.save()

    return ok({ changed: true })
  } catch (error) {
    return serverError("PATCH /api/admin/settings/password failed:", error)
  }
}
