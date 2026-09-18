import type { Metadata } from "next"
import { OrderDetailContent } from "@/components/orders/order-detail-content"

export const metadata: Metadata = { title: "Order Details | BabyNest" }

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params
  return <OrderDetailContent orderId={id} />
}
