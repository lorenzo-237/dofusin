import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { SearchFiltersCard } from "@/components/search/search-filters-card"
import { SearchResultsList } from "@/components/search/search-results-list"
import { getApiClient } from "@/lib/api"
import { SERVERS } from "@/lib/game-data"
import type { HelperSearchResult, SearchFilters } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/search")({
  staticData: { title: "Recherche" },
  component: SearchScreen,
})

const EMPTY_FILTERS: SearchFilters = {
  server: SERVERS[0],
  class: "",
  minLevel: "",
}

function SearchScreen() {
  const [filters, setFilters] = React.useState<SearchFilters>(EMPTY_FILTERS)
  const [results, setResults] = React.useState<HelperSearchResult[]>([])
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    let cancelled = false
    startTransition(async () => {
      const data = await getApiClient().searchHelpers(filters)
      if (!cancelled) setResults(data)
    })
    return () => {
      cancelled = true
    }
  }, [filters, startTransition])

  return (
    <div className="pt-1">
      <SearchFiltersCard
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
      />
      <SearchResultsList results={results} isLoading={isPending} />
    </div>
  )
}
