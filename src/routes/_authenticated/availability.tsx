import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Hammer, Users } from "lucide-react"

import { CharacterAvailabilityList } from "@/components/availability/character-availability-list"
import { EmptyStateReminder } from "@/components/availability/empty-state-reminder"
import { JobAvailabilityBulkBar } from "@/components/availability/job-availability-bulk-bar"
import { JobAvailabilityList } from "@/components/availability/job-availability-list"
import { ServerSelect } from "@/components/shared/server-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { getLastServer, setLastServer } from "@/lib/last-selection-store"
import type {
  AvailabilityInput,
  Character,
  Job,
  JobAvailabilityInput,
} from "@/lib/types"

export const Route = createFileRoute("/_authenticated/availability")({
  staticData: { title: "Disponibilité" },
  component: AvailabilityScreen,
})

function AvailabilityScreen() {
  const {
    characters,
    availabilities,
    setAvailability,
    removeAvailability,
    jobs,
    setJob,
    jobAvailabilities,
    setJobAvailability,
    removeJobAvailability,
  } = useAuth()

  const [server, setServer] = React.useState<string>(getLastServer())

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setLastServer(nextServer)
  }

  const serverCharacters = characters.filter((c) => c.server === server)
  const serverJobs = jobs.filter((j) => j.server === server)

  const handleToggle = (character: Character) => {
    const existing = availabilities.find(
      (a) => a.characterId === character.id
    )
    if (existing) {
      void removeAvailability(character.id)
    } else {
      void setAvailability({
        characterId: character.id,
        free: true,
        price: null,
      })
    }
  }

  const handleFieldChange = (
    characterId: string,
    patch: Partial<AvailabilityInput>
  ): Promise<void> => {
    const existing = availabilities.find((a) => a.characterId === characterId)
    if (!existing) return Promise.resolve()
    return setAvailability({
      characterId,
      free: existing.free,
      price: existing.price,
      ...patch,
    })
  }

  const handleJobToggle = (job: Job) => {
    const existing = jobAvailabilities.find((a) => a.jobId === job.id)
    if (existing) {
      void removeJobAvailability(job.id)
    } else {
      void setJobAvailability({ jobId: job.id, free: true, price: null })
    }
  }

  const handleJobFieldChange = (
    jobId: string,
    patch: Partial<JobAvailabilityInput>
  ): Promise<void> => {
    const existing = jobAvailabilities.find((a) => a.jobId === jobId)
    if (!existing) return Promise.resolve()
    return setJobAvailability({
      jobId,
      free: existing.free,
      price: existing.price,
      ...patch,
    })
  }

  const handleJobCharacterChange = (job: Job, characterId: string) => {
    void setJob({
      server: job.server,
      characterId,
      job: job.job,
      level: job.level,
      notifyMinLevel: job.notifyMinLevel,
    })
  }

  const allServerJobsOn =
    serverJobs.length > 0 &&
    serverJobs.every((j) => jobAvailabilities.some((a) => a.jobId === j.id))

  const handleToggleAllJobs = (on: boolean) => {
    serverJobs.forEach((job) => {
      const existing = jobAvailabilities.find((a) => a.jobId === job.id)
      if (on && !existing) {
        void setJobAvailability({ jobId: job.id, free: true, price: null })
      } else if (!on && existing) {
        void removeJobAvailability(job.id)
      }
    })
  }

  const handleAssignCharacterToAllJobs = (characterId: string) => {
    if (!characterId) return
    serverJobs.forEach((job) => {
      void setJob({
        server: job.server,
        characterId,
        job: job.job,
        level: job.level,
        notifyMinLevel: job.notifyMinLevel,
      })
    })
  }

  return (
    <div className="pt-1">
      <p className="mb-2 text-[13px] text-muted-foreground">
        Valable aujourd'hui seulement.
      </p>
      <ServerSelect
        value={server}
        onValueChange={handleServerChange}
        className="mb-3 h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />

      <Tabs defaultValue="characters">
        <TabsList className="mb-3 w-full">
          <TabsTrigger value="characters" className="flex-1">
            <Users className="opacity-70" />
            Personnages
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex-1">
            <Hammer className="opacity-70" />
            Métiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters">
          {serverCharacters.length === 0 ? (
            <EmptyStateReminder
              message="Aucun personnage sur ce serveur pour l'instant."
              to="/characters"
              ctaLabel="Configurer mes personnages →"
            />
          ) : (
            <CharacterAvailabilityList
              characters={serverCharacters}
              availabilities={availabilities}
              onToggle={handleToggle}
              onFieldChange={handleFieldChange}
            />
          )}
        </TabsContent>

        <TabsContent value="jobs">
          {serverJobs.length === 0 ? (
            <EmptyStateReminder
              message="Aucun métier sur ce serveur pour l'instant."
              to="/jobs"
              ctaLabel="Configurer mes métiers →"
            />
          ) : (
            <>
              <JobAvailabilityBulkBar
                characters={serverCharacters}
                allOn={allServerJobsOn}
                onToggleAll={handleToggleAllJobs}
                onAssignCharacterToAll={handleAssignCharacterToAllJobs}
              />
              <JobAvailabilityList
                jobs={serverJobs}
                characters={serverCharacters}
                availabilities={jobAvailabilities}
                onToggle={handleJobToggle}
                onFieldChange={handleJobFieldChange}
                onCharacterChange={handleJobCharacterChange}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
