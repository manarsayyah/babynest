import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import Return from "@/models/Return"
import { requireUser } from "@/lib/api/auth"
import { ok, serverError } from "@/lib/api/response"

/** GET /api/returns — only returns whose Order belongs to the authenticated customer (Return -> Order -> User). */
export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const ownOrders = await Order.find({ userId: session.user.id, deletedAt: null }).select("_id").lean()
    const orderIds = ownOrders.map((order) => order._id)

    const returns =
      orderIds.length > 0
        ? await Return.find({ orderId: { $in: orderIds }, deletedAt: null }).sort({ createdAt: -1 }).lean()
        : []

    return ok(returns)
  } catch (error) {
    return serverError("GET /api/returns failed:", error)
  }
}
