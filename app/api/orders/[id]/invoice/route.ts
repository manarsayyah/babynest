import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import { loadInvoiceData, renderInvoicePdf } from "@/lib/api/invoice"
import { requireUser } from "@/lib/api/auth"
import { notFound, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/orders/[id]/invoice — a PDF invoice for one of the caller's own orders.
 *
 * Ownership is enforced the same way as GET /api/orders/[id]: the lookup is scoped to
 * `userId: session.user.id` in a single query, so another customer's order — even a
 * syntactically valid, real order id — resolves to the same 404 as a missing one. This
 * never leaks whether an order exists to someone who doesn't own it.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const invoiceData = await loadInvoiceData(id, session.user.id)
    if (!invoiceData) return notFound()

    const pdf = await renderInvoicePdf(invoiceData)
    // Order numbers are server-generated (uppercase letters, digits, hyphens — see performCheckout) and always
    // filename-safe, but this strips anything else defensively before it ever reaches a Content-Disposition header.
    const safeOrderNumber = invoiceData.order.orderNumber.replace(/[^A-Za-z0-9-]/g, "")

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${safeOrderNumber}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return serverError("GET /api/orders/[id]/invoice failed:", error)
  }
}
