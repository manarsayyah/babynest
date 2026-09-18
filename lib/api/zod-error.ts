import type { ZodError } from "zod"

/** Flattens a ZodError into a single message per field, matching the register route's fieldErrors shape. */
export function formatZodError(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_"
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
