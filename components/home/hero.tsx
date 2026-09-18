import Link from "next/link"
import { ArrowRight, Moon, Sparkles, Star } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

/** Home Page hero — headline, supporting copy, primary/secondary CTAs, and a decorative visual. */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 via-background to-background">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="flex flex-col items-start gap-6 text-left">
          <h1 className="text-display text-foreground">
            Everything Your Baby Needs,
            <br />
            <span className="text-primary">In One Beautiful Nest</span>
          </h1>
          <p className="max-w-md text-body-lg text-muted-foreground">
            Thoughtfully curated essentials, gentle materials and AI-powered
            recommendations to help you find exactly what your little one needs
            — at every stage.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="xl" nativeButton={false} render={<Link href="/products" />}>
              Shop Now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="xl" nativeButton={false} render={<Link href="/categories" />}>
              Explore Categories
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-lg">
          <div
            aria-hidden
            className="absolute -top-10 -left-6 size-40 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-10 -right-4 size-48 rounded-full bg-ai/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute top-1/3 right-0 size-32 rounded-full bg-warning/15 blur-3xl"
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://placehold.co/800x800/FCE4E8/DB5E76?font=roboto&text=BabyNest"
            alt="Baby resting peacefully wrapped in a soft blanket"
            className="relative size-full rounded-[2rem] object-cover shadow-xl ring-1 ring-foreground/10"
          />

          <span
            aria-hidden
            className="absolute -top-4 left-6 flex size-11 items-center justify-center rounded-full bg-card text-ai shadow-md"
          >
            <Moon className="size-5" />
          </span>
          <span
            aria-hidden
            className="absolute top-10 -right-3 flex size-9 items-center justify-center rounded-full bg-card text-warning shadow-md"
          >
            <Star className="size-4" />
          </span>
          <span
            aria-hidden
            className="absolute -bottom-4 left-10 flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-md"
          >
            <Sparkles className="size-4" />
          </span>
        </div>
      </Container>
    </section>
  )
}

export { Hero }
