import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import Payment from "@/models/Payment"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updatePaymentStatusSchema } from "@/lib/validation/payment"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/orders/[id]/payment — admin only. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!order) return notFound()

    const payment = await Payment.findOne({ orderId: id }).lean()
    if (!payment) return notFound("No payment exists for this order.")

    return ok(payment)
  } catch (error) {
    return serverError("GET /api/admin/orders/[id]/payment failed:", error)
  }
}

/**
 * PATCH /api/admin/orders/[id]/payment — admin only. This is the only way a
 * COD payment's status can change; customers have no write access to it.
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

    const parsed = updatePaymentStatusSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!order) return notFound()

    const payment = await Payment.findOne({ orderId: id })
    if (!payment) return notFound("No payment exists for this order.")

    const { status } = parsed.data
    payment.status = status
    if (status === "paid") {
      payment.paidAt = new Date()
    } else if (status === "pending") {
      payment.paidAt = null
    }
    // "refunded"/"failed" leave paidAt as-is — it still records when the
    // payment was originally collected, if it was.

    await payment.save()

    return ok(payment.toObject())
  } catch (error) {
    return serverError("PATCH /api/admin/orders/[id]/payment failed:", error)
  }
}
