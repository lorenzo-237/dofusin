import { ClassIcon } from "@/components/shared/class-avatar"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"
import type { JobSearchResult } from "@/lib/types"

interface JobSearchResultItemProps {
  result: JobSearchResult
}

export function JobSearchResultItem({ result }: JobSearchResultItemProps) {
  const priceLabel = result.price ? `${result.price} k` : "Gratuit"

  return (
    <div className="rounded-2xl border border-border bg-card px-3.5 py-3">
      <div className="flex items-center gap-3">
        <ClassIcon characterClass={result.characterClass} className="size-9" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold">{result.job}</span>
            <Badge
              style={{ backgroundColor: jobColor(result.job) }}
              className="h-5 rounded-full px-2 text-[11px] font-bold text-white"
            >
              Niv. {result.level}
            </Badge>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {result.characterName} · N{result.characterLevel}
          </div>
        </div>
        <div className="text-xs font-bold text-primary">{priceLabel}</div>
      </div>
      <CopyCommandButton
        characterName={result.characterName}
        price={result.price}
        className="mt-2.5"
      />
    </div>
  )
}
