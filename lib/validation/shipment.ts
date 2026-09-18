import { z } from "zod"

export const SHIPMENT_STATUSES = ["pending", "shipped", "delivered", "returned"] as const

export const updateShipmentSchema = z.object({
  carrier: z.string().trim().max(100).optional(),
  method: z.string().trim().max(100).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  shipmentCost: z.number().min(0).optional(),
  estimatedDelivery: z.coerce.date().optional(),
  shippedAt: z.coerce.date().nullable().optional(),
  deliveredAt: z.coerce.date().nullable().optional(),
})

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>
