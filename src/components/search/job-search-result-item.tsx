import { ClassIcon } from "@/components/shared/class-avatar"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
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
        <div
          style={{ backgroundColor: jobColor(result.job) }}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl font-heading text-[11px] font-bold text-white"
        >
          N{result.level}
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold">{result.job}</span>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ClassIcon
              characterClass={result.characterClass}
              className="size-3.5"
            />
            <span>
              {result.characterName} · N{result.characterLevel}
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-primary">{priceLabel}</div>
      </div>
      <CopyCommandButton
        characterName={result.characterName}
        className="mt-2.5"
      />
    </div>
  )
}
