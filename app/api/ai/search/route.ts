import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { getCandidateProducts } from "@/lib/ai/catalog"
import { pickProductsForRequest, AiServiceError } from "@/lib/ai/product-picks"
import { AiNotConfiguredError } from "@/lib/ai/client"
import { logAiSearch } from "@/lib/ai/search-log"
import { aiUnavailable, badRequest, ok, serverError, validationFailed } from "@/lib/api/response"
import { aiSearchSchema } from "@/lib/validation/ai"

/**
 * POST /api/ai/search — AI-assisted natural-language product search.
 * Authentication is optional (guests may search); search history is only
 * persisted for a signed-in user, since AiSearchQuery.userId is required.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = aiSearchSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const limit = parsed.data.limit ?? 10
    const candidates = await getCandidateProducts()

    const { summary, isMedicalConcern, filtersApplied, picks } = await pickProductsForRequest(
      parsed.data.query,
      candidates,
      limit
    )

    const productIds = picks.map((pick) => pick.productId)
    const products =
      productIds.length > 0
        ? await Product.find({ _id: { $in: productIds }, deletedAt: null, isActive: true }).lean()
        : []
    // Additive: the product's primary image, so result cards can render without a second request.
    const productMap = new Map((await attachPrimaryImages(products)).map((product) => [product._id.toString(), product]))

    const results = picks
      .map((pick) => {
        const product = productMap.get(pick.productId)
        if (!product) return null
        return { product, reason: pick.reason, score: pick.score }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    await logAiSearch({
      userId: session?.user?.id ?? null,
      queryText: parsed.data.query,
      filtersApplied,
      resultsCount: results.length,
      source: "search",
    })

    return ok({ summary, isMedicalConcern, results })
  } catch (error) {
    if (error instanceof AiNotConfiguredError) return aiUnavailable(error.message)
    if (error instanceof AiServiceError) return aiUnavailable(error.message)
    return serverError("POST /api/ai/search failed:", error)
  }
}
