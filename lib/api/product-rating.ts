import mongoose from "mongoose"
import Review from "@/models/Review"
import Product from "@/models/Product"

/**
 * Recalculates Product.rating/reviewCount from that product's published,
 * non-deleted reviews — the denormalized aggregate is always derived, never
 * authored directly (see the comment on Product.rating). Called after any
 * review create/update/delete/moderation change; a no-op result (0/0) is
 * written when there are no published reviews.
 */
export async function recalculateProductRating(productId: string): Promise<void> {
  const [stats] = await Review.aggregate<{ average: number; count: number }>([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        deletedAt: null,
        status: "published",
      },
    },
    { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ])

  await Product.updateOne(
    { _id: productId },
    { rating: stats ? Math.round(stats.average * 10) / 10 : 0, reviewCount: stats?.count ?? 0 }
  )
}
