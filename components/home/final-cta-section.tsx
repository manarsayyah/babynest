import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

/** Closing call to action for the home page. */
function FinalCtaSection() {
  return (
    <section className="py-10 md:py-12 lg:py-14">
      <Container>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-secondary via-accent/60 to-secondary px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-h2 text-foreground">Find what your little one needs next</h2>
          <p className="max-w-md text-body text-muted-foreground">
            Browse gentle, carefully chosen essentials for every stage.
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="xl" nativeButton={false} render={<Link href="/products" />}>
              Shop Now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="xl" nativeButton={false} render={<Link href="/categories" />}>
              Explore Categories
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

export { FinalCtaSection }
