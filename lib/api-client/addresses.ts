import { apiFetch } from "@/lib/api-client/fetcher"

export type AddressLabel = "Home" | "Work" | "Other"

export const addressLabelOptions: AddressLabel[] = ["Home", "Work", "Other"]

/** Address as returned by /api/addresses (Mongoose lean document, JSON-serialised). */
export type ApiAddress = {
  _id: string
  label: AddressLabel
  fullName: string
  phone: string
  street: string
  apartment?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

/** What the Addresses UI works with — `id` instead of Mongo's `_id`. */
export type SavedAddress = Omit<ApiAddress, "_id"> & { id: string }

/** The editable fields — never carries userId or id; ownership is derived from the session server-side. */
export type AddressDraft = Omit<SavedAddress, "id">

export const emptyAddressDraft: AddressDraft = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  apartment: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  isDefault: false,
}

export function toSavedAddress({ _id, ...rest }: ApiAddress): SavedAddress {
  return { id: _id, ...rest }
}

const JSON_HEADERS = { "Content-Type": "application/json" }

/** GET /api/addresses — the caller's own addresses, default first. */
export async function fetchAddresses(): Promise<SavedAddress[]> {
  const list = await apiFetch<ApiAddress[]>("/api/addresses", { cache: "no-store" })
  return list.map(toSavedAddress)
}

/** POST /api/addresses */
export async function createAddress(draft: AddressDraft): Promise<SavedAddress> {
  const created = await apiFetch<ApiAddress>("/api/addresses", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(draft),
  })
  return toSavedAddress(created)
}

/** PATCH /api/addresses/[id] — only the fields given are changed. */
export async function updateAddress(id: string, changes: Partial<AddressDraft>): Promise<SavedAddress> {
  const updated = await apiFetch<ApiAddress>(`/api/addresses/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(changes),
  })
  return toSavedAddress(updated)
}

/** DELETE /api/addresses/[id] — soft delete; the server promotes another address to default if needed. */
export async function deleteAddress(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/addresses/${id}`, { method: "DELETE" })
}
