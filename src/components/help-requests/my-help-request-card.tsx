import * as React from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { DisputeDialog } from "@/components/help-requests/dispute-dialog"
import { HelpRequestStatusBadge } from "@/components/help-requests/help-request-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import { jobColor } from "@/lib/game-data"
import type { HelpRequest } from "@/lib/types"

interface MyHelpRequestCardProps {
  request: HelpRequest
}

/** A HelpRequest I created (requester side) — validate/dispute live here. */
export function MyHelpRequestCard({ request }: MyHelpRequestCardProps) {
  const { validateHelpRequest } = useAuth()
  const [isValidating, setIsValidating] = React.useState(false)

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      await validateHelpRequest(request.id)
      toast.success("Validé ! +1 xp pour vous deux.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Une erreur est survenue."
      )
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 text-[10px] font-bold tracking-wide text-primary uppercase">
        Ta demande
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
        <p className="mb-2 text-[13px] text-destructive">
          Motif : {request.disputeReason}
        </p>
      ) : null}

      {request.status === "ACCEPTED" ? (
        <div className="flex gap-2">
          <DisputeDialog requestId={request.id} />
          <Button
            size="sm"
            disabled={isValidating}
            onClick={() => void handleValidate()}
            className="h-auto flex-1 gap-1 rounded-xl py-2 text-xs font-bold"
          >
            <Check className="size-3.5" />
            Valider
          </Button>
        </div>
      ) : null}
    </div>
  )
}
