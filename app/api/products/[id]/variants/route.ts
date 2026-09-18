import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { createVariantSchema } from "@/lib/validation/variant"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/products/[id]/variants — non-deleted variants for the product. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const variants = await ProductVariant.find({ productId: id, deletedAt: null }).lean()
    return ok(variants)
  } catch (error) {
    return serverError("GET /api/products/[id]/variants failed:", error)
  }
}

/** POST /api/products/[id]/variants — admin only. */
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

    const parsed = createVariantSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const product = await Product.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!product) return notFound("Product not found.")

    const variant = await ProductVariant.create({ ...parsed.data, productId: id })

    return created(variant)
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return conflict("A variant with this SKU already exists.")
    return serverError("POST /api/products/[id]/variants failed:", error)
  }
}
