import { JobSelect } from "@/components/shared/job-select"
import { ServerSelect } from "@/components/shared/server-select"
import type { JobSearchFilters } from "@/lib/types"

interface JobSearchFiltersCardProps {
  filters: JobSearchFilters
  onChange: (patch: Partial<JobSearchFilters>) => void
}

export function JobSearchFiltersCard({
  filters,
  onChange,
}: JobSearchFiltersCardProps) {
  return (
    <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
      <ServerSelect
        value={filters.server}
        onValueChange={(server) => onChange({ server })}
        className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />
      <JobSelect
        value={filters.job}
        onValueChange={(job) => onChange({ job })}
        className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />
    </div>
  )
}
