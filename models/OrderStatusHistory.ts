import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const orderStatusHistorySchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    // Mirrors Order.status's own enum — a history row can only record a
    // status the order itself is allowed to hold.
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"] as const,
      required: true,
    },
    note: { type: String, trim: true },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  // Tier 4: `changedAt` is this row's only timestamp — no Mongoose-managed
  // createdAt/updatedAt, and history rows are never updated or deleted.
  { timestamps: false }
)

export type OrderStatusHistoryDocument = InferSchemaType<typeof orderStatusHistorySchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `OrderStatusHistory` model once compiled".
const OrderStatusHistory =
  (models.OrderStatusHistory as Model<OrderStatusHistoryDocument>) ??
  model<OrderStatusHistoryDocument>("OrderStatusHistory", orderStatusHistorySchema)

export default OrderStatusHistory
