"use client"

import * as React from "react"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { cn } from "cn"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { initialProfile } from "@/lib/mock/account"
import { mockCategories } from "@/lib/mock/categories"
import {
  defaultAIPreferences,
  loadAIPreferences,
  recommendationSourceCopy,
  saveAIPreferences,
  type AIPreferences,
} from "@/lib/mock/ai-preferences"

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-small font-medium text-foreground">{title}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}

/**
 * Customer "AI Preferences" — controls the existing on-site AI-style
 * features (Smart Search, personalized recommendation rails). No real AI
 * backend is called from this page. No API exists yet, so preferences are
 * stored in `localStorage` only (per this page's own brief); nothing is
 * sent anywhere or claimed to be saved to a database.
 */
function AIPreferencesPageContent() {
  const [saved, setSaved] = React.useState<AIPreferences>(defaultAIPreferences)
  const [draft, setDraft] = React.useState<AIPreferences>(defaultAIPreferences)

  React.useEffect(() => {
    // localStorage only exists client-side; reading it during render (instead of
    // here, post-mount) would produce a hydration mismatch against the server-
    // rendered defaults above, so this genuinely needs an effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    const loaded = loadAIPreferences()
    setSaved(loaded)
    setDraft(loaded)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  function update<K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSource(key: keyof AIPreferences["recommendationSources"], checked: boolean) {
    setDraft((prev) => ({
      ...prev,
      recommendationSources: { ...prev.recommendationSources, [key]: checked },
    }))
  }

  function toggleCategory(slug: string) {
    setDraft((prev) => {
      const isSelected = prev.selectedCategorySlugs.includes(slug)
      return {
        ...prev,
        selectedCategorySlugs: isSelected
          ? prev.selectedCategorySlugs.filter((s) => s !== slug)
          : [...prev.selectedCategorySlugs, slug],
      }
    })
  }

  function handleSave() {
    saveAIPreferences(draft)
    setSaved(draft)
    toast.success("Preferences saved", { description: "Your AI preferences have been updated." })
  }

  function handleReset() {
    setDraft(saved)
  }

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "AI Preferences" },
              ]}
            />
            <h1 className="flex items-center gap-2 text-account-title text-foreground">
              AI Preferences
              <Sparkles className="size-6 text-ai" />
            </h1>
            <p className="text-body text-muted-foreground">
              Customize how BabyNest uses your preferences to personalize your shopping experience.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Personalized Recommendations</CardTitle>
              <p className="text-caption text-muted-foreground">
                Allow BabyNest to personalize product recommendations based on your shopping preferences.
              </p>
            </CardHeader>
            <CardContent>
              <ToggleRow
                title="Personalized product recommendations"
                description="Show product suggestions tailored to your activity and preferences."
                checked={draft.personalizedRecommendations}
                onCheckedChange={(checked) => update("personalizedRecommendations", checked)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Recommendation Preferences</CardTitle>
              <p className="text-caption text-muted-foreground">Choose what your recommendations are based on</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {recommendationSourceCopy.map(({ key, title, description }) => (
                <ToggleRow
                  key={key}
                  title={title}
                  description={description}
                  checked={draft.recommendationSources[key]}
                  onCheckedChange={(checked) => toggleSource(key, checked)}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Shopping Preferences</CardTitle>
              <p className="text-caption text-muted-foreground">
                Select the categories and interests most relevant to your little one.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockCategories.map((category) => {
                  const selected = draft.selectedCategorySlugs.includes(category.slug)
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => toggleCategory(category.slug)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-small font-medium transition-colors",
                        selected
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">AI Shopping Assistant</CardTitle>
              <p className="text-caption text-muted-foreground">
                Choose whether BabyNest can use AI-powered assistance to help you discover products.
              </p>
            </CardHeader>
            <CardContent>
              <ToggleRow
                title="Enable AI Shopping Assistant"
                description="Powers Smart Search and AI-style product suggestions across BabyNest."
                checked={draft.aiAssistantEnabled}
                onCheckedChange={(checked) => update("aiAssistantEnabled", checked)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Privacy &amp; Personalization</CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleRow
                title="Use my activity to improve my recommendations"
                description="Your browsing and purchase activity stays private and is only used to personalize your own experience — never shared or sold."
                checked={draft.useActivityForRecommendations}
                onCheckedChange={(checked) => update("useActivityForRecommendations", checked)}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Preferences</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </Container>
    </main>
  )
}

export { AIPreferencesPageContent }
