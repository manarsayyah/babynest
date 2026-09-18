import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    // Tags and images are their own collections (ProductTag, ProductImage)
    // per the approved ERD, not embedded arrays here.
    brand: { type: String, trim: true },
    /** e.g. "Organic cotton", "Food-grade silicone, BPA-free". */
    material: { type: String, trim: true },
    /** e.g. "0-6m", "6-12m", "1-2y", "3+y". */
    ageGroup: { type: String, trim: true },
    // Denormalized aggregate, recalculated from Review documents at the
    // service layer — not authored directly on the product.
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    // Publish/visibility flag — distinct from `deletedAt`. An inactive
    // product still exists and can be managed in the admin catalog but is
    // excluded from the public storefront listing.
    isActive: { type: Boolean, required: true, default: true },
    // Soft-deleted rather than removed outright — Orders/OrderItems/Reviews
    // keep a valid product reference even after a product is discontinued.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ProductDocument = InferSchemaType<typeof productSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Product` model once compiled".
const Product = (models.Product as Model<ProductDocument>) ?? model<ProductDocument>("Product", productSchema)

export default Product
