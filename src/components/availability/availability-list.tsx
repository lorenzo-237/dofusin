import { AvailabilityCard } from "@/components/availability/availability-card"
import type { Availability, AvailabilityInput, Character } from "@/lib/types"

interface AvailabilityListProps {
  characters: Character[]
  availabilities: Availability[]
  onToggle: (character: Character) => void
  onFieldChange: (
    characterId: string,
    patch: Partial<AvailabilityInput>
  ) => void
}

export function AvailabilityList({
  characters,
  availabilities,
  onToggle,
  onFieldChange,
}: AvailabilityListProps) {
  return (
    <div className="flex flex-col gap-3">
      {characters.map((character) => (
        <AvailabilityCard
          key={character.id}
          character={character}
          availability={availabilities.find(
            (a) => a.characterId === character.id
          )}
          onToggle={() => onToggle(character)}
          onFieldChange={(patch) => onFieldChange(character.id, patch)}
        />
      ))}
    </div>
  )
}
