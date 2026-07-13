import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import {
  getMinimizeBehavior,
  setMinimizeBehavior,
  type MinimizeBehavior,
} from "@/lib/settings-store"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/settings")({
  staticData: { title: "Paramètres" },
  component: SettingsScreen,
})

const MINIMIZE_OPTIONS: {
  value: MinimizeBehavior
  label: string
  description: string
}[] = [
  {
    value: "taskbar",
    label: "Barre des tâches",
    description:
      "Le bouton réduire minimise la fenêtre normalement — elle reste visible dans la barre des tâches.",
  },
  {
    value: "tray",
    label: "Icônes système (tray)",
    description:
      "Le bouton réduire cache complètement la fenêtre. Pour la retrouver, clique sur l'icône DofusIn dans la zone de notification.",
  },
]

function SettingsScreen() {
  const [behavior, setBehavior] = React.useState<MinimizeBehavior>(() =>
    getMinimizeBehavior()
  )

  const handleChange = (value: MinimizeBehavior) => {
    setBehavior(value)
    setMinimizeBehavior(value)
  }

  return (
    <div className="pt-1">
      <div className="mb-2.5 font-heading text-[15px] font-bold">
        Bouton réduire
      </div>
      <div className="flex flex-col gap-2.5">
        {MINIMIZE_OPTIONS.map((option) => {
          const isSelected = behavior === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleChange(option.value)}
              className={cn(
                "flex flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <span
                className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {option.label}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
