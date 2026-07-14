import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { UserRound } from "lucide-react"

import { StatCard } from "@/components/home/stat-card"
import { useAuth } from "@/context/auth-context"
import { getApiClient } from "@/lib/api"
import type { Profile } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/profil")({
  staticData: { title: "Profil" },
  component: ProfilScreen,
})

function ProfilScreen() {
  const { token, characters, jobs } = useAuth()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    startTransition(async () => {
      const next = await getApiClient().getProfile(token)
      if (!cancelled) setProfile(next)
    })
    return () => {
      cancelled = true
    }
  }, [token, startTransition])

  if (isPending || !profile) {
    return (
      <p className="pt-4 text-center text-[13px] text-muted-foreground">
        Chargement du profil...
      </p>
    )
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-9" />
          </div>
        )}
        <span className="font-heading text-lg font-bold text-foreground">
          {profile.username}
        </span>
        <span className="text-[13px] text-muted-foreground">
          Membre depuis le {memberSince}
        </span>
      </div>

      <div className="flex rounded-2xl border border-border bg-card">
        <StatCard label="XP" value={profile.xp} accent="primary" />
        <StatCard label="Rang" value={profile.rank} accent="accent" />
        <StatCard label="Personnages" value={characters.length} accent="info" />
        <StatCard label="Métiers" value={jobs.length} accent="primary" />
      </div>

      {profile.strikes > 0 ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] font-semibold text-destructive">
          {profile.strikes} avertissement
          {profile.strikes > 1 ? "s" : ""} reçu
          {profile.strikes > 1 ? "s" : ""} suite à un litige.
        </div>
      ) : null}
    </div>
  )
}
