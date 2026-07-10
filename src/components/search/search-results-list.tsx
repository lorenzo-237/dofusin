import { SearchResultItem } from "@/components/search/search-result-item"
import type { HelperSearchResult } from "@/lib/types"

interface SearchResultsListProps {
  results: HelperSearchResult[]
  isLoading: boolean
}

export function SearchResultsList({ results, isLoading }: SearchResultsListProps) {
  const label = isLoading
    ? "Recherche..."
    : `${results.length} ${results.length > 1 ? "aventuriers trouvés" : "aventurier trouvé"}`

  return (
    <div>
      <div className="mb-2.5 text-xs font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-col gap-2.5">
        {results.map((result) => (
          <SearchResultItem key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
