import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Address from "@/models/Address"
import { requireUser } from "@/lib/api/auth"
import { badRequest, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { createAddressSchema } from "@/lib/validation/address"

/** GET /api/addresses — only the authenticated user's own non-deleted addresses. */
export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const addresses = await Address.find({ userId: session.user.id, deletedAt: null })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return ok(addresses)
  } catch (error) {
    return serverError("GET /api/addresses failed:", error)
  }
}

/** POST /api/addresses — userId always comes from the session, never the request body. */
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createAddressSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { isDefault, ...rest } = parsed.data

    if (isDefault) {
      await Address.updateMany(
        { userId: session.user.id, deletedAt: null, isDefault: true },
        { isDefault: false }
      )
    }

    const address = await Address.create({
      ...rest,
      userId: session.user.id,
      isDefault: Boolean(isDefault),
    })

    return created(address)
  } catch (error) {
    return serverError("POST /api/addresses failed:", error)
  }
}
