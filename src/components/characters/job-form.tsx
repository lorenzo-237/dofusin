import * as React from "react"

import { JobSelect } from "@/components/shared/job-select"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { JOBS, SERVERS } from "@/lib/game-data"
import type { Job, JobInput } from "@/lib/types"

interface JobFormProps {
  editingJob: Job | null
  onSubmit: (values: JobInput) => Promise<void>
  onCancelEdit: () => void
}

/**
 * Jobs are per-account-per-server (not per-character, see Job in
 * lib/types.ts) — this form always upserts by (server, job): submitting an
 * existing pair just updates its level.
 *
 * Fields are only initialized from `editingJob` on mount — the parent must
 * render this with `key={editingJob?.id ?? "new"}` so switching between
 * "add" and "edit X" remounts it with fresh values (same pattern as
 * CharacterForm).
 */
export function JobForm({ editingJob, onSubmit, onCancelEdit }: JobFormProps) {
  const [server, setServer] = React.useState<string>(
    editingJob?.server ?? SERVERS[0]
  )
  const [job, setJob] = React.useState<string>(editingJob?.job ?? JOBS[0])
  const [level, setLevel] = React.useState(editingJob?.level ?? "")
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!level.trim()) {
      setError("Le niveau est requis.")
      return
    }
    setError("")
    setIsSubmitting(true)
    try {
      await onSubmit({ server, job, level: level.trim() })
      if (!editingJob) {
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
        {editingJob ? "Modifier le métier" : "Ajouter un métier"}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <ServerSelect
          value={server}
          onValueChange={setServer}
          className="h-auto w-full rounded-xl bg-muted px-3 py-3 text-[15px]"
        />
        <JobSelect
          value={job}
          onValueChange={setJob}
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
            {isSubmitting
              ? "Enregistrement..."
              : editingJob
                ? "Enregistrer"
                : "Ajouter"}
          </Button>
          {editingJob ? (
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
