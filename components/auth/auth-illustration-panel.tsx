import Link from "next/link"
import { Cloud, Heart, Leaf, Star } from "lucide-react"
import { AIBadge } from "@/components/ai/ai-badge"

export type AuthIllustrationPanelProps = {
  heading: string
  subtext: string
}

/** Decorative left panel for full-page auth layouts (Login now, Register later). Hidden below lg. */
function AuthIllustrationPanel({ heading, subtext }: AuthIllustrationPanelProps) {
  return (
    <div className="relative hidden flex-col justify-center gap-8 overflow-hidden bg-gradient-to-b from-accent/50 via-background to-secondary/50 px-10 py-12 lg:flex xl:px-16">
      <Link href="/" className="flex items-center gap-2 text-h3 font-extrabold tracking-tight">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Heart className="size-4 fill-primary-foreground" />
        </span>
        <span className="text-foreground">
          Baby<span className="text-primary">Nest</span>
        </span>
      </Link>

      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-h1 text-foreground">{heading}</h1>
        <p className="text-body text-muted-foreground">{subtext}</p>
      </div>

      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
        <span
          aria-hidden
          className="absolute -top-6 -left-6 flex size-14 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md"
        >
          <Cloud className="size-6" />
        </span>
        <span
          aria-hidden
          className="absolute top-6 -right-4 flex size-10 items-center justify-center rounded-full bg-card text-warning shadow-md"
        >
          <Star className="size-4" />
        </span>
        <span
          aria-hidden
          className="absolute -bottom-3 -right-2 flex size-12 items-center justify-center rounded-full bg-card text-success shadow-md"
        >
          <Leaf className="size-5" />
        </span>

        <div className="size-full overflow-hidden rounded-[45%_55%_60%_40%/50%_45%_55%_50%] shadow-lg ring-1 ring-foreground/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/auth/auth-parent-holding-baby-nursery.jpg"
            alt="A parent gently holding their baby beside a nursery crib"
            className="size-full object-cover"
          />
        </div>

        <div className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2">
          <AIBadge label="AI-powered recommendations" className="bg-card shadow-md" />
        </div>
      </div>
    </div>
  )
}

export { AuthIllustrationPanel }
