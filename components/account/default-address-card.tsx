"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { SavedAddress } from "@/lib/api-client/addresses"

export type DefaultAddressCardProps = {
  /** The customer's real default address; null while loading, on error, or when they have none. */
  address: SavedAddress | null
  status: "loading" | "error" | "ready"
}

/** "Default Address" summary card, with links out to the full Addresses page. */
function DefaultAddressCard({ address, status }: DefaultAddressCardProps) {
  const cityLine = address ? [address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ") : ""

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-h3">Default Address</CardTitle>
        {address?.isDefault ? <Badge variant="success">Default</Badge> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 text-small text-foreground">
          {status === "loading" ? (
            <>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : status === "error" ? (
            <span className="text-muted-foreground">Couldn&apos;t load your address right now.</span>
          ) : address ? (
            <>
              <span className="font-medium">{address.fullName}</span>
              <span className="text-muted-foreground">
                {address.street}
                {address.apartment ? `, ${address.apartment}` : ""}
              </span>
              <span className="text-muted-foreground">{cityLine}</span>
              <span className="text-muted-foreground">Phone: {address.phone}</span>
            </>
          ) : (
            <span className="text-muted-foreground">You haven&apos;t saved a delivery address yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" nativeButton={false} render={<Link href="/addresses" />}>
            Edit Address
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/addresses" />}>
            Manage Addresses
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { DefaultAddressCard }
