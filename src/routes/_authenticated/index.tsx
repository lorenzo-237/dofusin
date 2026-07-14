import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LifeBuoy } from "lucide-react"

import { ReactivateBanner } from "@/components/home/reactivate-banner"
import { StatCard } from "@/components/home/stat-card"
import { TodaysAvailabilityList } from "@/components/home/todays-availability-list"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export const Route = createFileRoute("/_authenticated/")({
  staticData: { title: "Accueil" },
  component: HomeScreen,
})

function HomeScreen() {
  const { user, characters, availabilities, jobs, jobAvailabilities } =
    useAuth()
  const navigate = useNavigate()

  return (
    <div className="pt-1">
      <p className="mb-3 text-sm text-muted-foreground">
        Salut {user?.username}, voici ta journée.
      </p>

      <ReactivateBanner />

      <div className="mb-3 flex divide-x divide-border rounded-2xl border border-border bg-card">
        <StatCard label="Personnages" value={characters.length} accent="primary" />
        <StatCard
          label="Perso dispo"
          value={availabilities.length}
          accent="accent"
        />
        <StatCard
          label="Métier dispo"
          value={jobAvailabilities.length}
          accent="info"
        />
      </div>

      <Button
        onClick={() => navigate({ to: "/help-requests" })}
        className="mb-3 h-auto w-full gap-1.5 rounded-2xl bg-accent py-2.5 font-heading text-[15px] font-bold text-white hover:bg-accent/90"
      >
        <LifeBuoy className="size-4" />
        Entraide
      </Button>

      <div className="mb-2 font-heading text-[15px] font-bold">
        Mes dispos du jour
      </div>
      <TodaysAvailabilityList
        characters={characters}
        availabilities={availabilities}
        jobs={jobs}
        jobAvailabilities={jobAvailabilities}
      />
    </div>
  )
}
