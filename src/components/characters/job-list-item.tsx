import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"
import type { Job } from "@/lib/types"

interface JobListItemProps {
  job: Job
  characterName: string
  onEdit: () => void
  onDelete: () => void
}

export function JobListItem({
  job,
  characterName,
  onEdit,
  onDelete,
}: JobListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
      <div className="flex-1">
        <Badge
          style={{ backgroundColor: jobColor(job.job) }}
          className="mb-1 h-5 rounded-full px-2 text-[11px] font-bold text-white"
        >
          {job.job}
        </Badge>
        <div className="text-xs text-muted-foreground">
          Niveau {job.level}
          {characterName ? ` · via ${characterName}` : ""}
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
