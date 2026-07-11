import * as React from "react"

import { JobSearchFiltersCard } from "@/components/search/job-search-filters-card"
import { JobSearchResultsList } from "@/components/search/job-search-results-list"
import { getApiClient } from "@/lib/api"
import { JOBS, SERVERS } from "@/lib/game-data"
import type { JobSearchFilters, JobSearchResult } from "@/lib/types"

const EMPTY_FILTERS: JobSearchFilters = {
  server: SERVERS[0],
  job: JOBS[0],
}

/**
 * Owns its own filters/fetch so it only runs while the "Métiers" tab is
 * mounted (TabsContent unmounts inactive panels by default).
 */
export function JobSearchPanel() {
  const [filters, setFilters] = React.useState<JobSearchFilters>(EMPTY_FILTERS)
  const [results, setResults] = React.useState<JobSearchResult[]>([])
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    let cancelled = false
    startTransition(async () => {
      const data = await getApiClient().searchJobHelpers(filters)
      if (!cancelled) setResults(data)
    })
    return () => {
      cancelled = true
    }
  }, [filters, startTransition])

  return (
    <div>
      <JobSearchFiltersCard
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
      />
      <JobSearchResultsList results={results} isLoading={isPending} />
    </div>
  )
}
