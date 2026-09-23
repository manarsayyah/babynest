import { ApiRequestError } from "@/lib/api-client/fetcher"

/**
 * GET /api/orders/[id]/invoice — unlike every other endpoint in lib/api-client, a successful response here is
 * a raw PDF, not the shared `{ success, data }` envelope, so this doesn't go through apiFetch(). A failure
 * response still uses that envelope (see lib/api/response.ts), so the error path parses it the same way
 * apiFetch() does, keeping the same ApiRequestError contract every caller already handles.
 */
export async function downloadInvoice(orderId: string, orderNumber: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/invoice`)

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const json = (await response.json()) as { success?: boolean; error?: string }
      if (json?.success === false && typeof json.error === "string") message = json.error
    } catch {
      // Response wasn't JSON — keep the generic message above.
    }
    throw new ApiRequestError(message, response.status)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = `Invoice-${orderNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
