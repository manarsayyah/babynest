import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const cartSchema = new Schema(
  {
    // Not unique — the approved ERD's USERS 1:N CARTS relationship allows a
    // user to have more than one cart (e.g. an abandoned cart kept
    // alongside a new active one). Items live on CartItem (cart -> CartItem
    // is one-to-many via CartItem.cartId), not as an embedded array here.
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type CartDocument = InferSchemaType<typeof cartSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Cart` model once compiled".
const Cart = (models.Cart as Model<CartDocument>) ?? model<CartDocument>("Cart", cartSchema)

export default Cart
