import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"] as const,
      required: true,
      default: "Home",
    },
    // Recipient contact info — required so an order placed against this
    // address can build a complete shipping snapshot (Order.shippingAddress).
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type AddressDocument = InferSchemaType<typeof addressSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Address` model once compiled".
const Address = (models.Address as Model<AddressDocument>) ?? model<AddressDocument>("Address", addressSchema)

export default Address
