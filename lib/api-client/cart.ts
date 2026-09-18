import { apiFetch } from "@/lib/api-client/fetcher"
import type { ApiCart, ApiProductVariant } from "@/lib/api-client/types"

const JSON_HEADERS = { "Content-Type": "application/json" }

/** GET /api/cart — the authenticated user's own active cart. 401s if not signed in. */
export async function fetchCart(): Promise<ApiCart> {
  return apiFetch<ApiCart>("/api/cart", { cache: "no-store" })
}

/** POST /api/cart/items — adds `quantity` of a variant. userId, price and stock are all server-side. */
export async function addCartItem(variantId: string, quantity: number): Promise<unknown> {
  return apiFetch("/api/cart/items", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ variantId, quantity }),
  })
}

/** PATCH /api/cart/items/[id] — sets the line's quantity (server re-validates stock and price). */
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<unknown> {
  return apiFetch(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ quantity }),
  })
}

/** DELETE /api/cart/items/[id] — soft-deletes the line. */
export async function removeCartItem(itemId: string): Promise<unknown> {
  return apiFetch(`/api/cart/items/${itemId}`, { method: "DELETE" })
}

/** GET /api/products/[id] — the variants a product card needs, since the card has no variant picker of its own. */
export async function fetchProductVariants(productId: string): Promise<{ slug: string; variants: ApiProductVariant[] }> {
  const detail = await apiFetch<{ slug: string; variants: ApiProductVariant[] }>(`/api/products/${productId}`)
  return { slug: detail.slug, variants: detail.variants }
}
