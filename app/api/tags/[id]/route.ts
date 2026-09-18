import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Tag from "@/models/Tag"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { slugify } from "@/lib/api/slugify"
import { updateTagSchema } from "@/lib/validation/tag"

type RouteParams = { params: Promise<{ id: string }> }

/** PATCH /api/tags/[id] — admin only. */
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

    const parsed = updateTagSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const tag = await Tag.findOne({ _id: id, deletedAt: null })
    if (!tag) return notFound()

    const { name } = parsed.data
    if (name !== undefined) {
      const slug = slugify(name)
      const existing = await Tag.findOne({
        _id: { $ne: id },
        $or: [{ name: { $regex: `^${name}$`, $options: "i" } }, { slug }],
      })
        .select("_id")
        .lean()
      if (existing) return conflict("A tag with this name already exists.")

      tag.name = name
      tag.slug = slug
    }

    await tag.save()

    return ok(tag.toObject())
  } catch (error) {
    return serverError("PATCH /api/tags/[id] failed:", error)
  }
}

/** DELETE /api/tags/[id] — admin only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const tag = await Tag.findOne({ _id: id, deletedAt: null })
    if (!tag) return notFound()

    tag.deletedAt = new Date()
    await tag.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/tags/[id] failed:", error)
  }
}
