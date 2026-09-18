import { apiFetch } from "@/lib/api-client/fetcher"
import type { ApiWishlistItem } from "@/lib/api-client/types"

/** GET /api/wishlist — the authenticated user's own wishlist, with product info. 401s if not signed in. */
export async function fetchWishlist(): Promise<ApiWishlistItem[]> {
  return apiFetch<ApiWishlistItem[]>("/api/wishlist")
}

/** POST /api/wishlist — adds a product to the caller's own wishlist. userId is always server-derived. */
export async function addToWishlist(productId: string): Promise<ApiWishlistItem> {
  return apiFetch<ApiWishlistItem>("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  })
}

/** DELETE /api/wishlist/[productId] — soft-deletes the caller's own entry for that product. */
export async function removeFromWishlist(productId: string): Promise<{ productId: string }> {
  return apiFetch<{ productId: string }>(`/api/wishlist/${productId}`, { method: "DELETE" })
}
