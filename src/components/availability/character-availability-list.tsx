import { CharacterAvailabilityCard } from "@/components/availability/character-availability-card"
import type { Availability, AvailabilityInput, Character } from "@/lib/types"

interface CharacterAvailabilityListProps {
  characters: Character[]
  availabilities: Availability[]
  onToggle: (character: Character) => void
  onFieldChange: (
    characterId: string,
    patch: Partial<AvailabilityInput>
  ) => Promise<void>
}

export function CharacterAvailabilityList({
  characters,
  availabilities,
  onToggle,
  onFieldChange,
}: CharacterAvailabilityListProps) {
  return (
    <div className="flex flex-col gap-2">
      {characters.map((character) => (
        <CharacterAvailabilityCard
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
