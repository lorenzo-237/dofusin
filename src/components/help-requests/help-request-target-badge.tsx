import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"
import type { HelpRequest } from "@/lib/types"

interface HelpRequestTargetBadgeProps {
  request: Pick<
    HelpRequest,
    "targetType" | "targetClass" | "targetJob" | "targetMinLevel"
  >
}

/**
 * The criteria being asked for (job or class badge), shared by the three
 * Entraide cards — appends the minimum level when the requester set one.
 */
export function HelpRequestTargetBadge({ request }: HelpRequestTargetBadgeProps) {
  const suffix = request.targetMinLevel ? ` ${request.targetMinLevel}+` : ""

  if (request.targetType === "job") {
    return (
      <Badge
        style={{ backgroundColor: jobColor(request.targetJob ?? "") }}
        className="h-5 rounded-full px-2 text-[11px] font-bold text-white"
      >
        {request.targetJob}
        {suffix}
      </Badge>
    )
  }

  return (
    <Badge className="h-5 rounded-full px-2 text-[11px] font-bold">
      {request.targetClass ?? "Toutes classes"}
      {suffix}
    </Badge>
  )
}
