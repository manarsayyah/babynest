import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import WishlistItem from "@/models/WishlistItem"
import Product from "@/models/Product"
import { requireUser } from "@/lib/api/auth"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { addWishlistItemSchema } from "@/lib/validation/wishlist"

/** GET /api/wishlist — the authenticated user's own non-deleted wishlist entries, with product info. */
export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const items = await WishlistItem.find({ userId: session.user.id, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean()

    const productIds = items.map((item) => item.productId)
    const productsRaw =
      productIds.length > 0 ? await Product.find({ _id: { $in: productIds }, deletedAt: null }).lean() : []
    // Same batched primary-image lookup the catalog list/related-products
    // endpoints use — GET /api/wishlist previously returned no image data
    // at all, which the wishlist grid needs to render a thumbnail.
    const products = await attachPrimaryImages(productsRaw)
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    // A product deleted after being wishlisted is silently excluded here —
    // the WishlistItem row itself is left untouched.
    const enriched = items
      .map((item) => {
        const product = productMap.get(item.productId.toString())
        if (!product) return null
        return { id: item._id, productId: item.productId, addedAt: item.createdAt, product }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return ok(enriched)
  } catch (error) {
    return serverError("GET /api/wishlist failed:", error)
  }
}

/** POST /api/wishlist — admin/customer alike, adding to their own wishlist only. Body: { productId }. */
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

    const parsed = addWishlistItemSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { productId } = parsed.data

    const product = await Product.findOne({ _id: productId, deletedAt: null }).select("_id").lean()
    if (!product) return badRequest("productId does not reference an existing product.")

    // The unique index on (userId, productId) doesn't distinguish
    // soft-deleted rows, so a previously removed entry is reactivated in
    // place instead of inserting a second row for the same pair.
    const existing = await WishlistItem.findOne({ userId: session.user.id, productId })
    if (existing) {
      if (existing.deletedAt === null) return conflict("This product is already in your wishlist.")
      existing.deletedAt = null
      await existing.save()
      return ok(existing.toObject())
    }

    const wishlistItem = await WishlistItem.create({ userId: session.user.id, productId })
    return created(wishlistItem)
  } catch (error) {
    return serverError("POST /api/wishlist failed:", error)
  }
}
