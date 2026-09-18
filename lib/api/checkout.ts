import mongoose from "mongoose"
import Address from "@/models/Address"
import Cart from "@/models/Cart"
import CartItem from "@/models/CartItem"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Payment from "@/models/Payment"
import Shipment from "@/models/Shipment"
import OrderStatusHistory from "@/models/OrderStatusHistory"
import OrderPromotion from "@/models/OrderPromotion"
import { calculateShippingCost } from "@/lib/api/shipping"
import { generateOrderNumber } from "@/lib/api/order-number"
import { resolvePromotion, PromotionError } from "@/lib/api/promotion"
import { notifyUser } from "@/lib/api/notify"

/** A checkout failure with an HTTP status attached, so the route handler can map it directly. */
export class CheckoutError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "CheckoutError"
    this.status = status
  }
}

type SessionOption = { session: mongoose.ClientSession } | Record<string, never>

function sessionOption(session: mongoose.ClientSession | null): SessionOption {
  return session ? { session } : {}
}

async function generateUniqueOrderNumber(session: mongoose.ClientSession | null): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOrderNumber()
    const existing = await Order.findOne({ orderNumber: candidate }).session(session).select("_id").lean()
    if (!existing) return candidate
  }
  throw new CheckoutError(500, "Could not generate a unique order number. Please try again.")
}

async function runCheckout(
  userId: string,
  addressId: string,
  promotionCode: string | undefined,
  session: mongoose.ClientSession | null
) {
  const opts = sessionOption(session)

  const address = await Address.findOne({ _id: addressId, userId, deletedAt: null }).session(session)
  if (!address) {
    throw new CheckoutError(400, "The selected address does not belong to you or no longer exists.")
  }

  const cart = await Cart.findOne({ userId, deletedAt: null }).sort({ createdAt: -1 }).session(session)
  if (!cart) throw new CheckoutError(400, "Your cart is empty.")

  const cartItems = await CartItem.find({ cartId: cart._id, deletedAt: null }).session(session)
  if (cartItems.length === 0) throw new CheckoutError(400, "Your cart is empty.")

  // Tracks stock this attempt has already decremented, so it can be put
  // back if a later cart item or step fails (see the catch block below).
  const appliedDecrements: { variantId: mongoose.Types.ObjectId; quantity: number }[] = []
  const orderItemsData: {
    productId: mongoose.Types.ObjectId
    variantId: mongoose.Types.ObjectId
    quantity: number
    unitPrice: number
    subtotal: number
  }[] = []

  try {
    for (const item of cartItems) {
      const variant = await ProductVariant.findOne({ _id: item.variantId, deletedAt: null }).session(session)
      if (!variant) {
        throw new CheckoutError(409, "One of the items in your cart is no longer available.")
      }

      const product = await Product.findOne({
        _id: variant.productId,
        deletedAt: null,
        isActive: true,
      }).session(session)
      if (!product) {
        throw new CheckoutError(409, "One of the products in your cart is no longer available.")
      }

      // Server-computed — never trusts CartItem.unitPrice or any client value.
      const unitPrice = Math.round((product.price + variant.priceDelta) * 100) / 100

      // Atomic conditional decrement: only succeeds if enough stock is
      // still available at the moment of the write, so concurrent
      // checkouts can never drive stockQty negative.
      const updatedVariant = await ProductVariant.findOneAndUpdate(
        { _id: variant._id, deletedAt: null, stockQty: { $gte: item.quantity } },
        { $inc: { stockQty: -item.quantity } },
        { ...opts, new: true }
      )
      if (!updatedVariant) {
        throw new CheckoutError(409, `Insufficient stock for "${product.name}".`)
      }
      appliedDecrements.push({ variantId: variant._id, quantity: item.quantity })

      const lineSubtotal = Math.round(unitPrice * item.quantity * 100) / 100
      orderItemsData.push({
        productId: product._id,
        variantId: variant._id,
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal,
      })
    }

    const subtotal = Math.round(orderItemsData.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100

    // No code supplied -> discount is always 0. A supplied code that fails
    // validation (expired, inactive, not started, deleted, unknown) throws
    // a PromotionError here, which the same catch block below treats like
    // any other checkout failure — no order, no cart clearing, no stock left decremented.
    let discount = 0
    let appliedPromotion: Awaited<ReturnType<typeof resolvePromotion>>["promotion"] | null = null
    if (promotionCode) {
      const resolved = await resolvePromotion(promotionCode, subtotal, session)
      discount = resolved.discountApplied
      appliedPromotion = resolved.promotion
    }

    const shippingCost = calculateShippingCost(subtotal)
    const tax = 0 // No tax calculation requested for this phase.
    // Clamped defensively — resolvePromotion already caps the discount at
    // the subtotal, but the grand total must never go negative regardless.
    const total = Math.max(0, Math.round((subtotal - discount + shippingCost + tax) * 100) / 100)

    const orderNumber = await generateUniqueOrderNumber(session)

    const [order] = await Order.create(
      [
        {
          userId,
          orderNumber,
          addressId: address._id,
          subtotal,
          discount,
          shippingCost,
          tax,
          total,
          status: "pending",
          // Immutable snapshot, copied from the address book entry at the
          // moment of purchase — never a live reference.
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            apartment: address.apartment,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
          },
        },
      ],
      opts
    )

    const orderItems = await OrderItem.create(
      orderItemsData.map((item) => ({ ...item, orderId: order._id })),
      opts
    )

    let orderPromotion = null
    if (appliedPromotion) {
      // Stores the actual discount applied at purchase time — this stays
      // correct and available even if the Promotion is later soft-deleted.
      ;[orderPromotion] = await OrderPromotion.create(
        [{ orderId: order._id, promotionId: appliedPromotion._id, discountApplied: discount }],
        opts
      )
    }

    const [payment] = await Payment.create(
      [
        {
          orderId: order._id,
          method: "CASH_ON_DELIVERY",
          status: "pending",
          amount: total,
          paidAt: null,
        },
      ],
      opts
    )

    const [shipment] = await Shipment.create(
      [
        {
          orderId: order._id,
          shipmentCost: shippingCost,
          status: "pending",
          method: "Standard Delivery",
        },
      ],
      opts
    )

    await OrderStatusHistory.create(
      [{ orderId: order._id, status: "pending", note: "Order placed." }],
      opts
    )

    // Only the items that were actually turned into this order are
    // deactivated — checkout never runs on an empty cart (checked above),
    // and a failed checkout (caught below) never reaches this line.
    await CartItem.updateMany({ cartId: cart._id, deletedAt: null }, { deletedAt: new Date() }, opts)

    // Best-effort, outside the checkout's own atomicity guarantees on
    // purpose — a notification failure must never fail or roll back an
    // otherwise-successful order.
    try {
      await notifyUser(
        userId,
        "order_placed",
        "Order placed",
        `Your order ${orderNumber} has been placed and will be paid on delivery.`
      )
    } catch (notifyError) {
      console.error("Failed to create order-placed notification:", notifyError)
    }

    return { order, orderItems, payment, shipment, orderPromotion, usedTransaction: session !== null }
  } catch (error) {
    if (session === null && appliedDecrements.length > 0) {
      // No transaction to auto-rollback on this deployment — manually
      // restore any stock this attempt already decremented.
      await Promise.all(
        appliedDecrements.map((decrement) =>
          ProductVariant.updateOne({ _id: decrement.variantId }, { $inc: { stockQty: decrement.quantity } })
        )
      )
    }
    throw error
  }
}

/**
 * Runs checkout inside a real MongoDB transaction when the deployment
 * supports one (a replica set or mongos).
 *
 * KNOWN LIMITATION: this project's default local dev setup (see lib/db.ts,
 * `mongodb://127.0.0.1:27017/babynest`) is a standalone `mongod`, which does
 * NOT support multi-document transactions. On that setup, the very first
 * write inside `withTransaction` throws, this function detects that
 * specific error, and falls back to running the same steps without a
 * session — safety instead comes from an atomic conditional stock
 * decrement per item (`stockQty: { $gte: quantity }` + `$inc`) plus manual
 * compensation (reverting already-applied decrements) if a later step
 * fails. This prevents overselling and partial orders either way, but only
 * the replica-set/mongos path gets true multi-document atomicity across
 * Order/OrderItem/Payment/Shipment/OrderStatusHistory creation.
 */
export async function performCheckout(userId: string, addressId: string, promotionCode?: string) {
  const mongooseSession = await mongoose.startSession()
  try {
    let result: Awaited<ReturnType<typeof runCheckout>> | undefined
    await mongooseSession.withTransaction(async () => {
      result = await runCheckout(userId, addressId, promotionCode, mongooseSession)
    })
    return result as Awaited<ReturnType<typeof runCheckout>>
  } catch (error) {
    // Legitimate business failures (bad address/empty cart/out of
    // stock/invalid promotion) are never treated as "transactions
    // unsupported" — only the driver's specific unsupported-transaction
    // error triggers the sessionless fallback below.
    if (error instanceof CheckoutError || error instanceof PromotionError) throw error
    const message = error instanceof Error ? error.message : String(error)
    const transactionsUnsupported =
      /Transaction numbers are only allowed|Transactions are not supported|IllegalOperation/i.test(message)
    if (!transactionsUnsupported) throw error
    return runCheckout(userId, addressId, promotionCode, null)
  } finally {
    await mongooseSession.endSession()
  }
}
