import { createFileRoute } from "@tanstack/react-router"

import { CreateHelpRequestCard } from "@/components/help-requests/create-help-request-card"
import { ReactivateBanner } from "@/components/home/reactivate-banner"
import { StatCard } from "@/components/home/stat-card"
import { TodaysAvailabilityList } from "@/components/home/todays-availability-list"
import { useAuth } from "@/context/auth-context"

export const Route = createFileRoute("/_authenticated/")({
  staticData: { title: "Accueil" },
  component: HomeScreen,
})

function HomeScreen() {
  const { user, characters, availabilities, jobs, jobAvailabilities } =
    useAuth()

  return (
    <div className="pt-1">
      <p className="mb-3 text-sm text-muted-foreground">
        Salut {user?.username}, voici ta journée.
      </p>

      <ReactivateBanner />

      <div className="mb-3 flex divide-x divide-border rounded-2xl border border-border bg-card">
        <StatCard
          label="Personnage actif"
          value={availabilities.length}
          accent="accent"
        />
        <StatCard
          label="Métier actif"
          value={jobAvailabilities.length}
          accent="info"
        />
      </div>

      <div className="mb-2 font-heading text-[15px] font-bold">
        Demander de l'aide
      </div>
      <div className="mb-3">
        <CreateHelpRequestCard />
      </div>

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
