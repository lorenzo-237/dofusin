import * as React from "react"

import { SearchResultItem } from "@/components/search/search-result-item"
import { SortSelect } from "@/components/shared/sort-select"
import type { HelperSearchResult } from "@/lib/types"

type ResultSortKey = "level" | "price" | "name"

const SORT_OPTIONS: { value: ResultSortKey; label: string }[] = [
  { value: "level", label: "Niveau" },
  { value: "price", label: "Prix" },
  { value: "name", label: "Nom" },
]

function sortResults(
  results: HelperSearchResult[],
  sortBy: ResultSortKey
): HelperSearchResult[] {
  return [...results].sort((a, b) => {
    switch (sortBy) {
      case "level":
        return b.level - a.level
      case "price":
        return a.price - b.price
      case "name":
        return a.name.localeCompare(b.name, "fr")
    }
  })
}

interface SearchResultsListProps {
  results: HelperSearchResult[]
  isLoading: boolean
}

export function SearchResultsList({
  results,
  isLoading,
}: SearchResultsListProps) {
  const [sortBy, setSortBy] = React.useState<ResultSortKey>("level")
  const sortedResults = sortResults(results, sortBy)

  const label = isLoading
    ? "Recherche..."
    : `${results.length} ${results.length > 1 ? "aventuriers trouvés" : "aventurier trouvé"}`

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <SortSelect
          value={sortBy}
          onValueChange={setSortBy}
          options={SORT_OPTIONS}
          className="h-auto w-auto rounded-xl bg-muted px-2.5 py-1.5 text-xs"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {sortedResults.map((result) => (
          <SearchResultItem key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
