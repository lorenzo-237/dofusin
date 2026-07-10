import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JOBS } from "@/lib/game-data"

interface JobSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function JobSelect({ value, onValueChange, className }: JobSelectProps) {
  const items = JOBS.map((job) => ({ value: job, label: job }))

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Métier" />
      </SelectTrigger>
      <SelectContent>
        {JOBS.map((job) => (
          <SelectItem key={job} value={job}>
            {job}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
