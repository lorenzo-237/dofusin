import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { StatCard } from "@/components/home/stat-card"
import { TodaysAvailabilityList } from "@/components/home/todays-availability-list"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export const Route = createFileRoute("/_authenticated/")({
  staticData: { title: "Accueil" },
  component: HomeScreen,
})

function HomeScreen() {
  const { user, characters, availabilities } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="pt-1">
      <p className="mb-4.5 text-sm text-muted-foreground">
        Salut {user?.username}, voici ta journée.
      </p>

      <div className="mb-5.5 flex gap-3">
        <StatCard label="Personnages" value={characters.length} accent="primary" />
        <StatCard
          label="Dispo aujourd'hui"
          value={availabilities.length}
          accent="accent"
        />
      </div>

      <Button
        onClick={() => navigate({ to: "/search" })}
        className="mb-5.5 h-auto w-full rounded-2xl bg-accent py-3.5 font-heading text-[15px] font-bold text-white hover:bg-accent/90"
      >
        Chercher de l'aide
      </Button>

      <div className="mb-2.5 font-heading text-[15px] font-bold">
        Mes dispos du jour
      </div>
      <TodaysAvailabilityList
        characters={characters}
        availabilities={availabilities}
      />
    </div>
  )
}
