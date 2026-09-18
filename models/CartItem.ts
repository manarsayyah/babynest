import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const cartItemSchema = new Schema(
  {
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    quantity: { type: Number, required: true, min: 1 },
    // Price snapshotted when the item was added/last updated in the cart —
    // distinct from OrderItem.unitPrice, which freezes at checkout.
    unitPrice: { type: Number, required: true, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type CartItemDocument = InferSchemaType<typeof cartItemSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `CartItem` model once compiled".
const CartItem =
  (models.CartItem as Model<CartItemDocument>) ?? model<CartItemDocument>("CartItem", cartItemSchema)

export default CartItem
