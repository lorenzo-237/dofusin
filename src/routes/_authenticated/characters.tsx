import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { CharacterForm } from "@/components/characters/character-form"
import { CharacterList } from "@/components/characters/character-list"
import { JobForm } from "@/components/characters/job-form"
import { JobList } from "@/components/characters/job-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
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
  const [editingCharacter, setEditingCharacter] =
    React.useState<Character | null>(null)
  const [editingJob, setEditingJob] = React.useState<Job | null>(null)

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
    <Tabs defaultValue="characters" className="pt-1">
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
          characters={characters}
          onEdit={setEditingCharacter}
          onDelete={handleDelete}
        />
        <CharacterForm
          key={editingCharacter?.id ?? "new"}
          editingCharacter={editingCharacter}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingCharacter(null)}
        />
      </TabsContent>

      <TabsContent value="jobs">
        <p className="mb-4 text-[13px] text-muted-foreground">
          Les métiers sont liés à un serveur : tous tes personnages du même
          serveur partagent les mêmes niveaux.
        </p>
        <JobList jobs={jobs} onEdit={setEditingJob} onDelete={handleJobDelete} />
        <JobForm
          key={editingJob?.id ?? "new"}
          editingJob={editingJob}
          onSubmit={handleJobSubmit}
          onCancelEdit={() => setEditingJob(null)}
        />
      </TabsContent>
    </Tabs>
  )
}
