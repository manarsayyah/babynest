import Link from "next/link"
import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { mockCategories } from "@/lib/mock/categories"
import { categoryImageFor } from "@/lib/category-images"

/** "Shop by Category" — uniform image cards built from the existing category list and local images. */
function FeaturedCategories() {
  return (
    <section className="section-y">
      <Container className="flex flex-col gap-8">
        <SectionHeader
          title="Shop by Category"
          description="Everything organized by what your little one needs next."
          action={{ href: "/categories", label: "View all" }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {mockCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group/category flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className={`relative block aspect-[4/3] overflow-hidden ${category.tintClassName}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={categoryImageFor(category.slug, category.image)}
                  alt={category.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 ease-out group-hover/category:scale-105"
                />
              </span>
              <span className="px-4 py-3 text-small font-semibold text-foreground">{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

export { FeaturedCategories }
