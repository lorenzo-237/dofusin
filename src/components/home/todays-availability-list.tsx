import { Link } from "@tanstack/react-router"

import { ClassDot } from "@/components/shared/class-avatar"
import type { Availability, Character } from "@/lib/types"

interface TodaysAvailabilityListProps {
  characters: Character[]
  availabilities: Availability[]
}

interface AvailableCharacterRow {
  character: Character
  priceLabel: string
}

export function TodaysAvailabilityList({
  characters,
  availabilities,
}: TodaysAvailabilityListProps) {
  const items = characters.reduce<AvailableCharacterRow[]>((rows, character) => {
    const availability = availabilities.find(
      (a) => a.characterId === character.id
    )
    if (!availability) return rows
    const priceLabel = availability.free
      ? "Gratuit"
      : availability.price
        ? `${availability.price} k`
        : "—"
    rows.push({ character, priceLabel })
    return rows
  }, [])

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4.5 py-4.5 text-center text-[13px] text-muted-foreground">
        Aucun perso disponible.{" "}
        <Link to="/availability" className="font-bold text-primary">
          En rendre un dispo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ character, priceLabel }) => (
        <div
          key={character.id}
          className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <ClassDot characterClass={character.class} />
          <div className="flex-1 text-sm font-bold">{character.name}</div>
          <div className="text-[13px] font-bold text-primary">
            {priceLabel}
          </div>
        </div>
      ))}
    </div>
  )
}
