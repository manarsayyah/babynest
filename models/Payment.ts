import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const paymentSchema = new Schema(
  {
    // unique enforces ORDERS 1:1 PAYMENTS at the schema level.
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    // Cash on Delivery is the only method this project supports today — no
    // card storage, card tokens, CVV, expiry, or payment-gateway
    // integration of any kind.
    method: {
      type: String,
      enum: ["CASH_ON_DELIVERY"] as const,
      required: true,
      default: "CASH_ON_DELIVERY",
    },
    // Independent from `method` — a COD order still moves through
    // pending -> paid (collected on delivery) or refunded/failed.
    status: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"] as const,
      required: true,
      default: "pending",
    },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type PaymentDocument = InferSchemaType<typeof paymentSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Payment` model once compiled".
const Payment = (models.Payment as Model<PaymentDocument>) ?? model<PaymentDocument>("Payment", paymentSchema)

export default Payment
