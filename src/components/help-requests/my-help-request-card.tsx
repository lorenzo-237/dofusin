import * as React from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { DisputeDialog } from "@/components/help-requests/dispute-dialog"
import { HelpRequestContact } from "@/components/help-requests/help-request-contact"
import { HelpRequestStatusBadge } from "@/components/help-requests/help-request-status-badge"
import { HelpRequestTargetBadge } from "@/components/help-requests/help-request-target-badge"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
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
          <HelpRequestTargetBadge request={request} />
          <span className="text-xs text-muted-foreground">
            {request.server}
          </span>
        </div>
        <HelpRequestStatusBadge status={request.status} />
      </div>

      {request.status !== "OPEN" && request.status !== "EXPIRED" ? (
        <div className="flex flex-col gap-2">
          <HelpRequestContact
            label="Moi"
            characterName={request.requesterCharacterName}
            characterClass={request.requesterCharacterClass}
            characterLevel={request.requesterCharacterLevel}
          />
          <HelpRequestContact
            label="Aidant"
            characterName={request.helperCharacterName}
            characterClass={request.helperCharacterClass}
            characterLevel={request.helperCharacterLevel}
            jobName={request.helperJobName}
            jobLevel={request.helperJobLevel}
          />
        </div>
      ) : null}

      {request.status === "DISPUTED" && request.disputeReason ? (
        <p className="mt-2 text-[13px] text-destructive">
          Motif : {request.disputeReason}
        </p>
      ) : null}

      {request.status === "ACCEPTED" ? (
        <div className="mt-2 flex gap-2">
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

      {request.helperCharacterName ? (
        <CopyCommandButton
          characterName={request.helperCharacterName}
          className="mt-2"
        />
      ) : null}
    </div>
  )
}
