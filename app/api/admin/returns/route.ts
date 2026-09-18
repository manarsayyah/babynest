import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Return from "@/models/Return"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { parsePagination } from "@/lib/api/pagination"
import { RETURN_STATUSES } from "@/lib/validation/return"

/** GET /api/admin/returns — admin only. Lists all return requests, optionally filtered by status/orderId. */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const filter: Record<string, unknown> = { deletedAt: null }

    const status = searchParams.get("status")
    if (status) {
      if (!(RETURN_STATUSES as readonly string[]).includes(status)) {
        return badRequest("Invalid status filter.")
      }
      filter.status = status
    }

    const orderId = searchParams.get("orderId")
    if (orderId) {
      if (!isValidObjectId(orderId)) return badRequest("Invalid orderId.")
      filter.orderId = orderId
    }

    const [returns, total] = await Promise.all([
      Return.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Return.countDocuments(filter),
    ])

    return ok({ items: returns, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    return serverError("GET /api/admin/returns failed:", error)
  }
}
