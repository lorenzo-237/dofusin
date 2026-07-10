import { CharacterListItem } from "@/components/characters/character-list-item"
import type { Character } from "@/lib/types"

interface CharacterListProps {
  characters: Character[]
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
}

export function CharacterList({
  characters,
  onEdit,
  onDelete,
}: CharacterListProps) {
  if (characters.length === 0) return null

  return (
    <div className="mb-4.5 flex flex-col gap-2">
      {characters.map((character) => (
        <CharacterListItem
          key={character.id}
          character={character}
          onEdit={() => onEdit(character)}
          onDelete={() => onDelete(character)}
        />
      ))}
    </div>
  )
}
