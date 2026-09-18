import type { ApiEnvelope } from "@/lib/api-client/types"

/** A failed/erroring API call — `message` is always the server's own safe error string, never a raw stack trace. */
export class ApiRequestError extends Error {
  status: number
  /** Field-level validation errors (`{ field: string[] }`) when the server sent them with a 400. */
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.details = details
  }
}

/**
 * Calls a same-origin API route and unwraps the shared `{ success, data }` /
 * `{ success: false, error }` envelope every route in app/api/** uses.
 * Works from both client and server code (plain fetch, no client-only APIs).
 */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!json || json.success !== true) {
    const message = json && json.success === false ? json.error : `Request failed (${response.status}).`
    throw new ApiRequestError(message, response.status, json && json.success === false ? json.details : undefined)
  }

  return json.data
}
