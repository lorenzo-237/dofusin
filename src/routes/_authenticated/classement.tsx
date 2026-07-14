import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { UserRound } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { getApiClient } from "@/lib/api"
import type { LeaderboardEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/classement")({
  staticData: { title: "Classement" },
  component: ClassementScreen,
})

function ClassementScreen() {
  const { user, token } = useAuth()
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([])
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    startTransition(async () => {
      const next = await getApiClient().getLeaderboard(token)
      if (!cancelled) setEntries(next)
    })
    return () => {
      cancelled = true
    }
  }, [token, startTransition])

  if (isPending) {
    return (
      <p className="pt-4 text-center text-[13px] text-muted-foreground">
        Chargement du classement...
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3",
            entry.id === user?.id
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          )}
        >
          <span className="w-5 shrink-0 text-center font-heading text-sm font-bold text-muted-foreground">
            {index + 1}
          </span>

          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt={entry.username}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="size-5" />
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {entry.username}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {entry.xp} xp
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
