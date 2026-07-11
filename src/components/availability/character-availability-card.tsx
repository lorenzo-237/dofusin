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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        <ClassAvatar
          name={character.name}
          characterClass={character.class}
          size="sm"
        />
        <div className="flex-1">
          <div className="text-sm font-bold">{character.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{character.server} ·</span>
            <ClassIcon characterClass={character.class} />
            <span>
              {character.class}
              {character.level ? ` · N${character.level}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-bold">Disponible pour une quête</span>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

      {isOn ? (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
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
