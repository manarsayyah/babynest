"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import type { SavedAddress } from "@/lib/api-client/addresses"

export type ContactShippingFormProps = {
  /** The signed-in customer's own email (from the session) — display only, never submitted. */
  email: string
  addresses: SavedAddress[] | null
  addressesError: string | null
  selectedAddressId: string | null
  onSelectAddress: (id: string) => void
  /** Validation message shown when Place Order is attempted without an address. */
  selectionError?: string | null
  onRetryAddresses: () => void
  className?: string
}

/** "Contact Information" + "Shipping Address" — the first checkout card. Addresses come from the saved address book. */
function ContactShippingForm({
  email,
  addresses,
  addressesError,
  selectedAddressId,
  onSelectAddress,
  selectionError,
  onRetryAddresses,
  className,
}: ContactShippingFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} readOnly />
        </div>

        <div className="mt-2 h-px bg-border" />

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-h3 text-foreground">Shipping Address</h3>
          {addresses && addresses.length > 0 ? (
            <Link href="/addresses" className="text-small text-primary hover:underline">
              Manage addresses
            </Link>
          ) : null}
        </div>

        {addressesError ? (
          <div className="flex flex-col items-start gap-2">
            <FormError message={addressesError} />
            <Button variant="outline" size="sm" onClick={onRetryAddresses}>
              Try again
            </Button>
          </div>
        ) : addresses === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-small text-muted-foreground">
              You don&apos;t have a saved delivery address yet. Add one to place your order.
            </p>
            <Button variant="secondary" nativeButton={false} render={<Link href="/addresses" />}>
              Add an address
            </Button>
          </div>
        ) : (
          <RadioGroup
            value={selectedAddressId ?? ""}
            onValueChange={(value) => onSelectAddress(value as string)}
            className="gap-3"
          >
            {addresses.map((address) => (
              <label
                key={address.id}
                className={
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors " +
                  (selectedAddressId === address.id ? "border-primary bg-accent/40" : "border-border hover:bg-muted/50")
                }
              >
                <RadioGroupItem value={address.id} className="mt-1" />
                <span className="flex flex-1 flex-col gap-0.5 text-small">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{address.label}</span>
                    {address.isDefault ? <Badge variant="success">Default</Badge> : null}
                  </span>
                  <span className="font-medium text-foreground">{address.fullName}</span>
                  <span className="text-muted-foreground">
                    {address.street}
                    {address.apartment ? `, ${address.apartment}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {[address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ")}
                  </span>
                  <span className="text-muted-foreground">{address.phone}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        )}
        <FormError message={selectionError} />
      </CardContent>
    </Card>
  )
}

export { ContactShippingForm }
