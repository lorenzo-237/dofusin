import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { JobForm } from "@/components/characters/job-form"
import { JobList } from "@/components/characters/job-list"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setLastServer(nextServer)
    setEditingJob(null)
    setSheetOpen(false)
  }

  const serverCharacters = characters.filter((c) => c.server === server)
  const serverJobs = jobs.filter((j) => j.server === server)

  const handleAddClick = () => {
    setEditingJob(null)
    setSheetOpen(true)
  }

  const handleEditClick = (job: Job) => {
    setEditingJob(job)
    setSheetOpen(true)
  }

  const handleCancel = () => {
    setEditingJob(null)
    setSheetOpen(false)
  }

  const handleJobSubmit = async (values: JobInput) => {
    await setJob(values)
    setEditingJob(null)
    setSheetOpen(false)
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

      {serverCharacters.length > 0 ? (
        <Button
          onClick={handleAddClick}
          className="mb-4 h-auto w-full gap-1.5 rounded-xl py-3 font-bold"
        >
          <Plus className="size-4" />
          Ajouter un métier
        </Button>
      ) : (
        <p className="mb-4 rounded-2xl border border-dashed border-border bg-card px-4.5 py-4.5 text-center text-[13px] text-muted-foreground">
          Ajoute d'abord un personnage sur {server} pour pouvoir y rattacher
          un métier.
        </p>
      )}

      <JobList
        jobs={serverJobs}
        characters={serverCharacters}
        onEdit={handleEditClick}
        onDelete={handleJobDelete}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingJob ? "Modifier le métier" : "Ajouter un métier"}
              <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">
                sur {server}
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <JobForm
              key={editingJob?.id ?? "new"}
              server={server}
              characters={serverCharacters}
              editingJob={editingJob}
              onSubmit={handleJobSubmit}
              onCancelEdit={handleCancel}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
