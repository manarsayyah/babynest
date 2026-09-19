import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import { requireAdmin } from "@/lib/api/auth"
import { notFound, ok, serverError } from "@/lib/api/response"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-product-status"
import type { AdminSettings } from "@/lib/api-client/admin-settings"

/**
 * GET /api/admin/settings — admin only. Returns what the Settings page shows as real:
 *  - the signed-in admin's own account (looked up from the verified session — never from the request; the
 *    password hash is never selected) and when this session expires;
 *  - the store values the application actually runs on. BabyNest has no settings storage (no settings model),
 *    so these are the fixed values in the code, reported read-only rather than pretending to be editable.
 */
export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const admin = await User.findOne({ _id: session.user.id, role: "admin", deletedAt: null })
      .select("firstName lastName email role createdAt")
      .lean()
    if (!admin) return notFound()

    const body: AdminSettings = {
      account: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
      },
      session: { expiresAt: session.expires },
      store: {
        currency: "USD",
        // Every Admin report/dashboard buckets by UTC.
        timezone: "UTC",
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
    }
    return ok(body)
  } catch (error) {
    return serverError("GET /api/admin/settings failed:", error)
  }
}
