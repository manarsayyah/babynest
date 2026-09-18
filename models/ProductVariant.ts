import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const productVariantSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    /** Display label for this combination, e.g. "Red / Large". */
    variantName: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    // Adjustment applied to the parent product's price for this variant —
    // 0 means "same price as the base product" — rather than an absolute
    // override, so a plain color/size variant doesn't duplicate the
    // product's price outright.
    priceDelta: { type: Number, required: true, default: 0 },
    // Variant-level inventory is tracked independently of the product's own
    // `stock`, since color/size combinations sell out independently.
    stockQty: { type: Number, required: true, default: 0, min: 0 },
    // Soft-deleted rather than removed outright — OrderItems keep a valid
    // variant reference even after a variant is discontinued.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ProductVariantDocument = InferSchemaType<typeof productVariantSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `ProductVariant` model once compiled".
const ProductVariant =
  (models.ProductVariant as Model<ProductVariantDocument>) ??
  model<ProductVariantDocument>("ProductVariant", productVariantSchema)

export default ProductVariant
