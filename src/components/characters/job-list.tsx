import { JobListItem } from "@/components/characters/job-list-item"
import type { Job } from "@/lib/types"

interface JobListProps {
  jobs: Job[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}

export function JobList({ jobs, onEdit, onDelete }: JobListProps) {
  if (jobs.length === 0) return null

  return (
    <div className="mb-4.5 flex flex-col gap-2">
      {jobs.map((job) => (
        <JobListItem
          key={job.id}
          job={job}
          onEdit={() => onEdit(job)}
          onDelete={() => onDelete(job)}
        />
      ))}
    </div>
  )
}
