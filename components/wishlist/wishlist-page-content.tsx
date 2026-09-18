"use client"

import * as React from "react"
import Link from "next/link"
import { Heart, LayoutGrid, List, ListFilter, TriangleAlert, Trash2 } from "lucide-react"
import { cn } from "cn"
import { Container } from "@/components/layout/container"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductCard } from "@/components/product/product-card"
import { WishlistListRow } from "@/components/wishlist/wishlist-list-row"
import { WishlistRecommendations } from "@/components/wishlist/wishlist-recommendations"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { useCart } from "@/components/providers/cart-provider"
import { useAiRecommendations } from "@/components/ai/use-ai-recommendations"
import { fetchCategories } from "@/lib/api-client/categories"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { ApiCategory, ApiWishlistItem } from "@/lib/api-client/types"
import { initialProfile } from "@/lib/mock/account"

type ViewMode = "grid" | "list"
type SortKey = "recent" | "price-asc" | "price-desc" | "rating" | "name"

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "Name: A to Z" },
]

/** Full Wishlist page: header + count, view/sort/filter toolbar, product grid or list, empty state — backed by the real Wishlist API. */
function WishlistPageContent() {
  const { items, isLoading, error, remove, refresh } = useWishlist()
  const { addProduct } = useCart()
  const aiRecommendations = useAiRecommendations()
  const { toggle: toggleWishlist } = useWishlist()

  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [view, setView] = React.useState<ViewMode>("grid")
  const [sort, setSort] = React.useState<SortKey>("recent")
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch(() => {
        // The category filter is a convenience — a failure here shouldn't block the wishlist itself.
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const categoryNameById = React.useMemo(
    () => new Map(categories.map((category) => [category._id, category.name])),
    [categories]
  )

  const categoryOptions = React.useMemo(() => {
    const present = new Set(items.map((item) => item.product.categoryId))
    return categories.filter((category) => present.has(category._id))
  }, [items, categories])

  const filtered = categoryFilter
    ? items.filter((item) => item.product.categoryId === categoryFilter)
    : items

  const sortedItems = React.useMemo(() => {
    const arr = [...filtered]
    switch (sort) {
      case "price-asc":
        return arr.sort((a, b) => a.product.price - b.product.price)
      case "price-desc":
        return arr.sort((a, b) => b.product.price - a.product.price)
      case "rating":
        return arr.sort((a, b) => b.product.rating - a.product.rating)
      case "name":
        return arr.sort((a, b) => a.product.name.localeCompare(b.product.name))
      default:
        return arr
    }
  }, [filtered, sort])

  function handleClearAll() {
    for (const item of items) remove(item.productId)
  }

  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="flex items-center gap-2 text-h1 text-foreground">
                My Wishlist
                <Heart className="size-6 fill-primary text-primary" />
              </h1>
              <p className="text-body text-muted-foreground">
                Save your favorite baby products and find them whenever you&apos;re ready.
              </p>
              <span className="text-small text-muted-foreground">
                {items.length} saved {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Clear Wishlist
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't load your wishlist"
              description={error}
              action={
                <Button variant="outline" onClick={refresh}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save the products you love and they'll show up here, ready whenever you are."
              action={
                <Button size="lg" nativeButton={false} render={<Link href="/products" />}>
                  Continue Shopping
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-pressed={view === "grid"}
                    aria-label="Grid view"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors",
                      view === "grid"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-pressed={view === "list"}
                    aria-label="List view"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors",
                      view === "list"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="size-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={categoryFilter ?? "all"}
                    onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="h-9 rounded-full">
                      <ListFilter className="size-3.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                    <SelectTrigger className="h-9 rounded-full">
                      <span className="text-muted-foreground">Sort:</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sortedItems.length === 0 ? (
                <EmptyState
                  icon={ListFilter}
                  title="No items in this category"
                  description="Try a different category filter."
                  action={
                    <Button variant="outline" onClick={() => setCategoryFilter(null)}>
                      Clear filter
                    </Button>
                  }
                />
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {sortedItems.map((item: ApiWishlistItem) => (
                    <ProductCard
                      key={item.productId}
                      href={`/products/${item.product.slug}`}
                      imageSrc={item.product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                      imageAlt={item.product.primaryImage?.altText ?? item.product.name}
                      name={item.product.name}
                      price={item.product.price}
                      rating={item.product.rating}
                      reviewCount={item.product.reviewCount}
                      inWishlist
                      onToggleWishlist={() => remove(item.productId)}
                      onAddToCart={() => void addProduct(item.productId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col rounded-2xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
                  {sortedItems.map((item: ApiWishlistItem) => (
                    <WishlistListRow
                      key={item.productId}
                      item={{
                        productId: item.productId,
                        slug: item.product.slug,
                        name: item.product.name,
                        price: item.product.price,
                        rating: item.product.rating,
                        reviewCount: item.product.reviewCount,
                        imageSrc: item.product.primaryImage?.imageUrl,
                      }}
                      categoryLabel={categoryNameById.get(item.product.categoryId) ?? "BabyNest"}
                      onRemove={() => remove(item.productId)}
                      onAddToCart={() => void addProduct(item.productId)}
                    />
                  ))}
                </div>
              )}

              {/* Real AI recommendations (GET /api/ai/recommendations); the strip renders nothing while loading, on error, or when empty. */}
              <WishlistRecommendations
                items={aiRecommendations.status === "ready" ? aiRecommendations.items.slice(0, 2) : []}
                onAddToWishlist={(id) => toggleWishlist(id)}
                onAddToCart={(id) => void addProduct(id)}
              />
            </>
          )}
        </div>
      </Container>
    </main>
  )
}

export { WishlistPageContent }
