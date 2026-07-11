import * as React from "react"
import { SlidersHorizontal } from "lucide-react"

import { CharacterCheckboxGroup } from "@/components/shared/character-checkbox-group"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Character } from "@/lib/types"

interface JobAvailabilityBulkBarProps {
  characters: Character[]
  allOn: boolean
  onToggleAll: (on: boolean) => void
  onAssignCharacterToAll: (characterId: string) => void
}

/**
 * Bulk actions above the per-job cards: toggle every job's availability at
 * once, or reassign every job's representative character at once (picked
 * then confirmed via "Appliquer", not applied on every click). The per-job
 * controls (see JobAvailabilityCard) still work independently.
 */
export function JobAvailabilityBulkBar({
  characters,
  allOn,
  onToggleAll,
  onAssignCharacterToAll,
}: JobAvailabilityBulkBarProps) {
  const [selectedCharacterId, setSelectedCharacterId] = React.useState("")

  if (characters.length === 0) return null

  return (
    <div className="mb-3 flex flex-col gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
      <div className="flex items-center gap-1.5 text-primary">
        <SlidersHorizontal className="size-3.5" />
        <span className="text-[11px] font-bold tracking-wide uppercase">
          Actions globales
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Tous les métiers dispo</span>
        <Switch checked={allOn} onCheckedChange={onToggleAll} />
      </div>
      <div>
        <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
          Affecter un personnage à tous les métiers
        </div>
        <CharacterCheckboxGroup
          value={selectedCharacterId}
          onValueChange={setSelectedCharacterId}
          characters={characters}
          className="mb-2"
        />
        <Button
          type="button"
          size="sm"
          disabled={!selectedCharacterId}
          onClick={() => onAssignCharacterToAll(selectedCharacterId)}
          className="h-auto w-full rounded-xl py-2.5 font-bold"
        >
          Appliquer
        </Button>
      </div>
    </div>
  )
}
