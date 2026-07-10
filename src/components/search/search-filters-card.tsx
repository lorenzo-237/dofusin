import { ClassSelect } from "@/components/shared/class-select"
import { ServerSelect } from "@/components/shared/server-select"
import { Input } from "@/components/ui/input"
import type { SearchFilters } from "@/lib/types"

interface SearchFiltersCardProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
}

export function SearchFiltersCard({ filters, onChange }: SearchFiltersCardProps) {
  return (
    <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
      <ServerSelect
        value={filters.server}
        onValueChange={(server) => onChange({ server })}
        className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />
      <ClassSelect
        value={filters.class}
        onValueChange={(characterClass) => onChange({ class: characterClass })}
        includeAllOption
        className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />
      <Input
        value={filters.minLevel}
        onChange={(event) => onChange({ minLevel: event.target.value })}
        placeholder="Niveau min"
        aria-label="Niveau min"
        className="h-auto rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />
    </div>
  )
}
