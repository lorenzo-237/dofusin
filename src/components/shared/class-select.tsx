import { ClassIcon } from "@/components/shared/class-avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CLASSES } from "@/lib/game-data"

const ALL_CLASSES_VALUE = "__all-classes__"

interface ClassSelectProps {
  value: string
  onValueChange: (value: string) => void
  includeAllOption?: boolean
  className?: string
}

export function ClassSelect({
  value,
  onValueChange,
  includeAllOption = false,
  className,
}: ClassSelectProps) {
  // Base UI's trigger only knows an item's label via this `items` map — without
  // it, the trigger falls back to displaying the raw value string, which is
  // wrong for the "all classes" sentinel (it would show "__all-classes__").
  const items = [
    ...(includeAllOption
      ? [{ value: ALL_CLASSES_VALUE, label: "Toutes les classes" }]
      : []),
    ...CLASSES.map((cls) => ({
      value: cls,
      label: (
        <span className="flex items-center gap-1.5">
          <ClassIcon characterClass={cls} />
          {cls}
        </span>
      ),
    })),
  ]

  return (
    <Select
      items={items}
      value={value === "" ? ALL_CLASSES_VALUE : value}
      onValueChange={(next) =>
        onValueChange(!next || next === ALL_CLASSES_VALUE ? "" : next)
      }
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Classe" />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption ? (
          <SelectItem value={ALL_CLASSES_VALUE}>Toutes les classes</SelectItem>
        ) : null}
        {CLASSES.map((cls) => (
          <SelectItem key={cls} value={cls}>
            <ClassIcon characterClass={cls} />
            {cls}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
