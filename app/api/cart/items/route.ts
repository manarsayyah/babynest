import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import CartItem from "@/models/CartItem"
import ProductVariant from "@/models/ProductVariant"
import Product from "@/models/Product"
import { requireUser } from "@/lib/api/auth"
import { getOrCreateActiveCart } from "@/lib/api/cart"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { addCartItemSchema } from "@/lib/validation/cart"

/** POST /api/cart/items — any authenticated user, adding to their own cart only. */
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

    const parsed = addCartItemSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { variantId, quantity } = parsed.data

    const variant = await ProductVariant.findOne({ _id: variantId, deletedAt: null })
    if (!variant) return badRequest("variantId does not reference an existing variant.")

    const product = await Product.findOne({ _id: variant.productId, deletedAt: null, isActive: true })
    if (!product) return badRequest("This product is no longer available.")

    // Server-computed price — the client's request never carries a price.
    const unitPrice = Math.round((product.price + variant.priceDelta) * 100) / 100

    const cart = await getOrCreateActiveCart(session.user.id)

    const existingItem = await CartItem.findOne({ cartId: cart._id, variantId, deletedAt: null })

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > variant.stockQty) {
        return conflict(`Only ${variant.stockQty} unit(s) of this variant are in stock.`)
      }
      existingItem.quantity = newQuantity
      existingItem.unitPrice = unitPrice
      await existingItem.save()
      return ok(existingItem.toObject())
    }

    if (quantity > variant.stockQty) {
      return conflict(`Only ${variant.stockQty} unit(s) of this variant are in stock.`)
    }

    const cartItem = await CartItem.create({ cartId: cart._id, variantId, quantity, unitPrice })
    return created(cartItem)
  } catch (error) {
    return serverError("POST /api/cart/items failed:", error)
  }
}
