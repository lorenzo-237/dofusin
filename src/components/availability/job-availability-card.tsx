import { AvailabilityPriceInput } from "@/components/availability/availability-price-input"
import { CharacterCheckboxGroup } from "@/components/shared/character-checkbox-group"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { jobColor } from "@/lib/game-data"
import { cn } from "@/lib/utils"
import type {
  Character,
  Job,
  JobAvailability,
  JobAvailabilityInput,
} from "@/lib/types"

interface JobAvailabilityCardProps {
  job: Job
  characters: Character[]
  availability?: JobAvailability
  onToggle: () => void
  onFieldChange: (patch: Partial<JobAvailabilityInput>) => Promise<void>
  onCharacterChange: (characterId: string) => void
}

export function JobAvailabilityCard({
  job,
  characters,
  availability,
  onToggle,
  onFieldChange,
  onCharacterChange,
}: JobAvailabilityCardProps) {
  const isOn = availability != null

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            style={{ backgroundColor: jobColor(job.job) }}
            className="h-5 shrink-0 rounded-full px-2 text-[11px] font-bold text-white"
          >
            {job.job}
          </Badge>
          <span className="truncate text-[11px] text-muted-foreground">
            {job.server} · N{job.level}
          </span>
        </div>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

      <CharacterCheckboxGroup
        value={job.characterId}
        onValueChange={onCharacterChange}
        characters={characters}
      />

      {isOn ? (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
          <div className="flex gap-3.5">
            <button
              type="button"
              onClick={() => void onFieldChange({ free: true, price: null })}
              className={cn(
                "text-[13px] font-bold",
                availability.free ? "text-primary" : "text-muted-foreground"
              )}
            >
              ● Gratuit
            </button>
            <button
              type="button"
              onClick={() => void onFieldChange({ free: false })}
              className={cn(
                "text-[13px] font-bold",
                !availability.free ? "text-destructive" : "text-muted-foreground"
              )}
            >
              ● Payant
            </button>
          </div>
          {!availability.free ? (
            <AvailabilityPriceInput
              price={availability.price}
              onPriceChange={(price) => onFieldChange({ price })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
