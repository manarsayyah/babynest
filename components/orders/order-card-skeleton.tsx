import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Pulse placeholder shown briefly while the order list "loads". */
function OrderCardSkeleton() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="size-14 rounded-lg" />
        <Skeleton className="size-14 rounded-lg" />
        <Skeleton className="size-14 rounded-lg" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border pt-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-5">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </Card>
  )
}

export { OrderCardSkeleton }
