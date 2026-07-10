import type { Job } from "@/lib/types"

interface JobListItemProps {
  job: Job
  onEdit: () => void
  onDelete: () => void
}

export function JobListItem({ job, onEdit, onDelete }: JobListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
      <div className="flex-1">
        <div className="text-sm font-bold">{job.job}</div>
        <div className="text-xs text-muted-foreground">
          {job.server} · Niveau {job.level}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="px-1.5 py-2 text-xs font-bold text-primary"
      >
        Modif.
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-1.5 py-2 text-xs font-bold text-destructive"
      >
        Suppr.
      </button>
    </div>
  )
}
