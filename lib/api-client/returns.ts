import { apiFetch } from "@/lib/api-client/fetcher"
import { formatOrderDate } from "@/lib/api-client/orders"

export type ReturnStatus = "requested" | "approved" | "rejected" | "completed"

type ApiReturn = { _id: string; orderId: string; reason: string; status: ReturnStatus; requestedAt: string }
type ApiReturnItem = { _id: string; orderItemId: string; quantity: number; condition?: string }

export type ReturnRecord = {
  id: string
  orderId: string
  reason: string
  /** The backend's own status value, unmodified. */
  status: ReturnStatus
  requestedDate: string
  items: { orderItemId: string; quantity: number; condition?: string }[]
}

function toRecord(ret: ApiReturn, items: ApiReturnItem[]): ReturnRecord {
  return {
    id: ret._id,
    orderId: ret.orderId,
    reason: ret.reason,
    status: ret.status,
    requestedDate: formatOrderDate(ret.requestedAt),
    items: items.map((item) => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      condition: item.condition || undefined,
    })),
  }
}

/** GET /api/returns/[id] */
export async function fetchReturn(id: string): Promise<ReturnRecord> {
  const detail = await apiFetch<{ return: ApiReturn; items: ApiReturnItem[] }>(`/api/returns/${id}`, {
    cache: "no-store",
  })
  return toRecord(detail.return, detail.items)
}

/** GET /api/returns (the caller's own), narrowed to one order, each with its items from GET /api/returns/[id]. */
export async function fetchOrderReturns(orderId: string): Promise<ReturnRecord[]> {
  const list = await apiFetch<ApiReturn[]>("/api/returns", { cache: "no-store" })
  return Promise.all(list.filter((ret) => ret.orderId === orderId).map((ret) => fetchReturn(ret._id)))
}

/** POST /api/orders/[id]/returns — the server decides eligibility (delivered order, remaining quantity, ownership). */
export async function createReturn(
  orderId: string,
  input: { reason: string; items: { orderItemId: string; quantity: number }[] }
): Promise<void> {
  await apiFetch(`/api/orders/${orderId}/returns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

/** DELETE /api/returns/[id] — cancels a still-"requested" return (soft delete server-side). */
export async function cancelReturn(id: string): Promise<void> {
  await apiFetch(`/api/returns/${id}`, { method: "DELETE" })
}
