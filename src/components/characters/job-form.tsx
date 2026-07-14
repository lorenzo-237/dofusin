import * as React from "react"

import { CharacterSelect } from "@/components/shared/character-select"
import { JobSelect } from "@/components/shared/job-select"
import { LevelRangeInput } from "@/components/shared/level-range-input"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { getLastJob, setLastJob } from "@/lib/last-selection-store"
import type { Character, Job, JobInput } from "@/lib/types"

interface JobFormProps {
  server: string
  characters: Character[]
  editingJob: Job | null
  onSubmit: (values: JobInput) => Promise<void>
  onCancelEdit: () => void
}

/**
 * Jobs are per-account-per-server (not per-character, see Job in
 * lib/types.ts) — this form always upserts by (server, job): submitting an
 * existing pair just updates its level/character. `characterId` is only
 * which character to show (and whisper) alongside this job, picked from
 * `characters` (already scoped to `server` by the caller).
 *
 * Fields are only initialized from `editingJob` on mount — the parent must
 * render this with `key={editingJob?.id ?? "new"}` so switching between
 * "add" and "edit X" remounts it with fresh values (same pattern as
 * CharacterForm).
 *
 * Renders just the `<form>` — no outer card/title — since the parent hosts
 * it inside a bottom Sheet (title lives in SheetHeader/SheetTitle there).
 * `onCancelEdit` closes the sheet regardless of add/edit mode, so the
 * "Annuler" button is always shown, not just while editing.
 */
export function JobForm({
  server,
  characters,
  editingJob,
  onSubmit,
  onCancelEdit,
}: JobFormProps) {
  const [characterId, setCharacterId] = React.useState<string>(
    editingJob?.characterId ?? characters[0]?.id ?? ""
  )
  const [job, setJob] = React.useState<string>(
    editingJob?.job ?? getLastJob()
  )
  const [level, setLevel] = React.useState(
    editingJob ? String(editingJob.level) : ""
  )
  const [notifyMinLevel, setNotifyMinLevel] = React.useState(
    editingJob?.notifyMinLevel ? String(editingJob.notifyMinLevel) : ""
  )
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!characterId) {
      setError("Choisis un personnage.")
      return
    }
    const parsedLevel = Number(level.trim())
    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 200) {
      setError("Le niveau doit être un nombre entier entre 1 et 200.")
      return
    }
    let parsedNotifyMinLevel: number | null = null
    if (notifyMinLevel.trim()) {
      parsedNotifyMinLevel = Number(notifyMinLevel.trim())
      if (
        !Number.isInteger(parsedNotifyMinLevel) ||
        parsedNotifyMinLevel < 1 ||
        parsedNotifyMinLevel > 200
      ) {
        setError(
          "Le seuil de notification doit être un nombre entier entre 1 et 200."
        )
        return
      }
    }
    setError("")
    setIsSubmitting(true)
    try {
      await onSubmit({
        server,
        characterId,
        job,
        level: parsedLevel,
        notifyMinLevel: parsedNotifyMinLevel,
      })
      if (!editingJob) {
        setLevel("")
        setNotifyMinLevel("")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <CharacterSelect
        value={characterId}
        onValueChange={setCharacterId}
        characters={characters}
        className="h-auto w-full rounded-xl bg-muted px-3 py-3 text-[15px]"
      />
      <JobSelect
        value={job}
        onValueChange={(next) => {
          setJob(next)
          setLastJob(next)
        }}
        className="h-auto w-full rounded-xl bg-muted px-3 py-3 text-[15px]"
      />
      <LevelRangeInput
        value={level}
        onChange={setLevel}
        required
        placeholder="Niveau (1-200)"
        ariaLabel="Niveau"
        inputClassName="h-auto rounded-xl bg-muted px-3 py-3 text-[15px]"
      />
      <LevelRangeInput
        value={notifyMinLevel}
        onChange={setNotifyMinLevel}
        placeholder="Seuil de notification (optionnel)"
        ariaLabel="Seuil de notification"
        inputClassName="h-auto rounded-xl bg-muted px-3 py-3 text-[15px]"
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
          {isSubmitting
            ? "Enregistrement..."
            : editingJob
              ? "Enregistrer"
              : "Ajouter"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelEdit}
          className="h-auto rounded-xl px-3.5 py-3.5 font-bold text-muted-foreground"
        >
          Annuler
        </Button>
      </div>
    </form>
  )
}
