import CartItem from "@/models/CartItem"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import { findActiveCart } from "@/lib/api/cart"

/**
 * Read-only server-side subtotal for the user's active cart — same pricing
 * rule as checkout (`product.price + variant.priceDelta`), but never
 * touches stock. Used to preview a promotion's discount before checkout.
 * Returns null if the user has no active cart or it's empty.
 */
export async function computeActiveCartSubtotal(userId: string): Promise<number | null> {
  const cart = await findActiveCart(userId)
  if (!cart) return null

  const items = await CartItem.find({ cartId: cart._id, deletedAt: null })
  if (items.length === 0) return null

  let subtotal = 0
  for (const item of items) {
    const variant = await ProductVariant.findOne({ _id: item.variantId, deletedAt: null })
    if (!variant) continue
    const product = await Product.findOne({ _id: variant.productId, deletedAt: null, isActive: true })
    if (!product) continue
    subtotal += (product.price + variant.priceDelta) * item.quantity
  }

  return Math.round(subtotal * 100) / 100
}
