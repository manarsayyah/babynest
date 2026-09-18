import AiSearchQuery from "@/models/AiSearchQuery"

/**
 * Logs an AI search/assistant query as an AI_SEARCH_QUERIES row.
 * `AiSearchQuery.userId` is required by the approved ERD — for an
 * unauthenticated request this simply skips persistence rather than
 * relaxing that field, per the instruction not to modify the ERD to
 * support anonymous history.
 */
export async function logAiSearch(params: {
  userId: string | null
  queryText: string
  filtersApplied: unknown
  resultsCount: number
  source: "search" | "assistant"
}) {
  if (!params.userId) return null

  return AiSearchQuery.create({
    userId: params.userId,
    queryText: params.queryText,
    filtersApplied: { ...(params.filtersApplied as Record<string, unknown>), source: params.source },
    resultsCount: params.resultsCount,
    searchedAt: new Date(),
  })
}
