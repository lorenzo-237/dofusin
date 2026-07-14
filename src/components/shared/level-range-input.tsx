import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const LEVEL_BRACKETS = [
  { label: "1-50", min: 1, max: 50 },
  { label: "51-100", min: 51, max: 100 },
  { label: "101-150", min: 101, max: 150 },
  { label: "151-200", min: 151, max: 200 },
] as const

interface LevelRangeInputProps {
  // Same string-value contract as a plain <Input type="number"> — the
  // parent keeps owning parsing/validation on submit (see CharacterForm/
  // JobForm/CreateHelpRequestCard), this is purely an alternate way to
  // produce the same raw text.
  value: string
  onChange: (value: string) => void
  // Required fields (character/job level) always have a value and never
  // show the "Effacer" affordance; optional fields (notifyMinLevel,
  // targetMinLevel) can clear back to "" (= no threshold).
  required?: boolean
  placeholder?: string
  ariaLabel: string
  inputClassName?: string
}

/**
 * A single 1-200 slider felt too imprecise to drag by touch/mouse, so
 * picking a 50-wide bracket first, then a slider scoped to just that
 * bracket, keeps each drag gesture meaningful. Manual typing stays
 * available and drives the bracket/slider automatically (see
 * design discussion — this mirrors the approved prototype).
 */
export function LevelRangeInput({
  value,
  onChange,
  required = false,
  placeholder,
  ariaLabel,
  inputClassName,
}: LevelRangeInputProps) {
  const trimmed = value.trim()
  const numericValue = trimmed ? Number(trimmed) : null
  const activeBracketIndex =
    numericValue != null && Number.isFinite(numericValue)
      ? LEVEL_BRACKETS.findIndex(
          (bracket) => numericValue >= bracket.min && numericValue <= bracket.max
        )
      : -1
  const activeBracket =
    activeBracketIndex !== -1 ? LEVEL_BRACKETS[activeBracketIndex] : null

  const handleBracketClick = (bracket: (typeof LEVEL_BRACKETS)[number]) => {
    const current = numericValue
    const next =
      current != null && current >= bracket.min && current <= bracket.max
        ? current
        : Math.round((bracket.min + bracket.max) / 2)
    onChange(String(next))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={inputClassName}
        />
        {!required && value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-auto shrink-0 rounded-xl border border-border px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Effacer
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-muted p-1">
        {LEVEL_BRACKETS.map((bracket, index) => (
          <button
            key={bracket.label}
            type="button"
            aria-pressed={index === activeBracketIndex}
            onClick={() => handleBracketClick(bracket)}
            className={cn(
              "rounded-lg py-1.5 text-[12px] font-bold tabular-nums transition-colors",
              index === activeBracketIndex
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {bracket.label}
          </button>
        ))}
      </div>

      {activeBracket ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{activeBracket.min}</span>
            <span>{activeBracket.max}</span>
          </div>
          <input
            type="range"
            min={activeBracket.min}
            max={activeBracket.max}
            value={numericValue ?? activeBracket.min}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${ariaLabel} (curseur)`}
            className="h-5 w-full cursor-pointer accent-primary"
          />
        </div>
      ) : !required ? (
        <p className="text-[12px] text-muted-foreground italic">
          Aucun seuil sélectionné.
        </p>
      ) : null}
    </div>
  )
}
