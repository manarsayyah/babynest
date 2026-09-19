import { apiFetch } from "@/lib/api-client/fetcher"

/**
 * GET /api/admin/settings. `account` is the signed-in admin (from the server session). `store` holds the values the
 * application really runs on — fixed in code, because BabyNest has no settings storage — so the page shows them
 * read-only instead of pretending they can be saved.
 */
export type AdminSettings = {
  account: { firstName: string; lastName: string; email: string; role: string; createdAt: string }
  session: { expiresAt: string }
  store: { currency: string; timezone: string; lowStockThreshold: number }
}

export function fetchAdminSettings(init?: RequestInit): Promise<AdminSettings> {
  return apiFetch<AdminSettings>("/api/admin/settings", { cache: "no-store", ...init })
}

/** PATCH /api/admin/settings/password — rejects with the server's own message (and field details) on failure. */
export function changeAdminPassword(input: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ changed: true }>("/api/admin/settings/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}
