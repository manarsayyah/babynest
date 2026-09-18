import connectToDatabase from "@/lib/db"
import CartItem from "@/models/CartItem"
import ProductVariant from "@/models/ProductVariant"
import Product from "@/models/Product"
import ProductImage from "@/models/ProductImage"
import { requireUser } from "@/lib/api/auth"
import { findActiveCart } from "@/lib/api/cart"
import { ok, serverError } from "@/lib/api/response"
import { FREE_SHIPPING_THRESHOLD, calculateShippingCost } from "@/lib/api/shipping"
import { getPrimaryImageUrl } from "@/lib/api-client/image"

export type CartItemAvailability = "available" | "insufficient_stock" | "out_of_stock" | "unavailable"

/** GET /api/cart — the authenticated user's own active cart, with product/variant info. Never another user's. */
export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const cart = await findActiveCart(session.user.id)
    if (!cart) {
      return ok({
        cartId: null,
        items: [],
        itemCount: 0,
        subtotal: 0,
        shipping: 0,
        total: 0,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        hasUnavailableItems: false,
      })
    }

    const items = await CartItem.find({ cartId: cart._id, deletedAt: null }).sort({ createdAt: 1 }).lean()

    const variantIds = items.map((item) => item.variantId)
    const variants =
      variantIds.length > 0 ? await ProductVariant.find({ _id: { $in: variantIds }, deletedAt: null }).lean() : []
    const variantMap = new Map(variants.map((variant) => [variant._id.toString(), variant]))

    const productIds = variants.map((variant) => variant.productId)
    const products =
      productIds.length > 0 ? await Product.find({ _id: { $in: productIds }, deletedAt: null }).lean() : []
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const images =
      products.length > 0
        ? await ProductImage.find({ productId: { $in: products.map((product) => product._id) }, deletedAt: null }).lean()
        : []
    const imagesByProduct = new Map<string, typeof images>()
    for (const image of images) {
      const key = image.productId.toString()
      imagesByProduct.set(key, [...(imagesByProduct.get(key) ?? []), image])
    }

    const enrichedItems = items.map((item) => {
      const variant = variantMap.get(item.variantId.toString()) ?? null
      const product = variant ? (productMap.get(variant.productId.toString()) ?? null) : null

      let availability: CartItemAvailability = "available"
      if (!variant || !product || !product.isActive) availability = "unavailable"
      else if (variant.stockQty <= 0) availability = "out_of_stock"
      else if (variant.stockQty < item.quantity) availability = "insufficient_stock"

      // Live price while the item is still purchasable (the same rule checkout uses); the stored snapshot otherwise.
      const unitPrice =
        variant && product ? Math.round((product.price + variant.priceDelta) * 100) / 100 : item.unitPrice

      const image = product
        ? getPrimaryImageUrl(
            (imagesByProduct.get(product._id.toString()) ?? []).map((row) => ({
              imageUrl: row.imageUrl,
              altText: row.altText ?? undefined,
              variantId: row.variantId ? row.variantId.toString() : null,
              isPrimary: row.isPrimary,
              displayOrder: row.displayOrder,
            })),
            variant?._id.toString()
          )
        : null

      return {
        id: item._id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
        availability,
        image,
        variant: variant
          ? {
              id: variant._id,
              sku: variant.sku,
              variantName: variant.variantName,
              color: variant.color,
              size: variant.size,
              stockQty: variant.stockQty,
            }
          : null,
        product: product
          ? { id: product._id, name: product.name, slug: product.slug, price: product.price }
          : null,
      }
    })

    const subtotal = Math.round(enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100

    const shipping = enrichedItems.length > 0 ? calculateShippingCost(subtotal) : 0
    const itemCount = enrichedItems.reduce((sum, item) => sum + item.quantity, 0)
    const hasUnavailableItems = enrichedItems.some((item) => item.availability !== "available")

    return ok({
      cartId: cart._id,
      items: enrichedItems,
      itemCount,
      subtotal,
      shipping,
      total: Math.round((subtotal + shipping) * 100) / 100,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      hasUnavailableItems,
    })
  } catch (error) {
    return serverError("GET /api/cart failed:", error)
  }
}

/** DELETE /api/cart — soft-deletes the user's own active cart and all its active items. */
export async function DELETE() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const cart = await findActiveCart(session.user.id)
    if (!cart) return ok({ cartId: null })

    await CartItem.updateMany({ cartId: cart._id, deletedAt: null }, { deletedAt: new Date() })

    cart.deletedAt = new Date()
    await cart.save()

    return ok({ cartId: cart._id })
  } catch (error) {
    return serverError("DELETE /api/cart failed:", error)
  }
}
