import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { JobSearchPanel } from "@/components/search/job-search-panel"
import { SearchFiltersCard } from "@/components/search/search-filters-card"
import { SearchResultsList } from "@/components/search/search-results-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiClient } from "@/lib/api"
import { getLastServer, setLastServer } from "@/lib/last-selection-store"
import type { HelperSearchResult, SearchFilters } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/search")({
  staticData: { title: "Recherche" },
  component: SearchScreen,
})

function SearchScreen() {
  const [filters, setFilters] = React.useState<SearchFilters>({
    server: getLastServer(),
    class: "",
    minLevel: "",
  })
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
      <Tabs defaultValue="characters">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="characters" className="flex-1">
            Personnages
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex-1">
            Métiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters">
          <SearchFiltersCard
            filters={filters}
            onChange={(patch) => {
              setFilters((prev) => ({ ...prev, ...patch }))
              if (patch.server) setLastServer(patch.server)
            }}
          />
          <SearchResultsList results={results} isLoading={isPending} />
        </TabsContent>

        <TabsContent value="jobs">
          <JobSearchPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
