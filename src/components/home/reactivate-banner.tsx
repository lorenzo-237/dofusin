import * as React from "react"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`
}

/**
 * Shown on Accueil only when the account has characters/jobs that were
 * available on some previous day but aren't today (see
 * AuthContextValue.staleAvailabilities) — a one-click way to republish
 * yesterday's settings instead of redoing every toggle by hand.
 */
export function ReactivateBanner() {
  const { staleAvailabilities, staleJobAvailabilities, reactivateAll } =
    useAuth()
  const [isReactivating, setIsReactivating] = React.useState(false)

  const characterCount = staleAvailabilities.length
  const jobCount = staleJobAvailabilities.length
  if (characterCount === 0 && jobCount === 0) return null

  const parts = [
    characterCount > 0
      ? pluralize(characterCount, "perso", "persos")
      : null,
    jobCount > 0 ? pluralize(jobCount, "métier", "métiers") : null,
  ].filter((part): part is string => part !== null)

  const handleReactivate = async () => {
    setIsReactivating(true)
    try {
      await reactivateAll()
      toast.success("Dispos réactivées !")
    } catch {
      toast.error("Impossible de tout réactiver, réessaie.")
    } finally {
      setIsReactivating(false)
    }
  }

  return (
    <div className="mb-5.5 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-3.5">
      <div className="flex-1 text-[13px] font-semibold">
        Tu étais disponible avec {parts.join(" et ")}. Tout réactiver ?
      </div>
      <Button
        size="sm"
        disabled={isReactivating}
        onClick={() => void handleReactivate()}
        className="h-auto shrink-0 gap-1.5 rounded-xl py-2.5 font-bold"
      >
        <RotateCcw className="size-3.5" />
        {isReactivating ? "..." : "Réactiver"}
      </Button>
    </div>
  )
}
