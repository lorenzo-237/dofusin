import { Link, useRouterState } from "@tanstack/react-router"
import { Clock, Home, Search, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const TABS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/characters", label: "Persos", icon: Users },
  { to: "/availability", label: "Dispo", icon: Clock },
  { to: "/search", label: "Recherche", icon: Search },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="flex flex-none items-stretch justify-around border-t border-border bg-background/95 px-2 pt-2 pb-3 backdrop-blur">
      {TABS.map(({ to, label, icon: Icon }) => {
        const isActive = pathname === to
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <Icon
              className={cn(
                "size-[22px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className={cn(
                "text-[10px] font-bold",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
