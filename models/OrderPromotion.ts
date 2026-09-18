import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

/** Join collection for the ORDERS <-> PROMOTIONS many-to-many relationship. */
const orderPromotionSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    promotionId: { type: Schema.Types.ObjectId, ref: "Promotion", required: true },
    discountApplied: { type: Number, required: true, min: 0 },
  },
  // Tier 4: creation timestamp only.
  { timestamps: { createdAt: true, updatedAt: false } }
)

// One application of a given promotion per order.
orderPromotionSchema.index({ orderId: 1, promotionId: 1 }, { unique: true })

export type OrderPromotionDocument = InferSchemaType<typeof orderPromotionSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `OrderPromotion` model once compiled".
const OrderPromotion =
  (models.OrderPromotion as Model<OrderPromotionDocument>) ??
  model<OrderPromotionDocument>("OrderPromotion", orderPromotionSchema)

export default OrderPromotion
