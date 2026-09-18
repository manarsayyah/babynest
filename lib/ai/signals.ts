import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import WishlistItem from "@/models/WishlistItem"
import Cart from "@/models/Cart"
import CartItem from "@/models/CartItem"
import ProductVariant from "@/models/ProductVariant"
import Product from "@/models/Product"
import Category from "@/models/Category"

/**
 * Builds a plain-text summary of a shopper's real engagement (past orders,
 * wishlist, active cart) for the AI to personalize against, plus the set of
 * product ids they've already engaged with (excluded from the candidate
 * pool so recommendations surface something new). Never invents signals —
 * a shopper with no history gets an explicit "no history" summary instead.
 */
export async function buildUserSignals(userId: string) {
  const orders = await Order.find({ userId, deletedAt: null }).select("_id").lean()
  const orderIds = orders.map((order) => order._id)
  const orderItems =
    orderIds.length > 0 ? await OrderItem.find({ orderId: { $in: orderIds } }).select("productId").lean() : []

  const wishlistItems = await WishlistItem.find({ userId, deletedAt: null }).select("productId").lean()

  const cart = await Cart.findOne({ userId, deletedAt: null }).sort({ createdAt: -1 }).select("_id").lean()
  const cartItems = cart
    ? await CartItem.find({ cartId: cart._id, deletedAt: null }).select("variantId").lean()
    : []
  const variantIds = cartItems.map((item) => item.variantId)
  const cartVariants =
    variantIds.length > 0 ? await ProductVariant.find({ _id: { $in: variantIds } }).select("productId").lean() : []

  const engagedProductIds = Array.from(
    new Set(
      [...orderItems.map((item) => item.productId), ...wishlistItems.map((item) => item.productId), ...cartVariants.map((v) => v.productId)].map(
        (id) => id.toString()
      )
    )
  )

  if (engagedProductIds.length === 0) {
    return {
      summaryText: "This shopper has no purchase, wishlist, or cart history yet. Recommend a well-rounded, generally popular selection.",
      excludeProductIds: [] as string[],
    }
  }

  const engagedProducts = await Product.find({ _id: { $in: engagedProductIds } })
    .select("categoryId material ageGroup")
    .lean()

  const categoryIds = Array.from(new Set(engagedProducts.map((p) => p.categoryId.toString())))
  const categories =
    categoryIds.length > 0 ? await Category.find({ _id: { $in: categoryIds } }).select("name").lean() : []
  const categoryNames = categories.map((c) => c.name)
  const materials = Array.from(new Set(engagedProducts.map((p) => p.material).filter((v): v is string => Boolean(v))))
  const ageGroups = Array.from(new Set(engagedProducts.map((p) => p.ageGroup).filter((v): v is string => Boolean(v))))

  const summaryText = [
    `Categories this shopper has engaged with: ${categoryNames.join(", ") || "unspecified"}.`,
    `Materials they've shown interest in: ${materials.join(", ") || "unspecified"}.`,
    `Age groups relevant to them: ${ageGroups.join(", ") || "unspecified"}.`,
  ].join(" ")

  return { summaryText, excludeProductIds: engagedProductIds }
}
