"use client"

import type { ElementType } from "react"
import { Bell, Palette, Settings2, Shield, Store } from "lucide-react"
import { cn } from "cn"

export type SettingsSection = "general" | "store" | "notifications" | "security" | "appearance"

const sections: { key: SettingsSection; label: string; icon: ElementType }[] = [
  { key: "general", label: "General", icon: Settings2 },
  { key: "store", label: "Store", icon: Store },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
]

export type SettingsNavProps = {
  active: SettingsSection
  onChange: (section: SettingsSection) => void
}

/** Settings section switcher — vertical rail on desktop, horizontal scroll on mobile. Active state mirrors the Admin Sidebar's blush highlight. */
function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-1 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {sections.map((section) => {
        const isActive = active === section.key
        const Icon = section.icon
        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onChange(section.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-small font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-foreground/75 hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}

export { SettingsNav }
