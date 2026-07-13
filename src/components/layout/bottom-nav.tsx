import { Link, useRouterState } from "@tanstack/react-router"
import { Clock, Home, LifeBuoy, Search } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

const TABS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/availability", label: "Dispo", icon: Clock },
  { to: "/search", label: "Recherche", icon: Search },
  { to: "/help-requests", label: "Entraide", icon: LifeBuoy },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { incomingHelpRequests } = useAuth()

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
            <span className="relative">
              <Icon
                className={cn(
                  "size-[22px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {to === "/help-requests" && incomingHelpRequests.length > 0 ? (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white">
                  {incomingHelpRequests.length}
                </span>
              ) : null}
            </span>
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
