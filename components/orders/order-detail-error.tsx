"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export type OrderDetailErrorProps = {
  title?: string
  description?: string
  /** When omitted the primary action is "Try Again". */
  action?: { label: string; href: string }
  onRetry?: () => void
}

/** "Order Details Unavailable" — shown when an order can't be loaded (failure, not found, or signed out). */
function OrderDetailError({
  title = "Order Details Unavailable",
  description = "We couldn't load this order right now. Please try again.",
  action,
  onRetry,
}: OrderDetailErrorProps) {
  const router = useRouter()

  return (
    <main className="flex flex-1 items-center">
      <Container className="section-y flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-h2 text-foreground">{title}</h1>
        <p className="max-w-sm text-body text-muted-foreground">
          {description}
        </p>
        {action ? (
          <Button nativeButton={false} render={<Link href={action.href} />}>
            {action.label}
          </Button>
        ) : (
          <Button onClick={onRetry ?? (() => router.refresh())}>Try Again</Button>
        )}
      </Container>
    </main>
  )
}

export { OrderDetailError }
