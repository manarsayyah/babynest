import type { NextRequest } from "next/server"
import type { Types } from "mongoose"
import connectToDatabase from "@/lib/db"
import Category from "@/models/Category"
import Product from "@/models/Product"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateCategorySchema } from "@/lib/validation/category"

type RouteParams = { params: Promise<{ id: string }> }

/** Walks up the parent chain from `startId` — true if it ever reaches `categoryId` (would create a cycle). */
async function createsCycle(categoryId: string, startId: string): Promise<boolean> {
  let currentId: string | null = startId
  const visited = new Set<string>()

  while (currentId) {
    if (currentId === categoryId) return true
    if (visited.has(currentId)) return false
    visited.add(currentId)

    const current: { parentCategoryId?: Types.ObjectId | null } | null = await Category.findById(currentId)
      .select("parentCategoryId")
      .lean()
    currentId = current?.parentCategoryId ? current.parentCategoryId.toString() : null
  }

  return false
}

/** GET /api/categories/[id] — one non-deleted category, with its parent's info when it has one. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const category = await Category.findOne({ _id: id, deletedAt: null }).lean()
    if (!category) return notFound()

    let parent = null
    if (category.parentCategoryId) {
      parent = await Category.findOne({ _id: category.parentCategoryId, deletedAt: null }).lean()
    }

    return ok({ ...category, parent })
  } catch (error) {
    return serverError("GET /api/categories/[id] failed:", error)
  }
}

/** PATCH /api/categories/[id] — admin only. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const existing = await Category.findOne({ _id: id, deletedAt: null })
    if (!existing) return notFound()

    const { name, slug, parentCategoryId, description, image, status } = parsed.data

    if (slug && slug !== existing.slug) {
      const slugTaken = await Category.findOne({ slug, _id: { $ne: id } }).select("_id").lean()
      if (slugTaken) return conflict("A category with this slug already exists.")
    }

    if (parentCategoryId !== undefined && parentCategoryId !== null) {
      if (parentCategoryId === id) {
        return badRequest("A category cannot be its own parent.")
      }
      const parent = await Category.findOne({ _id: parentCategoryId, deletedAt: null }).select("_id").lean()
      if (!parent) return badRequest("parentCategoryId does not reference an existing category.")
      if (await createsCycle(id, parentCategoryId)) {
        return badRequest("This would create a circular category relationship.")
      }
    }

    if (name !== undefined) existing.name = name
    if (slug !== undefined) existing.slug = slug
    if (description !== undefined) existing.description = description
    if (image !== undefined) existing.image = image
    if (status !== undefined) existing.status = status
    // Cast through `unknown` — Mongoose casts a hex string to ObjectId at
    // runtime, but the inferred document type expects Types.ObjectId.
    if (parentCategoryId !== undefined) {
      existing.parentCategoryId = parentCategoryId as unknown as Types.ObjectId | null
    }

    await existing.save()

    return ok(existing.toObject())
  } catch (error) {
    return serverError("PATCH /api/categories/[id] failed:", error)
  }
}

/** DELETE /api/categories/[id] — admin only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const category = await Category.findOne({ _id: id, deletedAt: null })
    if (!category) return notFound()

    const activeProductCount = await Product.countDocuments({ categoryId: id, deletedAt: null })
    if (activeProductCount > 0) {
      return conflict(
        `This category still has ${activeProductCount} active product(s). Reassign or remove them before deleting it.`
      )
    }

    category.deletedAt = new Date()
    await category.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/categories/[id] failed:", error)
  }
}
