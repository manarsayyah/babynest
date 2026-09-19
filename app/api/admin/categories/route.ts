import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Category from "@/models/Category"
import Product from "@/models/Product"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { CATEGORY_STATUSES } from "@/lib/validation/category"

type Sorter = (a: { name: string; productCount: number; createdAt: Date }, b: { name: string; productCount: number; createdAt: Date }) => number

const byName: Sorter = (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })

const SORTERS: Record<string, Sorter> = {
  "name-asc": byName,
  "products-desc": (a, b) => b.productCount - a.productCount || byName(a, b),
  "products-asc": (a, b) => a.productCount - b.productCount || byName(a, b),
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || byName(a, b),
}

/**
 * GET /api/admin/categories — admin only. Every non-deleted category
 * (active *and* inactive — the public GET /api/categories hides inactive ones),
 * each with its parent, subcategory count and a real product count, plus
 * catalog-wide summary counts and a lightweight `options` list (id/name/slug/
 * parent of every category) for the parent picker.
 *
 * `productCount` counts the category's own non-deleted products — the same rule
 * DELETE /api/categories/[id] uses to refuse deleting a category that is in use.
 *
 * Filters: `status`, `parentCategoryId` (an id, or "null" for top-level),
 * `search` (name, slug or description), `sort`. Categories are few, so
 * filtering/sorting/paging happens in memory after two small queries.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const status = searchParams.get("status")
    if (status && !(CATEGORY_STATUSES as readonly string[]).includes(status)) return badRequest("Invalid status filter.")

    const parentFilter = searchParams.get("parentCategoryId")
    if (parentFilter && parentFilter !== "null" && !isValidObjectId(parentFilter)) {
      return badRequest("Invalid parentCategoryId.")
    }

    const sortKey = searchParams.get("sort") ?? "name-asc"
    const sorter = SORTERS[sortKey]
    if (!sorter) return badRequest("Invalid sort.")

    const search = searchParams.get("search")?.trim()
    const pattern = search ? { $regex: escapeRegex(search), $options: "i" } : null

    const [categories, productCounts] = await Promise.all([
      Category.find({ deletedAt: null }).lean(),
      Product.aggregate<{ _id: unknown; count: number }>([
        { $match: { deletedAt: null } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
    ])

    const countByCategory = new Map(productCounts.map((entry) => [String(entry._id), entry.count]))
    const nameById = new Map(categories.map((category) => [category._id.toString(), category.name]))
    const childCountByParent = new Map<string, number>()
    for (const category of categories) {
      if (!category.parentCategoryId) continue
      const key = category.parentCategoryId.toString()
      childCountByParent.set(key, (childCountByParent.get(key) ?? 0) + 1)
    }

    const rows = categories.map((category) => {
      const id = category._id.toString()
      const parentId = category.parentCategoryId ? category.parentCategoryId.toString() : null
      return {
        _id: id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        image: category.image ?? "",
        status: category.status,
        parentCategoryId: parentId,
        // A parent that was itself deleted resolves to null rather than a dangling name.
        parent: parentId && nameById.has(parentId) ? { _id: parentId, name: nameById.get(parentId)! } : null,
        childCount: childCountByParent.get(id) ?? 0,
        productCount: countByCategory.get(id) ?? 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }
    })

    const filtered = rows.filter((row) => {
      if (status && row.status !== status) return false
      if (parentFilter === "null" && row.parentCategoryId !== null) return false
      if (parentFilter && parentFilter !== "null" && row.parentCategoryId !== parentFilter) return false
      if (pattern) {
        const needle = search!.toLowerCase()
        if (![row.name, row.slug, row.description].some((field) => field.toLowerCase().includes(needle))) return false
      }
      return true
    })
    filtered.sort(sorter)

    return ok({
      items: filtered.slice(skip, skip + limit),
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      summary: {
        total: rows.length,
        active: rows.filter((row) => row.status === "active").length,
        productsAssigned: rows.reduce((sum, row) => sum + row.productCount, 0),
        empty: rows.filter((row) => row.productCount === 0).length,
      },
      options: rows
        .map((row) => ({ _id: row._id, name: row.name, slug: row.slug, parentCategoryId: row.parentCategoryId }))
        .sort((a, b) => byName({ ...a, productCount: 0, createdAt: new Date(0) }, { ...b, productCount: 0, createdAt: new Date(0) })),
    })
  } catch (error) {
    return serverError("GET /api/admin/categories failed:", error)
  }
}
