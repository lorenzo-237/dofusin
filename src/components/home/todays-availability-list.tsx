import { Link } from "@tanstack/react-router"

import { classColor, jobColor } from "@/lib/game-data"
import type {
  Availability,
  Character,
  Job,
  JobAvailability,
} from "@/lib/types"

interface TodaysAvailabilityListProps {
  characters: Character[]
  availabilities: Availability[]
  jobs: Job[]
  jobAvailabilities: JobAvailability[]
}

interface AvailabilityRow {
  key: string
  color: string
  label: string
  priceLabel: string
}

function priceLabelFor(entry: { free: boolean; price: number | null }) {
  if (entry.free) return "Gratuit"
  return entry.price ? `${entry.price} k` : "—"
}

export function TodaysAvailabilityList({
  characters,
  availabilities,
  jobs,
  jobAvailabilities,
}: TodaysAvailabilityListProps) {
  const characterRows = characters.reduce<AvailabilityRow[]>(
    (rows, character) => {
      const availability = availabilities.find(
        (a) => a.characterId === character.id
      )
      if (!availability) return rows
      rows.push({
        key: `character-${character.id}`,
        color: classColor(character.class),
        label: character.name,
        priceLabel: priceLabelFor(availability),
      })
      return rows
    },
    []
  )

  const jobRows = jobs.reduce<AvailabilityRow[]>((rows, job) => {
    const availability = jobAvailabilities.find((a) => a.jobId === job.id)
    if (!availability) return rows
    const character = characters.find((c) => c.id === job.characterId)
    rows.push({
      key: `job-${job.id}`,
      color: jobColor(job.job),
      label: character ? `${job.job} (${character.name})` : job.job,
      priceLabel: priceLabelFor(availability),
    })
    return rows
  }, [])

  const items = [...characterRows, ...jobRows]

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4.5 py-4.5 text-center text-[13px] text-muted-foreground">
        Aucune dispo aujourd'hui.{" "}
        <Link to="/availability" className="font-bold text-primary">
          En rendre une
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-3"
        >
          <div
            className="size-2.25 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1 text-sm font-bold">{item.label}</div>
          <div className="text-[13px] font-bold text-primary">
            {item.priceLabel}
          </div>
        </div>
      ))}
    </div>
  )
}
