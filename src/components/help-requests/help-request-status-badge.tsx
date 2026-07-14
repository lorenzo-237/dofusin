import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { HelpRequestStatus } from "@/lib/types"

const STATUS_LABELS: Record<HelpRequestStatus, string> = {
  OPEN: "En attente",
  ACCEPTED: "Accepté",
  VALIDATED: "Validé",
  DISPUTED: "Litige",
  EXPIRED: "Expirée",
}

const STATUS_CLASSES: Record<HelpRequestStatus, string> = {
  OPEN: "bg-muted text-muted-foreground",
  ACCEPTED: "bg-accent/15 text-accent",
  VALIDATED: "bg-primary/15 text-primary",
  DISPUTED: "bg-destructive/15 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
}

export function HelpRequestStatusBadge({
  status,
}: {
  status: HelpRequestStatus
}) {
  return (
    <Badge
      className={cn(
        "h-5 shrink-0 rounded-full px-2 text-[11px] font-bold",
        STATUS_CLASSES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
