import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import Order from "@/models/Order"
import Payment from "@/models/Payment"
import Address from "@/models/Address"
import WishlistItem from "@/models/WishlistItem"
import Notification from "@/models/Notification"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateCustomerSchema } from "@/lib/validation/customer"

type RouteParams = { params: Promise<{ id: string }> }

const RECENT_ORDERS_LIMIT = 20

type CustomerLike = {
  _id: { toString(): string }
  firstName: string
  lastName: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

/** The only shape of a user that ever leaves the server from these routes — an allow-list, so `password` can't leak. */
function toCustomer(user: CustomerLike) {
  return {
    _id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    status: user.deletedAt ? ("inactive" as const) : ("active" as const),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt ?? null,
  }
}

/** A customer account by id — admin accounts are not managed through the customers API, so they 404 here. */
async function findCustomer(id: string) {
  return User.findOne({ _id: id, role: "customer" }).select("-password")
}

/**
 * GET /api/admin/customers/[id] — admin only. Profile, addresses, order stats
 * (live, non-cancelled orders — the Dashboard's revenue rule), the customer's
 * recent orders (every status, so cancelled ones are visible but not counted),
 * wishlist size and notification counts.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const user = await findCustomer(id)
    if (!user) return notFound()

    const [addresses, orders, wishlistCount, notificationTotal, notificationUnread] = await Promise.all([
      Address.find({ userId: id, deletedAt: null }).sort({ isDefault: -1, createdAt: 1 }).lean(),
      Order.find({ userId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      WishlistItem.countDocuments({ userId: id, deletedAt: null }),
      Notification.countDocuments({ userId: id, deletedAt: null }),
      Notification.countDocuments({ userId: id, deletedAt: null, isRead: false }),
    ])

    const payments = orders.length > 0 ? await Payment.find({ orderId: { $in: orders.map((order) => order._id) } }).lean() : []
    const paymentByOrder = new Map(payments.map((payment) => [payment.orderId.toString(), payment.status]))

    const counted = orders.filter((order) => order.status !== "cancelled")

    return ok({
      customer: toCustomer(user),
      stats: {
        ordersCount: counted.length,
        totalSpent: counted.reduce((sum, order) => sum + order.total, 0),
        lastOrderDate: counted[0]?.createdAt ?? null,
        cancelledOrders: orders.length - counted.length,
      },
      addresses: addresses.map((address) => ({
        _id: address._id.toString(),
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        apartment: address.apartment ?? null,
        city: address.city,
        state: address.state ?? null,
        postalCode: address.postalCode ?? null,
        country: address.country,
        isDefault: address.isDefault,
      })),
      orders: orders.slice(0, RECENT_ORDERS_LIMIT).map((order) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        paymentStatus: paymentByOrder.get(order._id.toString()) ?? null,
      })),
      wishlistCount,
      notifications: { total: notificationTotal, unread: notificationUnread },
    })
  } catch (error) {
    return serverError("GET /api/admin/customers/[id] failed:", error)
  }
}

/**
 * PATCH /api/admin/customers/[id] — admin only. Edits name/email and/or
 * disables/enables the account. There is no `isActive` on User, so "inactive"
 * follows the existing soft-delete convention: `deletedAt` set = disabled,
 * cleared = active. Nothing is ever physically deleted, and `role`/`password`
 * can't be changed through this route (they aren't in the schema).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateCustomerSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const user = await findCustomer(id)
    if (!user) return notFound()

    const { firstName, lastName, email, status } = parsed.data

    if (email !== undefined && email !== user.email) {
      const taken = await User.findOne({ email, _id: { $ne: id } }).select("_id").lean()
      if (taken) return conflict("An account with this email already exists.")
      user.email = email
    }
    if (firstName !== undefined) user.firstName = firstName
    if (lastName !== undefined) user.lastName = lastName
    if (status === "inactive" && !user.deletedAt) user.deletedAt = new Date()
    if (status === "active") user.deletedAt = null

    await user.save()

    return ok(toCustomer(user))
  } catch (error) {
    return serverError("PATCH /api/admin/customers/[id] failed:", error)
  }
}
