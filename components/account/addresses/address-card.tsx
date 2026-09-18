"use client"

import { MapPin, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SavedAddress } from "@/lib/api-client/addresses"

export type AddressCardProps = {
  address: SavedAddress
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}

/** One saved address — label, contact, full postal details, and Edit/Delete/Set as Default actions. */
function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ")

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <MapPin className="size-4" />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-small font-semibold text-foreground">{address.label}</span>
            {address.isDefault ? <Badge variant="success">Default</Badge> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${address.label} address`}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${address.label} address`}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 text-small">
        <span className="font-medium text-foreground">{address.fullName}</span>
        <span className="text-muted-foreground">{address.phone}</span>
        <span className="text-muted-foreground">
          {address.street}
          {address.apartment ? `, ${address.apartment}` : ""}
        </span>
        {cityLine ? <span className="text-muted-foreground">{cityLine}</span> : null}
        <span className="text-muted-foreground">{address.country}</span>
      </div>

      {!address.isDefault ? (
        <Button variant="outline" size="sm" onClick={onSetDefault} className="w-fit">
          Set as Default
        </Button>
      ) : null}
    </Card>
  )
}

export { AddressCard }
