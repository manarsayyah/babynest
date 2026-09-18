/**
 * Customer "AI Preferences" settings. This only ever controls the existing
 * on-site AI-style features (Smart Search, personalized recommendation
 * rails) — there is no real AI backend behind these toggles, and none is
 * called from this page. No backend/API exists yet, so preferences are
 * kept in `localStorage` only (opted into per this page's own brief) —
 * nothing is sent to or claimed to be saved in a database.
 */
export type RecommendationSourceKey =
  | "recentlyViewed"
  | "wishlistActivity"
  | "previousPurchases"
  | "favoriteCategories"

export type RecommendationSources = Record<RecommendationSourceKey, boolean>

export const recommendationSourceCopy: {
  key: RecommendationSourceKey
  title: string
  description: string
}[] = [
  {
    key: "recentlyViewed",
    title: "Recently viewed products",
    description: "Use the products you've recently browsed to fine-tune suggestions.",
  },
  {
    key: "wishlistActivity",
    title: "Wishlist activity",
    description: "Factor in the items you've saved to your wishlist.",
  },
  {
    key: "previousPurchases",
    title: "Previous purchases",
    description: "Learn from what you've already bought to suggest complementary products.",
  },
  {
    key: "favoriteCategories",
    title: "Favorite categories",
    description: "Prioritize the categories you shop from most often.",
  },
]

export type AIPreferences = {
  personalizedRecommendations: boolean
  recommendationSources: RecommendationSources
  selectedCategorySlugs: string[]
  aiAssistantEnabled: boolean
  useActivityForRecommendations: boolean
}

export const defaultAIPreferences: AIPreferences = {
  personalizedRecommendations: true,
  recommendationSources: {
    recentlyViewed: true,
    wishlistActivity: true,
    previousPurchases: true,
    favoriteCategories: false,
  },
  selectedCategorySlugs: ["clothing", "diapers", "toys"],
  aiAssistantEnabled: true,
  useActivityForRecommendations: true,
}

const STORAGE_KEY = "babynest:ai-preferences"

/** Client-only. Falls back to defaults on the server, in private browsing, or if the stored value is malformed. */
export function loadAIPreferences(): AIPreferences {
  if (typeof window === "undefined") return defaultAIPreferences
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAIPreferences
    const parsed = JSON.parse(raw) as Partial<AIPreferences>
    return {
      ...defaultAIPreferences,
      ...parsed,
      recommendationSources: {
        ...defaultAIPreferences.recommendationSources,
        ...(parsed.recommendationSources ?? {}),
      },
    }
  } catch {
    return defaultAIPreferences
  }
}

export function saveAIPreferences(preferences: AIPreferences) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — preferences just won't persist across reloads.
  }
}
