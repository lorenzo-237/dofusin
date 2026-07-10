import { createFileRoute } from "@tanstack/react-router"

import { AvailabilityList } from "@/components/availability/availability-list"
import { useAuth } from "@/context/auth-context"
import type { AvailabilityInput, Character } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/availability")({
  staticData: { title: "Disponibilité" },
  component: AvailabilityScreen,
})

function AvailabilityScreen() {
  const { characters, availabilities, setAvailability, removeAvailability } =
    useAuth()

  const handleToggle = (character: Character) => {
    const existing = availabilities.find(
      (a) => a.characterId === character.id
    )
    if (existing) {
      void removeAvailability(character.id)
    } else {
      void setAvailability({
        characterId: character.id,
        free: true,
        price: null,
      })
    }
  }

  const handleFieldChange = (
    characterId: string,
    patch: Partial<AvailabilityInput>
  ) => {
    const existing = availabilities.find((a) => a.characterId === characterId)
    if (!existing) return
    void setAvailability({
      characterId,
      free: existing.free,
      price: existing.price,
      ...patch,
    })
  }

  return (
    <div className="pt-1">
      <p className="mb-4 text-[13px] text-muted-foreground">
        Valable aujourd'hui seulement.
      </p>
      <AvailabilityList
        characters={characters}
        availabilities={availabilities}
        onToggle={handleToggle}
        onFieldChange={handleFieldChange}
      />
    </div>
  )
}
