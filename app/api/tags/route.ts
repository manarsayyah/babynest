import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Tag from "@/models/Tag"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { slugify } from "@/lib/api/slugify"
import { createTagSchema } from "@/lib/validation/tag"

/** GET /api/tags — non-deleted tags. */
export async function GET() {
  try {
    await connectToDatabase()
    const tags = await Tag.find({ deletedAt: null }).sort({ name: 1 }).lean()
    return ok(tags)
  } catch (error) {
    return serverError("GET /api/tags failed:", error)
  }
}

/** POST /api/tags — admin only. */
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

    const parsed = createTagSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { name } = parsed.data
    const slug = slugify(name)

    const existing = await Tag.findOne({
      $or: [{ name: { $regex: `^${name}$`, $options: "i" } }, { slug }],
    })
      .select("_id")
      .lean()
    if (existing) return conflict("A tag with this name already exists.")

    const tag = await Tag.create({ name, slug })

    return created(tag)
  } catch (error) {
    return serverError("POST /api/tags failed:", error)
  }
}
