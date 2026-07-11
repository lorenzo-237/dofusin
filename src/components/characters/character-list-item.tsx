import { ClassAvatar, ClassIcon } from "@/components/shared/class-avatar"
import type { Character } from "@/lib/types"

interface CharacterListItemProps {
  character: Character
  onEdit: () => void
  onDelete: () => void
}

export function CharacterListItem({
  character,
  onEdit,
  onDelete,
}: CharacterListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
      <ClassAvatar name={character.name} characterClass={character.class} />
      <div className="flex-1">
        <div className="text-sm font-bold">{character.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClassIcon characterClass={character.class} />
          <span>
            {character.class}
            {character.level ? ` · N${character.level}` : ""}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="px-1.5 py-2 text-xs font-bold text-primary"
      >
        Modif.
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-1.5 py-2 text-xs font-bold text-destructive"
      >
        Suppr.
      </button>
    </div>
  )
}
