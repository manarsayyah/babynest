import Link from "next/link"
import { Sparkles } from "lucide-react"
import { AIPanel } from "@/components/ai/ai-panel"
import { Button } from "@/components/ui/button"

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function MatchRing({ percent }: { percent: number }) {
  const offset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div className="relative flex size-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} className="fill-none stroke-border" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          className="fill-none stroke-success transition-[stroke-dashoffset] duration-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-small font-bold text-foreground">{percent}%</span>
    </div>
  )
}

export type AIPreferencesCardProps = {
  tags: string[]
  /** Average of the backend's real recommendation scores, or null while loading / unavailable. */
  matchPercent: number | null
  /** Number of real recommended products, or null while loading / unavailable. */
  newMatchesCount: number | null
  onUpdatePreferences: () => void
}

/** "Your BabyNest AI" — preference summary + match ring, reusing the same AIPanel/AIBadge language as Home and AI Smart Search. */
function AIPreferencesCard({ tags, matchPercent, newMatchesCount, onUpdatePreferences }: AIPreferencesCardProps) {
  return (
    <AIPanel className="p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 font-heading text-base leading-snug font-medium text-foreground">
            Your BabyNest AI
            <Sparkles className="size-4 text-ai" />
          </h2>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-small font-medium text-foreground">AI Profile: Your preferences</span>
            {tags.length > 0 ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-small text-muted-foreground">
                {tags.map((tag) => (
                  <li key={tag} className="flex items-center gap-1.5">
                    <span className="size-1 shrink-0 rounded-full bg-ai" />
                    {tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-muted-foreground">No favorite categories chosen yet.</p>
            )}
          </div>

          {matchPercent !== null ? (
            <div className="flex shrink-0 items-center gap-3">
              <MatchRing percent={matchPercent} />
              <div className="flex flex-col">
                <span className="text-small font-semibold text-foreground">AI Match</span>
                <span className="text-caption text-muted-foreground">Personalized</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={onUpdatePreferences}>
            Update AI Preferences
          </Button>
          <p className="text-caption text-muted-foreground">
            {newMatchesCount === null
              ? "Your personalized matches will appear here."
              : `${newMatchesCount} ${newMatchesCount === 1 ? "product matches" : "products match"} your preferences.`}
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href="/search" />}>
            View Recommendations
          </Button>
        </div>
      </div>
    </AIPanel>
  )
}

export { AIPreferencesCard }
