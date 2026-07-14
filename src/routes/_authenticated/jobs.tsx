import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { JobForm } from "@/components/characters/job-form"
import { JobList } from "@/components/characters/job-list"
import { ServerSelect } from "@/components/shared/server-select"
import { useAuth } from "@/context/auth-context"
import { getLastServer, setLastServer } from "@/lib/last-selection-store"
import type { Job, JobInput } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/jobs")({
  staticData: { title: "Mes métiers" },
  component: JobsScreen,
})

function JobsScreen() {
  const { characters, jobs, setJob, deleteJob } = useAuth()

  const [server, setServer] = React.useState<string>(getLastServer())
  const [editingJob, setEditingJob] = React.useState<Job | null>(null)

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setLastServer(nextServer)
    setEditingJob(null)
  }

  const serverCharacters = characters.filter((c) => c.server === server)
  const serverJobs = jobs.filter((j) => j.server === server)

  const handleJobSubmit = async (values: JobInput) => {
    await setJob(values)
    setEditingJob(null)
  }

  const handleJobDelete = async (job: Job) => {
    await deleteJob(job.id)
    setEditingJob((current) => (current?.id === job.id ? null : current))
  }

  return (
    <div className="pt-1">
      <ServerSelect
        value={server}
        onValueChange={handleServerChange}
        className="mb-4 h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />

      <p className="mb-4 text-[13px] text-muted-foreground">
        Les métiers sont liés au serveur : tous tes personnages sur {server}{" "}
        partagent les mêmes niveaux.
      </p>
      <JobList
        jobs={serverJobs}
        characters={serverCharacters}
        onEdit={setEditingJob}
        onDelete={handleJobDelete}
      />
      {serverCharacters.length > 0 ? (
        <JobForm
          key={editingJob?.id ?? "new"}
          server={server}
          characters={serverCharacters}
          editingJob={editingJob}
          onSubmit={handleJobSubmit}
          onCancelEdit={() => setEditingJob(null)}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4.5 py-4.5 text-center text-[13px] text-muted-foreground">
          Ajoute d'abord un personnage sur {server} pour pouvoir y rattacher
          un métier.
        </p>
      )}
    </div>
  )
}
