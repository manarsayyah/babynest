import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { orderStatusLabel, type OrderStatus } from "@/lib/api-client/orders"

const variantByStatus: Record<OrderStatus, "success" | "warning" | "ai" | "destructive"> = {
  delivered: "success",
  pending: "warning",
  processing: "warning",
  shipped: "ai",
  cancelled: "destructive",
}

/** Status pill shared by the order list cards and the order detail header. */
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={variantByStatus[status]}>
      {status === "delivered" ? <Check className="size-3" /> : null}
      {orderStatusLabel[status]}
    </Badge>
  )
}

export { OrderStatusBadge }
