import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { requireUser } from "@/lib/api/auth"
import { getCandidateProducts } from "@/lib/ai/catalog"
import { pickProductsForRequest, AiServiceError } from "@/lib/ai/product-picks"
import { AiNotConfiguredError } from "@/lib/ai/client"
import { logAiSearch } from "@/lib/ai/search-log"
import { aiUnavailable, badRequest, ok, serverError, validationFailed } from "@/lib/api/response"
import { aiAssistantSchema } from "@/lib/validation/ai"

/**
 * POST /api/ai/assistant — authenticated product-discovery assistant.
 * Product discovery only: never diagnoses, treats, or gives medical advice.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = aiAssistantSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const candidates = await getCandidateProducts()

    const { summary, isMedicalConcern, filtersApplied, picks } = await pickProductsForRequest(
      parsed.data.message,
      candidates
    )

    // Re-fetches every result from the database — the AI's own description
    // of a product is never trusted for what gets returned to the client.
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
      userId: session.user.id,
      queryText: parsed.data.message,
      filtersApplied,
      resultsCount: results.length,
      source: "assistant",
    })

    return ok({ summary, isMedicalConcern, results })
  } catch (error) {
    if (error instanceof AiNotConfiguredError) return aiUnavailable(error.message)
    if (error instanceof AiServiceError) return aiUnavailable(error.message)
    return serverError("POST /api/ai/assistant failed:", error)
  }
}
