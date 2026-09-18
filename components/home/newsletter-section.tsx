"use client"

import { ArrowRight, Mail } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/** Newsletter signup band. */
function NewsletterSection() {
  return (
    <section className="section-y">
      <Container>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-secondary via-accent/60 to-secondary px-6 py-12 text-center sm:px-12">
          <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-xs">
            <Mail className="size-5" />
          </span>
          <h2 className="text-h2 text-foreground">Join the BabyNest Family</h2>
          <p className="max-w-md text-body text-muted-foreground">
            New arrivals, gentle parenting tips and members-only offers —
            straight to your inbox. No spam, unsubscribe anytime.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-11 flex-1 rounded-full bg-card"
            />
            <Button type="submit" size="lg" className="shrink-0">
              Subscribe
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
        </div>
      </Container>
    </section>
  )
}

export { NewsletterSection }
