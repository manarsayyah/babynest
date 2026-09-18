import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"

/**
 * User -> Order -> OrderItem -> Product. Only a delivered order counts as a
 * verified purchase — a pending/cancelled order hasn't put the product in
 * the customer's hands yet. Returns the matching OrderItem's id (to link
 * Review.orderItemId) or null if the user never purchased this product.
 */
export async function findVerifiedPurchaseOrderItemId(userId: string, productId: string) {
  const deliveredOrders = await Order.find({ userId, status: "delivered", deletedAt: null })
    .select("_id")
    .lean()
  if (deliveredOrders.length === 0) return null

  const orderItem = await OrderItem.findOne({
    orderId: { $in: deliveredOrders.map((order) => order._id) },
    productId,
  })
    .select("_id")
    .lean()

  return orderItem?._id ?? null
}
