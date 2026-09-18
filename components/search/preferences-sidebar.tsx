"use client"

import { Loader2 } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ageBuckets } from "@/lib/mock/filters"
import { budgetOptions, preferenceTagOptions, type PreferenceFilters } from "@/lib/api-client/ai"

export type PreferencesSidebarProps = {
  value: PreferenceFilters
  onChange: (next: PreferenceFilters) => void
  onUpdate: () => void
  categoryOptions: { slug: string; name: string }[]
  isLoading: boolean
  className?: string
}

/** "Refine Your Preferences" sidebar — baby age, budget, category, preference tags. */
function PreferencesSidebar({
  value,
  onChange,
  onUpdate,
  categoryOptions,
  isLoading,
  className,
}: PreferencesSidebarProps) {
  function toggleTag(tag: string) {
    const next = new Set(value.tags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange({ ...value, tags: next })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Refine Your Preferences</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="baby-age">Baby Age</Label>
          <Select
            value={value.ageBucketKey ?? "any"}
            onValueChange={(next) => onChange({ ...value, ageBucketKey: next === "any" ? null : next })}
          >
            <SelectTrigger id="baby-age" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any age</SelectItem>
              {ageBuckets.map((bucket) => (
                <SelectItem key={bucket.key} value={bucket.key}>
                  {bucket.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budget">Budget</Label>
          <Select
            value={value.maxBudget ? String(value.maxBudget) : "any"}
            onValueChange={(next) =>
              onChange({ ...value, maxBudget: next === "any" ? null : Number(next) })
            }
          >
            <SelectTrigger id="budget" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {budgetOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={value.category ?? "all"}
            onValueChange={(next) => onChange({ ...value, category: next === "all" ? null : next })}
          >
            <SelectTrigger id="category" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Preferences</Label>
          <div className="flex flex-wrap gap-2">
            {preferenceTagOptions.map((tag) => {
              const selected = value.tags.has(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-caption font-medium transition-colors",
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={onUpdate} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          Update Preferences
        </Button>
      </CardContent>
    </Card>
  )
}

export { PreferencesSidebar }
