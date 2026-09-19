import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { CategoryCard } from "@/components/product/category-card"
import { mockCategories } from "@/lib/mock/categories"
import { categoryImageFor } from "@/lib/category-images"

/** "Shop by Category" rail. */
function FeaturedCategories() {
  return (
    <section className="section-y">
      <Container className="flex flex-col gap-8">
        <SectionHeader
          title="Shop by Category"
          description="Everything organized by what your little one needs next."
          action={{ href: "/categories", label: "View all" }}
        />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
          {mockCategories.map((category) => (
            <CategoryCard
              key={category.slug}
              href={`/products?category=${category.slug}`}
              imageSrc={categoryImageFor(category.slug, category.image)}
              imageAlt={category.name}
              name={category.name}
              tintClassName={category.tintClassName}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}

export { FeaturedCategories }
