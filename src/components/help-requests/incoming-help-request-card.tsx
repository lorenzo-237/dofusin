import * as React from "react"
import { Check, UserX, X } from "lucide-react"
import { toast } from "sonner"

import { CharacterCheckboxGroup } from "@/components/shared/character-checkbox-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import { jobColor } from "@/lib/game-data"
import type { HelpRequest, HelpRequestResponder } from "@/lib/types"

interface IncomingHelpRequestCardProps {
  request: HelpRequest
}

/**
 * A HelpRequest carries only requesterId (no username — see
 * HelpRequest in lib/types.ts), so this shows what's being asked for
 * (server + class/job criteria) rather than who's asking.
 */
export function IncomingHelpRequestCard({
  request,
}: IncomingHelpRequestCardProps) {
  const {
    characters,
    availabilities,
    jobs,
    jobAvailabilities,
    acceptHelpRequest,
    declineHelpRequestAndGoUnavailable,
    dismissIncomingHelpRequest,
  } = useAuth()
  const [isResponding, setIsResponding] = React.useState(false)

  const matchingCharacters =
    request.targetType === "character"
      ? characters.filter(
          (c) =>
            c.server === request.server &&
            (!request.targetClass || c.class === request.targetClass) &&
            availabilities.some((a) => a.characterId === c.id)
        )
      : []
  const matchingJob =
    request.targetType === "job"
      ? jobs.find(
          (j) =>
            j.server === request.server &&
            j.job === request.targetJob &&
            jobAvailabilities.some((a) => a.jobId === j.id)
        )
      : undefined

  const [selectedCharacterId, setSelectedCharacterId] = React.useState(
    matchingCharacters[0]?.id ?? ""
  )

  const responder: HelpRequestResponder | null =
    request.targetType === "character"
      ? selectedCharacterId
        ? { targetType: "character", characterId: selectedCharacterId }
        : null
      : matchingJob
        ? { targetType: "job", jobId: matchingJob.id }
        : null

  const handleAccept = async () => {
    if (!responder) return
    setIsResponding(true)
    try {
      await acceptHelpRequest(request.id, responder)
      toast.success("Demande acceptée !")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Impossible d'accepter, réessaie."
      )
    } finally {
      setIsResponding(false)
    }
  }

  const handleDeclineUnavailable = async () => {
    if (!responder) return
    setIsResponding(true)
    try {
      await declineHelpRequestAndGoUnavailable(request.id, responder)
      toast.success("Tu es maintenant indisponible.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Une erreur est survenue."
      )
    } finally {
      setIsResponding(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
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
        <span className="text-xs text-muted-foreground">{request.server}</span>
      </div>

      <p className="mb-3 text-[13px] font-semibold">
        Quelqu'un cherche de l'aide.
      </p>

      {request.targetType === "character" && matchingCharacters.length > 1 ? (
        <CharacterCheckboxGroup
          value={selectedCharacterId}
          onValueChange={setSelectedCharacterId}
          characters={matchingCharacters}
          className="mb-3"
        />
      ) : null}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => dismissIncomingHelpRequest(request.id)}
          className="h-auto flex-1 gap-1 rounded-xl py-2 text-xs font-bold"
        >
          <X className="size-3.5" />
          Refuser
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!responder || isResponding}
          onClick={() => void handleDeclineUnavailable()}
          className="h-auto flex-1 gap-1 rounded-xl py-2 text-xs font-bold text-destructive hover:text-destructive"
        >
          <UserX className="size-3.5" />
          Indispo
        </Button>
        <Button
          size="sm"
          disabled={!responder || isResponding}
          onClick={() => void handleAccept()}
          className="h-auto flex-1 gap-1 rounded-xl py-2 text-xs font-bold"
        >
          <Check className="size-3.5" />
          Accepter
        </Button>
      </div>
    </div>
  )
}
