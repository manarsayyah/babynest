const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/** Clamped, sane page/limit defaults for list endpoints — never trusts raw client numbers directly. */
export function parsePagination(searchParams: URLSearchParams) {
  const rawPage = Number(searchParams.get("page"))
  const rawLimit = Number(searchParams.get("limit"))

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), MAX_LIMIT) : DEFAULT_LIMIT

  return { page, limit, skip: (page - 1) * limit }
}
