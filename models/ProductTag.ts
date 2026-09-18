import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

/** Join collection for the PRODUCTS <-> TAGS many-to-many relationship. */
const productTagSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    tagId: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
    deletedAt: { type: Date, default: null },
  },
  // Tier 3: createdAt + deletedAt, no updatedAt — an assignment is either
  // active or soft-deleted, never edited in place.
  { timestamps: { createdAt: true, updatedAt: false } }
)

// One assignment per product/tag pair.
productTagSchema.index({ productId: 1, tagId: 1 }, { unique: true })

export type ProductTagDocument = InferSchemaType<typeof productTagSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `ProductTag` model once compiled".
const ProductTag =
  (models.ProductTag as Model<ProductTagDocument>) ?? model<ProductTagDocument>("ProductTag", productTagSchema)

export default ProductTag
