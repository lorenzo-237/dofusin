import { ClassAvatar, ClassIcon } from "@/components/shared/class-avatar"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import type { HelperSearchResult } from "@/lib/types"

interface SearchResultItemProps {
  result: HelperSearchResult
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  const priceLabel = result.price ? `${result.price} k` : "Gratuit"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-3">
        <ClassAvatar name={result.name} characterClass={result.class} size="sm" />
        <div className="flex-1">
          <div className="text-sm font-bold">{result.name}</div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{result.server} ·</span>
            <ClassIcon characterClass={result.class} className="size-3.5" />
            <span>
              {result.class} · N{result.level}
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-primary">{priceLabel}</div>
      </div>
      <CopyCommandButton characterName={result.name} />
    </div>
  )
}
