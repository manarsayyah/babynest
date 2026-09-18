import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const productImageSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Optional — set only when an image belongs to a specific color/size
    // variant rather than the product as a whole.
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", default: null },
    imageUrl: { type: String, required: true, trim: true },
    altText: { type: String, trim: true },
    displayOrder: { type: Number, required: true, default: 0 },
    isPrimary: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ProductImageDocument = InferSchemaType<typeof productImageSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `ProductImage` model once compiled".
const ProductImage =
  (models.ProductImage as Model<ProductImageDocument>) ??
  model<ProductImageDocument>("ProductImage", productImageSchema)

export default ProductImage
