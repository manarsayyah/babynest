import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Optional link to the purchase this review came from, to support a
    // future "verified purchase" badge without requiring every review to
    // originate from a tracked order.
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    // Determined server-side at creation time (User -> Order -> OrderItem ->
    // Product, requiring a delivered order) — never client-settable.
    isVerifiedPurchase: { type: Boolean, required: true, default: false },
    // Moderation state doubles as the soft-delete mechanism here — an admin
    // hides a review via status rather than a separate deletedAt field.
    status: {
      type: String,
      enum: ["pending", "published", "hidden"] as const,
      required: true,
      default: "pending",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ReviewDocument = InferSchemaType<typeof reviewSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Review` model once compiled".
const Review = (models.Review as Model<ReviewDocument>) ?? model<ReviewDocument>("Review", reviewSchema)

export default Review
