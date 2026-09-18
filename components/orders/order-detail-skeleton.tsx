import { Container } from "@/components/layout/container"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { initialProfile } from "@/lib/mock/account"

/** Full-page pulse placeholder for the order detail route. Keeps the Account sidebar visible so it doesn't flash in/out once the real content loads. */
function OrderDetailSkeleton() {
  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Skeleton className="h-4 w-64" />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <Skeleton className="mb-5 h-5 w-40" />
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="size-7 rounded-full" />
                  ))}
                </div>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-4 pt-6">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-full rounded-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}

export { OrderDetailSkeleton }
