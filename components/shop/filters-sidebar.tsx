"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { ageBuckets, priceBounds, ratingOptions } from "@/lib/mock/filters"

export type ShopFilters = {
  categories: Set<string>
  ageRanges: Set<string>
  rating: number | null
  price: [number, number]
}

export const defaultShopFilters: ShopFilters = {
  categories: new Set(),
  ageRanges: new Set(),
  rating: null,
  price: priceBounds,
}

function formatPrice(amount: number) {
  return amount >= priceBounds[1] ? `$${amount}+` : `$${amount}`
}

export type FiltersSidebarProps = {
  value: ShopFilters
  onChange: (next: ShopFilters) => void
  onApply: () => void
  onClear: () => void
  categoryOptions: { slug: string; name: string; count: number }[]
  className?: string
}

/** "Filters" sidebar — category, price range, age range and rating. Matches ShopPage.png. */
function FiltersSidebar({
  value,
  onChange,
  onApply,
  onClear,
  categoryOptions,
  className,
}: FiltersSidebarProps) {
  function toggleCategory(slug: string) {
    const next = new Set(value.categories)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    onChange({ ...value, categories: next })
  }

  function toggleAgeRange(key: string) {
    const next = new Set(value.ageRanges)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ ...value, ageRanges: next })
  }

  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-h3">Filters</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          Clear all
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption font-semibold uppercase tracking-wide text-foreground">
            Category
          </legend>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={value.categories.size === 0}
              onCheckedChange={() => onChange({ ...value, categories: new Set() })}
            />
            <span className="text-small text-foreground">All Categories</span>
          </label>
          {categoryOptions.map((category) => (
            <label key={category.slug} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={value.categories.has(category.slug)}
                onCheckedChange={() => toggleCategory(category.slug)}
              />
              <span className="flex flex-1 items-center justify-between text-small text-foreground">
                {category.name}
                <span className="text-muted-foreground">({category.count})</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-4">
          <span className="text-caption font-semibold uppercase tracking-wide text-foreground">
            Price Range
          </span>
          <Slider
            min={priceBounds[0]}
            max={priceBounds[1]}
            step={10}
            value={value.price}
            onValueChange={(next) => onChange({ ...value, price: next as [number, number] })}
          />
          <div className="flex items-center justify-between text-small text-muted-foreground">
            <span>{formatPrice(value.price[0])}</span>
            <span>{formatPrice(value.price[1])}</span>
          </div>
        </div>

        <div className="h-px bg-border" />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption font-semibold uppercase tracking-wide text-foreground">
            Age Range
          </legend>
          {ageBuckets.map((bucket) => (
            <label key={bucket.key} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={value.ageRanges.has(bucket.key)}
                onCheckedChange={() => toggleAgeRange(bucket.key)}
              />
              <span className="text-small text-foreground">{bucket.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="h-px bg-border" />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption font-semibold uppercase tracking-wide text-foreground">
            Rating
          </legend>
          <RadioGroup
            value={value.rating ? String(value.rating) : ""}
            onValueChange={(next) => onChange({ ...value, rating: next ? Number(next) : null })}
          >
            {ratingOptions.map((stars) => (
              <Label key={stars} className="flex cursor-pointer items-center gap-2.5 font-normal">
                <RadioGroupItem value={String(stars)} />
                <span className="flex items-center gap-1 text-small text-foreground">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {stars} &amp; up
                </span>
              </Label>
            ))}
          </RadioGroup>
        </fieldset>

        <Button size="lg" className="w-full" onClick={onApply}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}

export { FiltersSidebar }
