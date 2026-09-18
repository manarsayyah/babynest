"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { aiRecommendations, type AiProduct } from "@/lib/api-client/ai"

export type AiRecommendationsState =
  | { status: "guest" }
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; items: AiProduct[] }

/**
 * The signed-in customer's real personalized recommendations (GET /api/ai/recommendations).
 * Fetches once per mount / session change / retry — not on every render — and never for guests.
 */
export function useAiRecommendations(): AiRecommendationsState {
  const { status } = useSession()
  const [result, setResult] = React.useState<{ items: AiProduct[] } | { error: string } | null>(null)
  const [token, setToken] = React.useState(0)

  React.useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false

    async function load() {
      const outcome = await aiRecommendations()
      if (cancelled) return
      setResult(outcome.ok ? { items: outcome.data } : { error: outcome.message })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token])

  const retry = React.useCallback(() => {
    setResult(null)
    setToken((n) => n + 1)
  }, [])

  if (status === "unauthenticated") return { status: "guest" }
  if (status === "loading" || result === null) return { status: "loading" }
  if ("error" in result) return { status: "error", message: result.error, retry }
  return { status: "ready", items: result.items }
}
