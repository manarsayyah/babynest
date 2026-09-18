import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Address from "@/models/Address"
import { requireUser } from "@/lib/api/auth"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateAddressSchema } from "@/lib/validation/address"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/addresses/[id] — 404s for both "missing" and "belongs to someone else", never distinguishing the two. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const address = await Address.findOne({ _id: id, userId: session.user.id, deletedAt: null }).lean()
    if (!address) return notFound()

    return ok(address)
  } catch (error) {
    return serverError("GET /api/addresses/[id] failed:", error)
  }
}

/** PATCH /api/addresses/[id] — userId is never part of the allow-listed update schema, so it can never change. */
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

    const parsed = updateAddressSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const address = await Address.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!address) return notFound()

    const { isDefault, ...rest } = parsed.data

    if (isDefault === true) {
      await Address.updateMany(
        { userId: session.user.id, deletedAt: null, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      )
      address.isDefault = true
    } else if (isDefault === false) {
      address.isDefault = false
    }

    Object.assign(address, rest)
    await address.save()

    return ok(address.toObject())
  } catch (error) {
    return serverError("PATCH /api/addresses/[id] failed:", error)
  }
}

/** DELETE /api/addresses/[id] — soft delete; promotes the next remaining address to default if this one was it. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const address = await Address.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!address) return notFound()

    const wasDefault = address.isDefault
    address.deletedAt = new Date()
    address.isDefault = false
    await address.save()

    if (wasDefault) {
      const nextAddress = await Address.findOne({ userId: session.user.id, deletedAt: null }).sort({
        createdAt: -1,
      })
      if (nextAddress) {
        nextAddress.isDefault = true
        await nextAddress.save()
      }
    }

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/addresses/[id] failed:", error)
  }
}
