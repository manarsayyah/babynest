"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Flower2, SearchX, SlidersHorizontal, Star, TriangleAlert } from "lucide-react"
import { cn } from "cn"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/product/product-card"
import { FiltersSidebar, defaultShopFilters, type ShopFilters } from "@/components/shop/filters-sidebar"
import { ProductToolbar, type SortKey } from "@/components/shop/product-toolbar"
import { ProductsPagination } from "@/components/shop/products-pagination"
import { priceBounds } from "@/lib/mock/filters"
import { fetchProducts, type ProductQueryParams } from "@/lib/api-client/products"
import { fetchCategories } from "@/lib/api-client/categories"
import { ageGroupsForBucketKeys } from "@/lib/api-client/age-groups"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { useCart } from "@/components/providers/cart-provider"
import type { ApiCategory, ApiProduct } from "@/lib/api-client/types"

const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 350

type ApiSort = NonNullable<ProductQueryParams["sort"]>

const SORT_KEY_TO_API_SORT: Record<SortKey, ApiSort | undefined> = {
  featured: undefined,
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  rating: "rating_desc",
  newest: "newest",
}

function countActiveFilters(filters: ShopFilters) {
  let count = filters.categories.size + filters.ageRanges.size
  if (filters.rating) count += 1
  if (filters.price[0] !== priceBounds[0] || filters.price[1] !== priceBounds[1]) count += 1
  return count
}

/** Builds the initial filter state from ?category=<slug> on the URL, if present — read once, synchronously, at mount. */
function initialFiltersFromSearchParams(searchParams: URLSearchParams): ShopFilters {
  const categorySlug = searchParams.get("category")
  if (!categorySlug) return defaultShopFilters
  return { ...defaultShopFilters, categories: new Set([categorySlug]) }
}

/** Full Shop / Products page: breadcrumb, header, filters sidebar, toolbar, grid, pagination — backed by the real catalog API. */
function ProductsPageContent() {
  const searchParams = useSearchParams()
  const { addProduct } = useCart()

  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [categoryCounts, setCategoryCounts] = React.useState<Record<string, number>>({})

  const [draftFilters, setDraftFilters] = React.useState<ShopFilters>(() =>
    initialFiltersFromSearchParams(searchParams)
  )
  const [appliedFilters, setAppliedFilters] = React.useState<ShopFilters>(() =>
    initialFiltersFromSearchParams(searchParams)
  )
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("featured")
  const [page, setPage] = React.useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()

  const [products, setProducts] = React.useState<ApiProduct[]>([])
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  // Debounce the search box so every keystroke doesn't fire a request.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Load categories once for the filter sidebar (slug/name + real per-category counts).
  React.useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await fetchCategories()
        if (cancelled) return
        setCategories(result)

        const counts = await Promise.all(
          result.map((category) =>
            fetchProducts({ categoryId: category._id, limit: 1 })
              .then((res) => res.total)
              .catch(() => 0)
          )
        )
        if (cancelled) return
        const countMap: Record<string, number> = {}
        result.forEach((category, index) => {
          countMap[category.slug] = counts[index]
        })
        setCategoryCounts(countMap)
      } catch {
        // Category options are a filter convenience — a failure here
        // shouldn't block the product grid itself from loading.
        if (!cancelled) setCategories([])
      }
    }

    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  const categoryOptions = React.useMemo(
    () =>
      categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        count: categoryCounts[category.slug] ?? 0,
      })),
    [categories, categoryCounts]
  )

  const slugToCategoryId = React.useMemo(
    () => new Map(categories.map((category) => [category.slug, category._id])),
    [categories]
  )

  function handleApply() {
    setAppliedFilters(draftFilters)
    setPage(1)
  }

  function handleClear() {
    setDraftFilters(defaultShopFilters)
    setAppliedFilters(defaultShopFilters)
    setPage(1)
  }

  // Fetch the real product grid whenever filters/search/sort/page change.
  React.useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setIsLoading(true)
      setLoadError(null)

      const categoryIds = Array.from(appliedFilters.categories)
        .map((slug) => slugToCategoryId.get(slug))
        .filter((id): id is string => Boolean(id))
      const ageGroups = ageGroupsForBucketKeys(appliedFilters.ageRanges)

      try {
        const result = await fetchProducts({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          categoryId: categoryIds.length > 0 ? categoryIds : undefined,
          ageGroup: ageGroups.length > 0 ? ageGroups : undefined,
          minRating: appliedFilters.rating ?? undefined,
          minPrice: appliedFilters.price[0] > priceBounds[0] ? appliedFilters.price[0] : undefined,
          maxPrice: appliedFilters.price[1] < priceBounds[1] ? appliedFilters.price[1] : undefined,
          sort: SORT_KEY_TO_API_SORT[sort],
        })
        if (cancelled) return
        setProducts(result.items)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } catch (error) {
        if (cancelled) return
        setProducts([])
        setTotal(0)
        setTotalPages(1)
        setLoadError(error instanceof ApiRequestError ? error.message : "Something went wrong. Please try again.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadProducts()
    return () => {
      cancelled = true
    }
  }, [appliedFilters, search, sort, page, slugToCategoryId, reloadToken])

  const currentPage = Math.min(page, totalPages)
  const activeFilterCount = countActiveFilters(appliedFilters)

  return (
    <main className="flex-1">
      <div className="border-b border-border bg-card">
        <Container className="relative flex flex-col gap-3 py-8 sm:py-10">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
          <span
            aria-hidden
            className="absolute top-6 left-0 hidden size-9 items-center justify-center rounded-full bg-accent text-primary sm:flex"
          >
            <Flower2 className="size-4" />
          </span>
          <span
            aria-hidden
            className="absolute top-6 right-0 hidden size-9 items-center justify-center rounded-full bg-ai-muted text-ai sm:flex"
          >
            <Star className="size-4" />
          </span>
          <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
            <h1 className="text-h1 text-foreground">Shop All Products</h1>
            <p className="text-body text-muted-foreground">
              Discover everything your baby needs, in one place.
            </p>
          </div>
        </Container>
      </div>

      <Container className="section-y grid gap-8 lg:grid-cols-[280px_1fr]">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="w-full justify-center lg:hidden"
        >
          <SlidersHorizontal data-icon="inline-start" />
          Filters
          {activeFilterCount > 0 ? (
            <Badge className="ml-1" variant="default">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>

        <div className={cn("lg:block", mobileFiltersOpen ? "block" : "hidden")}>
          <FiltersSidebar
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={handleApply}
            onClear={handleClear}
            categoryOptions={categoryOptions}
            className="lg:sticky lg:top-20"
          />
        </div>

        <div className="flex flex-col gap-6">
          <ProductToolbar
            search={searchInput}
            onSearchChange={(value) => setSearchInput(value)}
            sort={sort}
            onSortChange={(value) => {
              setSort(value)
              setPage(1)
            }}
            resultCount={total}
          />

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't load products"
              description={loadError}
              action={
                <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  href={`/products/${product.slug}`}
                  imageSrc={product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                  imageAlt={product.primaryImage?.altText ?? product.name}
                  name={product.name}
                  price={product.price}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  inWishlist={isWishlisted(product._id)}
                  onToggleWishlist={() => toggleWishlist(product._id)}
                  onAddToCart={() => void addProduct(product._id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No products found"
              description="Try adjusting your filters or search terms."
              action={
                <Button variant="outline" onClick={handleClear}>
                  Clear filters
                </Button>
              }
            />
          )}

          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </Container>
    </main>
  )
}

export { ProductsPageContent }
