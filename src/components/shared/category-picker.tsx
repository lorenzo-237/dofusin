import { cn } from "@/lib/utils"

interface CategoryPickerProps<C extends string> {
  categories: readonly C[]
  value: C
  onValueChange: (category: C) => void
  className?: string
}

export function CategoryPicker<C extends string>({
  categories,
  value,
  onValueChange,
  className,
}: CategoryPickerProps<C>) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {categories.map((category) => {
        const isSelected = category === value
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onValueChange(category)}
            className={cn(
              "rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
