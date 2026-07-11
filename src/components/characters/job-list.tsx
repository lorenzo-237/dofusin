import { JobListItem } from "@/components/characters/job-list-item"
import type { Character, Job } from "@/lib/types"

interface JobListProps {
  jobs: Job[]
  characters: Character[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}

export function JobList({ jobs, characters, onEdit, onDelete }: JobListProps) {
  if (jobs.length === 0) return null

  const sortedJobs = [...jobs].sort((a, b) => a.job.localeCompare(b.job, "fr"))

  return (
    <div className="mb-4.5 flex flex-col gap-2">
      {sortedJobs.map((job) => (
        <JobListItem
          key={job.id}
          job={job}
          characterName={
            characters.find((c) => c.id === job.characterId)?.name ?? ""
          }
          onEdit={() => onEdit(job)}
          onDelete={() => onDelete(job)}
        />
      ))}
    </div>
  )
}
