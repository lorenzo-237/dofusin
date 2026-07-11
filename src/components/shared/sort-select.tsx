import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SortOption<T extends string> {
  value: T
  label: string
}

interface SortSelectProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: SortOption<T>[]
  className?: string
}

export function SortSelect<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SortSelectProps<T>) {
  const items = options.map((option) => ({
    value: option.value,
    label: option.label,
  }))

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as T)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Trier par" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
