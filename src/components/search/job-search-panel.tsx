import * as React from "react"

import { JobSearchFiltersCard } from "@/components/search/job-search-filters-card"
import { JobSearchResultsList } from "@/components/search/job-search-results-list"
import { getApiClient } from "@/lib/api"
import {
  getLastJob,
  getLastServer,
  setLastJob,
  setLastServer,
} from "@/lib/last-selection-store"
import type { JobSearchFilters, JobSearchResult } from "@/lib/types"

/**
 * Owns its own filters/fetch so it only runs while the "Métiers" tab is
 * mounted (TabsContent unmounts inactive panels by default).
 */
export function JobSearchPanel() {
  const [filters, setFilters] = React.useState<JobSearchFilters>({
    server: getLastServer(),
    job: getLastJob(),
  })
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
        onChange={(patch) => {
          setFilters((prev) => ({ ...prev, ...patch }))
          if (patch.server) setLastServer(patch.server)
          if (patch.job) setLastJob(patch.job)
        }}
      />
      <JobSearchResultsList results={results} isLoading={isPending} />
    </div>
  )
}
