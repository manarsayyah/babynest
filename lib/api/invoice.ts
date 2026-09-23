import PDFDocument from "pdfkit"
import Order, { type OrderDocument } from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Payment from "@/models/Payment"
import OrderPromotion from "@/models/OrderPromotion"
import Promotion from "@/models/Promotion"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import User from "@/models/User"

/** BabyNest's storefront primary/rose accent (app/globals.css `--primary`) — reused here so the PDF reads as
 * the same brand, without importing any UI/CSS module into server code. */
const BRAND_COLOR = "#db5e76"
const INK_COLOR = "#2b2320"
const MUTED_COLOR = "#6b6259"

export class InvoiceNotFoundError extends Error {
  constructor() {
    super("Invoice not found.")
    this.name = "InvoiceNotFoundError"
  }
}

type InvoiceLineItem = {
  name: string
  variantLabel: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export type InvoiceData = {
  order: Pick<OrderDocument, "orderNumber" | "status" | "subtotal" | "discount" | "shippingCost" | "tax" | "total" | "shippingAddress"> & {
    createdAt: Date
  }
  customer: { name: string; email: string }
  items: InvoiceLineItem[]
  paymentStatus: string
  /** The applied promotion's code, if any — null when the order had no promotion (never invented). */
  promotionCode: string | null
}

/**
 * Loads everything the invoice needs for one order, scoped to `userId` so a customer can only ever build an
 * invoice for their own order. Returns null rather than throwing when the order doesn't exist or isn't theirs —
 * the route maps that to 404, same as every other customer order endpoint (see app/api/orders/[id]/route.ts).
 */
export async function loadInvoiceData(orderId: string, userId: string): Promise<InvoiceData | null> {
  const order = await Order.findOne({ _id: orderId, userId, deletedAt: null }).lean()
  if (!order) return null

  const [orderItems, payment, customer, orderPromotion] = await Promise.all([
    OrderItem.find({ orderId }).lean(),
    Payment.findOne({ orderId }).lean(),
    User.findOne({ _id: userId }).select("firstName lastName email").lean(),
    OrderPromotion.findOne({ orderId }).lean(),
  ])

  const variantIds = orderItems.map((item) => item.variantId).filter(Boolean)
  const productIds = orderItems.map((item) => item.productId)
  const [variants, products, promotion] = await Promise.all([
    variantIds.length > 0 ? ProductVariant.find({ _id: { $in: variantIds } }).lean() : [],
    productIds.length > 0 ? Product.find({ _id: { $in: productIds } }).lean() : [],
    orderPromotion ? Promotion.findOne({ _id: orderPromotion.promotionId }).select("code").lean() : null,
  ])
  const variantMap = new Map(variants.map((v) => [v._id.toString(), v]))
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  const items: InvoiceLineItem[] = orderItems.map((item) => {
    const product = productMap.get(item.productId.toString())
    const variant = item.variantId ? variantMap.get(item.variantId.toString()) : null
    const variantParts = [variant?.color, variant?.size].filter(Boolean)
    return {
      name: product?.name ?? "Product no longer available",
      variantLabel: variant?.variantName || (variantParts.length > 0 ? variantParts.join(" / ") : null),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }
  })

  return {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCost: order.shippingCost,
      tax: order.tax,
      total: order.total,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    },
    customer: {
      name: customer ? `${customer.firstName} ${customer.lastName}` : "—",
      email: customer?.email ?? "—",
    },
    items,
    // Cash on Delivery is the only method — see models/Payment.ts — so there is never a card/gateway status to show.
    paymentStatus: payment ? payment.status : "pending",
    promotionCode: promotion?.code ?? null,
  }
}

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending (due on delivery)",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
}

/** Renders `data` into a one-page PDF invoice and resolves with the finished bytes. */
export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const { order, customer, items, paymentStatus, promotionCode } = data
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

    // Header — brand + invoice meta.
    doc.fillColor(BRAND_COLOR).font("Helvetica-Bold").fontSize(22).text("BabyNest", { continued: false })
    doc.fillColor(MUTED_COLOR).font("Helvetica").fontSize(9).text("Everything your baby needs, in one beautiful nest.")
    doc.moveDown(1.2)

    doc.fillColor(INK_COLOR).font("Helvetica-Bold").fontSize(16).text("Invoice")
    doc.font("Helvetica").fontSize(10).fillColor(MUTED_COLOR)
    doc.text(`Order Number: ${order.orderNumber}`)
    doc.text(`Order Date: ${formatDate(order.createdAt)}`)
    doc.text(`Order Status: ${STATUS_LABEL[order.status] ?? order.status}`)
    doc.moveDown(1)

    // Two-column "Bill To" / "Ship To" — both from real data (Ship To is the order's own immutable snapshot).
    const columnWidth = pageWidth / 2 - 10
    const columnsTop = doc.y
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK_COLOR).text("Bill To", doc.page.margins.left, columnsTop, { width: columnWidth })
    doc.font("Helvetica").fontSize(10).fillColor(MUTED_COLOR)
    doc.text(customer.name, { width: columnWidth })
    doc.text(customer.email, { width: columnWidth })

    const shipToX = doc.page.margins.left + columnWidth + 20
    const address = order.shippingAddress
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK_COLOR).text("Ship To", shipToX, columnsTop, { width: columnWidth })
    doc.font("Helvetica").fontSize(10).fillColor(MUTED_COLOR)
    doc.text(address.fullName, shipToX, doc.y, { width: columnWidth })
    doc.text(address.street + (address.apartment ? `, ${address.apartment}` : ""), shipToX, doc.y, { width: columnWidth })
    doc.text(
      [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
      shipToX,
      doc.y,
      { width: columnWidth }
    )
    doc.text(address.country, shipToX, doc.y, { width: columnWidth })
    doc.text(address.phone, shipToX, doc.y, { width: columnWidth })

    doc.y = Math.max(doc.y, columnsTop + 90)
    doc.x = doc.page.margins.left
    doc.moveDown(1.5)

    // Items table.
    const tableTop = doc.y
    const col = {
      item: doc.page.margins.left,
      qty: doc.page.margins.left + pageWidth * 0.52,
      price: doc.page.margins.left + pageWidth * 0.68,
      total: doc.page.margins.left + pageWidth * 0.84,
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK_COLOR)
    doc.text("Item", col.item, tableTop, { width: col.qty - col.item - 8 })
    doc.text("Qty", col.qty, tableTop, { width: col.price - col.qty - 8, align: "right" })
    doc.text("Unit Price", col.price, tableTop, { width: col.total - col.price - 8, align: "right" })
    doc.text("Total", col.total, tableTop, { width: doc.page.margins.left + pageWidth - col.total, align: "right" })
    doc.moveDown(0.4)
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).strokeColor("#e5ded6").stroke()
    doc.moveDown(0.4)

    doc.font("Helvetica").fontSize(10).fillColor(INK_COLOR)
    for (const item of items) {
      const rowTop = doc.y
      const label = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name
      doc.text(label, col.item, rowTop, { width: col.qty - col.item - 8 })
      const rowBottomAnchor = doc.y
      doc.text(String(item.quantity), col.qty, rowTop, { width: col.price - col.qty - 8, align: "right" })
      doc.text(formatMoney(item.unitPrice), col.price, rowTop, { width: col.total - col.price - 8, align: "right" })
      doc.text(formatMoney(item.subtotal), col.total, rowTop, { width: doc.page.margins.left + pageWidth - col.total, align: "right" })
      doc.y = Math.max(doc.y, rowBottomAnchor)
      doc.moveDown(0.5)
    }

    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).strokeColor("#e5ded6").stroke()
    doc.moveDown(0.6)

    // Totals.
    const totalsLabelWidth = 120
    const totalsX = doc.page.margins.left + pageWidth - totalsLabelWidth - 90
    function totalsRow(label: string, value: string, opts?: { bold?: boolean }) {
      const y = doc.y
      doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts?.bold ? 11 : 10).fillColor(opts?.bold ? BRAND_COLOR : INK_COLOR)
      doc.text(label, totalsX, y, { width: totalsLabelWidth, align: "right" })
      doc.text(value, totalsX + totalsLabelWidth + 10, y, { width: 80, align: "right" })
      doc.moveDown(0.4)
    }
    totalsRow("Subtotal", formatMoney(order.subtotal))
    if (order.discount > 0) {
      totalsRow(promotionCode ? `Discount (${promotionCode})` : "Discount", `-${formatMoney(order.discount)}`)
    }
    if (order.shippingCost > 0) totalsRow("Shipping", formatMoney(order.shippingCost))
    if (order.tax > 0) totalsRow("Tax", formatMoney(order.tax))
    totalsRow("Total", formatMoney(order.total), { bold: true })

    doc.moveDown(1)
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).strokeColor("#e5ded6").stroke()
    doc.moveDown(0.6)

    // Payment.
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK_COLOR).text("Payment")
    doc.font("Helvetica").fontSize(10).fillColor(MUTED_COLOR)
    doc.text("Method: Cash on Delivery")
    doc.text(`Status: ${PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus}`)

    doc.moveDown(1.5)
    doc.font("Helvetica").fontSize(8).fillColor(MUTED_COLOR).text("Thank you for shopping with BabyNest.", { align: "center" })

    doc.end()
  })
}
