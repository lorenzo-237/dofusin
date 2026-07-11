import * as React from "react"
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router"

import { BottomNav } from "@/components/layout/bottom-nav"
import { useAuth } from "@/context/auth-context"
import { getSession } from "@/lib/auth-store"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getSession()) {
      throw redirect({ to: "/login" })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { characters, charactersLoaded } = useAuth()
  const navigate = useNavigate()

  // A brand new Discord account has no character yet — the cahier des
  // charges still requires one before using the rest of the app.
  // `beforeLoad` above can't check this (characters live in React state,
  // not the plain auth-store it reads), so it's an effect here instead.
  React.useEffect(() => {
    if (charactersLoaded && characters.length === 0) {
      void navigate({ to: "/onboarding" })
    }
  }, [charactersLoaded, characters.length, navigate])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
