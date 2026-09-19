/**
 * Catalog seed script — populates Categories, Tags, Products, ProductVariants,
 * ProductImages, and ProductTags with realistic BabyNest test data so the
 * integrated storefront (/products, /categories, /products/[slug]) has real
 * content to render.
 *
 * Usage: npm run seed:catalog
 *
 * Idempotent: every entity is looked up by a stable natural key (Category/Tag/
 * Product by slug, ProductVariant by sku, ProductImage by productId+variantId+
 * displayOrder, ProductTag by productId+tagId) and upserted in place — running
 * this script multiple times updates the same seeded records instead of
 * duplicating them.
 *
 * This is a manual setup tool: it is never imported by the app, exposed
 * through a page or API route, or run automatically on startup. It only
 * creates/updates rows; it never deletes anything, so it's safe to run
 * alongside real data.
 */
import connectToDatabase from "../lib/db"
import Category from "../models/Category"
import Tag from "../models/Tag"
import Product from "../models/Product"
import ProductVariant from "../models/ProductVariant"
import ProductImage from "../models/ProductImage"
import ProductTag from "../models/ProductTag"
import { hasPhoto, productImageUrl } from "./product-images"

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

type CategorySeed = {
  slug: string
  name: string
  description: string
  parentSlug?: string
  tintClassName: string
}

const CATEGORY_SEEDS: CategorySeed[] = [
  { slug: "feeding", name: "Feeding", description: "Everything for mealtime, from bottles to bibs.", tintClassName: "bg-[#FCEEF2]" },
  { slug: "bottles", name: "Bottles", description: "Baby bottles and feeding sets.", parentSlug: "feeding", tintClassName: "bg-[#FCEEF2]" },
  { slug: "bibs", name: "Bibs", description: "Mealtime bibs for every stage.", parentSlug: "feeding", tintClassName: "bg-[#FCEEF2]" },
  { slug: "feeding-accessories", name: "Feeding Accessories", description: "Spoons, sets and mealtime extras.", parentSlug: "feeding", tintClassName: "bg-[#FCEEF2]" },

  { slug: "clothing", name: "Clothing", description: "Comfortable everyday clothing for babies.", tintClassName: "bg-[#FCEAE3]" },
  { slug: "bodysuits", name: "Bodysuits", description: "Soft everyday bodysuits.", parentSlug: "clothing", tintClassName: "bg-[#FCEAE3]" },
  { slug: "sleepwear", name: "Sleepwear", description: "Sleep gowns, sleepsuits and sacks.", parentSlug: "clothing", tintClassName: "bg-[#FCEAE3]" },

  { slug: "bath-care", name: "Bath & Care", description: "Baby bath and personal care essentials.", tintClassName: "bg-[#E7F1FA]" },
  { slug: "bath-accessories", name: "Bath Accessories", description: "Towels, toys and bathtime helpers.", parentSlug: "bath-care", tintClassName: "bg-[#E7F1FA]" },
  { slug: "baby-care", name: "Baby Care", description: "Gentle skin and body care essentials.", parentSlug: "bath-care", tintClassName: "bg-[#E7F1FA]" },

  { slug: "nursery", name: "Nursery", description: "Beautiful and practical nursery essentials.", tintClassName: "bg-[#FBF3DE]" },
  { slug: "bedding", name: "Bedding", description: "Crib sheets and sleep essentials.", parentSlug: "nursery", tintClassName: "bg-[#FBF3DE]" },
  { slug: "blankets", name: "Blankets", description: "Swaddles and nursery blankets.", parentSlug: "nursery", tintClassName: "bg-[#FBF3DE]" },

  { slug: "toys", name: "Toys", description: "Safe and engaging toys for little ones.", tintClassName: "bg-[#F1EEFC]" },
  { slug: "developmental-toys", name: "Developmental Toys", description: "Toys that grow with your baby.", parentSlug: "toys", tintClassName: "bg-[#F1EEFC]" },
  { slug: "soft-toys", name: "Soft Toys", description: "Cuddly companions for nap time and play.", parentSlug: "toys", tintClassName: "bg-[#F1EEFC]" },

  { slug: "strollers-travel", name: "Strollers & Travel", description: "Smooth and reliable rides for every outing.", tintClassName: "bg-[#EFEAE3]" },
]

const TAG_SEEDS = [
  "BPA-Free",
  "Organic",
  "Eco-Friendly",
  "Cotton",
  "Newborn",
  "Sensitive Skin",
  "Lightweight",
] as const

type VariantSeed = {
  sku: string
  variantName?: string
  color?: string
  size?: string
  priceDelta?: number
  stockQty: number
  /** Also create a dedicated variant-linked image (imageUrl differs per color, variantId set). */
  withImage?: boolean
}

type ProductSeed = {
  slug: string
  name: string
  description: string
  brand: string
  material: string
  /** One of the storefront's four age-filter buckets — see lib/api-client/age-groups.ts. */
  ageGroup: "0-6m" | "6-12m" | "1-2y" | "3+y"
  price: number
  rating: number
  reviewCount: number
  stock: number
  categorySlug: string
  tagSlugs: string[]
  variants?: VariantSeed[]
  /** Number of base (non-variant) product images to generate; the first is always the primary. */
  imageCount?: number
}

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    slug: "glass-baby-bottle-set",
    name: "Glass Baby Bottle Feeding Set",
    description: "A borosilicate glass bottle set designed for gentle, easy-clean feeding from birth.",
    brand: "PureStart",
    material: "Borosilicate glass",
    ageGroup: "0-6m",
    price: 24.99,
    rating: 4.6,
    reviewCount: 128,
    stock: 80,
    categorySlug: "bottles",
    tagSlugs: ["bpa-free", "lightweight"],
    variants: [
      { sku: "BN-BOTL-120", variantName: "120ml", size: "120ml", stockQty: 40 },
      { sku: "BN-BOTL-240", variantName: "240ml", size: "240ml", priceDelta: 4, stockQty: 35 },
    ],
    imageCount: 2,
  },
  {
    slug: "silicone-baby-bibs-3-pack",
    name: "Silicone Baby Bibs, 3-Pack",
    description: "Wipe-clean silicone bibs with a food-catching pocket, built for messy mealtimes.",
    brand: "CozyCub",
    material: "Food-grade silicone",
    ageGroup: "6-12m",
    price: 16.99,
    rating: 4.5,
    reviewCount: 96,
    stock: 90,
    categorySlug: "bibs",
    tagSlugs: ["bpa-free", "eco-friendly"],
    variants: [
      { sku: "BN-BIB-SAGE", color: "Sage", stockQty: 30, withImage: true },
      { sku: "BN-BIB-BLUE", color: "Blue", stockQty: 30, withImage: true },
      { sku: "BN-BIB-PINK", color: "Pink", stockQty: 30, withImage: true },
    ],
    imageCount: 1,
  },
  {
    slug: "bamboo-feeding-spoon-set",
    name: "Bamboo Feeding Spoon Set",
    description: "Soft-tipped bamboo spoons sized for tiny mouths, gentle on emerging teeth and gums.",
    brand: "PureStart",
    material: "Bamboo",
    ageGroup: "6-12m",
    price: 12.99,
    rating: 4.7,
    reviewCount: 54,
    stock: 100,
    categorySlug: "feeding-accessories",
    tagSlugs: ["eco-friendly", "bpa-free"],
    imageCount: 2,
  },
  {
    slug: "organic-cotton-bodysuit-3-pack",
    name: "Organic Cotton Bodysuit, 3-Pack",
    description: "Breathable organic cotton bodysuits with easy snap closures for quick changes.",
    brand: "TinyBloom",
    material: "Organic cotton",
    ageGroup: "0-6m",
    price: 22.0,
    rating: 4.8,
    reviewCount: 214,
    stock: 120,
    categorySlug: "bodysuits",
    tagSlugs: ["organic", "cotton", "sensitive-skin", "newborn"],
    variants: [
      { sku: "BN-BODY-WHT-NB", variantName: "White / Newborn", color: "White", size: "Newborn", stockQty: 25, withImage: true },
      { sku: "BN-BODY-BEI-03", variantName: "Beige / 0-3M", color: "Beige", size: "0-3M", stockQty: 25, withImage: true },
      { sku: "BN-BODY-SAG-36", variantName: "Sage / 3-6M", color: "Sage", size: "3-6M", stockQty: 25, withImage: true },
    ],
    imageCount: 1,
  },
  {
    slug: "knit-cotton-sleep-gown",
    name: "Knit Cotton Sleep Gown",
    description: "A stretchy, easy-access sleep gown for fuss-free nighttime changes.",
    brand: "NestWell",
    material: "Organic cotton",
    ageGroup: "0-6m",
    price: 19.99,
    rating: 4.6,
    reviewCount: 88,
    stock: 70,
    categorySlug: "sleepwear",
    tagSlugs: ["organic", "cotton", "newborn"],
    variants: [
      { sku: "BN-GOWN-NB", variantName: "Newborn", size: "Newborn", stockQty: 35 },
      { sku: "BN-GOWN-03", variantName: "0-3M", size: "0-3M", stockQty: 35 },
    ],
    imageCount: 2,
  },
  {
    slug: "footed-cotton-sleepsuit",
    name: "Footed Cotton Sleepsuit",
    description: "A cozy footed sleepsuit in a soft cotton blend, built for all-night comfort.",
    brand: "TinyBloom",
    material: "Cotton blend",
    ageGroup: "6-12m",
    price: 18.5,
    rating: 4.4,
    reviewCount: 61,
    stock: 60,
    categorySlug: "sleepwear",
    tagSlugs: ["cotton", "sensitive-skin"],
    variants: [
      { sku: "BN-SLEEPS-BLUE", color: "Blue", size: "6-12M", stockQty: 30, withImage: true },
      { sku: "BN-SLEEPS-LAV", color: "Lavender", size: "6-12M", stockQty: 30, withImage: true },
    ],
    imageCount: 1,
  },
  {
    slug: "hooded-baby-towel",
    name: "Hooded Baby Towel",
    description: "An extra-absorbent hooded towel in soft organic cotton terry.",
    brand: "CozyCub",
    material: "Organic cotton",
    ageGroup: "0-6m",
    price: 21.0,
    rating: 4.7,
    reviewCount: 73,
    stock: 65,
    categorySlug: "bath-accessories",
    tagSlugs: ["organic", "cotton"],
    variants: [
      { sku: "BN-TOWEL-WHT", color: "White", stockQty: 33 },
      { sku: "BN-TOWEL-SAGE", color: "Sage", stockQty: 32 },
    ],
    imageCount: 2,
  },
  {
    slug: "silicone-bath-toys-set",
    name: "Silicone Bath Toys, 6-Pack",
    description: "Mold-resistant, mildew-free silicone bath toys with no hidden squeeze holes.",
    brand: "LittleSprout",
    material: "Food-grade silicone",
    ageGroup: "6-12m",
    price: 14.99,
    rating: 4.5,
    reviewCount: 102,
    stock: 110,
    categorySlug: "bath-accessories",
    tagSlugs: ["bpa-free", "eco-friendly"],
    imageCount: 2,
  },
  {
    slug: "gentle-baby-wash-shampoo",
    name: "Gentle Baby Wash & Shampoo",
    description: "A tear-free, plant-derived wash and shampoo for daily use.",
    brand: "PureStart",
    material: "Plant-derived formula",
    ageGroup: "0-6m",
    price: 11.99,
    rating: 4.6,
    reviewCount: 145,
    stock: 150,
    categorySlug: "baby-care",
    tagSlugs: ["sensitive-skin", "organic"],
    imageCount: 1,
  },
  {
    slug: "baby-lotion-sensitive-skin",
    name: "Baby Lotion for Sensitive Skin",
    description: "A lightweight, fragrance-free lotion formulated for delicate newborn skin.",
    brand: "PureStart",
    material: "Plant-derived formula",
    ageGroup: "0-6m",
    price: 10.99,
    rating: 4.5,
    reviewCount: 87,
    stock: 140,
    categorySlug: "baby-care",
    tagSlugs: ["sensitive-skin"],
    imageCount: 1,
  },
  {
    slug: "muslin-swaddle-blanket-set",
    name: "Muslin Swaddle Blanket Set",
    description: "Breathable organic muslin swaddles, generously sized for a secure wrap.",
    brand: "NestWell",
    material: "Organic cotton muslin",
    ageGroup: "0-6m",
    price: 26.0,
    rating: 4.8,
    reviewCount: 190,
    stock: 95,
    categorySlug: "blankets",
    tagSlugs: ["organic", "cotton", "newborn", "lightweight"],
    variants: [
      { sku: "BN-SWDL-SAGE", color: "Sage", stockQty: 24, withImage: true },
      { sku: "BN-SWDL-BEIGE", color: "Beige", stockQty: 24, withImage: true },
      { sku: "BN-SWDL-LAV", color: "Lavender", stockQty: 24, withImage: true },
      { sku: "BN-SWDL-WHT", color: "White", stockQty: 23, withImage: true },
    ],
    imageCount: 1,
  },
  {
    slug: "knit-nursery-blanket",
    name: "Knit Nursery Blanket",
    description: "A generously sized knit blanket for the crib, stroller, or tummy time.",
    brand: "CozyCub",
    material: "Cotton knit",
    ageGroup: "0-6m",
    price: 32.0,
    rating: 4.7,
    reviewCount: 58,
    stock: 50,
    categorySlug: "blankets",
    tagSlugs: ["cotton", "newborn"],
    variants: [
      { sku: "BN-KBLKT-BEIGE", color: "Beige", stockQty: 25 },
      { sku: "BN-KBLKT-SAGE", color: "Sage", stockQty: 25 },
    ],
    imageCount: 2,
  },
  {
    slug: "organic-crib-sheet-set",
    name: "Organic Crib Sheet Set",
    description: "Snug-fitting, breathable organic cotton crib sheets.",
    brand: "NestWell",
    material: "Organic cotton",
    ageGroup: "0-6m",
    price: 28.0,
    rating: 4.6,
    reviewCount: 64,
    stock: 55,
    categorySlug: "bedding",
    tagSlugs: ["organic", "cotton"],
    variants: [
      { sku: "BN-SHEET-WHT", color: "White", stockQty: 19 },
      { sku: "BN-SHEET-SAGE", color: "Sage", stockQty: 18 },
      { sku: "BN-SHEET-BLUE", color: "Blue", stockQty: 18 },
    ],
    imageCount: 1,
  },
  {
    slug: "cotton-sleep-sack",
    name: "Cotton Sleep Sack",
    description: "A wearable cotton sleep sack that keeps little ones cozy without loose bedding.",
    brand: "TinyBloom",
    material: "Cotton blend",
    ageGroup: "6-12m",
    price: 34.99,
    rating: 4.4,
    reviewCount: 39,
    stock: 45,
    categorySlug: "bedding",
    tagSlugs: ["cotton"],
    variants: [
      { sku: "BN-SACK-612", variantName: "6-12M", size: "6-12M", stockQty: 22 },
      { sku: "BN-SACK-12Y", variantName: "1-2Y", size: "1-2Y", priceDelta: 3, stockQty: 20 },
    ],
    imageCount: 1,
  },
  {
    slug: "wooden-stacking-rings",
    name: "Wooden Stacking Rings",
    description: "Sustainably sourced wooden stacking rings that build early hand-eye coordination.",
    brand: "LittleSprout",
    material: "Sustainably sourced wood",
    ageGroup: "6-12m",
    price: 18.99,
    rating: 4.8,
    reviewCount: 112,
    stock: 75,
    categorySlug: "developmental-toys",
    tagSlugs: ["eco-friendly"],
    imageCount: 2,
  },
  {
    slug: "soft-plush-elephant",
    name: "Soft Plush Elephant Companion",
    description: "An ultra-soft plush elephant made from organic cotton, safe for cuddling from day one.",
    brand: "LittleSprout",
    material: "Organic cotton plush",
    ageGroup: "0-6m",
    price: 22.0,
    rating: 4.9,
    reviewCount: 256,
    stock: 100,
    categorySlug: "soft-toys",
    tagSlugs: ["organic", "cotton", "sensitive-skin", "newborn"],
    variants: [
      { sku: "BN-PLUSH-SAGE", color: "Sage", stockQty: 34, withImage: true },
      { sku: "BN-PLUSH-BEIGE", color: "Beige", stockQty: 33, withImage: true },
      { sku: "BN-PLUSH-PINK", color: "Pink", stockQty: 33, withImage: true },
    ],
    imageCount: 1,
  },
  {
    slug: "sensory-activity-cube",
    name: "Sensory Activity Cube",
    description: "A multi-sided activity cube with textures, sounds, and simple problem-solving play.",
    brand: "LittleSprout",
    material: "BPA-free plastic and fabric",
    ageGroup: "6-12m",
    price: 29.99,
    rating: 4.6,
    reviewCount: 77,
    stock: 40,
    categorySlug: "developmental-toys",
    tagSlugs: ["bpa-free"],
    imageCount: 2,
  },
  {
    slug: "lightweight-travel-stroller",
    name: "Lightweight Travel Stroller",
    description: "A compact, airline-friendly stroller with a one-hand fold and breathable mesh seat.",
    brand: "NestWell",
    material: "Aluminum frame, breathable mesh",
    ageGroup: "1-2y",
    price: 189.99,
    rating: 4.7,
    reviewCount: 143,
    stock: 30,
    categorySlug: "strollers-travel",
    tagSlugs: ["lightweight"],
    variants: [
      { sku: "BN-STROL-BEIGE", color: "Beige", stockQty: 10 },
      { sku: "BN-STROL-SAGE", color: "Sage", stockQty: 10 },
      { sku: "BN-STROL-LAV", color: "Lavender", stockQty: 10 },
    ],
    imageCount: 2,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildImageUrl(seed: string, index: number): string {
  const palette = ["F5EDE6", "FCEAE3", "E7F1FA", "F1EEFC", "FBF3DE", "E9F0E6"]
  const bg = palette[index % palette.length]
  const text = encodeURIComponent(`${seed} ${index + 1}`)
  return `https://placehold.co/800x800/${bg}/2B2320?font=roboto&text=${text}`
}

const counts = {
  categoriesTopLevel: 0,
  categoriesSub: 0,
  tags: 0,
  products: 0,
  variants: 0,
  images: 0,
  productTags: 0,
}

async function upsertCategory(seed: CategorySeed, parentId: string | null) {
  const isNew = !(await Category.exists({ slug: seed.slug }))

  const category = await Category.findOneAndUpdate(
    { slug: seed.slug },
    {
      $set: {
        name: seed.name,
        description: seed.description,
        parentCategoryId: parentId,
        tintClassName: seed.tintClassName,
        image: buildImageUrl(seed.name, 0),
        status: "active",
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) {
    if (parentId) counts.categoriesSub += 1
    else counts.categoriesTopLevel += 1
  }

  return category
}

async function upsertTag(name: string) {
  const slug = slugify(name)
  const isNew = !(await Tag.exists({ slug }))

  const tag = await Tag.findOneAndUpdate(
    { slug },
    { $set: { name, deletedAt: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) counts.tags += 1
  return tag
}

async function upsertProduct(seed: ProductSeed, categoryId: string) {
  const isNew = !(await Product.exists({ slug: seed.slug }))

  const product = await Product.findOneAndUpdate(
    { slug: seed.slug },
    {
      $set: {
        name: seed.name,
        description: seed.description,
        brand: seed.brand,
        material: seed.material,
        ageGroup: seed.ageGroup,
        price: seed.price,
        stock: seed.stock,
        rating: seed.rating,
        reviewCount: seed.reviewCount,
        categoryId,
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) counts.products += 1
  return product
}

async function upsertVariant(productId: string, seed: VariantSeed) {
  const isNew = !(await ProductVariant.exists({ sku: seed.sku }))

  const variant = await ProductVariant.findOneAndUpdate(
    { sku: seed.sku },
    {
      $set: {
        productId,
        variantName: seed.variantName,
        color: seed.color,
        size: seed.size,
        priceDelta: seed.priceDelta ?? 0,
        stockQty: seed.stockQty,
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) counts.variants += 1
  return variant
}

/**
 * ProductImage has no natural unique key in the schema, so the seed script
 * treats (productId, variantId, displayOrder) as its own idempotency key —
 * matching or creating exactly one row per slot instead of a DB constraint.
 */
async function upsertImage(params: {
  productId: string
  variantId: string | null
  imageUrl: string
  altText: string
  displayOrder: number
  isPrimary: boolean
}) {
  const isNew = !(await ProductImage.exists({
    productId: params.productId,
    variantId: params.variantId,
    displayOrder: params.displayOrder,
  }))

  await ProductImage.findOneAndUpdate(
    { productId: params.productId, variantId: params.variantId, displayOrder: params.displayOrder },
    {
      $set: {
        imageUrl: params.imageUrl,
        altText: params.altText,
        isPrimary: params.isPrimary,
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) counts.images += 1
}

async function upsertProductTag(productId: string, tagId: string) {
  const isNew = !(await ProductTag.exists({ productId, tagId }))

  await ProductTag.findOneAndUpdate(
    { productId, tagId },
    { $set: { deletedAt: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (isNew) counts.productTags += 1
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const mongoose = await connectToDatabase()

  try {
    // Categories: top-level first, so subcategories can resolve parentCategoryId.
    const categoryIdBySlug = new Map<string, string>()

    const topLevel = CATEGORY_SEEDS.filter((c) => !c.parentSlug)
    const subCategories = CATEGORY_SEEDS.filter((c) => c.parentSlug)

    for (const seed of topLevel) {
      const category = await upsertCategory(seed, null)
      categoryIdBySlug.set(seed.slug, category._id.toString())
    }
    for (const seed of subCategories) {
      const parentId = seed.parentSlug ? (categoryIdBySlug.get(seed.parentSlug) ?? null) : null
      const category = await upsertCategory(seed, parentId)
      categoryIdBySlug.set(seed.slug, category._id.toString())
    }

    // Tags
    const tagIdBySlug = new Map<string, string>()
    for (const name of TAG_SEEDS) {
      const tag = await upsertTag(name)
      tagIdBySlug.set(tag.slug, tag._id.toString())
    }

    // Products, variants, images, product-tags
    for (const seed of PRODUCT_SEEDS) {
      const categoryId = categoryIdBySlug.get(seed.categorySlug)
      if (!categoryId) {
        throw new Error(`Product "${seed.slug}" references unknown category "${seed.categorySlug}".`)
      }

      const product = await upsertProduct(seed, categoryId)
      const productId = product._id.toString()

      // Base product-level images (no variant). A product with a real photo (see product-images.ts) gets that single
      // photo; every other product keeps the BabyNest placeholder(s).
      const photo = hasPhoto(seed.slug)
      const imageCount = photo ? 1 : (seed.imageCount ?? 1)
      for (let i = 0; i < imageCount; i++) {
        await upsertImage({
          productId,
          variantId: null,
          imageUrl: productImageUrl(seed.slug, seed.name, i),
          altText: seed.name,
          displayOrder: i,
          isPrimary: i === 0,
        })
      }
      if (photo) await ProductImage.deleteMany({ productId, variantId: null, displayOrder: { $gte: 1 } })

      // Variants (+ one variant-linked image each, where requested).
      for (const variantSeed of seed.variants ?? []) {
        const variant = await upsertVariant(productId, variantSeed)

        if (variantSeed.withImage) {
          const label = variantSeed.color ?? variantSeed.variantName ?? variantSeed.sku
          await upsertImage({
            productId,
            variantId: variant._id.toString(),
            imageUrl: productImageUrl(seed.slug, `${seed.name} ${label}`, 0, label),
            altText: `${seed.name} — ${label}`,
            displayOrder: 0,
            isPrimary: true,
          })
        }
      }

      // Product <-> Tag associations.
      for (const tagSlug of seed.tagSlugs) {
        const tagId = tagIdBySlug.get(tagSlug)
        if (!tagId) {
          throw new Error(`Product "${seed.slug}" references unknown tag "${tagSlug}".`)
        }
        await upsertProductTag(productId, tagId)
      }
    }

    console.log("Catalog seed complete.")
    console.log(`  Categories (top-level): ${counts.categoriesTopLevel} created this run`)
    console.log(`  Categories (sub):       ${counts.categoriesSub} created this run`)
    console.log(`  Tags:                   ${counts.tags} created this run`)
    console.log(`  Products:               ${counts.products} created this run`)
    console.log(`  Variants:               ${counts.variants} created this run`)
    console.log(`  Images:                 ${counts.images} created this run`)
    console.log(`  Product-Tag links:      ${counts.productTags} created this run`)
    console.log(
      `  Totals in seed definition: ${CATEGORY_SEEDS.length} categories, ${TAG_SEEDS.length} tags, ${PRODUCT_SEEDS.length} products`
    )
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error("Catalog seed failed:", error)
  process.exitCode = 1
})
