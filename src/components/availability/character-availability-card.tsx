import { AvailabilityPriceInput } from "@/components/availability/availability-price-input"
import { ClassAvatar, ClassIcon } from "@/components/shared/class-avatar"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Availability, AvailabilityInput, Character } from "@/lib/types"

interface CharacterAvailabilityCardProps {
  character: Character
  availability?: Availability
  onToggle: () => void
  onFieldChange: (patch: Partial<AvailabilityInput>) => Promise<void>
}

export function CharacterAvailabilityCard({
  character,
  availability,
  onToggle,
  onFieldChange,
}: CharacterAvailabilityCardProps) {
  const isOn = availability != null

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <ClassAvatar
          name={character.name}
          characterClass={character.class}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{character.name}</div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{character.server} ·</span>
            <ClassIcon characterClass={character.class} className="size-3" />
            <span>
              {character.class}
              {character.level ? ` · N${character.level}` : ""}
            </span>
          </div>
        </div>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

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
