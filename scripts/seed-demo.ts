/**
 * Demo data seed — populates a coherent, realistic BabyNest dataset (customers,
 * addresses, extra catalog, carts, wishlists, promotions, orders and everything
 * hanging off them, reviews, notifications, AI history) for demos, screenshots
 * and end-to-end testing.
 *
 * Usage: npm run seed:demo        (run `npm run seed:catalog` and `seed:admin` first or not — both are optional)
 *
 * Repeatable & safe to rerun: everything this script owns is identified by a
 * stable marker and is rebuilt on each run —
 *   - users:      email ending in @seed.babynest.test
 *   - orders:     orderNumber starting with ORD-SEED-
 *   - catalog:    fixed slugs (Product/Category/Tag), fixed SKUs (prefix SD-), promo codes
 * The reset step only deletes rows owned by those seed users / seed orders.
 * Real users, real orders, the existing catalog products and any other data
 * are never touched. Product ratings/review counts of seed products are derived
 * from the seeded published reviews (same rule as recalculateProductRating);
 * seed variant stock is stored net of the seeded non-cancelled orders.
 *
 * Manual tool only: never imported by the app or exposed through a route.
 * Payments are Cash on Delivery only.
 */
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import connectToDatabase from "../lib/db"
import User from "../models/User"
import Address from "../models/Address"
import Category from "../models/Category"
import Tag from "../models/Tag"
import Product from "../models/Product"
import ProductVariant from "../models/ProductVariant"
import ProductImage from "../models/ProductImage"
import ProductTag from "../models/ProductTag"
import WishlistItem from "../models/WishlistItem"
import Cart from "../models/Cart"
import CartItem from "../models/CartItem"
import Promotion from "../models/Promotion"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import OrderPromotion from "../models/OrderPromotion"
import OrderStatusHistory from "../models/OrderStatusHistory"
import Payment from "../models/Payment"
import Shipment from "../models/Shipment"
import Return from "../models/Return"
import ReturnItem from "../models/ReturnItem"
import Review from "../models/Review"
import Notification from "../models/Notification"
import AiSearchQuery from "../models/AiSearchQuery"
import AiRecommendation from "../models/AiRecommendation"
import { hasPhoto, productImageUrl } from "./product-images"
import { mappedCategoryImage } from "../lib/category-images"

const SALT_ROUNDS = 12
const SEED_EMAIL_DOMAIN = "@seed.babynest.test"
const SEED_PASSWORD = "Seed@12345"
const ORDER_PREFIX = "ORD-SEED-"
const FREE_SHIPPING_THRESHOLD = 75
const FLAT_SHIPPING_FEE = 6.99

const round2 = (n: number) => Math.round(n * 100) / 100
const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const NOW = new Date()
const TODAY = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()))
/** A date `daysAgo` days before today (UTC) at the given time, never in the future. */
function at(daysAgo: number, hour = 10, minute = 0): Date {
  const d = new Date(TODAY.getTime() - daysAgo * 86_400_000 + (hour * 60 + minute) * 60_000)
  return d > NOW ? new Date(NOW.getTime() - 60_000) : d
}
const plusHours = (d: Date, h: number) => {
  const r = new Date(d.getTime() + h * 3_600_000)
  return r > NOW ? new Date(NOW.getTime() - 30_000) : r
}

// ---------------------------------------------------------------------------
// Seed definitions
// ---------------------------------------------------------------------------

const CATEGORY_SEEDS = [
  { slug: "safety", name: "Safety", description: "Everyday home and travel safety essentials.", tint: "bg-[#E9F0E6]" },
  { slug: "baby-monitors", name: "Baby Monitors", description: "Monitors and night lights.", parent: "safety", tint: "bg-[#E9F0E6]" },
  { slug: "safety-gates-locks", name: "Safety Gates & Locks", description: "Gates, corner guards and cabinet locks.", parent: "safety", tint: "bg-[#E9F0E6]" },
  { slug: "diapering", name: "Diapering", description: "Diapers, wipes and changing essentials.", tint: "bg-[#E7F1FA]" },
  { slug: "diapers-wipes", name: "Diapers & Wipes", description: "Diapers and gentle wipes.", parent: "diapering", tint: "bg-[#E7F1FA]" },
  { slug: "changing-essentials", name: "Changing Essentials", description: "Changing pads, caddies and diaper bags.", parent: "diapering", tint: "bg-[#E7F1FA]" },
  { slug: "strollers", name: "Strollers", description: "Strollers and travel systems.", parent: "strollers-travel", tint: "bg-[#EFEAE3]" },
  { slug: "carriers-travel", name: "Carriers & Travel Gear", description: "Carriers and on-the-go accessories.", parent: "strollers-travel", tint: "bg-[#EFEAE3]" },
]
const TAG_NAMES = ["BPA-Free", "Organic", "Eco-Friendly", "Cotton", "Newborn", "Sensitive Skin", "Lightweight", "New", "Best Seller", "Soft", "Travel", "Baby Safe"]

type V = { key: string; color?: string; size?: string; delta?: number; stock: number }
type P = {
  code: string
  slug: string
  name: string
  brand: string
  material: string
  age: string
  price: number
  cat: string
  tags: string[]
  desc: string
  variants: V[]
}
const v = (key: string, stock: number, color?: string, size?: string, delta = 0): V => ({ key, color, size, delta, stock })

const PRODUCTS: P[] = [
  // Feeding
  { code: "FBP", slug: "anti-colic-bottle-twin-pack", name: "Anti-Colic Baby Bottle, Twin Pack", brand: "CozyCub", material: "BPA-free PP", age: "0-6m", price: 19.99, cat: "bottles", tags: ["bpa-free", "best-seller", "baby-safe"], desc: "Two vented bottles with slow-flow nipples designed for comfortable feeds.", variants: [v("150", 84, undefined, "150ml"), v("260", 62, undefined, "260ml", 3)] },
  { code: "FSC", slug: "silicone-suction-bowl-set", name: "Silicone Suction Bowl Set", brand: "PureStart", material: "Food-grade silicone", age: "6-12m", price: 17.5, cat: "feeding-accessories", tags: ["bpa-free", "eco-friendly", "new"], desc: "Non-slip suction bowls and matching spoon that stay put on the highchair tray.", variants: [v("SAGE", 46, "Sage"), v("BLUSH", 9, "Blush"), v("SAND", 31, "Sand")] },
  { code: "FBB", slug: "waterproof-feeding-bib-set", name: "Waterproof Feeding Bib Set", brand: "CozyCub", material: "Polyester / PU", age: "6-12m", price: 14.0, cat: "bibs", tags: ["soft", "best-seller"], desc: "Set of four wipe-clean bibs with adjustable snap closure.", variants: [v("ANIM", 75, "Animals"), v("STAR", 0, "Stars")] },
  { code: "FST", slug: "stainless-steel-sippy-cup", name: "Stainless Steel Sippy Cup", brand: "PureStart", material: "Stainless steel", age: "1-2y", price: 21.5, cat: "feeding-accessories", tags: ["eco-friendly", "bpa-free", "travel"], desc: "Insulated sippy cup with a leak-proof silicone spout and easy-grip handles.", variants: [v("BLU", 38, "Blue", "240ml"), v("PNK", 27, "Pink", "240ml")] },
  { code: "FBW", slug: "bamboo-bibs-burp-cloth-bundle", name: "Bamboo Bib & Burp Cloth Bundle", brand: "TinyBloom", material: "Bamboo viscose", age: "0-6m", price: 24.0, cat: "bibs", tags: ["organic", "soft", "sensitive-skin"], desc: "Ultra-soft, absorbent bibs and burp cloths for newborn feeding.", variants: [v("WHT", 58, "White"), v("GRY", 41, "Grey")] },
  // Clothing
  { code: "CBS", slug: "organic-long-sleeve-bodysuit", name: "Organic Long-Sleeve Bodysuit", brand: "TinyBloom", material: "Organic cotton", age: "0-6m", price: 15.99, cat: "bodysuits", tags: ["organic", "cotton", "newborn", "best-seller"], desc: "Envelope-neck bodysuit with snap crotch for quick changes.", variants: [v("NB", 66, "Cream", "Newborn"), v("03", 54, "Cream", "0-3M"), v("36", 7, "Cream", "3-6M")] },
  { code: "CSL", slug: "zip-front-sleepsuit-with-mitts", name: "Zip-Front Sleepsuit with Mitts", brand: "TinyBloom", material: "Cotton", age: "0-6m", price: 21.0, cat: "sleepwear", tags: ["cotton", "soft", "newborn"], desc: "Zip-front sleepsuit with fold-over mitts for cosy nights.", variants: [v("BLU", 44, "Sky Blue", "0-3M"), v("PNK", 36, "Dusty Pink", "0-3M"), v("BLU6", 22, "Sky Blue", "3-6M")] },
  { code: "CSK", slug: "wearable-sleep-sack", name: "Wearable Sleep Sack", brand: "SnuggleNest", material: "Cotton muslin", age: "6-12m", price: 29.0, cat: "sleepwear", tags: ["soft", "cotton", "baby-safe"], desc: "Breathable wearable blanket with a two-way zip for easy diaper changes.", variants: [v("SM", 33, "Oat", "6-12M"), v("MD", 8, "Oat", "12-18M")] },
  { code: "CHT", slug: "knit-hat-and-mittens-set", name: "Knit Hat & Mittens Set", brand: "SnuggleNest", material: "Cotton blend", age: "0-6m", price: 12.5, cat: "clothing", tags: ["soft", "newborn", "new"], desc: "Stretchy knit hat with matching no-scratch mittens.", variants: [v("CRM", 52, "Cream"), v("GRN", 40, "Sage")] },
  { code: "CDR", slug: "cotton-romper-two-pack", name: "Cotton Romper, 2-Pack", brand: "TinyBloom", material: "Cotton", age: "6-12m", price: 26.0, cat: "clothing", tags: ["cotton", "soft"], desc: "Short-sleeve rompers for warm days, with easy snap closures.", variants: [v("SM", 47, "Stripe", "6-9M"), v("MD", 29, "Stripe", "9-12M")] },
  // Bath & care
  { code: "BTW", slug: "hooded-bath-towel", name: "Hooded Bath Towel", brand: "SnuggleNest", material: "Bamboo cotton", age: "0-6m", price: 18.0, cat: "bath-accessories", tags: ["soft", "eco-friendly", "sensitive-skin"], desc: "Extra-absorbent hooded towel that keeps little ones warm after bath.", variants: [v("WHT", 61, "White"), v("SAG", 35, "Sage")] },
  { code: "BTB", slug: "foldable-baby-bathtub", name: "Foldable Baby Bathtub", brand: "SplashPal", material: "BPA-free PP / TPE", age: "0-6m", price: 34.0, cat: "bath-accessories", tags: ["bpa-free", "travel", "lightweight"], desc: "Space-saving foldable tub with a non-slip base and drain plug.", variants: [v("GRY", 24, "Grey"), v("BLU", 6, "Aqua")] },
  { code: "BWC", slug: "soft-bath-washcloths-6-pack", name: "Soft Bath Washcloths, 6-Pack", brand: "TinyBloom", material: "Organic cotton", age: "0-6m", price: 11.5, cat: "baby-care", tags: ["organic", "soft", "sensitive-skin"], desc: "Gentle terry washcloths for bathtime and mealtime wipe-ups.", variants: [v("PST", 92, "Pastel"), v("NEU", 70, "Neutral")] },
  { code: "BSH", slug: "tear-free-baby-shampoo", name: "Tear-Free Baby Shampoo & Wash", brand: "PureStart", material: "Plant-based formula", age: "0-6m", price: 9.9, cat: "baby-care", tags: ["organic", "sensitive-skin", "best-seller"], desc: "Gentle two-in-one wash with a light, fragrance-free formula.", variants: [v("250", 118, undefined, "250ml"), v("500", 45, undefined, "500ml", 6)] },
  { code: "BNB", slug: "baby-nail-care-kit", name: "Baby Nail Care Kit", brand: "PureStart", material: "Stainless steel / ABS", age: "0-6m", price: 13.0, cat: "baby-care", tags: ["newborn", "baby-safe"], desc: "Rounded clippers, file and scissors in a compact travel pouch.", variants: [v("BLU", 39, "Blue"), v("PNK", 0, "Pink")] },
  // Nursery
  { code: "NSW", slug: "muslin-swaddle-blankets-3-pack", name: "Muslin Swaddle Blankets, 3-Pack", brand: "SnuggleNest", material: "Cotton muslin", age: "0-6m", price: 27.0, cat: "blankets", tags: ["cotton", "soft", "newborn", "best-seller"], desc: "Breathable, oversized swaddles that soften with every wash.", variants: [v("NEU", 72, "Neutral"), v("FLR", 48, "Floral")] },
  { code: "NKB", slug: "knitted-baby-blanket", name: "Knitted Baby Blanket", brand: "TinyBloom", material: "Organic cotton", age: "0-6m", price: 39.0, cat: "blankets", tags: ["organic", "soft", "new"], desc: "Chunky-knit stroller and crib blanket in soft neutral tones.", variants: [v("CRM", 26, "Cream"), v("GRY", 4, "Grey")] },
  { code: "NCS", slug: "fitted-crib-sheet-2-pack", name: "Fitted Crib Sheet, 2-Pack", brand: "SnuggleNest", material: "Jersey cotton", age: "0-6m", price: 23.0, cat: "bedding", tags: ["cotton", "soft", "sensitive-skin"], desc: "Stretchy fitted sheets that fit standard crib mattresses snugly.", variants: [v("WHT", 55, "White/Grey"), v("STR", 43, "Stars")] },
  { code: "NNL", slug: "gentle-glow-night-light", name: "Gentle Glow Night Light", brand: "LumiKid", material: "Silicone", age: "0-6m", price: 22.0, cat: "nursery", tags: ["baby-safe", "eco-friendly", "new"], desc: "Rechargeable squeezable night light with a warm, dimmable glow.", variants: [v("CLD", 34, "Cloud"), v("MON", 19, "Moon")] },
  { code: "NMB", slug: "crib-mobile-woodland", name: "Woodland Crib Mobile", brand: "LumiKid", material: "Wood / felt", age: "0-6m", price: 44.0, cat: "nursery", tags: ["eco-friendly", "soft"], desc: "Hand-finished felt animals on a wooden arm to watch over the crib.", variants: [v("STD", 15, "Natural")] },
  // Toys
  { code: "TSK", slug: "stacking-rings-toy", name: "Rainbow Stacking Rings", brand: "PlayNest", material: "Beech wood", age: "6-12m", price: 16.5, cat: "developmental-toys", tags: ["eco-friendly", "baby-safe", "best-seller"], desc: "Classic stacking toy that builds hand-eye coordination.", variants: [v("STD", 68, "Rainbow")] },
  { code: "TAM", slug: "soft-activity-mat", name: "Soft Activity Play Mat", brand: "PlayNest", material: "Padded cotton", age: "0-6m", price: 49.0, cat: "developmental-toys", tags: ["soft", "organic", "new"], desc: "Padded playmat with hanging toys for tummy time and play.", variants: [v("SAG", 21, "Sage"), v("BLS", 12, "Blush")] },
  { code: "TTE", slug: "silicone-teething-toys-set", name: "Silicone Teething Toys Set", brand: "PureStart", material: "Food-grade silicone", age: "0-6m", price: 12.0, cat: "developmental-toys", tags: ["bpa-free", "baby-safe", "best-seller"], desc: "Three textured silicone teethers that are easy to grip and clean.", variants: [v("NEU", 96, "Neutral"), v("BRT", 74, "Bright")] },
  { code: "TBK", slug: "wooden-building-blocks", name: "Wooden Building Blocks, 30 pcs", brand: "PlayNest", material: "Beech wood", age: "1-2y", price: 28.0, cat: "developmental-toys", tags: ["eco-friendly", "baby-safe"], desc: "Smooth, colourful blocks that encourage stacking and imaginative play.", variants: [v("STD", 37, "Multi")] },
  { code: "TBR", slug: "plush-bunny-lovey", name: "Plush Bunny Lovey", brand: "SnuggleNest", material: "Plush polyester", age: "0-6m", price: 19.0, cat: "soft-toys", tags: ["soft", "newborn", "best-seller"], desc: "A snuggly bunny lovey with a knotted comforter for tiny hands.", variants: [v("CRM", 58, "Cream"), v("GRY", 33, "Grey")] },
  { code: "TEL", slug: "musical-elephant-plush", name: "Musical Elephant Plush", brand: "SnuggleNest", material: "Plush polyester", age: "6-12m", price: 24.5, cat: "soft-toys", tags: ["soft", "new"], desc: "Wind-up lullaby elephant that plays a gentle melody.", variants: [v("BLU", 28, "Blue"), v("PNK", 3, "Pink")] },
  { code: "TBT", slug: "bath-time-squirty-toys", name: "Bath Time Squirty Toys", brand: "SplashPal", material: "BPA-free rubber", age: "6-12m", price: 10.5, cat: "bath-accessories", tags: ["bpa-free", "baby-safe"], desc: "Set of five mould-resistant squirt toys for bath time fun.", variants: [v("SEA", 85, "Sea Life")] },
  // Safety
  { code: "SMN", slug: "wifi-video-baby-monitor", name: "Video Baby Monitor", brand: "LumiKid", material: "ABS", age: "0-6m", price: 89.0, cat: "baby-monitors", tags: ["new", "best-seller"], desc: "Wide-angle video monitor with night vision and two-way talk.", variants: [v("WHT", 18, "White"), v("GRY", 11, "Grey", undefined, 10)] },
  { code: "SGT", slug: "pressure-mounted-safety-gate", name: "Pressure-Mounted Safety Gate", brand: "SafeNest", material: "Steel / ABS", age: "1-2y", price: 54.0, cat: "safety-gates-locks", tags: ["baby-safe"], desc: "Walk-through gate with a one-hand release for doorways and hallways.", variants: [v("WHT", 16, "White"), v("GRY", 8, "Grey")] },
  { code: "SCG", slug: "corner-edge-guards-8-pack", name: "Corner & Edge Guards, 8-Pack", brand: "SafeNest", material: "Soft foam", age: "6-12m", price: 15.0, cat: "safety-gates-locks", tags: ["baby-safe", "soft"], desc: "Cushioned corner protectors with strong adhesive backing.", variants: [v("CLR", 64, "Clear"), v("GRY", 51, "Grey")] },
  { code: "SCL", slug: "cabinet-safety-locks-10-pack", name: "Cabinet Safety Locks, 10-Pack", brand: "SafeNest", material: "ABS", age: "6-12m", price: 13.5, cat: "safety-gates-locks", tags: ["baby-safe"], desc: "No-drill adhesive locks for cabinets and drawers.", variants: [v("WHT", 79, "White")] },
  // Diapering
  { code: "DDS", slug: "ultra-soft-diapers-size-2", name: "Ultra-Soft Diapers, Size 2", brand: "PureStart", material: "Cotton-soft topsheet", age: "0-6m", price: 18.5, cat: "diapers-wipes", tags: ["sensitive-skin", "best-seller"], desc: "Absorbent, comfortable diapers with a wetness indicator, 72 count.", variants: [v("S2", 130, undefined, "Size 2"), v("S3", 105, undefined, "Size 3")] },
  { code: "DWP", slug: "water-wipes-3-pack", name: "Sensitive Baby Wipes, 3-Pack", brand: "PureStart", material: "Plant-based fibre", age: "0-6m", price: 11.0, cat: "diapers-wipes", tags: ["organic", "sensitive-skin", "eco-friendly"], desc: "Fragrance-free wipes, 60 per pack.", variants: [v("STD", 150)] },
  { code: "DCP", slug: "portable-changing-pad", name: "Portable Changing Pad", brand: "SnuggleNest", material: "Quilted cotton / PU", age: "0-6m", price: 25.0, cat: "changing-essentials", tags: ["travel", "lightweight"], desc: "Foldable, wipe-clean changing pad with a pocket for wipes.", variants: [v("GRY", 42, "Grey"), v("SAG", 30, "Sage")] },
  { code: "DBG", slug: "everyday-diaper-bag-backpack", name: "Everyday Diaper Bag Backpack", brand: "RoamBaby", material: "Recycled polyester", age: "0-6m", price: 59.0, cat: "changing-essentials", tags: ["travel", "eco-friendly", "best-seller"], desc: "Roomy backpack with insulated bottle pockets and stroller straps.", variants: [v("BLK", 25, "Black"), v("OLV", 14, "Olive"), v("SND", 0, "Sand")] },
  // Travel
  { code: "TSL", slug: "compact-fold-airline-stroller", name: "Compact Fold Airline Stroller", brand: "RoamBaby", material: "Aluminium / polyester", age: "6-12m", price: 149.0, cat: "strollers", tags: ["travel", "lightweight", "new"], desc: "One-hand fold stroller that fits airplane overhead bins.", variants: [v("GRY", 12, "Grey"), v("NVY", 9, "Navy")] },
  { code: "TCR", slug: "ergonomic-baby-carrier", name: "Ergonomic Baby Carrier", brand: "RoamBaby", material: "Breathable cotton", age: "0-6m", price: 79.0, cat: "carriers-travel", tags: ["travel", "cotton", "best-seller"], desc: "Adjustable carrier with padded shoulder straps for all-day comfort.", variants: [v("GRY", 23, "Grey"), v("SGE", 17, "Sage")] },
  { code: "TSF", slug: "stroller-sun-shade-and-organiser", name: "Stroller Sun Shade & Organiser", brand: "RoamBaby", material: "UV-resistant fabric", age: "6-12m", price: 22.0, cat: "carriers-travel", tags: ["travel", "lightweight"], desc: "Universal sun shade with a drink holder and storage pocket.", variants: [v("STD", 44)] },
  { code: "TMS", slug: "muslin-stroller-cover", name: "Muslin Stroller Cover", brand: "SnuggleNest", material: "Cotton muslin", age: "0-6m", price: 20.0, cat: "carriers-travel", tags: ["cotton", "soft", "travel"], desc: "Lightweight breathable cover for strollers and car seats.", variants: [v("FLR", 5, "Floral"), v("SAG", 27, "Sage")] },
]
const skuOf = (p: P, vv: V) => `SD-${p.code}-${vv.key}`

const CUSTOMERS = [
  { first: "Layla", last: "Haddad", email: "customer@babynest.com", password: "customer@12345", phone: "+961 3 112 233", city: "Beirut", state: "Beirut", street: "Hamra Street 45", apt: "Apt 3B", postal: "1103", joined: 118 },
  { first: "Omar", last: "Khoury", phone: "+961 70 224 455", city: "Jounieh", state: "Mount Lebanon", street: "Maameltein Road 12", apt: "Floor 2", postal: "1200", joined: 110 },
  { first: "Nour", last: "Mansour", phone: "+961 71 335 677", city: "Tripoli", state: "North Lebanon", street: "Al Mina Street 8", apt: "Apt 5", postal: "1300", joined: 104 },
  { first: "Karim", last: "Saade", phone: "+961 3 446 880", city: "Sidon", state: "South Lebanon", street: "Riad El Solh Street 21", apt: "Apt 1A", postal: "1600", joined: 96 },
  { first: "Maya", last: "Nassar", phone: "+961 76 557 901", city: "Byblos", state: "Mount Lebanon", street: "Old Souk Road 7", apt: "Apt 4", postal: "1401", joined: 88 },
  { first: "Rami", last: "Fares", phone: "+961 3 668 012", city: "Zahle", state: "Beqaa", street: "Kassara Street 33", apt: "Floor 3", postal: "1801", joined: 79 },
  { first: "Dana", last: "Khalil", phone: "+961 71 779 123", city: "Baabda", state: "Mount Lebanon", street: "Hazmieh Highway 16", apt: "Apt 6C", postal: "1100", joined: 66 },
  { first: "Hadi", last: "Karam", phone: "+961 70 880 234", city: "Tyre", state: "South Lebanon", street: "Corniche Road 9", apt: "Apt 2", postal: "1700", joined: 51 },
  { first: "Lina", last: "Abboud", phone: "+961 3 991 345", city: "Beirut", state: "Beirut", street: "Achrafieh Sassine 60", apt: "Apt 8D", postal: "1100", joined: 38 },
  { first: "Tarek", last: "Sleiman", phone: "+961 76 102 456", city: "Jounieh", state: "Mount Lebanon", street: "Kaslik Main Road 4", apt: "Floor 1", postal: "1200", joined: 24 },
]
const emailOf = (c: (typeof CUSTOMERS)[number]) => c.email ?? `${c.first}.${c.last}`.toLowerCase() + SEED_EMAIL_DOMAIN
// Second (non-default) addresses for some customers, by customer index.
const EXTRA_ADDRESSES: Record<number, { label: "Work" | "Other"; street: string; apt: string; city: string; state: string; postal: string }> = {
  0: { label: "Work", street: "Verdun Street 102", apt: "Office 7", city: "Beirut", state: "Beirut", postal: "1107" },
  1: { label: "Other", street: "Adma Road 3", apt: "Villa 3", city: "Jounieh", state: "Mount Lebanon", postal: "1200" },
  3: { label: "Work", street: "Downtown Sidon 15", apt: "Suite 2", city: "Sidon", state: "South Lebanon", postal: "1600" },
  6: { label: "Other", street: "Baabda Palace Road 20", apt: "Apt 1", city: "Baabda", state: "Mount Lebanon", postal: "1100" },
}

const PROMOS = [
  { code: "WELCOME10", description: "10% off your first order.", discountType: "percentage" as const, discountValue: 10, start: -120, end: 120, active: true },
  { code: "BABY15", description: "15% off baby essentials.", discountType: "percentage" as const, discountValue: 15, start: -45, end: 45, active: true },
  { code: "SUMMER15", description: "Summer sale, 15% off.", discountType: "percentage" as const, discountValue: 15, start: -100, end: -25, active: false },
  { code: "NEWMOM10", description: "$10 off for new moms.", discountType: "fixed" as const, discountValue: 10, start: -60, end: 90, active: true },
]

type OrderSeed = {
  cust: number
  ago: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  lines: [string, string, number][] // [product code, variant key, qty]
  promo?: string
  ret?: { status: "requested" | "approved" | "rejected" | "completed"; reason: string; condition: string; line: number; qty: number }
}
const ORDERS: OrderSeed[] = [
  { cust: 0, ago: 112, status: "delivered", lines: [["CBS", "NB", 3], ["NSW", "NEU", 1], ["BSH", "250", 2]], promo: "WELCOME10" },
  { cust: 1, ago: 101, status: "delivered", lines: [["FBP", "150", 2], ["TTE", "NEU", 1]], promo: "WELCOME10" },
  { cust: 2, ago: 92, status: "delivered", lines: [["DDS", "S2", 3], ["DWP", "STD", 2]] },
  { cust: 3, ago: 84, status: "delivered", lines: [["TCR", "GRY", 1], ["TMS", "SAG", 1]], promo: "SUMMER15" },
  { cust: 4, ago: 71, status: "delivered", lines: [["TAM", "SAG", 1], ["TBR", "CRM", 1], ["TTE", "BRT", 2]], promo: "SUMMER15" },
  { cust: 5, ago: 63, status: "cancelled", lines: [["TSL", "GRY", 1]] },
  { cust: 0, ago: 52, status: "delivered", lines: [["SMN", "WHT", 1], ["NNL", "CLD", 1]], ret: { status: "completed", reason: "The unit arrived with a faulty charging port.", condition: "Opened, in original box", line: 1, qty: 1 } },
  { cust: 6, ago: 44, status: "delivered", lines: [["CSL", "BLU", 2], ["BTW", "WHT", 1], ["BWC", "PST", 2]], promo: "NEWMOM10" },
  { cust: 1, ago: 36, status: "delivered", lines: [["SGT", "WHT", 1], ["SCG", "CLR", 2], ["SCL", "WHT", 1]], promo: "BABY15" },
  { cust: 7, ago: 29, status: "delivered", lines: [["FSC", "SAGE", 2], ["FST", "BLU", 1]], ret: { status: "requested", reason: "The colour is different from the photos.", condition: "Unused", line: 0, qty: 1 } },
  { cust: 2, ago: 22, status: "delivered", lines: [["TBK", "STD", 1], ["TSK", "STD", 1], ["TBT", "SEA", 2]], promo: "BABY15", ret: { status: "approved", reason: "Received the wrong item in the set.", condition: "Unused", line: 2, qty: 1 } },
  { cust: 8, ago: 17, status: "delivered", lines: [["DBG", "OLV", 1], ["DCP", "SAG", 1]], promo: "BABY15" },
  { cust: 3, ago: 12, status: "shipped", lines: [["CDR", "SM", 2], ["CHT", "CRM", 1]] },
  { cust: 9, ago: 9, status: "delivered", lines: [["BTB", "GRY", 1], ["BSH", "500", 1]] },
  { cust: 4, ago: 8, status: "shipped", lines: [["NKB", "CRM", 1], ["NCS", "WHT", 1]], promo: "BABY15" },
  { cust: 6, ago: 5, status: "processing", lines: [["FBB", "ANIM", 2], ["FBW", "WHT", 1]] },
  { cust: 8, ago: 4, status: "cancelled", lines: [["NMB", "STD", 1]] },
  { cust: 5, ago: 3, status: "processing", lines: [["TEL", "BLU", 1], ["CSK", "SM", 1], ["BNB", "BLU", 1]], promo: "NEWMOM10" },
  { cust: 9, ago: 2, status: "pending", lines: [["DDS", "S3", 2], ["DWP", "STD", 1]] },
  { cust: 7, ago: 1, status: "pending", lines: [["TSF", "STD", 1], ["TCR", "SGE", 1]] },
]

// Reviews: [order index, line index, rating, comment, status] for delivered orders (verified);
// standalone unverified reviews are appended below.
const VERIFIED_REVIEWS: [number, number, number, string, "published" | "pending" | "hidden"][] = [
  [0, 0, 5, "Super soft and washes really well, we bought a second pack.", "published"],
  [0, 1, 5, "The muslin swaddles are lovely and breathable.", "published"],
  [0, 2, 4, "Gentle wash with a light smell, lasts a while.", "published"],
  [1, 0, 4, "Good bottles, easy to clean and no leaks.", "published"],
  [1, 1, 5, "Our baby loves chewing on these teethers.", "published"],
  [2, 0, 4, "Great fit and absorbent, delivery was quick.", "published"],
  [2, 1, 5, "Soft wipes, no irritation at all.", "published"],
  [3, 0, 5, "Very comfortable for long walks, straps are well padded.", "published"],
  [4, 0, 4, "Nice thick mat, colours look calm and pretty.", "published"],
  [4, 1, 5, "The bunny is now inseparable from our little one.", "published"],
  [6, 0, 3, "Good picture quality, but the first unit had a charging issue.", "published"],
  [6, 1, 5, "Perfect glow for night feeds.", "published"],
  [7, 0, 5, "Cosy sleepsuits, the mitts are a clever touch.", "published"],
  [7, 1, 4, "Thick towel, dries quickly.", "published"],
  [8, 0, 4, "Sturdy gate, took a few minutes to install.", "published"],
  [8, 1, 5, "Corner guards stay in place well.", "published"],
  [9, 0, 4, "Suction really holds. Colour is a bit greyer than photos.", "published"],
  [10, 0, 5, "Beautiful wooden blocks, great quality.", "published"],
  [10, 1, 4, "Nice stacking rings, good size for small hands.", "published"],
  [11, 0, 5, "Roomy and stylish, the bottle pockets are handy.", "published"],
  [11, 1, 4, "Folds up small and wipes clean.", "pending"],
  [13, 0, 4, "Easy to fill and drain, folds flat.", "published"],
  [13, 1, 2, "Not what I expected, packaging was damaged.", "hidden"],
]
const EXTRA_REVIEWS: [number, string, number, string, "published" | "pending"][] = [
  // [customer index, product code, rating, comment, status] — not from a tracked purchase (unverified)
  [5, "TBR", 5, "Gift for my niece, she adores it.", "published"],
  [6, "TSK", 4, "Bought at a store first, then a second one online. Solid toy.", "published"],
  [9, "SMN", 5, "Clear picture even at night, setup was simple.", "published"],
  [2, "CBS", 4, "Runs slightly small, size up.", "pending"],
]
const AI_SEARCHES: [number, string, number, number][] = [
  [0, "organic cotton bodysuit for newborn", 2, 100],
  [1, "best anti colic bottles", 1, 96],
  [2, "gentle wipes for sensitive skin", 3, 90],
  [3, "lightweight travel stroller", 1, 80],
  [4, "soft toys for 3 month old", 3, 70],
  [5, "sleep sack for summer", 2, 60],
  [6, "safety gate for stairs", 1, 45],
  [7, "silicone bibs under 20", 3, 30],
  [8, "diaper bag backpack", 2, 20],
  [9, "night light for nursery", 2, 10],
  [0, "wooden toys 1 year old", 3, 6],
  [8, "baby monitor with video", 1, 2],
]
const AI_RECS: [number, string, string, number, number][] = [
  [0, "TAM", "Popular play mat for babies around your baby's age.", 0.92, 40],
  [0, "TTE", "Frequently bought together with bodysuits and swaddles.", 0.85, 40],
  [1, "SCL", "Complements the safety gate you purchased.", 0.88, 30],
  [2, "TCR", "Customers who bought diapers also like carriers for outings.", 0.74, 25],
  [3, "TSL", "Matches your interest in travel gear.", 0.9, 20],
  [4, "NNL", "A soft night light to go with your nursery items.", 0.81, 18],
  [5, "FBP", "Best-selling bottle set for newborns.", 0.79, 14],
  [6, "CSK", "Fits your baby's age range and previous sleepwear purchase.", 0.83, 12],
  [7, "FST", "Pairs well with your feeding accessories.", 0.77, 10],
  [8, "TBR", "Popular soft toy in your basket category.", 0.72, 8],
  [9, "BWC", "Gentle bath essentials, a natural add-on to your order.", 0.7, 5],
  [3, "DBG", "Handy accessory for the travel gear you viewed.", 0.86, 5],
]
const CARTS: [number, [string, string, number][]][] = [
  [3, [["TSF", "STD", 1], ["CHT", "GRN", 1]]],
  [5, [["FSC", "SAND", 2]]],
  [7, [["TAM", "BLS", 1], ["TBK", "STD", 1]]],
  [9, [["BSH", "250", 2], ["BWC", "NEU", 1], ["DCP", "GRY", 1]]],
]
const WISHLIST: [number, string][] = [
  [0, "TAM"], [0, "NKB"], [1, "SMN"], [2, "TCR"], [2, "TBK"], [3, "TSL"], [4, "NNL"], [4, "NMB"],
  [5, "DBG"], [6, "BTB"], [7, "CDR"], [8, "SGT"], [8, "TEL"], [9, "FST"],
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Timed = { createdAt: Date; updatedAt?: Date }
/** Creates docs with explicit historical timestamps (Mongoose respects supplied createdAt/updatedAt when timestamps are off). */
async function createTimed<T extends Timed>(model: mongoose.Model<any>, docs: T[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (docs.length === 0) return []
  const withUpdated = docs.map((d) => ({ ...d, updatedAt: d.updatedAt ?? d.createdAt }))
  return model.create(withUpdated, { timestamps: false })
}

async function main() {
  const conn = await connectToDatabase()
  try {
    // ---- Reset (seed-scoped only) ----
    const seedEmailRegex = `${SEED_EMAIL_DOMAIN.replace(".", "\\.")}$`
    // The first customer uses customer@babynest.com, outside the seed domain, so include it in the reset scope.
    const seedUsers = await User.find({ $or: [{ email: { $regex: seedEmailRegex } }, { email: emailOf(CUSTOMERS[0]) }] }).select("_id email password").lean()
    const seedUserIds = seedUsers.map((u) => u._id)
    const seedOrders = await Order.find({ orderNumber: { $regex: `^${ORDER_PREFIX}` } }).select("_id").lean()
    const seedOrderIds = seedOrders.map((o) => o._id)
    const returns = await Return.find({ orderId: { $in: seedOrderIds } }).select("_id").lean()
    await ReturnItem.deleteMany({ returnId: { $in: returns.map((r) => r._id) } })
    await Return.deleteMany({ orderId: { $in: seedOrderIds } })
    for (const m of [OrderItem, OrderPromotion, OrderStatusHistory, Payment, Shipment] as mongoose.Model<any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      await m.deleteMany({ orderId: { $in: seedOrderIds } })
    }
    await Order.deleteMany({ _id: { $in: seedOrderIds } })
    const seedCarts = await Cart.find({ userId: { $in: seedUserIds } }).select("_id").lean()
    await CartItem.deleteMany({ cartId: { $in: seedCarts.map((c) => c._id) } })
    for (const m of [Cart, WishlistItem, Review, Notification, AiSearchQuery, AiRecommendation, Address] as mongoose.Model<any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      await m.deleteMany({ userId: { $in: seedUserIds } })
    }

    // ---- Users ----
    // The first customer was renamed to customer@babynest.com; drop its old seed-domain account.
    await User.deleteOne({ email: `layla.haddad${SEED_EMAIL_DOMAIN}` })
    const upsertUser = async (first: string, last: string, email: string, role: "admin" | "customer", createdAt: Date, password = SEED_PASSWORD) => {
      const existing = seedUsers.find((u) => u.email === email)
      const keepHash = existing ? await bcrypt.compare(password, existing.password) : false
      const user = await User.findOneAndUpdate(
        { email },
        {
          $set: { firstName: first, lastName: last, role, deletedAt: null, password: keepHash && existing ? existing.password : await bcrypt.hash(password, SALT_ROUNDS) },
          $setOnInsert: { createdAt, updatedAt: createdAt },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, timestamps: false }
      )
      return user!
    }
    const adminUser = await upsertUser("Sara", "Mitri", `admin${SEED_EMAIL_DOMAIN}`, "admin", at(130))
    const users = []
    for (const c of CUSTOMERS) users.push(await upsertUser(c.first, c.last, emailOf(c), "customer", at(c.joined, 9), c.password))

    // ---- Addresses ----
    const addressIds: mongoose.Types.ObjectId[][] = CUSTOMERS.map(() => [])
    const addressDocs: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    CUSTOMERS.forEach((c, i) => {
      addressDocs.push({ cust: i, userId: users[i]._id, label: "Home", fullName: `${c.first} ${c.last}`, phone: c.phone, street: c.street, apartment: c.apt, city: c.city, state: c.state, postalCode: c.postal, country: "Lebanon", isDefault: true, deletedAt: null, createdAt: at(c.joined, 9, 30) })
      const x = EXTRA_ADDRESSES[i]
      if (x) addressDocs.push({ cust: i, userId: users[i]._id, label: x.label, fullName: `${c.first} ${c.last}`, phone: c.phone, street: x.street, apartment: x.apt, city: x.city, state: x.state, postalCode: x.postal, country: "Lebanon", isDefault: false, deletedAt: null, createdAt: at(Math.max(c.joined - 10, 1), 9) })
    })
    const createdAddresses = await createTimed(Address, addressDocs)
    createdAddresses.forEach((a, k) => addressIds[addressDocs[k].cust].push(a._id))

    // ---- Categories & tags ----
    const catId = new Map<string, mongoose.Types.ObjectId>()
    for (const c of await Category.find({ deletedAt: null }).select("slug").lean()) catId.set(c.slug, c._id)
    for (const seed of [...CATEGORY_SEEDS.filter((c) => !c.parent), ...CATEGORY_SEEDS.filter((c) => c.parent)]) {
      const doc = await Category.findOneAndUpdate(
        { slug: seed.slug },
        { $set: { name: seed.name, description: seed.description, parentCategoryId: seed.parent ? (catId.get(seed.parent) ?? null) : null, tintClassName: seed.tint, image: mappedCategoryImage(seed.slug) ?? "/products/placeholders/no-image.svg", status: "active", deletedAt: null } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      )
      catId.set(seed.slug, doc!._id)
    }
    const tagId = new Map<string, mongoose.Types.ObjectId>()
    for (const name of TAG_NAMES) {
      const slug = slugify(name)
      const tag = (await Tag.findOne({ slug })) ?? (await Tag.findOneAndUpdate({ slug }, { $set: { name, deletedAt: null } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }))
      tagId.set(slug, tag!._id)
    }

    // ---- Promotions ----
    const promoDocs = new Map<string, { _id: mongoose.Types.ObjectId; discountType: string; discountValue: number }>()
    for (const p of PROMOS) {
      const doc = await Promotion.findOneAndUpdate(
        { code: p.code },
        { $set: { description: p.description, discountType: p.discountType, discountValue: p.discountValue, startDate: new Date(TODAY.getTime() + p.start * 86_400_000), endDate: new Date(TODAY.getTime() + p.end * 86_400_000 + 86_399_000), isActive: p.active, deletedAt: null } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      )
      promoDocs.set(p.code, doc!)
    }

    // ---- Orders (planned first so product stock/rating can be computed) ----
    const productByCode = new Map(PRODUCTS.map((p) => [p.code, p]))
    const variantOf = (code: string, key: string) => {
      const p = productByCode.get(code)
      const vv = p?.variants.find((x) => x.key === key)
      if (!p || !vv) throw new Error(`Unknown variant ${code}/${key}`)
      return { p, vv, sku: skuOf(p, vv), unitPrice: round2(p.price + (vv.delta ?? 0)) }
    }
    const sold = new Map<string, number>()
    ORDERS.forEach((o) => {
      if (o.status === "cancelled") return
      for (const [code, key, qty] of o.lines) {
        const { sku } = variantOf(code, key)
        sold.set(sku, (sold.get(sku) ?? 0) + qty)
      }
    })

    // ---- Products / variants / images / product-tags ----
    // `stock` in the table is the final on-hand quantity (already net of seeded orders).
    const productIds = new Map<string, mongoose.Types.ObjectId>()
    const variantIds = new Map<string, mongoose.Types.ObjectId>()
    for (const p of PRODUCTS) {
      const totalStock = p.variants.reduce((s, x) => s + x.stock, 0)
      // Never overwrite a product this seed does not own: a pre-existing slug is only updated if it already carries seed (SD-) variants.
      const existing = await Product.findOne({ slug: p.slug }).select("_id").lean()
      if (existing && !(await ProductVariant.exists({ productId: existing._id, sku: /^SD-/ }))) {
        throw new Error(`Refusing to overwrite non-seed product "${p.slug}". Rename the seed product.`)
      }
      const productDoc = await Product.findOneAndUpdate(
        { slug: p.slug },
        { $set: { name: p.name, description: p.desc, brand: p.brand, material: p.material, ageGroup: p.age, price: p.price, stock: totalStock, categoryId: catId.get(p.cat), isActive: true, deletedAt: null } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      )
      productIds.set(p.code, productDoc!._id)
      // A product with a real photo (see product-images.ts) gets that single photo; others keep two placeholders.
      const photo = hasPhoto(p.slug)
      for (let i = 0; i < (photo ? 1 : 2); i++) {
        await ProductImage.findOneAndUpdate(
          { productId: productDoc!._id, variantId: null, displayOrder: i },
          { $set: { imageUrl: productImageUrl(p.slug, p.name, i), altText: p.name, isPrimary: i === 0, deletedAt: null } },
          { upsert: true, setDefaultsOnInsert: true }
        )
      }
      if (photo) await ProductImage.deleteMany({ productId: productDoc!._id, variantId: null, displayOrder: { $gte: 1 } })
      const colorsWithImage = new Set<string>()
      for (const vv of p.variants) {
        const sku = skuOf(p, vv)
        const variantDoc = await ProductVariant.findOneAndUpdate(
          { sku },
          { $set: { productId: productDoc!._id, variantName: [vv.color, vv.size].filter(Boolean).join(" / ") || "Standard", color: vv.color, size: vv.size, priceDelta: vv.delta ?? 0, stockQty: vv.stock, deletedAt: null } },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )
        variantIds.set(sku, variantDoc!._id)
        // One image per colour: variants sharing a colour would otherwise produce identical gallery URLs (duplicate React keys in the gallery).
        if (vv.color && !colorsWithImage.has(vv.color)) {
          colorsWithImage.add(vv.color)
          await ProductImage.findOneAndUpdate(
            { productId: productDoc!._id, variantId: variantDoc!._id, displayOrder: 0 },
            { $set: { imageUrl: productImageUrl(p.slug, `${p.name} ${vv.color}`, 0, vv.color), altText: `${p.name} — ${vv.color}`, isPrimary: true, deletedAt: null } },
            { upsert: true, setDefaultsOnInsert: true }
          )
        } else {
          await ProductImage.deleteMany({ productId: productDoc!._id, variantId: variantDoc!._id })
        }
      }
      for (const t of p.tags) {
        const tid = tagId.get(t)
        if (!tid) throw new Error(`Unknown tag ${t}`)
        await ProductTag.findOneAndUpdate({ productId: productDoc!._id, tagId: tid }, { $set: { deletedAt: null } }, { upsert: true, setDefaultsOnInsert: true })
      }
    }

    // ---- Orders and dependants ----
    const orderInfo: { id: mongoose.Types.ObjectId; number: string; seed: OrderSeed; placedAt: Date; deliveredAt: Date | null; items: { id: mongoose.Types.ObjectId; code: string }[] }[] = []
    const notifications: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    const counters = { items: 0, history: 0, orderPromos: 0, returns: 0, returnItems: 0, shipments: 0 }
    for (let n = 0; n < ORDERS.length; n++) {
      const o = ORDERS[n]
      const placedAt = at(o.ago, 9 + (n % 9), (n * 7) % 60)
      const number = `${ORDER_PREFIX}${String(n + 1).padStart(4, "0")}`
      const lines = o.lines.map(([code, key, qty]) => {
        const { unitPrice } = variantOf(code, key)
        return { code, key, qty, unitPrice, subtotal: round2(unitPrice * qty) }
      })
      const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0))
      let discount = 0
      if (o.promo) {
        const pr = promoDocs.get(o.promo)!
        discount = pr.discountType === "percentage" ? round2(subtotal * (Math.min(pr.discountValue, 100) / 100)) : round2(Math.min(pr.discountValue, subtotal))
      }
      const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE
      const total = Math.max(0, round2(subtotal - discount + shippingCost))
      const cust = CUSTOMERS[o.cust]
      const addressId = addressIds[o.cust][0]
      const processingAt = plusHours(placedAt, 6)
      const shippedAt = plusHours(placedAt, 30)
      const deliveredAt = plusHours(placedAt, 78)
      const reachedShipped = o.status === "shipped" || o.status === "delivered"
      const finalAt = o.status === "pending" ? placedAt : o.status === "processing" ? processingAt : o.status === "shipped" ? shippedAt : o.status === "delivered" ? deliveredAt : plusHours(placedAt, 5)

      const [order] = await createTimed(Order, [{
        userId: users[o.cust]._id, orderNumber: number, addressId, subtotal, discount, shippingCost, tax: 0, total, status: o.status,
        shippingAddress: { fullName: `${cust.first} ${cust.last}`, phone: cust.phone, street: cust.street, apartment: cust.apt, city: cust.city, state: cust.state, country: "Lebanon", postalCode: cust.postal },
        deletedAt: null, createdAt: placedAt, updatedAt: finalAt,
      }])
      const items = await createTimed(OrderItem, lines.map((l) => ({ orderId: order._id, productId: productIds.get(l.code)!, variantId: variantIds.get(variantOf(l.code, l.key).sku)!, quantity: l.qty, unitPrice: l.unitPrice, subtotal: l.subtotal, createdAt: placedAt })))
      counters.items += items.length

      if (o.promo) {
        await createTimed(OrderPromotion, [{ orderId: order._id, promotionId: promoDocs.get(o.promo)!._id, discountApplied: discount, createdAt: placedAt }])
        counters.orderPromos += 1
      }

      const paymentStatus = o.status === "delivered" ? (o.ret?.status === "completed" ? "refunded" : "paid") : o.status === "cancelled" ? "failed" : "pending"
      await createTimed(Payment, [{ orderId: order._id, method: "CASH_ON_DELIVERY", status: paymentStatus, amount: total, paidAt: o.status === "delivered" ? deliveredAt : null, createdAt: placedAt, updatedAt: finalAt }])

      await createTimed(Shipment, [{
        orderId: order._id, carrier: "BabyNest Logistics", shipmentCost: shippingCost, method: "Standard Delivery",
        estimatedDelivery: plusHours(placedAt, 24 * 4),
        trackingNumber: reachedShipped ? `BN${String(700000 + n * 137)}LB` : undefined,
        status: o.status === "shipped" ? "shipped" : o.status === "delivered" ? "delivered" : "pending",
        shippedAt: reachedShipped ? shippedAt : null, deliveredAt: o.status === "delivered" ? deliveredAt : null, deletedAt: null,
        createdAt: placedAt, updatedAt: finalAt,
      }])
      counters.shipments += 1

      const history: { status: string; note: string; changedAt: Date }[] = [{ status: "pending", note: "Order placed.", changedAt: placedAt }]
      if (o.status === "cancelled") history.push({ status: "cancelled", note: "Cancelled at the customer's request.", changedAt: plusHours(placedAt, 5) })
      else {
        if (o.status !== "pending") history.push({ status: "processing", note: "Order is being prepared.", changedAt: processingAt })
        if (reachedShipped) history.push({ status: "shipped", note: "Handed to BabyNest Logistics.", changedAt: shippedAt })
        if (o.status === "delivered") history.push({ status: "delivered", note: "Delivered and cash collected.", changedAt: deliveredAt })
      }
      await OrderStatusHistory.create(history.map((h) => ({ orderId: order._id, ...h })), { timestamps: false })
      counters.history += history.length

      notifications.push({ userId: users[o.cust]._id, type: "order_placed", title: "Order placed", message: `Your order ${number} has been placed and will be paid on delivery.`, sentAt: placedAt })
      if (o.status !== "pending") {
        const last = history[history.length - 1]
        notifications.push({ userId: users[o.cust]._id, type: "order_status_changed", title: "Order status updated", message: `Your order ${number} is now "${o.status}".`, sentAt: last.changedAt })
      }

      if (o.ret) {
        const retAt = plusHours(deliveredAt, 24 * 3)
        const [ret] = await createTimed(Return, [{ orderId: order._id, reason: o.ret.reason, status: o.ret.status, requestedAt: retAt, deletedAt: null, createdAt: retAt, updatedAt: o.ret.status === "requested" ? retAt : plusHours(retAt, 30) }])
        await createTimed(ReturnItem, [{ returnId: ret._id, orderItemId: items[o.ret.line]._id, quantity: o.ret.qty, condition: o.ret.condition, createdAt: retAt }])
        counters.returns += 1
        counters.returnItems += 1
        if (o.ret.status !== "requested") notifications.push({ userId: users[o.cust]._id, type: "return_status_changed", title: "Return update", message: `Your return for order ${number} is now "${o.ret.status}".`, sentAt: plusHours(retAt, 30) })
      }

      orderInfo.push({ id: order._id, number, seed: o, placedAt, deliveredAt: o.status === "delivered" ? deliveredAt : null, items: items.map((it, k) => ({ id: it._id, code: lines[k].code })) })
    }

    // ---- Carts & wishlist ----
    let cartItemCount = 0
    for (const [ci, lines] of CARTS) {
      const created = at(3 + ci, 14)
      const [cart] = await createTimed(Cart, [{ userId: users[ci]._id, deletedAt: null, createdAt: created }])
      const ci2 = await createTimed(CartItem, lines.map(([code, key, qty]) => ({ cartId: cart._id, variantId: variantIds.get(variantOf(code, key).sku)!, quantity: qty, unitPrice: variantOf(code, key).unitPrice, deletedAt: null, createdAt: created })))
      cartItemCount += ci2.length
    }
    await createTimed(WishlistItem, WISHLIST.map(([ci, code], k) => ({ userId: users[ci]._id, productId: productIds.get(code)!, deletedAt: null, createdAt: at(4 + ((k * 5) % 40), 16) })))

    // ---- Reviews (+ derived product rating/reviewCount) ----
    const reviewDocs: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const [oi, li, rating, comment, status] of VERIFIED_REVIEWS) {
      const info = orderInfo[oi]
      if (info.seed.status !== "delivered" || !info.deliveredAt) throw new Error(`Review references non-delivered order ${info.number}`)
      const item = info.items[li]
      reviewDocs.push({ userId: users[info.seed.cust]._id, productId: productIds.get(item.code)!, orderItemId: item.id, rating, comment, isVerifiedPurchase: true, status, deletedAt: null, createdAt: plusHours(info.deliveredAt, 24 * (3 + ((oi + li) % 6))) })
    }
    EXTRA_REVIEWS.forEach(([ci, code, rating, comment, status], k) => {
      reviewDocs.push({ userId: users[ci]._id, productId: productIds.get(code)!, rating, comment, isVerifiedPurchase: false, status, deletedAt: null, createdAt: at(6 + k * 7, 18) })
    })
    await createTimed(Review, reviewDocs)
    for (const p of PRODUCTS) {
      const pid = productIds.get(p.code)!
      const [stats] = await Review.aggregate<{ average: number; count: number }>([
        { $match: { productId: pid, deletedAt: null, status: "published" } },
        { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
      ])
      await Product.updateOne({ _id: pid }, { rating: stats ? Math.round(stats.average * 10) / 10 : 0, reviewCount: stats?.count ?? 0 })
    }

    // ---- Notifications ----
    notifications.push({ userId: users[9]._id, type: "order_placed", title: "Welcome to BabyNest", message: "Thanks for joining BabyNest. Enjoy free delivery on orders over $75.", sentAt: at(24, 9, 45) })
    notifications.forEach((nn) => {
      nn.isRead = NOW.getTime() - nn.sentAt.getTime() > 6 * 86_400_000
      nn.deletedAt = null
      nn.createdAt = nn.sentAt
    })
    await createTimed(Notification, notifications)

    // ---- AI history ----
    await createTimed(AiSearchQuery, AI_SEARCHES.map(([ci, q, results, ago]) => {
      const t = at(ago, 11, ci * 5)
      return { userId: users[ci]._id, queryText: q, filtersApplied: { source: "search" }, resultsCount: results, searchedAt: t, deletedAt: null, createdAt: t }
    }))
    await createTimed(AiRecommendation, AI_RECS.map(([ci, code, reason, score, ago]) => {
      const t = at(ago, 12)
      return { userId: users[ci]._id, productId: productIds.get(code)!, reason, score, generatedAt: t, deletedAt: null, createdAt: t }
    }))

    console.log("Demo seed complete.")
    console.log(`  Admin: admin${SEED_EMAIL_DOMAIN}  Customers: ${users.length}  (password for all seed users: ${SEED_PASSWORD})`)
    console.log(`  Addresses ${createdAddresses.length}, products ${PRODUCTS.length}, orders ${ORDERS.length}, order items ${counters.items}, returns ${counters.returns}`)
    console.log(`  Reviews ${reviewDocs.length}, notifications ${notifications.length}, cart items ${cartItemCount}, wishlist ${WISHLIST.length}`)
    void adminUser
  } finally {
    await conn.disconnect()
  }
}

main().catch((error) => {
  console.error("Demo seed failed:", error)
  process.exitCode = 1
})
