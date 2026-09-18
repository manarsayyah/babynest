import type { Metadata } from "next"
import { notFound } from "next/navigation"
import connectToDatabase from "@/lib/db"
import { getProductDetailByIdOrSlug, getRelatedProducts } from "@/lib/api/product-detail"
import { getGalleryUrls } from "@/lib/api-client/image"
import { ProductDetailContent, type ProductDetailView, type RelatedProductView } from "@/components/shop/product-detail-content"

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params

  await connectToDatabase()
  const result = await getProductDetailByIdOrSlug(slug)

  if (!result) {
    return { title: "Product Not Found | BabyNest" }
  }

  return {
    title: `${result.product.name} | BabyNest`,
    description: result.product.description ?? `${result.product.name} — available now at BabyNest.`,
  }
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params

  await connectToDatabase()
  const result = await getProductDetailByIdOrSlug(slug)

  if (!result) {
    notFound()
  }

  const { product, category, variants, images, tags } = result

  const relatedRaw = await getRelatedProducts(product.categoryId.toString(), product._id.toString())

  const related: RelatedProductView[] = relatedRaw.map((item) => ({
    id: item._id.toString(),
    slug: item.slug,
    name: item.name,
    price: item.price,
    rating: item.rating,
    reviewCount: item.reviewCount,
    imageSrc: item.primaryImage?.imageUrl,
  }))

  const categoryLabel = category?.name ?? "Shop"
  const categorySlug = category?.slug ?? ""

  const productView: ProductDetailView = {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    description: product.description ?? undefined,
    brand: product.brand ?? undefined,
    material: product.material ?? undefined,
    ageGroup: product.ageGroup ?? undefined,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    categoryLabel,
    categoryHref: categorySlug ? `/products?category=${categorySlug}` : "/products",
    gallery: getGalleryUrls(
      images.map((image) => ({
        imageUrl: image.imageUrl,
        altText: image.altText ?? undefined,
        variantId: image.variantId ? image.variantId.toString() : null,
        isPrimary: image.isPrimary,
        displayOrder: image.displayOrder,
      }))
    ),
    tags: tags.map((tag) => tag.name),
    variants: variants.map((variant) => ({
      id: variant._id.toString(),
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      priceDelta: variant.priceDelta,
      stockQty: variant.stockQty,
    })),
  }

  return <ProductDetailContent product={productView} related={related} />
}
