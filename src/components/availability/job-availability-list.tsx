import { JobAvailabilityCard } from "@/components/availability/job-availability-card"
import type { Character, Job, JobAvailability, JobAvailabilityInput } from "@/lib/types"

interface JobAvailabilityListProps {
  jobs: Job[]
  characters: Character[]
  availabilities: JobAvailability[]
  onToggle: (job: Job) => void
  onFieldChange: (
    jobId: string,
    patch: Partial<JobAvailabilityInput>
  ) => Promise<void>
  onCharacterChange: (job: Job, characterId: string) => void
}

export function JobAvailabilityList({
  jobs,
  characters,
  availabilities,
  onToggle,
  onFieldChange,
  onCharacterChange,
}: JobAvailabilityListProps) {
  const sortedJobs = [...jobs].sort((a, b) => a.job.localeCompare(b.job, "fr"))

  return (
    <div className="flex flex-col gap-2">
      {sortedJobs.map((job) => (
        <JobAvailabilityCard
          key={job.id}
          job={job}
          characters={characters}
          availability={availabilities.find((a) => a.jobId === job.id)}
          onToggle={() => onToggle(job)}
          onFieldChange={(patch) => onFieldChange(job.id, patch)}
          onCharacterChange={(characterId) => onCharacterChange(job, characterId)}
        />
      ))}
    </div>
  )
}
