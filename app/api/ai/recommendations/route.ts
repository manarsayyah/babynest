import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import AiRecommendation from "@/models/AiRecommendation"
import { requireUser } from "@/lib/api/auth"
import { getCandidateProducts } from "@/lib/ai/catalog"
import { buildUserSignals } from "@/lib/ai/signals"
import { pickRecommendationsForUser, AiServiceError } from "@/lib/ai/product-picks"
import { AiNotConfiguredError } from "@/lib/ai/client"
import { aiUnavailable, ok, serverError } from "@/lib/api/response"

/**
 * GET /api/ai/recommendations — authenticated personalized recommendations,
 * grounded in the user's real orders/wishlist/cart. Falls back to a general
 * catalog-based selection when there's no history. Persists one
 * AiRecommendation row per (userId, productId), refreshed in place on
 * repeat calls rather than duplicated.
 */
export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const { summaryText, excludeProductIds } = await buildUserSignals(session.user.id)
    const candidates = await getCandidateProducts({ excludeProductIds })

    const { picks } = await pickRecommendationsForUser(summaryText, candidates)

    const productIds = picks.map((pick) => pick.productId)
    const products =
      productIds.length > 0
        ? await Product.find({ _id: { $in: productIds }, deletedAt: null, isActive: true }).lean()
        : []
    // Additive: the product's primary image, so result cards can render without a second request.
    const productMap = new Map((await attachPrimaryImages(products)).map((product) => [product._id.toString(), product]))

    const now = new Date()
    const results: { product: NonNullable<ReturnType<typeof productMap.get>>; reason: string; score: number }[] = []

    for (const pick of picks) {
      // Discards anything the model returned that isn't a real,
      // non-deleted, active product — never persisted, never returned.
      const product = productMap.get(pick.productId)
      if (!product) continue

      const existing = await AiRecommendation.findOne({ userId: session.user.id, productId: pick.productId })
      if (existing) {
        existing.reason = pick.reason
        existing.score = pick.score
        existing.generatedAt = now
        existing.deletedAt = null
        await existing.save()
      } else {
        await AiRecommendation.create({
          userId: session.user.id,
          productId: pick.productId,
          reason: pick.reason,
          score: pick.score,
          generatedAt: now,
        })
      }

      results.push({ product, reason: pick.reason, score: pick.score })
    }

    return ok({ results })
  } catch (error) {
    if (error instanceof AiNotConfiguredError) return aiUnavailable(error.message)
    if (error instanceof AiServiceError) return aiUnavailable(error.message)
    return serverError("GET /api/ai/recommendations failed:", error)
  }
}
