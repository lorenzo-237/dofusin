import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Character } from "@/lib/types"

interface CharacterSelectProps {
  value: string
  onValueChange: (value: string) => void
  characters: Character[]
  className?: string
}

export function CharacterSelect({
  value,
  onValueChange,
  characters,
  className,
}: CharacterSelectProps) {
  const items = characters.map((character) => ({
    value: character.id,
    label: character.name,
  }))

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Personnage" />
      </SelectTrigger>
      <SelectContent>
        {characters.map((character) => (
          <SelectItem key={character.id} value={character.id}>
            {character.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
