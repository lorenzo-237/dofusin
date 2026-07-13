import { HelpRequestStatusBadge } from "@/components/help-requests/help-request-status-badge"
import { Badge } from "@/components/ui/badge"
import { jobColor } from "@/lib/game-data"
import type { HelpRequest } from "@/lib/types"

interface AcceptedHelpRequestCardProps {
  request: HelpRequest
}

/** A HelpRequest I accepted (helper side) — status-only, no action here, the requester validates/disputes. */
export function AcceptedHelpRequestCard({
  request,
}: AcceptedHelpRequestCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 text-[10px] font-bold tracking-wide text-accent uppercase">
        Ton aide
      </div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {request.targetType === "job" ? (
            <Badge
              style={{ backgroundColor: jobColor(request.targetJob ?? "") }}
              className="h-5 rounded-full px-2 text-[11px] font-bold text-white"
            >
              {request.targetJob}
            </Badge>
          ) : (
            <Badge className="h-5 rounded-full px-2 text-[11px] font-bold">
              {request.targetClass ?? "Toutes classes"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {request.server}
          </span>
        </div>
        <HelpRequestStatusBadge status={request.status} />
      </div>

      {request.status === "DISPUTED" && request.disputeReason ? (
        <p className="text-[13px] text-destructive">
          Motif : {request.disputeReason}
        </p>
      ) : request.status === "VALIDATED" ? (
        <p className="text-[13px] text-muted-foreground">
          Merci d'avoir aidé ! +1 xp.
        </p>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          En attente de validation par le demandeur.
        </p>
      )}
    </div>
  )
}
