import Cart from "@/models/Cart"

/** The user's most recent non-deleted cart, or null if they don't have one yet. */
export async function findActiveCart(userId: string) {
  return Cart.findOne({ userId, deletedAt: null }).sort({ createdAt: -1 })
}

/** Finds the user's active cart, creating a new one if they don't have one yet. */
export async function getOrCreateActiveCart(userId: string) {
  const existing = await findActiveCart(userId)
  if (existing) return existing
  return Cart.create({ userId })
}
