import { CategoryPicker } from "@/components/shared/category-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JOBS_BY_CATEGORY, jobCategory, type JobCategory } from "@/lib/game-data"

interface JobSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

const JOB_CATEGORIES = Object.keys(JOBS_BY_CATEGORY) as JobCategory[]

export function JobSelect({ value, onValueChange, className }: JobSelectProps) {
  const category = jobCategory(value)
  const jobs = JOBS_BY_CATEGORY[category]
  const items = jobs.map((job) => ({ value: job, label: job }))

  return (
    <div className="flex flex-col gap-1.5">
      <CategoryPicker
        categories={JOB_CATEGORIES}
        value={category}
        onValueChange={(nextCategory) =>
          onValueChange(JOBS_BY_CATEGORY[nextCategory][0])
        }
      />
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
          {jobs.map((job) => (
            <SelectItem key={job} value={job}>
              {job}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
