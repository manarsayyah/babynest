"use client"

import * as React from "react"
import { toast } from "sonner"
import { MapPin, Plus, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { AddressCard } from "@/components/account/addresses/address-card"
import { AddressFormDialog, type AddressFormState } from "@/components/account/addresses/address-form-dialog"
import { DeleteAddressDialog } from "@/components/account/addresses/delete-address-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
  type AddressDraft,
  type SavedAddress,
} from "@/lib/api-client/addresses"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { initialProfile } from "@/lib/mock/account"

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Please sign in again to manage your addresses."
    // Field-level detail is enforced server-side; the form already catches the common cases.
    if (err.status === 400) return "Please check the address details and try again."
    if (err.status === 404) return "This address no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

/**
 * Full "Addresses" account page: saved address cards, Add/Edit dialog, and
 * delete confirmation — backed by the real Addresses API. After every change
 * the list is re-read from the server, so default-address rules (one per
 * customer, promotion on delete) always reflect what MongoDB actually holds.
 */
function AddressesPageContent() {
  const [addresses, setAddresses] = React.useState<SavedAddress[] | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [formState, setFormState] = React.useState<AddressFormState | null>(null)
  const [addressToDelete, setAddressToDelete] = React.useState<SavedAddress | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchAddresses()
        if (cancelled) return
        setAddresses(result)
        setLoadError(null)
      } catch (err) {
        if (cancelled) return
        setAddresses(null)
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  async function syncFromServer() {
    try {
      setAddresses(await fetchAddresses())
      setLoadError(null)
    } catch (err) {
      setAddresses(null)
      setLoadError(errorMessage(err, "Something went wrong. Please try again."))
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await updateAddress(id, { isDefault: true })
      toast.success("Default address updated")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the default address. Please try again."))
    }
    await syncFromServer()
  }

  async function handleDeleteConfirm(id: string) {
    const label = addressToDelete?.label
    try {
      await deleteAddress(id)
      toast.success("Address deleted", { description: label ? `${label} address has been removed.` : undefined })
      setAddressToDelete(null)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) setAddressToDelete(null)
      toast.error(errorMessage(err, "Couldn't delete the address. Please try again."))
    }
    await syncFromServer()
  }

  async function handleSave(draft: AddressDraft, state: AddressFormState) {
    try {
      if (state.mode === "edit") {
        // Only ever *promote* to default from here — un-defaulting is done by choosing another default.
        const { isDefault, ...fields } = draft
        await updateAddress(state.address.id, isDefault ? { ...fields, isDefault: true } : fields)
        toast.success("Address updated")
      } else {
        await createAddress(draft)
        toast.success("Address added")
      }
    } catch (err) {
      toast.error(
        errorMessage(err, state.mode === "edit" ? "Couldn't update the address. Please try again." : "Couldn't save the address. Please try again.")
      )
      return false
    }
    setFormState(null)
    await syncFromServer()
    return true
  }

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <Breadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: "My Account", href: "/account" },
                  { label: "Addresses" },
                ]}
              />
              <h1 className="text-account-title text-foreground">Addresses</h1>
              <p className="text-body text-muted-foreground">Manage your saved delivery addresses.</p>
            </div>
            {addresses && addresses.length > 0 ? (
              <Button onClick={() => setFormState({ mode: "add" })} className="w-full sm:w-auto">
                <Plus data-icon="inline-start" />
                Add New Address
              </Button>
            ) : null}
          </div>

          {loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't load your addresses"
              description={loadError}
              action={
                <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : addresses === null ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => setFormState({ mode: "edit", address })}
                  onDelete={() => setAddressToDelete(address)}
                  onSetDefault={() => void handleSetDefault(address.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No saved addresses yet"
              description="Add a delivery address to make checkout faster next time."
              action={
                <Button onClick={() => setFormState({ mode: "add" })}>
                  <Plus data-icon="inline-start" />
                  Add New Address
                </Button>
              }
            />
          )}
        </div>
      </Container>

      <AddressFormDialog state={formState} onClose={() => setFormState(null)} onSave={handleSave} />

      <DeleteAddressDialog
        address={addressToDelete}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  )
}

export { AddressesPageContent }
