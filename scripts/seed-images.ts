/**
 * Image-only updater — applies the shared product-image map (scripts/product-images.ts) to the products that
 * already exist in the database, without touching any other product data.
 *
 * Usage: npm run seed:images            (apply)
 *        npm run seed:images -- --dry   (show what would change, write nothing)
 *
 * What it does, per non-deleted product:
 *   - mapped to a real photo: sets the base image (display order 0) to that photo, removes the extra *placeholder*
 *     base images (display order >= 1), and points existing variant images at the same photo (distinct per variant).
 *   - not mapped: keeps its BabyNest placeholders but makes them local — any image still pointing at placehold.co is
 *     rewritten to a generated SVG in public/products/placeholders/ (same text and colour). If it has no image at
 *     all, one local placeholder is added so the UI never has an empty gallery.
 *
 * Only ProductImage rows are read/written. Products, variants, prices, stock, ratings, etc. are never modified, and
 * nothing is created outside ProductImage. Repeatable; a manual tool that no page or API route can run.
 */
import connectToDatabase from "../lib/db"
import Product from "../models/Product"
import ProductVariant from "../models/ProductVariant"
import ProductImage from "../models/ProductImage"
import { hasPhoto, localizePlaceholderUrl, placeholderImageUrl, productImageUrl } from "./product-images"

const DRY = process.argv.includes("--dry")

async function main() {
  const mongoose = await connectToDatabase()
  const counts = { photoProducts: 0, placeholderProducts: 0, baseUpdated: 0, extraRemoved: 0, variantImagesUpdated: 0, placeholdersAdded: 0, placeholdersLocalized: 0 }
  try {
    const products = await Product.find({ deletedAt: null }).select("slug name").lean()

    for (const product of products) {
      const productId = product._id
      if (hasPhoto(product.slug)) {
        counts.photoProducts += 1
        const url = productImageUrl(product.slug, product.name, 0)
        const base = await ProductImage.findOne({ productId, variantId: null, displayOrder: 0 })
        if (!base || base.imageUrl !== url || !base.isPrimary || base.deletedAt) {
          counts.baseUpdated += 1
          if (!DRY) {
            await ProductImage.findOneAndUpdate(
              { productId, variantId: null, displayOrder: 0 },
              { $set: { imageUrl: url, altText: product.name, isPrimary: true, deletedAt: null } },
              { upsert: true, setDefaultsOnInsert: true }
            )
          }
        }
        // Only placeholder extras are removed — a base image that is already a real photo is never touched.
        const extras = await ProductImage.find({ productId, variantId: null, displayOrder: { $gte: 1 }, imageUrl: /^(https:\/\/placehold\.co\/|\/products\/placeholders\/)/ }).select("_id").lean()
        counts.extraRemoved += extras.length
        if (!DRY && extras.length > 0) await ProductImage.deleteMany({ _id: { $in: extras.map((e) => e._id) } })

        const variants = await ProductVariant.find({ productId, deletedAt: null }).select("color variantName sku").lean()
        for (const variant of variants) {
          const image = await ProductImage.findOne({ productId, variantId: variant._id, deletedAt: null })
          if (!image) continue
          const variantUrl = productImageUrl(product.slug, product.name, 0, variant.color ?? variant.variantName ?? variant.sku)
          if (image.imageUrl !== variantUrl) {
            counts.variantImagesUpdated += 1
            if (!DRY) await ProductImage.updateOne({ _id: image._id }, { $set: { imageUrl: variantUrl } })
          }
        }
      } else {
        counts.placeholderProducts += 1
        const remote = await ProductImage.find({ productId, imageUrl: /^https:\/\/placehold\.co\// })
        for (const image of remote) {
          let label: string | undefined
          if (image.variantId) {
            const variant = await ProductVariant.findById(image.variantId).select("color variantName sku").lean()
            label = variant ? (variant.color ?? variant.variantName ?? variant.sku) : String(image.variantId)
          }
          counts.placeholdersLocalized += 1
          const localUrl = localizePlaceholderUrl(product.slug, image.imageUrl, image.displayOrder, label, !DRY)
          if (!DRY) await ProductImage.updateOne({ _id: image._id }, { $set: { imageUrl: localUrl } })
        }
        const anyImage = await ProductImage.exists({ productId, deletedAt: null })
        if (!anyImage) {
          counts.placeholdersAdded += 1
          if (!DRY) {
            await ProductImage.create({ productId, imageUrl: placeholderImageUrl(product.slug, product.name, 0), altText: product.name, displayOrder: 0, isPrimary: true, variantId: null })
          }
        }
      }
    }

    console.log(`${DRY ? "[dry run] " : ""}Image update complete (${products.length} products).`)
    console.log(`  Products with a real photo:        ${counts.photoProducts}`)
    console.log(`  Products keeping the placeholder:  ${counts.placeholderProducts}`)
    console.log(`  Base images set/updated:           ${counts.baseUpdated}`)
    console.log(`  Extra placeholder images removed:  ${counts.extraRemoved}`)
    console.log(`  Variant images repointed:          ${counts.variantImagesUpdated}`)
    console.log(`  Placeholders made local:           ${counts.placeholdersLocalized}`)
    console.log(`  Placeholder images added:          ${counts.placeholdersAdded}`)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error("Image update failed:", error)
  process.exitCode = 1
})
