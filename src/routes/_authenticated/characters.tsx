import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { CharacterForm } from "@/components/characters/character-form"
import { CharacterList } from "@/components/characters/character-list"
import { JobForm } from "@/components/characters/job-form"
import { JobList } from "@/components/characters/job-list"
import { ServerSelect } from "@/components/shared/server-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { SERVERS } from "@/lib/game-data"
import type { Character, CharacterInput, Job, JobInput } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/characters")({
  staticData: { title: "Mes personnages" },
  component: CharactersScreen,
})

function CharactersScreen() {
  const {
    characters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    jobs,
    setJob,
    deleteJob,
  } = useAuth()

  const [server, setServer] = React.useState<string>(SERVERS[0])
  const [editingCharacter, setEditingCharacter] =
    React.useState<Character | null>(null)
  const [editingJob, setEditingJob] = React.useState<Job | null>(null)

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setEditingCharacter(null)
    setEditingJob(null)
  }

  const serverCharacters = characters.filter((c) => c.server === server)
  const serverJobs = jobs.filter((j) => j.server === server)

  const handleSubmit = async (values: CharacterInput) => {
    if (editingCharacter) {
      await updateCharacter(editingCharacter.id, values)
      setEditingCharacter(null)
    } else {
      await createCharacter(values)
    }
  }

  const handleDelete = async (character: Character) => {
    await deleteCharacter(character.id)
    setEditingCharacter((current) =>
      current?.id === character.id ? null : current
    )
  }

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

      <Tabs defaultValue="characters">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="characters" className="flex-1">
            Personnages
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex-1">
            Métiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters">
          <CharacterList
            characters={serverCharacters}
            onEdit={setEditingCharacter}
            onDelete={handleDelete}
          />
          <CharacterForm
            key={editingCharacter?.id ?? "new"}
            server={server}
            editingCharacter={editingCharacter}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingCharacter(null)}
          />
        </TabsContent>

        <TabsContent value="jobs">
          <p className="mb-4 text-[13px] text-muted-foreground">
            Les métiers sont liés au serveur : tous tes personnages sur{" "}
            {server} partagent les mêmes niveaux.
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
              Ajoute d'abord un personnage sur {server} pour pouvoir y
              rattacher un métier.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
