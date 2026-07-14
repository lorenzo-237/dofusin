import { ClassIcon } from "@/components/shared/class-avatar"
import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"

interface HelpRequestContactProps {
  // "Moi" / "Demandeur" / "Aidant" — which side this row represents, so a
  // card showing both at once (which one am I looking at?) isn't ambiguous.
  label: string
  characterName: string | null
  characterClass?: string | null
  characterLevel?: number | null
  jobName?: string | null
  jobLevel?: number | null
}

/**
 * "Who to whisper in-game" row — shared by MyHelpRequestCard (shows "Moi"
 * + "Aidant") and AcceptedHelpRequestCard (shows "Moi" + "Demandeur"), each
 * rendering it twice, once per side. Class icon instead of a class name,
 * level as a badge — same conventions already used for job results (see
 * JobSearchResultItem).
 */
export function HelpRequestContact({
  label,
  characterName,
  characterClass,
  characterLevel,
  jobName,
  jobLevel,
}: HelpRequestContactProps) {
  if (!characterName) return null

  return (
    <div>
      <div className="mb-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        {characterClass ? (
          <ClassIcon characterClass={characterClass} className="size-5" />
        ) : null}
        <span className="flex-1 text-[13px] font-bold">{characterName}</span>
        {characterLevel ? (
          <Badge className="h-5 shrink-0 rounded-full px-2 text-[11px] font-bold">
            Niv. {characterLevel}
          </Badge>
        ) : null}
        {jobName ? (
          <Badge
            style={{ backgroundColor: jobColor(jobName) }}
            className="h-5 shrink-0 rounded-full px-2 text-[11px] font-bold text-white"
          >
            {jobName} {jobLevel}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
