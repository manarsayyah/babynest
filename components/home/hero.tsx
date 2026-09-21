import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

/** Home Page hero — headline, supporting copy, primary/secondary CTAs, and the BabyNest hero photo. */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 via-background to-background">
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-24">
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="text-caption font-semibold uppercase tracking-[0.16em] text-primary">
            Baby essentials, thoughtfully chosen
          </span>
          <h1 className="text-display text-foreground">
            Everything Your Baby Needs,
            <br />
            <span className="text-primary">In One Beautiful Nest</span>
          </h1>
          <p className="max-w-md text-body-lg text-muted-foreground">
            Gentle, carefully selected essentials and smart recommendations for
            every stage of your little one&apos;s first years.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="xl" nativeButton={false} render={<Link href="/products" />}>
              Shop Now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="xl" nativeButton={false} render={<Link href="/categories" />}>
              Explore Categories
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-xl sm:aspect-square sm:max-w-md lg:max-w-lg">
          <div aria-hidden className="absolute -inset-3 rounded-[2.5rem] bg-accent/70 sm:-inset-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home/hero-newborn-soft-blanket.jpg"
            alt="Baby resting peacefully wrapped in a soft blanket"
            className="relative size-full rounded-[2rem] object-cover shadow-xl ring-1 ring-foreground/10"
          />
        </div>
      </Container>
    </section>
  )
}

export { Hero }
