import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const orderItemSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant" },
    quantity: { type: Number, required: true, min: 1 },
    // Snapshots of the price at purchase time — must be copied in when the
    // order is placed and never recalculated from the product's current
    // price, so past orders stay accurate after a price change.
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

export type OrderItemDocument = InferSchemaType<typeof orderItemSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `OrderItem` model once compiled".
const OrderItem =
  (models.OrderItem as Model<OrderItemDocument>) ?? model<OrderItemDocument>("OrderItem", orderItemSchema)

export default OrderItem
