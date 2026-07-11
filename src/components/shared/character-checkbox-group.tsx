import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Character } from "@/lib/types"

interface CharacterCheckboxGroupProps {
  value: string
  onValueChange: (characterId: string) => void
  characters: Character[]
  className?: string
}

/**
 * Single-choice "checkbox" chips (not a real HTML checkbox group — only one
 * can be checked, like a radio group, but styled as checkboxes per the
 * design request) for picking which character represents a job.
 */
export function CharacterCheckboxGroup({
  value,
  onValueChange,
  characters,
  className,
}: CharacterCheckboxGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {characters.map((character) => {
        const isSelected = character.id === value
        return (
          <button
            key={character.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onValueChange(character.id)}
            className={cn(
              "flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {isSelected ? (
              <Check className="size-3" />
            ) : (
              <span className="size-3 rounded-sm border border-current" />
            )}
            {character.name}
          </button>
        )
      })}
    </div>
  )
}
