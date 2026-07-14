import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClassSelect } from "@/components/shared/class-select"
import { ServerSelect } from "@/components/shared/server-select"
import { CLASSES } from "@/lib/game-data"
import { getLastServer, setLastServer } from "@/lib/last-selection-store"
import type { CharacterInput } from "@/lib/types"

interface RegisterCharacterFormProps {
  isSubmitting?: boolean
  submitError?: string
  onSubmit: (values: CharacterInput) => void
}

export function RegisterCharacterForm({
  isSubmitting = false,
  submitError,
  onSubmit,
}: RegisterCharacterFormProps) {
  const [name, setName] = React.useState("")
  const [server, setServer] = React.useState<string>(getLastServer())
  const [characterClass, setCharacterClass] = React.useState<string>(
    CLASSES[0]
  )
  const [level, setLevel] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError("Le nom du personnage est requis.")
      return
    }
    const parsedLevel = Number(level.trim())
    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 200) {
      setError("Le niveau doit être un nombre entier entre 1 et 200.")
      return
    }
    setError("")
    onSubmit({
      name: name.trim(),
      server,
      class: characterClass,
      level: parsedLevel,
      notifyMinLevel: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nom exact en jeu"
        aria-label="Nom exact en jeu"
        className="h-auto rounded-xl px-3.5 py-3.5 text-base"
      />
      <ServerSelect
        value={server}
        onValueChange={(next) => {
          setServer(next)
          setLastServer(next)
        }}
        className="h-auto w-full rounded-xl px-3.5 py-3.5 text-base"
      />
      <ClassSelect
        value={characterClass}
        onValueChange={setCharacterClass}
        className="h-auto w-full rounded-xl px-3.5 py-3.5 text-base"
      />
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={200}
        value={level}
        onChange={(event) => setLevel(event.target.value)}
        placeholder="Niveau (1-200)"
        aria-label="Niveau"
        className="h-auto rounded-xl px-3.5 py-3.5 text-base"
      />
      {(error || submitError) ? (
        <p className="text-[13px] font-semibold text-destructive">
          {error || submitError}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-1.5 h-auto rounded-2xl py-3.5 font-heading text-base font-bold"
      >
        {isSubmitting ? "Création..." : "Terminer l'inscription"}
      </Button>
    </form>
  )
}
