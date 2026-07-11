import { JobSearchResultItem } from "@/components/search/job-search-result-item"
import type { JobSearchResult } from "@/lib/types"

interface JobSearchResultsListProps {
  results: JobSearchResult[]
  isLoading: boolean
}

export function JobSearchResultsList({
  results,
  isLoading,
}: JobSearchResultsListProps) {
  const label = isLoading
    ? "Recherche..."
    : `${results.length} ${results.length > 1 ? "offres trouvées" : "offre trouvée"}`

  return (
    <div>
      <div className="mb-2.5 text-xs font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-col gap-2.5">
        {results.map((result) => (
          <JobSearchResultItem key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
