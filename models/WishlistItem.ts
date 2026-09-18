import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

/**
 * Flat wishlist entry — the approved 24-entity ERD has no separate
 * "Wishlist" container entity, so each saved product is its own row tied
 * directly to the user.
 */
const wishlistItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    deletedAt: { type: Date, default: null },
  },
  // Tier 3: createdAt + deletedAt, no updatedAt.
  { timestamps: { createdAt: true, updatedAt: false } }
)

// One wishlist entry per user/product pair.
wishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true })

export type WishlistItemDocument = InferSchemaType<typeof wishlistItemSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `WishlistItem` model once compiled".
const WishlistItem =
  (models.WishlistItem as Model<WishlistItemDocument>) ??
  model<WishlistItemDocument>("WishlistItem", wishlistItemSchema)

export default WishlistItem
