import { HelpRequestContact } from "@/components/help-requests/help-request-contact"
import { HelpRequestStatusBadge } from "@/components/help-requests/help-request-status-badge"
import { HelpRequestTargetBadge } from "@/components/help-requests/help-request-target-badge"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import { useAuth } from "@/context/auth-context"
import { buildHelperIntroMessage } from "@/lib/help-request-message"
import type { HelpRequest } from "@/lib/types"

interface AcceptedHelpRequestCardProps {
  request: HelpRequest
}

/** A HelpRequest I accepted (helper side) — status-only, no action here, the requester validates/disputes. */
export function AcceptedHelpRequestCard({
  request,
}: AcceptedHelpRequestCardProps) {
  const { availabilities, jobAvailabilities } = useAuth()
  const { defaultMessage, price } = buildHelperIntroMessage(
    request,
    availabilities,
    jobAvailabilities
  )

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 text-[10px] font-bold tracking-wide text-accent uppercase">
        Ton aide
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

      <div className="flex flex-col gap-2">
        <HelpRequestContact
          label="Moi"
          characterName={request.helperCharacterName}
          characterClass={request.helperCharacterClass}
          characterLevel={request.helperCharacterLevel}
          jobName={request.helperJobName}
          jobLevel={request.helperJobLevel}
        />
        <HelpRequestContact
          label="Demandeur"
          characterName={request.requesterCharacterName}
          characterClass={request.requesterCharacterClass}
          characterLevel={request.requesterCharacterLevel}
        />
      </div>

      {request.status === "DISPUTED" && request.disputeReason ? (
        <p className="mt-2 text-[13px] text-destructive">
          Motif : {request.disputeReason}
        </p>
      ) : request.status === "VALIDATED" ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Merci d'avoir aidé ! +1 xp.
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">
          En attente de validation par le demandeur.
        </p>
      )}

      <CopyCommandButton
        characterName={request.requesterCharacterName}
        price={price}
        defaultMessage={defaultMessage}
        className="mt-2"
      />
    </div>
  )
}
