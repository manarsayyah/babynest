import { NextResponse } from "next/server"

/** `{ success: true, data }` — the shared success envelope for every catalog API response. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { success: false, error } : { success: false, error, details },
    { status: 400 }
  )
}

export function validationFailed(details: unknown) {
  return badRequest("Validation failed", details)
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
}

export function notFound(error = "Resource not found") {
  return NextResponse.json({ success: false, error }, { status: 404 })
}

export function conflict(error: string) {
  return NextResponse.json({ success: false, error }, { status: 409 })
}

/** Never forwards the caught error's message/stack to the client — only logs it server-side. */
export function serverError(context: string, error: unknown) {
  console.error(context, error)
  return NextResponse.json(
    { success: false, error: "Something went wrong. Please try again." },
    { status: 500 }
  )
}

/**
 * A known, expected AI-layer failure (provider not configured, provider
 * error, timeout) — distinct from `serverError`, which is for unexpected
 * bugs. The message is safe to show as-is; it never contains provider
 * internals or secrets.
 */
export function aiUnavailable(error: string) {
  return NextResponse.json({ success: false, error }, { status: 500 })
}
