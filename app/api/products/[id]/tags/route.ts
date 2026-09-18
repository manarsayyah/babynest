import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import Tag from "@/models/Tag"
import ProductTag from "@/models/ProductTag"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { createProductTagSchema } from "@/lib/validation/product-tag"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/products/[id]/tags — tags associated with the product. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const productTags = await ProductTag.find({ productId: id, deletedAt: null }).lean()
    const tagIds = productTags.map((pt) => pt.tagId)
    const tags = tagIds.length > 0 ? await Tag.find({ _id: { $in: tagIds }, deletedAt: null }).lean() : []

    return ok(tags)
  } catch (error) {
    return serverError("GET /api/products/[id]/tags failed:", error)
  }
}

/** POST /api/products/[id]/tags — admin only. Body: { tagId }. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createProductTagSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { tagId } = parsed.data

    const [product, tag] = await Promise.all([
      Product.findOne({ _id: id, deletedAt: null }).select("_id").lean(),
      Tag.findOne({ _id: tagId, deletedAt: null }).select("_id").lean(),
    ])
    if (!product) return notFound("Product not found.")
    if (!tag) return badRequest("tagId does not reference an existing tag.")

    // The unique index on (productId, tagId) doesn't distinguish soft-deleted
    // rows, so a previously removed association is reactivated in place
    // instead of inserting a second row for the same pair.
    const existingAssociation = await ProductTag.findOne({ productId: id, tagId })
    if (existingAssociation) {
      if (existingAssociation.deletedAt === null) {
        return conflict("This product already has this tag.")
      }
      existingAssociation.deletedAt = null
      await existingAssociation.save()
      return created(existingAssociation.toObject())
    }

    const productTag = await ProductTag.create({ productId: id, tagId })

    return created(productTag)
  } catch (error) {
    return serverError("POST /api/products/[id]/tags failed:", error)
  }
}
