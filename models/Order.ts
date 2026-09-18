import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

// Embedded snapshot, not a reference — an order's delivery address must
// stay exactly as it was at checkout even if the customer later edits or
// deletes the saved address it was copied from.
const shippingAddressFields = {
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  apartment: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true },
}

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Server-generated at checkout — human-readable, unique order
    // reference, never client-supplied.
    orderNumber: { type: String, required: true, unique: true, trim: true },
    // Optional link back to the saved address book entry this order's
    // address was copied from (ADDRESSES 1:N ORDERS) — null for a one-off
    // address that was never saved, or if the saved address is later
    // removed. `shippingAddress` below is the immutable snapshot actually
    // used for fulfillment, and never changes even if this reference does.
    addressId: { type: Schema.Types.ObjectId, ref: "Address", default: null },
    // Line items live on OrderItem (order -> OrderItem is one-to-many via
    // OrderItem.orderId) rather than as a parallel array here, so there is
    // only one place that can drift out of sync.
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    shippingCost: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    // Fulfillment status only — payment status is tracked separately on
    // Payment, since the two lifecycles are independent (e.g. a COD order
    // can be "delivered" while its payment is still "pending").
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"] as const,
      required: true,
      default: "pending",
    },
    shippingAddress: { type: shippingAddressFields, required: true },
    // Soft-deleted rather than removed outright — order history must
    // survive independently of its `status` (e.g. "cancelled" is a status,
    // not a deletion).
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type OrderDocument = InferSchemaType<typeof orderSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Order` model once compiled".
const Order = (models.Order as Model<OrderDocument>) ?? model<OrderDocument>("Order", orderSchema)

export default Order
