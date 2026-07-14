import * as React from "react"
import { Hammer, Megaphone, Users } from "lucide-react"
import { toast } from "sonner"

import { CharacterSelect } from "@/components/shared/character-select"
import { ClassSelect } from "@/components/shared/class-select"
import { JobSelect } from "@/components/shared/job-select"
import { LevelRangeInput } from "@/components/shared/level-range-input"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import {
  getLastJob,
  getLastServer,
  setLastJob,
  setLastServer,
} from "@/lib/last-selection-store"
import { cn } from "@/lib/utils"

type TargetType = "character" | "job"

const TARGET_TYPES: {
  value: TargetType
  label: string
  icon: typeof Users
}[] = [
  { value: "character", label: "Personnage", icon: Users },
  { value: "job", label: "Métier", icon: Hammer },
]

/**
 * "Demander" tab — the smart-search-and-notify form: same criteria as the
 * classic Recherche filters (server + optional class, or server + job), but
 * instead of just listing who's available, it broadcasts a HelpRequest live
 * to every matching account currently marked available (see
 * docs/help-requests.md in dofusin-api). Also requires picking one of the
 * requester's own characters on that server — whoever accepts needs to know
 * who to whisper in-game, and there's otherwise no way to know.
 */
export function CreateHelpRequestCard() {
  const { characters, createHelpRequest } = useAuth()
  const [targetType, setTargetType] = React.useState<TargetType>("character")
  const [server, setServer] = React.useState(getLastServer())
  const [targetClass, setTargetClass] = React.useState("")
  const [targetJob, setTargetJob] = React.useState(getLastJob())
  const [targetMinLevel, setTargetMinLevel] = React.useState("")
  const [requesterCharacterId, setRequesterCharacterId] = React.useState(
    () => characters.find((c) => c.server === getLastServer())?.id ?? ""
  )
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState("")

  const serverCharacters = characters.filter((c) => c.server === server)

  // Reset the pick whenever the server changes so it can't silently keep
  // pointing at a character from the previous server.
  const handleServerChange = (next: string) => {
    setServer(next)
    setLastServer(next)
    const firstOnServer = characters.find((c) => c.server === next)
    setRequesterCharacterId(firstOnServer?.id ?? "")
  }

  const handleJobChange = (next: string) => {
    setTargetJob(next)
    setLastJob(next)
  }

  const handleSubmit = async () => {
    if (!requesterCharacterId) return

    let parsedMinLevel: number | null = null
    if (targetMinLevel.trim()) {
      parsedMinLevel = Number(targetMinLevel.trim())
      if (
        !Number.isInteger(parsedMinLevel) ||
        parsedMinLevel < 1 ||
        parsedMinLevel > 200
      ) {
        setError("Le niveau minimum doit être un nombre entier entre 1 et 200.")
        return
      }
    }

    setError("")
    setIsSending(true)
    try {
      await createHelpRequest(
        targetType === "character"
          ? {
              targetType,
              server,
              targetClass: targetClass || null,
              targetMinLevel: parsedMinLevel,
              requesterCharacterId,
            }
          : {
              targetType,
              server,
              targetJob,
              targetMinLevel: parsedMinLevel,
              requesterCharacterId,
            }
      )
      toast.success("Demande envoyée à tous les aidants disponibles !")
      setTargetClass("")
      setTargetMinLevel("")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Impossible d'envoyer la demande, réessaie."
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-1.5 rounded-xl bg-muted p-1">
        {TARGET_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            aria-pressed={targetType === type.value}
            onClick={() => setTargetType(type.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-bold transition-colors",
              targetType === type.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <type.icon className="size-4 opacity-70" />
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

      <LevelRangeInput
        value={targetMinLevel}
        onChange={setTargetMinLevel}
        placeholder="Niveau min (optionnel)"
        ariaLabel="Niveau min"
        inputClassName="h-auto rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />

      {error ? (
        <p className="text-[13px] font-semibold text-destructive">{error}</p>
      ) : null}

      {serverCharacters.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted-foreground">
            Qui contacter si quelqu'un répond ?
          </span>
          <CharacterSelect
            value={requesterCharacterId}
            onValueChange={setRequesterCharacterId}
            characters={serverCharacters}
            className="h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
          />
        </div>
      ) : null}

      <Button
        disabled={isSending || !requesterCharacterId}
        onClick={() => void handleSubmit()}
        className="h-auto gap-1.5 rounded-xl py-3 font-heading text-[15px] font-bold"
      >
        <Megaphone className="size-4" />
        {isSending ? "Envoi..." : "Notifier tout le monde"}
      </Button>
    </div>
  )
}
