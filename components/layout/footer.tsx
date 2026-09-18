"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/categories", label: "Categories" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/shipping", label: "Shipping info" },
      { href: "/returns", label: "Returns & exchanges" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About BabyNest" },
      { href: "/careers", label: "Careers" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
]

/** Global site footer. Reused on every page (mounted once in the root layout). */
function Footer() {
  return (
    <footer data-slot="footer" className="border-t border-border bg-card">
      <Container className="section-y grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 text-h3 font-extrabold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4 fill-primary-foreground" />
            </span>
            <span className="text-foreground">
              Baby<span className="text-primary">Nest</span>
            </span>
          </Link>
          <p className="text-small text-muted-foreground">
            Everything your baby needs, in one beautiful nest — curated essentials backed
            by AI-powered recommendations for every stage.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-2.5">
            <h3 className="text-caption font-semibold uppercase tracking-wide text-foreground">
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-2.5">
          <h3 className="text-caption font-semibold uppercase tracking-wide text-foreground">
            Stay in the loop
          </h3>
          <p className="text-small text-muted-foreground">
            New arrivals and gentle parenting tips, no spam.
          </p>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-10 rounded-full"
            />
            <Button type="submit" size="icon" className="shrink-0" aria-label="Subscribe">
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-caption text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} BabyNest. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  )
}

export { Footer }
