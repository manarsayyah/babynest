import { generateObject } from "ai"
import { z } from "zod"
import { getAiModel } from "@/lib/ai/client"
import type { ProductCandidate } from "@/lib/ai/catalog"

/** A known AI-layer failure (provider error, timeout, malformed output) — never a fabricated result. */
export class AiServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AiServiceError"
  }
}

const REQUEST_TIMEOUT_MS = 30000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new AiServiceError("The AI provider took too long to respond.")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

const productPickSchema = z.object({
  productId: z.string(),
  reason: z.string().max(300),
  score: z.number().min(0).max(1),
})

const discoveryOutputSchema = z.object({
  summary: z.string().max(600),
  isMedicalConcern: z.boolean(),
  filtersApplied: z.object({
    ageGroup: z.string().optional(),
    material: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    tags: z.array(z.string()).optional(),
    categoryHint: z.string().optional(),
  }),
  results: z.array(productPickSchema).max(20),
})

const recommendationOutputSchema = z.object({
  results: z.array(productPickSchema).max(20),
})

const GROUNDING_RULES = `- You may only recommend products from the CANDIDATES list you are given, referenced by their exact "id" field as productId. Never invent a productId, product name, brand, price, or any characteristic not present in CANDIDATES.
- If nothing in CANDIDATES is a good match, return an empty results array rather than forcing a match.
- Only state a product characteristic (e.g. "BPA-Free", "organic") if it appears in that product's data (material/tags) in CANDIDATES. Never invent safety certifications.`

const ASSISTANT_SYSTEM_PROMPT = `You are the BabyNest product-discovery assistant. You help parents find baby products already sold on BabyNest.

${GROUNDING_RULES}
- You are a shopping assistant only, not a medical service. Never diagnose conditions, recommend treatments or medication, or give medical advice. If the user's message describes a medical concern (illness, injury, allergy, symptoms, etc.), set isMedicalConcern to true, keep your summary limited to general product-shopping guidance, and note that a pediatrician or healthcare professional should be consulted for medical concerns.
- Keep "reason" grounded in the product's actual data (name, material, ageGroup, tags, rating) and the user's request.`

const RECOMMENDATION_SYSTEM_PROMPT = `You are BabyNest's personalized recommendation engine. You suggest products already sold on BabyNest to a specific shopper based on a summary of their engagement (categories, materials, age groups) or, if they have no history, a general well-rounded selection.

${GROUNDING_RULES}
- Do not invent or assume the shopper's preferences beyond what is stated in the shopper summary.
- Ground each "reason" in the product's actual data and, when relevant, the shopper's summarized signals.
- Never make medical claims.`

function toCandidateJson(candidates: ProductCandidate[]): string {
  return JSON.stringify(candidates)
}

function validatePicks(rawResults: z.infer<typeof productPickSchema>[], candidates: ProductCandidate[], max: number) {
  const candidateIds = new Set(candidates.map((c) => c.id))
  return rawResults
    .filter((pick) => candidateIds.has(pick.productId))
    .map((pick) => ({ ...pick, score: Math.max(0, Math.min(1, pick.score)) }))
    .slice(0, max)
}

/**
 * Asks the model to pick/rank products from `candidates` for a natural
 * language request (assistant or search). Every returned pick is validated
 * against `candidates` before being handed back — an id the model invents
 * or hallucinates is silently discarded, never persisted or returned.
 */
export async function pickProductsForRequest(userPrompt: string, candidates: ProductCandidate[], maxResults = 10) {
  const model = getAiModel()

  let raw: z.infer<typeof discoveryOutputSchema>
  try {
    const result = await withTimeout(
      generateObject({
        model,
        schema: discoveryOutputSchema,
        system: ASSISTANT_SYSTEM_PROMPT,
        prompt: `CANDIDATES (JSON array of real BabyNest products):\n${toCandidateJson(candidates)}\n\nUSER REQUEST:\n${userPrompt}`,
      }),
      REQUEST_TIMEOUT_MS
    )
    raw = result.object
  } catch (error) {
    if (error instanceof AiServiceError) throw error
    throw new AiServiceError("The AI provider failed to generate a response.")
  }

  return {
    summary: raw.summary,
    isMedicalConcern: raw.isMedicalConcern,
    filtersApplied: raw.filtersApplied,
    picks: validatePicks(raw.results, candidates, maxResults),
  }
}

/** Same grounding/validation contract as `pickProductsForRequest`, but for the personalized-recommendations feed. */
export async function pickRecommendationsForUser(signalSummary: string, candidates: ProductCandidate[], maxResults = 8) {
  const model = getAiModel()

  let raw: z.infer<typeof recommendationOutputSchema>
  try {
    const result = await withTimeout(
      generateObject({
        model,
        schema: recommendationOutputSchema,
        system: RECOMMENDATION_SYSTEM_PROMPT,
        prompt: `CANDIDATES (JSON array of real BabyNest products):\n${toCandidateJson(candidates)}\n\nSHOPPER SUMMARY:\n${signalSummary}\n\nRecommend up to ${maxResults} products.`,
      }),
      REQUEST_TIMEOUT_MS
    )
    raw = result.object
  } catch (error) {
    if (error instanceof AiServiceError) throw error
    throw new AiServiceError("The AI provider failed to generate recommendations.")
  }

  return { picks: validatePicks(raw.results, candidates, maxResults) }
}
