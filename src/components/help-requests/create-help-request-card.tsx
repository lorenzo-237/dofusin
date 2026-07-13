import * as React from "react"
import { Megaphone } from "lucide-react"
import { toast } from "sonner"

import { ClassSelect } from "@/components/shared/class-select"
import { JobSelect } from "@/components/shared/job-select"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import {
  getLastJob,
  getLastServer,
  setLastJob,
  setLastServer,
} from "@/lib/last-selection-store"
import { cn } from "@/lib/utils"

type TargetType = "character" | "job"

const TARGET_TYPES: { value: TargetType; label: string }[] = [
  { value: "character", label: "Personnage" },
  { value: "job", label: "Métier" },
]

/**
 * "Demander" tab — the smart-search-and-notify form: same criteria as the
 * classic Recherche filters (server + optional class, or server + job), but
 * instead of just listing who's available, it broadcasts a HelpRequest live
 * to every matching account currently marked available (see
 * docs/help-requests.md in dofusin-api).
 */
export function CreateHelpRequestCard() {
  const { createHelpRequest } = useAuth()
  const [targetType, setTargetType] = React.useState<TargetType>("character")
  const [server, setServer] = React.useState(getLastServer())
  const [targetClass, setTargetClass] = React.useState("")
  const [targetJob, setTargetJob] = React.useState(getLastJob())
  const [isSending, setIsSending] = React.useState(false)

  const handleServerChange = (next: string) => {
    setServer(next)
    setLastServer(next)
  }

  const handleJobChange = (next: string) => {
    setTargetJob(next)
    setLastJob(next)
  }

  const handleSubmit = async () => {
    setIsSending(true)
    try {
      await createHelpRequest(
        targetType === "character"
          ? { targetType, server, targetClass: targetClass || null }
          : { targetType, server, targetJob }
      )
      toast.success("Demande envoyée à tous les aidants disponibles !")
      setTargetClass("")
    } catch {
      toast.error("Impossible d'envoyer la demande, réessaie.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-[13px] text-muted-foreground">
        Notifie en direct tous les joueurs actuellement disponibles qui
        correspondent à ta recherche.
      </p>

      <div className="flex gap-1.5 rounded-xl bg-muted p-1">
        {TARGET_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            aria-pressed={targetType === type.value}
            onClick={() => setTargetType(type.value)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-[13px] font-bold transition-colors",
              targetType === type.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      <ServerSelect
        value={server}
        onValueChange={handleServerChange}
        className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />

      {targetType === "character" ? (
        <ClassSelect
          value={targetClass}
          onValueChange={setTargetClass}
          includeAllOption
          className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
        />
      ) : (
        <JobSelect
          value={targetJob}
          onValueChange={handleJobChange}
          className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
        />
      )}

      <Button
        disabled={isSending}
        onClick={() => void handleSubmit()}
        className="h-auto gap-1.5 rounded-xl py-3 font-heading text-[15px] font-bold"
      >
        <Megaphone className="size-4" />
        {isSending ? "Envoi..." : "Notifier tout le monde"}
      </Button>
    </div>
  )
}
