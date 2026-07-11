import { ClassIcon } from "@/components/shared/class-avatar"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"
import type { HelperSearchResult } from "@/lib/types"

interface SearchResultItemProps {
  result: HelperSearchResult
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  const priceLabel = result.price ? `${result.price} k` : "Gratuit"
  const sortedJobs = [...result.jobs].sort((a, b) =>
    a.job.localeCompare(b.job, "fr")
  )

  return (
    <div className="rounded-2xl border border-border bg-card px-3.5 py-3">
      <div className="flex items-center gap-3">
        <ClassIcon characterClass={result.class} className="size-9" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold">{result.name}</span>
            <Badge className="h-5 rounded-full px-2 text-[11px] font-bold">
              Niv. {result.level}
            </Badge>
          </div>
          {sortedJobs.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {sortedJobs.map((j) => (
                <span
                  key={j.job}
                  style={{ backgroundColor: jobColor(j.job) }}
                  className="rounded-full px-1.5 py-px text-[10px] font-bold text-white"
                >
                  {j.job} {j.level}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-xs font-bold text-primary">{priceLabel}</div>
      </div>
      <CopyCommandButton characterName={result.name} className="mt-2.5" />
    </div>
  )
}
