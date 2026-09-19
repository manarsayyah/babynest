import type { NextRequest } from "next/server"
import { Types, type PipelineStage } from "mongoose"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import Order from "@/models/Order"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { CUSTOMER_STATUSES } from "@/lib/validation/customer"

const NEW_CUSTOMER_WINDOW_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "orders-desc": { ordersCount: -1, createdAt: -1 },
  "spent-desc": { totalSpent: -1, createdAt: -1 },
  "name-asc": { firstName: 1, lastName: 1 },
}

type Condition = Record<string, unknown>

/** Start of the registration window a `dateRange` filter selects — "30"/"90" days back, or Jan 1st of this year. */
function dateRangeStart(range: string): Date | null {
  const now = new Date()
  if (range === "year") return new Date(now.getFullYear(), 0, 1)
  if (range === "30" || range === "90") return new Date(now.getTime() - Number(range) * DAY_MS)
  return null
}

type CustomerRow = {
  _id: unknown
  firstName: string
  lastName: string
  email: string
  createdAt: Date
  deletedAt: Date | null
  ordersCount: number
  totalSpent: number
  lastOrderDate: Date | null
}

/**
 * GET /api/admin/customers — admin only. Paginated list of *customer* accounts
 * (role "customer" — admins never appear), including disabled ones, each with
 * order stats aggregated from Orders. Password hashes are never selected.
 *
 * Order stats follow the Dashboard's rule for revenue: only live
 * (not soft-deleted) and not-cancelled orders count as purchases.
 *
 * Filters: `status` (active | inactive), `dateRange` (30 | 90 | year — by
 * registration date), `search` (name, email, or an exact user id), `sort`.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const conditions: Condition[] = [{ role: "customer" }]

    const status = searchParams.get("status")
    if (status) {
      if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) return badRequest("Invalid status filter.")
      // "Disabled" is the soft-delete convention: an account with deletedAt set is inactive.
      conditions.push(status === "active" ? { deletedAt: null } : { deletedAt: { $ne: null } })
    }

    const dateRange = searchParams.get("dateRange")
    if (dateRange) {
      const start = dateRangeStart(dateRange)
      if (!start) return badRequest("Invalid dateRange filter.")
      conditions.push({ createdAt: { $gte: start } })
    }

    const search = searchParams.get("search")?.trim()
    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean)
      conditions.push({
        $or: [
          { email: { $regex: escapeRegex(search), $options: "i" } },
          // Every word must match the first or last name, so "sarah miller" finds Sarah Miller.
          {
            $and: tokens.map((token) => ({
              $or: [
                { firstName: { $regex: escapeRegex(token), $options: "i" } },
                { lastName: { $regex: escapeRegex(token), $options: "i" } },
              ],
            })),
          },
          // Aggregation stages don't cast strings, so the id must be an ObjectId here.
          ...(isValidObjectId(search) ? [{ _id: new Types.ObjectId(search) }] : []),
        ],
      })
    }

    const sort = SORT_OPTIONS[searchParams.get("sort") ?? "newest"] ?? SORT_OPTIONS.newest
    const match = { $and: conditions }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: Order.collection.name,
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: [{ $ifNull: ["$deletedAt", null] }, null] },
                    { $ne: ["$status", "cancelled"] },
                  ],
                },
              },
            },
            { $group: { _id: null, ordersCount: { $sum: 1 }, totalSpent: { $sum: "$total" }, lastOrderDate: { $max: "$createdAt" } } },
          ],
          as: "orderStats",
        },
      },
      {
        $addFields: {
          ordersCount: { $ifNull: [{ $first: "$orderStats.ordersCount" }, 0] },
          totalSpent: { $ifNull: [{ $first: "$orderStats.totalSpent" }, 0] },
          lastOrderDate: { $ifNull: [{ $first: "$orderStats.lastOrderDate" }, null] },
        },
      },
      { $sort: { ...sort, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      // Allow-list projection: `password` (and everything else) is simply never selected.
      { $project: { firstName: 1, lastName: 1, email: 1, createdAt: 1, deletedAt: 1, ordersCount: 1, totalSpent: 1, lastOrderDate: 1 } },
    ]

    const now = Date.now()
    const base = { role: "customer" as const }
    const [rows, total, totalAll, active, newCustomers, repeatBuyers] = await Promise.all([
      User.aggregate<CustomerRow>(pipeline).collation({ locale: "en", strength: 2 }),
      User.countDocuments(match),
      User.countDocuments(base),
      User.countDocuments({ ...base, deletedAt: null }),
      User.countDocuments({ ...base, createdAt: { $gte: new Date(now - NEW_CUSTOMER_WINDOW_DAYS * DAY_MS) } }),
      // Users with 2+ live, non-cancelled orders.
      Order.aggregate<{ _id: unknown }>([
        { $match: { deletedAt: null, status: { $ne: "cancelled" } } },
        { $group: { _id: "$userId", orders: { $sum: 1 } } },
        { $match: { orders: { $gte: 2 } } },
      ]),
    ])
    const returning = repeatBuyers.length
      ? await User.countDocuments({ ...base, _id: { $in: repeatBuyers.map((entry) => entry._id) } })
      : 0

    return ok({
      items: rows.map((row) => ({
        _id: String(row._id),
        firstName: row.firstName,
        lastName: row.lastName,
        name: `${row.firstName} ${row.lastName}`.trim(),
        email: row.email,
        status: row.deletedAt ? "inactive" : "active",
        createdAt: row.createdAt,
        ordersCount: row.ordersCount,
        totalSpent: row.totalSpent,
        lastOrderDate: row.lastOrderDate,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: { total: totalAll, active, new: newCustomers, returning },
    })
  } catch (error) {
    return serverError("GET /api/admin/customers failed:", error)
  }
}
