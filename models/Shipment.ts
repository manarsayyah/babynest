import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const shipmentSchema = new Schema(
  {
    // Not unique — ORDERS 1:N SHIPMENTS allows an order to be split across
    // more than one shipment.
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    /** e.g. "BabyNest Logistics", or a third-party carrier name once one is integrated. */
    carrier: { type: String, trim: true },
    shipmentCost: { type: Number, required: true, default: 0, min: 0 },
    estimatedDelivery: { type: Date },
    /** e.g. "Standard Delivery", "Express Delivery". */
    method: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "returned"] as const,
      required: true,
      default: "pending",
    },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ShipmentDocument = InferSchemaType<typeof shipmentSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Shipment` model once compiled".
const Shipment =
  (models.Shipment as Model<ShipmentDocument>) ?? model<ShipmentDocument>("Shipment", shipmentSchema)

export default Shipment
