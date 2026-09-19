"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryCard } from "@/components/product/category-card"
import { fetchCategories } from "@/lib/api-client/categories"
import { categoryImageFor } from "@/lib/category-images"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import type { ApiCategory } from "@/lib/api-client/types"

/** "All Categories" — the full "Shop by Category" grid, backed by the real Categories API. */
function CategoriesPageContent() {
  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const result = await fetchCategories()
        if (!cancelled) setCategories(result)
      } catch (error) {
        if (!cancelled) {
          setCategories([])
          setLoadError(error instanceof ApiRequestError ? error.message : "Something went wrong. Please try again.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return (
    <main className="flex-1">
      <div className="border-b border-border bg-card">
        <Container className="flex flex-col gap-3 py-8 sm:py-10">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
          <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
            <h1 className="text-h1 text-foreground">Shop by Category</h1>
            <p className="text-body text-muted-foreground">
              Everything organized by what your little one needs next.
            </p>
          </div>
        </Container>
      </div>

      <Container className="section-y">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2.5 p-2">
                <Skeleton className="size-20 rounded-full sm:size-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={TriangleAlert}
            title="Couldn't load categories"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                Try again
              </Button>
            }
          />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard
                key={category._id}
                href={`/products?category=${category.slug}`}
                imageSrc={categoryImageFor(category.slug, category.image)}
                imageAlt={category.name}
                name={category.name}
                tintClassName={category.tintClassName}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No categories found" description="Check back soon." />
        )}
      </Container>
    </main>
  )
}

export { CategoriesPageContent }
