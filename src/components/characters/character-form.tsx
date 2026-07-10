import * as React from "react"

import { ClassSelect } from "@/components/shared/class-select"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { CLASSES, SERVERS } from "@/lib/game-data"
import type { Character, CharacterInput } from "@/lib/types"

interface CharacterFormProps {
  editingCharacter: Character | null
  onSubmit: (values: CharacterInput) => Promise<void>
  onCancelEdit: () => void
}

/**
 * Fields are only initialized from `editingCharacter` on mount — the parent
 * must render this with `key={editingCharacter?.id ?? "new"}` so switching
 * between "add" and "edit X" (or between two characters) remounts it with
 * fresh values instead of needing an effect to resync state.
 */

export function CharacterForm({
  editingCharacter,
  onSubmit,
  onCancelEdit,
}: CharacterFormProps) {
  const [name, setName] = React.useState(editingCharacter?.name ?? "")
  const [server, setServer] = React.useState(
    editingCharacter?.server ?? SERVERS[0]
  )
  const [characterClass, setCharacterClass] = React.useState(
    editingCharacter?.class ?? CLASSES[0]
  )
  const [level, setLevel] = React.useState(editingCharacter?.level ?? "")
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError("Le nom du personnage est requis.")
      return
    }
    setError("")
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        server,
        class: characterClass,
        level: level.trim(),
      })
      if (!editingCharacter) {
        setName("")
        setServer(SERVERS[0])
        setCharacterClass(CLASSES[0])
        setLevel("")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4.5">
      <div className="mb-3 font-heading text-[15px] font-bold">
        {editingCharacter ? "Modifier le personnage" : "Ajouter un personnage"}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom exact en jeu"
          aria-label="Nom exact en jeu"
          className="h-auto rounded-xl bg-muted px-3 py-3 text-[15px]"
        />
        <ServerSelect
          value={server}
          onValueChange={setServer}
          className="h-auto w-full rounded-xl bg-muted px-3 py-3 text-[15px]"
        />
        <ClassSelect
          value={characterClass}
          onValueChange={setCharacterClass}
          className="h-auto w-full rounded-xl bg-muted px-3 py-3 text-[15px]"
        />
        <Input
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          placeholder="Niveau"
          aria-label="Niveau"
          className="h-auto rounded-xl bg-muted px-3 py-3 text-[15px]"
        />
        {error ? (
          <p className="text-[13px] font-semibold text-destructive">{error}</p>
        ) : null}
        <div className="flex gap-2.5">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto flex-1 rounded-xl py-3.5 font-bold"
          >
            {editingCharacter ? "Enregistrer" : "Ajouter"}
          </Button>
          {editingCharacter ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancelEdit}
              className="h-auto rounded-xl px-3.5 py-3.5 font-bold text-muted-foreground"
            >
              Annuler
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
