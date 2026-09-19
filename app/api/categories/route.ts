import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Category from "@/models/Category"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { createCategorySchema } from "@/lib/validation/category"

/** GET /api/categories — active, non-deleted categories. Optionally scoped to one parent via ?parentCategoryId=. */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const parentCategoryId = request.nextUrl.searchParams.get("parentCategoryId")
    const filter: Record<string, unknown> = { deletedAt: null, status: "active" }

    if (parentCategoryId !== null) {
      if (parentCategoryId === "null") {
        filter.parentCategoryId = null
      } else if (isValidObjectId(parentCategoryId)) {
        filter.parentCategoryId = parentCategoryId
      } else {
        return badRequest("Invalid parentCategoryId.")
      }
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean()
    return ok(categories)
  } catch (error) {
    return serverError("GET /api/categories failed:", error)
  }
}

/** POST /api/categories — admin only. */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return validationFailed(parsed.error.flatten().fieldErrors)
    }

    await connectToDatabase()

    const { name, slug, parentCategoryId, description, image, status } = parsed.data

    const existingSlug = await Category.findOne({ slug }).select("_id").lean()
    if (existingSlug) return conflict("A category with this slug already exists.")

    if (parentCategoryId) {
      const parent = await Category.findOne({ _id: parentCategoryId, deletedAt: null }).select("_id").lean()
      if (!parent) return badRequest("parentCategoryId does not reference an existing category.")
    }

    const category = await Category.create({
      name,
      slug,
      parentCategoryId: parentCategoryId ?? null,
      // Optional fields are only written when supplied, so the schema defaults (e.g. status: active) still apply.
      ...(description !== undefined ? { description } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(status !== undefined ? { status } : {}),
    })

    return created(category)
  } catch (error) {
    return serverError("POST /api/categories failed:", error)
  }
}
