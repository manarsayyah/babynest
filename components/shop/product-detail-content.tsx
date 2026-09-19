"use client"

import * as React from "react"
import { Bot, Check, Heart, ShoppingCart } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { SectionHeader } from "@/components/layout/section-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIPanel } from "@/components/ai/ai-panel"
import { Rating } from "@/components/product/rating"
import { ProductCard, formatPrice } from "@/components/product/product-card"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductReviews } from "@/components/shop/product-reviews"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { useCart } from "@/components/providers/cart-provider"
import { toast } from "sonner"
import { cn } from "cn"

export type ProductDetailVariant = {
  id: string
  color?: string
  size?: string
  /** Adjustment applied to the base price for this specific color/size combination. */
  priceDelta: number
  stockQty: number
}

export type ProductDetailView = {
  id: string
  slug: string
  name: string
  description?: string
  brand?: string
  material?: string
  ageGroup?: string
  price: number
  rating: number
  reviewCount: number
  /** Product-level stock — used only when the product has no variants. */
  stock: number
  categoryLabel: string
  categoryHref: string
  gallery: string[]
  tags: string[]
  variants: ProductDetailVariant[]
  // AI grounding is a later integration phase — the panel below only
  // renders when both of these are actually provided.
  aiMatchPercent?: number
  aiHighlights?: string[]
}

export type RelatedProductView = {
  id: string
  slug: string
  name: string
  price: number
  rating: number
  reviewCount: number
  imageSrc?: string
}

export type ProductDetailContentProps = {
  product: ProductDetailView
  related: RelatedProductView[]
}

const SHARED_SHIPPING = [
  { title: "Free Delivery", description: "On all orders over $50, arrives in 2-4 business days." },
  { title: "Secure Payment", description: "Cash on delivery — pay when your order arrives." },
  { title: "Easy Returns", description: "30-day hassle-free returns on unused, unopened items." },
]

/** Full Product Details page content: gallery, AI recommend panel, buy box, tabs, related products. */
function ProductDetailContent({ product, related }: ProductDetailContentProps) {
  const colors = React.useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color).filter((v): v is string => Boolean(v)))),
    [product.variants]
  )
  const sizes = React.useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter((v): v is string => Boolean(v)))),
    [product.variants]
  )

  const [selectedColor, setSelectedColor] = React.useState<string | undefined>(colors[0])
  const [selectedSize, setSelectedSize] = React.useState<string | undefined>(sizes[0])
  const [quantity, setQuantity] = React.useState(1)
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const inWishlist = isWishlisted(product.id)
  const { addVariant } = useCart()
  const [isAdding, setIsAdding] = React.useState(false)

  const selectedVariant = React.useMemo(() => {
    if (product.variants.length === 0) return undefined
    return (
      product.variants.find(
        (v) => (!colors.length || v.color === selectedColor) && (!sizes.length || v.size === selectedSize)
      ) ?? product.variants[0]
    )
  }, [product.variants, colors.length, sizes.length, selectedColor, selectedSize])

  const effectivePrice = product.price + (selectedVariant?.priceDelta ?? 0)
  const effectiveStock = selectedVariant ? selectedVariant.stockQty : product.stock
  const inStock = effectiveStock > 0
  const maxQuantity = Math.max(1, Math.min(99, effectiveStock))
  const safeQuantity = Math.min(quantity, maxQuantity)

  async function handleAddToCart() {
    if (!selectedVariant) {
      // Cart lines are always a real ProductVariant — a product without variants can't be carted.
      toast.error("This product can't be added to the cart right now.")
      return
    }
    setIsAdding(true)
    try {
      await addVariant(selectedVariant.id, safeQuantity)
    } finally {
      setIsAdding(false)
    }
  }

  const specifications = [
    product.material ? { label: "Material", value: product.material } : null,
    product.ageGroup ? { label: "Age Group", value: product.ageGroup } : null,
    product.brand ? { label: "Brand", value: product.brand } : null,
    { label: "Category", value: product.categoryLabel },
  ].filter((spec): spec is { label: string; value: string } => spec !== null)

  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: product.categoryLabel, href: product.categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left: gallery + AI recommend panel */}
          <div className="flex min-w-0 flex-col gap-6">
            <ProductGallery images={product.gallery} alt={product.name} />

            {product.aiMatchPercent !== undefined && product.aiHighlights ? (
              <AIPanel className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ai/15 text-ai ring-1 ring-ai-border">
                      <Bot className="size-5" />
                    </span>
                    <h2 className="text-h3 text-foreground">Why BabyNest Recommends This</h2>
                  </div>
                  <Badge variant="ai" className="shrink-0">
                    AI Match: {product.aiMatchPercent}%
                  </Badge>
                </div>
                <ul className="mt-4 flex flex-col gap-2">
                  {product.aiHighlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-small text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-ai" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </AIPanel>
            ) : null}
          </div>

          {/* Right: buy box */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-h1 text-foreground">{product.name}</h1>
                  {!inStock ? <Badge variant="warning">Out of Stock</Badge> : null}
                </div>
                <p className="text-small text-muted-foreground">{product.categoryLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={inWishlist}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-xs ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Heart className={inWishlist ? "size-4 fill-primary text-primary" : "size-4"} />
              </button>
            </div>

            <Rating value={product.rating} count={product.reviewCount} size="md" />

            <div className="flex items-baseline gap-2.5">
              <span className="text-h2 text-foreground">{formatPrice(effectivePrice)}</span>
            </div>

            {product.description ? (
              <p className="text-body text-muted-foreground">{product.description}</p>
            ) : null}

            {colors.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-small font-semibold text-foreground">Color</span>
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={selectedColor === color}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-small font-medium ring-1 transition-colors",
                        selectedColor === color
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-card text-foreground ring-border hover:ring-foreground/30"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {sizes.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-small font-semibold text-foreground">Size</span>
                <div className="flex flex-wrap items-center gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-small font-medium ring-1 transition-colors",
                        selectedSize === size
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-card text-foreground ring-border hover:ring-foreground/30"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              <span className="text-small font-semibold text-foreground">Quantity</span>
              <QuantityStepper value={safeQuantity} onChange={setQuantity} max={maxQuantity} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="xl"
                className="flex-1"
                disabled={!inStock || isAdding}
                onClick={() => void handleAddToCart()}
              >
                <ShoppingCart data-icon="inline-start" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
              <Button size="xl" variant="outline" className="flex-1" disabled={!inStock} onClick={() => {}}>
                Buy Now
              </Button>
            </div>

            <Tabs defaultValue="description" className="mt-2">
              <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
                <TabsTrigger value="shipping">Shipping &amp; Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="flex flex-col gap-4 pt-4">
                <p className="text-body text-muted-foreground">
                  {product.description ?? "No description available for this product yet."}
                </p>
                {product.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <li key={tag}>
                        <Badge variant="secondary">{tag}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </TabsContent>

              <TabsContent value="specifications" className="pt-4">
                {specifications.length > 0 ? (
                  <dl className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {specifications.map((spec) => (
                      <div key={spec.label} className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-small text-muted-foreground">{spec.label}</dt>
                        <dd className="text-small font-medium text-foreground">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-small text-muted-foreground">No specifications available for this product.</p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="flex flex-col gap-5 pt-4">
                <div className="flex items-center gap-3">
                  <Rating value={product.rating} size="md" />
                  <span className="text-small text-muted-foreground">
                    {product.rating.toFixed(1)} out of 5 · {product.reviewCount} reviews
                  </span>
                </div>
                <ProductReviews productId={product.id} productName={product.name} />
              </TabsContent>

              <TabsContent value="shipping" className="pt-4">
                <ul className="flex flex-col gap-4">
                  {SHARED_SHIPPING.map((item) => (
                    <li key={item.title} className="flex flex-col gap-0.5">
                      <span className="text-small font-semibold text-foreground">{item.title}</span>
                      <span className="text-small text-muted-foreground">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>

            {related.length > 0 ? (
              <div className="mt-4 flex flex-col gap-5">
                <SectionHeader title="You May Also Like" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {related.map((item) => (
                    <ProductCard
                      key={item.id}
                      href={`/products/${item.slug}`}
                      imageSrc={item.imageSrc ?? PLACEHOLDER_PRODUCT_IMAGE}
                      imageAlt={item.name}
                      name={item.name}
                      price={item.price}
                      rating={item.rating}
                      reviewCount={item.reviewCount}
                      inWishlist={isWishlisted(item.id)}
                      onToggleWishlist={() => toggleWishlist(item.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </main>
  )
}

export { ProductDetailContent }
