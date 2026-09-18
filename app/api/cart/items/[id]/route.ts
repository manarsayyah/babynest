import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Cart from "@/models/Cart"
import CartItem from "@/models/CartItem"
import ProductVariant from "@/models/ProductVariant"
import Product from "@/models/Product"
import { requireUser } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateCartItemSchema } from "@/lib/validation/cart"

type RouteParams = { params: Promise<{ id: string }> }

/** True only if the cart item exists, is not soft-deleted, and belongs (via its cart) to this user. */
async function findOwnedCartItem(itemId: string, userId: string) {
  const item = await CartItem.findOne({ _id: itemId, deletedAt: null })
  if (!item) return null

  const cart = await Cart.findOne({ _id: item.cartId, userId, deletedAt: null }).select("_id").lean()
  if (!cart) return null

  return item
}

/** PATCH /api/cart/items/[id] — quantity only; ownership and identity fields are never editable here. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateCartItemSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const cartItem = await findOwnedCartItem(id, session.user.id)
    if (!cartItem) return notFound()

    const variant = await ProductVariant.findOne({ _id: cartItem.variantId, deletedAt: null })
    if (!variant) return conflict("This variant is no longer available.")

    const product = await Product.findOne({ _id: variant.productId, deletedAt: null, isActive: true })
    if (!product) return conflict("This product is no longer available.")

    const { quantity } = parsed.data
    if (quantity > variant.stockQty) {
      return conflict(`Only ${variant.stockQty} unit(s) of this variant are in stock.`)
    }

    cartItem.quantity = quantity
    // Recalculated server-side every time — never trusts a stored or client price.
    cartItem.unitPrice = Math.round((product.price + variant.priceDelta) * 100) / 100
    await cartItem.save()

    return ok(cartItem.toObject())
  } catch (error) {
    return serverError("PATCH /api/cart/items/[id] failed:", error)
  }
}

/** DELETE /api/cart/items/[id] — soft delete; ownership verified via the item's cart. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const cartItem = await findOwnedCartItem(id, session.user.id)
    if (!cartItem) return notFound()

    cartItem.deletedAt = new Date()
    await cartItem.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/cart/items/[id] failed:", error)
  }
}
